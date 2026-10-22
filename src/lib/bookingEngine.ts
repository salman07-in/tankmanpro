/**
 * TankmanPro — Phase 3 Pure Customer Booking & Dispatch Engine
 *
 * Implements the 8-step Customer Booking & Vendor Assignment Workflow:
 * Step 1: Location & 6-digit PIN serviceability verification
 * Step 2: Active location-filtered service catalog resolution
 * Step 3: Date & time-slot availability, working-hours & slot-conflict prevention
 * Step 4: Customer details & service-specific booking requirement validation
 * Step 5: Server-authoritative final price & immutable price snapshot calculation
 * Step 6: Idempotent booking creation with separate paymentStatus vs job status
 * Step 7: Configurable 6-point vendor eligibility & dispatch (auto_score, round_robin, manual_admin)
 * Step 8: Vendor & Admin in-panel notification generation
 */

import type {
  AssignmentPolicy,
  Booking,
  BookingEvent,
  BookingPriceSnapshot,
  City,
  Coupon,
  PaymentMethod,
  PaymentStatus,
  PortalNotification,
  PriceOverride,
  QuoteBreakdown,
  Service,
  ServiceArea,
  Vendor,
} from '../types/domain.ts';
import { isValidIndianPin, lookupPinCoverage } from './portalRouting.ts';
import {
  calculateAuthoritativeQuote,
  listEligibleVendorOffers,
  resolveEffectivePricePaise,
  resolveServicePricingMode,
} from './pricingEngine.ts';

export const STANDARD_TIME_WINDOWS = [
  '09:00 AM – 11:00 AM',
  '12:00 PM – 02:00 PM',
  '03:30 PM – 05:30 PM',
  '05:30 PM – 07:30 PM',
] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface SlotWindowEvaluation {
  timeWindow: string;
  available: boolean;
  availableCrewCount: number;
  eligibleVendorUids: string[];
  reason?: string;
}

export interface VendorEligibilityCheckResult {
  vendor: Vendor;
  eligible: boolean;
  disqualificationReason?: string;
  effectivePricePaise?: number;
}

export interface DispatchDecision {
  assignedVendor: Vendor | null;
  status: 'assigned_to_vendor' | 'pending_admin_assignment';
  subStatus:
    | 'awaiting_vendor_acceptance'
    | 'manual_admin_hold'
    | 'unassigned_no_eligible_vendor';
  assignmentPolicyUsed: AssignmentPolicy;
  eligibleVendors: Vendor[];
  customerMessage: string;
  adminAlertReason?: string;
}

export interface CreateCustomerBookingInput {
  idempotencyKey?: string;
  customerUid?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressLine: string;
  landmark?: string;
  pinCode: string;
  serviceId: string;
  variantId: string;
  addonQuantities?: Record<string, number>;
  selectedVendorUid?: string;
  scheduledDate: string; // YYYY-MM-DD
  timeWindow: string;
  couponCode?: string;
  customerNotes?: string;
  tankCapacityLitres?: string;
  unitCount?: number;
  paymentMethod?: PaymentMethod;
  /** Ignored for pricing calculation; logged if tampered */
  clientSubmittedTotalPaise?: number;
}

export interface CreateCustomerBookingResult {
  ok: boolean;
  errorCode?:
    | 'UNSERVICEABLE_PIN'
    | 'SERVICE_UNAVAILABLE'
    | 'INVALID_CUSTOMER_DETAILS'
    | 'INVALID_SLOT'
    | 'SLOT_FULL_OR_CONFLICT'
    | 'QUOTE_FAILED';
  error?: string;
  duplicatePrevented?: boolean;
  booking?: Booking & { priceSnapshot: BookingPriceSnapshot; bookingCode: string; scheduledDate: string; timeWindow: string };
  dispatchDecision?: DispatchDecision;
  quote?: QuoteBreakdown;
  bookingEvent?: BookingEvent;
  notifications?: PortalNotification[];
}

/**
 * Parses a time window start hour in 24-hour format (e.g., "09:00 AM – 11:00 AM" -> 9, "03:30 PM – 05:30 PM" -> 15.5)
 */
export function parseSlotHours(timeWindow: string): { startHour: number; endHour: number } {
  const parts = timeWindow.split(/–|-/).map((s) => s.trim());
  const parsePart = (part: string, fallback: number): number => {
    const match = part.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return fallback;
    let hr = parseInt(match[1], 10);
    const min = parseInt(match[2], 10) / 60;
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hr < 12) hr += 12;
    if (ampm === 'AM' && hr === 12) hr = 0;
    return hr + min;
  };
  return {
    startHour: parsePart(parts[0] || '', 9),
    endHour: parsePart(parts[1] || '', 11),
  };
}

function parse24HourString(hhmm: string | undefined, fallback: number): number {
  if (!hhmm) return fallback;
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
}

/**
 * Returns the 3-letter day-of-week label ('Sun'..'Sat') for a YYYY-MM-DD date string in UTC.
 */
export function getDayLabelForDate(dateStr: string): string {
  const match = (dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'Mon';
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const dt = new Date(Date.UTC(year, month, day));
  return DAY_NAMES[dt.getUTCDay()] || 'Mon';
}

/**
 * Step 7: Evaluates all 6 mandatory vendor eligibility rules for a specific booking request:
 * 1. Vendor is active and approved (`status === 'active'` and `isAvailable !== false`).
 * 2. Vendor serves the selected city and 6-digit PIN code.
 * 3. Vendor provides the requested service.
 * 4. Vendor is available for the selected date and time (working days, working hours, and no conflicting active booking in the same date + slot).
 * 5. Vendor has sufficient booking capacity (`activeAssignedJobs < maxActiveJobs`).
 * 6. Vendor's price and service conditions match the confirmed quote.
 */
export function evaluateVendorsForSlotAndService(params: {
  service: Service;
  variantId: string;
  cityId: string;
  pinCode: string;
  scheduledDate: string;
  timeWindow: string;
  vendors: Vendor[];
  existingBookings: Booking[];
  priceOverrides: PriceOverride[];
  expectedUnitPricePaise?: number;
  selectedVendorUid?: string;
}): VendorEligibilityCheckResult[] {
  const {
    service,
    variantId,
    cityId,
    pinCode,
    scheduledDate,
    timeWindow,
    vendors,
    existingBookings,
    priceOverrides,
    expectedUnitPricePaise,
    selectedVendorUid,
  } = params;

  const pricingMode = resolveServicePricingMode(service, cityId);
  const dayLabel = getDayLabelForDate(scheduledDate);
  const { startHour, endHour } = parseSlotHours(timeWindow);

  return vendors.map((vendor): VendorEligibilityCheckResult => {
    // 1. Active & Approved + Online Availability
    if (vendor.status !== 'active') {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor status is "${vendor.status}" (must be active & approved).`,
      };
    }
    if (vendor.isAvailable === false) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: 'Vendor shift status is currently offline/paused.',
      };
    }

    // 2. Serves City & 6-Digit PIN Code
    if (!vendor.supportedCityIds.includes(cityId)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not cover city ${cityId}.`,
      };
    }
    if (!vendor.supportedAreaPins.includes(pinCode)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not serve PIN code ${pinCode}.`,
      };
    }

    // 3. Provides Requested Service
    if (!vendor.supportedServiceIds.includes(service.id)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor is not authorized for service ${service.title}.`,
      };
    }

    // 4a. Working Days & Working Hours Check
    if (
      vendor.workingDays &&
      vendor.workingDays.length > 0 &&
      !vendor.workingDays.includes(dayLabel)
    ) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not operate on ${dayLabel}.`,
      };
    }
    const vendorStart = parse24HourString(vendor.workingHoursStart, 8);
    const vendorEnd = parse24HourString(vendor.workingHoursEnd, 20);
    if (startHour < vendorStart || endHour > vendorEnd) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Slot ${timeWindow} is outside vendor working hours (${vendor.workingHoursStart || '08:00'}–${vendor.workingHoursEnd || '20:00'}).`,
      };
    }

    // 4b. Slot Conflict Check (prevent double-booking the same vendor in the exact same date & timeWindow)
    const conflictingBooking = existingBookings.find(
      (b) =>
        b.assignedVendorUid === vendor.uid &&
        (b.scheduledDate || b.preferredDate) === scheduledDate &&
        (b.timeWindow || b.preferredSlot) === timeWindow &&
        (b.status === 'assigned_to_vendor' ||
          b.status === 'vendor_accepted' ||
          b.status === 'in_progress')
    );
    if (conflictingBooking) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor is already booked for ${scheduledDate} · ${timeWindow} (${conflictingBooking.bookingCode || conflictingBooking.bookingNumber}).`,
      };
    }

    // 5. Sufficient Booking Capacity
    const liveActiveCount = existingBookings.filter(
      (b) =>
        b.assignedVendorUid === vendor.uid &&
        (b.status === 'assigned_to_vendor' ||
          b.status === 'vendor_accepted' ||
          b.status === 'in_progress')
    ).length;
    const effectiveActiveLoad = Math.max(vendor.activeAssignedJobs, liveActiveCount);
    if (effectiveActiveLoad >= vendor.maxActiveJobs) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor has reached maximum active job capacity (${effectiveActiveLoad}/${vendor.maxActiveJobs}).`,
      };
    }

    // 6. Price & Service Conditions Match Confirmed Quote
    if (selectedVendorUid && vendor.uid !== selectedVendorUid) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: 'Customer explicitly selected a different partner offer.',
      };
    }

    const priceRes = resolveEffectivePricePaise({
      service,
      variantId,
      cityId,
      vendorUid: pricingMode === 'vendor_offer' ? vendor.uid : undefined,
      priceOverrides,
    });

    if (!priceRes.bookable || priceRes.unitPricePaise === null) {
      return {
        vendor,
        eligible: false,
        disqualificationReason:
          priceRes.reason || 'Vendor does not have a valid rate for this service and city.',
      };
    }

    if (
      pricingMode === 'vendor_offer' &&
      expectedUnitPricePaise !== undefined &&
      priceRes.unitPricePaise !== expectedUnitPricePaise
    ) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor rate (${priceRes.unitPricePaise}) does not match confirmed quote (${expectedUnitPricePaise}).`,
      };
    }

    return {
      vendor,
      eligible: true,
      effectivePricePaise: priceRes.unitPricePaise,
    };
  });
}

/**
 * Step 3: Evaluates all standard time windows for a given date, location, and service
 * so the customer UI can show real-time slot capacity and prevent booking full/conflicting slots.
 */
export function evaluateSlotsForDate(params: {
  service: Service;
  variantId: string;
  cityId: string;
  pinCode: string;
  scheduledDate: string;
  vendors: Vendor[];
  existingBookings: Booking[];
  priceOverrides: PriceOverride[];
  selectedVendorUid?: string;
  timeWindows?: readonly string[];
}): SlotWindowEvaluation[] {
  const windows = params.timeWindows || STANDARD_TIME_WINDOWS;

  return windows.map((timeWindow) => {
    const evaluations = evaluateVendorsForSlotAndService({
      ...params,
      timeWindow,
    });
    const eligible = evaluations.filter((e) => e.eligible).map((e) => e.vendor);
    return {
      timeWindow,
      available: eligible.length > 0,
      availableCrewCount: eligible.length,
      eligibleVendorUids: eligible.map((v) => v.uid),
      reason:
        eligible.length > 0
          ? `${eligible.length} verified crew${eligible.length > 1 ? 's' : ''} available`
          : 'All crews booked or outside working hours for this slot',
    };
  });
}

/**
 * Step 7: Selects the target vendor using the configured assignment policy:
 * - 'auto_score' / 'auto_lowest_load': Ranks eligible vendors by lowest active workload, highest completion rate, and priority.
 * - 'round_robin': Rotates deterministically across eligible vendors in the city/PIN so jobs are evenly distributed.
 * - 'manual_admin' / 'manual': Holds the booking for Admin manual assignment.
 * If no eligible vendor exists, safely queues for Admin review.
 */
export function selectVendorByDispatchPolicy(params: {
  eligibleVendors: Vendor[];
  policy: AssignmentPolicy;
  existingBookings: Booking[];
  cityId: string;
  pinCode: string;
  preferredVendorUid?: string;
}): DispatchDecision {
  const {
    eligibleVendors,
    policy,
    existingBookings,
    cityId,
    pinCode,
    preferredVendorUid,
  } = params;

  const isManualPolicy = policy === 'manual_admin' || policy === 'manual';

  // If customer explicitly picked a vendor in vendor_offer mode and that vendor is eligible:
  if (preferredVendorUid && !isManualPolicy) {
    const chosen = eligibleVendors.find((v) => v.uid === preferredVendorUid);
    if (chosen) {
      return {
        assignedVendor: chosen,
        status: 'assigned_to_vendor',
        subStatus: 'awaiting_vendor_acceptance',
        assignmentPolicyUsed: policy,
        eligibleVendors,
        customerMessage: `Assigned to your selected partner ${chosen.displayName} (${chosen.vendorCode || chosen.uid}).`,
      };
    }
  }

  // Manual Admin Assignment mode
  if (isManualPolicy) {
    return {
      assignedVendor: null,
      status: 'pending_admin_assignment',
      subStatus: 'manual_admin_hold',
      assignmentPolicyUsed: 'manual_admin',
      eligibleVendors,
      customerMessage:
        'Your booking is confirmed and queued for Main Admin dispatch verification. You will be notified as soon as a specialist is assigned.',
      adminAlertReason: `Booking held under Manual Admin Assignment policy (${eligibleVendors.length} eligible vendor(s) in PIN ${pinCode}).`,
    };
  }

  // No eligible vendor available for this PIN + service + slot
  if (eligibleVendors.length === 0) {
    return {
      assignedVendor: null,
      status: 'pending_admin_assignment',
      subStatus: 'unassigned_no_eligible_vendor',
      assignmentPolicyUsed: policy,
      eligibleVendors: [],
      customerMessage:
        'Your booking request has been recorded and routed to TankmanPro Admin Review because all partner crews in your PIN code are currently at capacity for this slot.',
      adminAlertReason: `No eligible vendor with open slot capacity found for PIN ${pinCode} (${cityId}). Immediate Admin review required.`,
    };
  }

  if (policy === 'round_robin') {
    const sortedByLastAssigned = [...eligibleVendors].sort((a, b) => {
      const lastIndexA = existingBookings.findIndex((bk) => bk.assignedVendorUid === a.uid);
      const lastIndexB = existingBookings.findIndex((bk) => bk.assignedVendorUid === b.uid);
      const rankA = lastIndexA === -1 ? Number.MAX_SAFE_INTEGER : lastIndexA;
      const rankB = lastIndexB === -1 ? Number.MAX_SAFE_INTEGER : lastIndexB;
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return a.uid.localeCompare(b.uid);
    });

    const winner = sortedByLastAssigned[0];
    return {
      assignedVendor: winner,
      status: 'assigned_to_vendor',
      subStatus: 'awaiting_vendor_acceptance',
      assignmentPolicyUsed: 'round_robin',
      eligibleVendors,
      customerMessage: `Assigned via Round-Robin dispatch to ${winner.displayName} (${winner.vendorCode || winner.uid}).`,
    };
  }

  // Default: 'auto_score' / 'auto_lowest_load'
  const scored = [...eligibleVendors].sort((a, b) => {
    if (a.activeAssignedJobs !== b.activeAssignedJobs) {
      return a.activeAssignedJobs - b.activeAssignedJobs;
    }
    const prioA = a.assignmentPriority ?? 50;
    const prioB = b.assignmentPriority ?? 50;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    const compA = a.completionRatePercent ?? 95;
    const compB = b.completionRatePercent ?? 95;
    if (compA !== compB) {
      return compB - compA;
    }
    return (b.slaScore ?? 95) - (a.slaScore ?? 95);
  });

  const winner = scored[0];
  return {
    assignedVendor: winner,
    status: 'assigned_to_vendor',
    subStatus: 'awaiting_vendor_acceptance',
    assignmentPolicyUsed: 'auto_score',
    eligibleVendors,
    customerMessage: `Assigned to verified specialist ${winner.displayName} (${winner.vendorCode || winner.uid}).`,
  };
}

/**
 * Generates a unique human-readable Booking Code (e.g. TMP-2026-1008).
 */
export function generateUniqueBookingCode(existingBookings: Booking[]): string {
  let maxNumber = 1000;
  for (const b of existingBookings) {
    const code = b.bookingCode || b.bookingNumber;
    if (code) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  return `TMP-2026-${maxNumber + 1}`;
}

/**
 * Steps 1–8 Complete Authoritative Customer Booking Transaction.
 */
export function createCustomerBookingTransaction(params: {
  input: CreateCustomerBookingInput;
  cities: City[];
  serviceAreas: ServiceArea[];
  services: Service[];
  vendors: Vendor[];
  priceOverrides: PriceOverride[];
  coupons: Coupon[];
  existingBookings: Booking[];
  assignmentPolicy: AssignmentPolicy;
  taxRatePercent?: number;
  allowUnassignedAdminReview?: boolean;
  nowIso?: string;
}): CreateCustomerBookingResult {
  const {
    input,
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    existingBookings,
    assignmentPolicy,
    taxRatePercent = 0,
    allowUnassignedAdminReview = true,
    nowIso = new Date().toISOString(),
  } = params;

  const pinCode = (input.pinCode || '').trim();
  const customerName = (input.customerName || '').trim();
  const customerPhoneClean = (input.customerPhone || '').replace(/\D/g, '').slice(-10);
  const customerEmail = (input.customerEmail || '').trim() || undefined;
  const addressLine = (input.addressLine || '').trim();
  const landmark = (input.landmark || '').trim() || undefined;
  const scheduledDate = (input.scheduledDate || '').trim();
  const timeWindow = (input.timeWindow || '').trim();
  const customerNotes = (input.customerNotes || '').trim() || undefined;

  // Step 1: Verify PIN code & city serviceability
  if (!isValidIndianPin(pinCode)) {
    return {
      ok: false,
      errorCode: 'UNSERVICEABLE_PIN',
      error: 'Please enter a valid 6-digit Indian PIN code.',
    };
  }

  const pinResolution = lookupPinCoverage(pinCode, cities, serviceAreas);
  if (!pinResolution.serviceable || !pinResolution.city || !pinResolution.serviceArea) {
    return {
      ok: false,
      errorCode: 'UNSERVICEABLE_PIN',
      error:
        pinResolution.message ||
        `PIN ${pinCode} is currently outside our active service areas. Bookings from unsupported locations are blocked.`,
    };
  }

  const city = pinResolution.city;
  const area = pinResolution.serviceArea;

  // Step 2: Verify service & package variant
  const service = services.find((s) => s.id === input.serviceId && s.status === 'published');
  if (!service || !service.supportedCityIds.includes(city.id)) {
    return {
      ok: false,
      errorCode: 'SERVICE_UNAVAILABLE',
      error: `Selected service is not active or not available in ${city.name} (${pinCode}).`,
    };
  }

  const variant = service.variants.find((v) => v.id === input.variantId && v.active);
  if (!variant) {
    return {
      ok: false,
      errorCode: 'SERVICE_UNAVAILABLE',
      error: 'Selected service package variant is not active.',
    };
  }

  // Step 4: Validate customer details & slot format
  if (customerName.length < 2) {
    return {
      ok: false,
      errorCode: 'INVALID_CUSTOMER_DETAILS',
      error: 'Please enter the customer full name (at least 2 characters).',
    };
  }
  if (!/^[6-9]\d{9}$/.test(customerPhoneClean)) {
    return {
      ok: false,
      errorCode: 'INVALID_CUSTOMER_DETAILS',
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }
  if (addressLine.length < 5) {
    return {
      ok: false,
      errorCode: 'INVALID_CUSTOMER_DETAILS',
      error: 'Please enter a complete house/flat number and street address.',
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return {
      ok: false,
      errorCode: 'INVALID_SLOT',
      error: 'Please select a valid booking date (YYYY-MM-DD).',
    };
  }
  if (!timeWindow || timeWindow.length < 5) {
    return {
      ok: false,
      errorCode: 'INVALID_SLOT',
      error: 'Please select a valid service time slot.',
    };
  }

  // Step 6a: Idempotency / Retry Duplicate Guard
  const normalizedPhoneDisplay = `+91 ${customerPhoneClean}`;
  const existingDuplicate = existingBookings.find((b) => {
    if (
      input.idempotencyKey &&
      b.idempotencyKey &&
      b.idempotencyKey === input.idempotencyKey
    ) {
      return true;
    }
    const sameCore =
      b.customerPhone.replace(/\D/g, '').slice(-10) === customerPhoneClean &&
      b.serviceId === service.id &&
      b.variantId === variant.id &&
      (b.scheduledDate || b.preferredDate) === scheduledDate &&
      (b.timeWindow || b.preferredSlot) === timeWindow &&
      b.pinCode === pinCode &&
      b.status !== 'cancelled' &&
      b.status !== 'refunded';
    return sameCore;
  });

  if (existingDuplicate) {
    const dupSnapshot: BookingPriceSnapshot = existingDuplicate.priceSnapshot || {
      pricingMode: existingDuplicate.pricingMode,
      pricingSource: existingDuplicate.quoteSnapshot.pricingSource,
      baseServicePaise: existingDuplicate.quoteSnapshot.baseServicePaise,
      addonsTotalPaise: existingDuplicate.quoteSnapshot.addonsTotalPaise,
      subtotalPaise: existingDuplicate.quoteSnapshot.subtotalPaise,
      couponCode: existingDuplicate.quoteSnapshot.couponCode,
      discountPaise: existingDuplicate.quoteSnapshot.discountPaise,
      taxRatePercent: existingDuplicate.quoteSnapshot.taxRatePercent,
      taxPaise: existingDuplicate.quoteSnapshot.taxPaise,
      finalTotalPaise: existingDuplicate.quoteSnapshot.finalTotalPaise,
      currency: 'INR',
      lockedAtIso: existingDuplicate.createdAtIso,
    };
    return {
      ok: true,
      duplicatePrevented: true,
      booking: {
        ...existingDuplicate,
        bookingCode: existingDuplicate.bookingCode || existingDuplicate.bookingNumber,
        scheduledDate: existingDuplicate.scheduledDate || existingDuplicate.preferredDate,
        timeWindow: existingDuplicate.timeWindow || existingDuplicate.preferredSlot,
        priceSnapshot: dupSnapshot,
      },
    };
  }

  // Step 5: Calculate authoritative final price on the server (never trust client total)
  const pricingMode = resolveServicePricingMode(service, city.id);
  let effectiveSelectedVendorUid =
    pricingMode === 'vendor_offer' ? input.selectedVendorUid : undefined;

  if (pricingMode === 'vendor_offer' && !effectiveSelectedVendorUid) {
    const offers = listEligibleVendorOffers({
      service,
      variantId: variant.id,
      cityId: city.id,
      pinCode,
      vendors,
      priceOverrides,
    });
    if (offers.length > 0) {
      effectiveSelectedVendorUid = offers[0].vendorUid;
    }
  }

  const quote = calculateAuthoritativeQuote({
    request: {
      pinCode,
      serviceId: service.id,
      variantId: variant.id,
      addonQuantities: input.addonQuantities || {},
      selectedVendorUid: effectiveSelectedVendorUid,
      couponCode: input.couponCode,
    },
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    taxRatePercent,
    nowIso,
  });

  if (!quote.bookable) {
    return {
      ok: false,
      errorCode: 'QUOTE_FAILED',
      error: quote.reason || 'Unable to calculate a valid service quote for this location.',
    };
  }

  // Step 3 & Step 7: Evaluate vendor eligibility for the chosen date & time slot
  const vendorEvaluations = evaluateVendorsForSlotAndService({
    service,
    variantId: variant.id,
    cityId: city.id,
    pinCode,
    scheduledDate,
    timeWindow,
    vendors,
    existingBookings,
    priceOverrides,
    expectedUnitPricePaise: quote.baseServicePaise,
    selectedVendorUid: effectiveSelectedVendorUid,
  });

  const eligibleVendors = vendorEvaluations
    .filter((e) => e.eligible)
    .map((e) => e.vendor);

  if (eligibleVendors.length === 0 && !allowUnassignedAdminReview) {
    return {
      ok: false,
      errorCode: 'SLOT_FULL_OR_CONFLICT',
      error:
        'All verified partner crews for this PIN code are already booked during this time slot. Please choose another slot or date.',
    };
  }

  const dispatchDecision = selectVendorByDispatchPolicy({
    eligibleVendors,
    policy: assignmentPolicy,
    existingBookings,
    cityId: city.id,
    pinCode,
    preferredVendorUid: effectiveSelectedVendorUid,
  });

  // Build combined notes including service-specific requirements if provided
  const requirementParts: string[] = [];
  if (input.tankCapacityLitres) {
    requirementParts.push(`Tank Capacity: ${input.tankCapacityLitres}`);
  }
  if (typeof input.unitCount === 'number' && input.unitCount > 0) {
    requirementParts.push(`Units: ${input.unitCount}`);
  }
  if (customerNotes) {
    requirementParts.push(customerNotes);
  }
  const combinedCustomerNotes =
    requirementParts.length > 0 ? requirementParts.join(' · ') : undefined;

  const bookingCode = generateUniqueBookingCode(existingBookings);
  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Payment status is recorded strictly separately from job status
  const paymentMethod: PaymentMethod = input.paymentMethod || 'pay_after_service';
  const paymentStatus: PaymentStatus =
    paymentMethod === 'pay_after_service' ? 'pay_after_service' : 'pending';

  const priceSnapshot: BookingPriceSnapshot = {
    pricingMode: quote.pricingMode,
    pricingSource:
      quote.pricingSource === 'unavailable' ? 'base_price' : quote.pricingSource,
    baseServicePaise: quote.baseServicePaise,
    addonsTotalPaise: quote.addonsTotalPaise,
    subtotalPaise: quote.subtotalPaise,
    couponCode: quote.couponValid ? quote.couponCode : undefined,
    discountPaise: quote.discountPaise,
    taxRatePercent: quote.taxRatePercent,
    taxPaise: quote.taxPaise,
    finalTotalPaise: quote.finalTotalPaise,
    currency: 'INR',
    lockedAtIso: nowIso,
  };

  const newBooking: Booking & {
    priceSnapshot: BookingPriceSnapshot;
    bookingCode: string;
    scheduledDate: string;
    timeWindow: string;
  } = {
    id: bookingId,
    bookingNumber: bookingCode,
    bookingCode,
    idempotencyKey: input.idempotencyKey,
    customerUid: input.customerUid || `cust_${customerPhoneClean}`,
    customerName,
    customerPhone: normalizedPhoneDisplay,
    customerEmail,
    serviceId: service.id,
    serviceSlug: service.slug,
    serviceTitle: service.title,
    categoryId: service.categoryId,
    variantId: variant.id,
    variantName: variant.name,
    addons: quote.addons,
    cityId: city.id,
    cityName: city.name,
    pinCode,
    zoneLabel: area.zoneLabel,
    addressLine,
    landmark,
    propertyType: 'residential',
    preferredDate: scheduledDate,
    preferredSlot: timeWindow,
    scheduledDate,
    timeWindow,
    pricingMode: quote.pricingMode,
    quoteSnapshot: quote,
    priceSnapshot,
    status: dispatchDecision.status,
    subStatus: dispatchDecision.subStatus,
    paymentStatus,
    paymentMethod,
    assignmentMode: dispatchDecision.assignmentPolicyUsed,
    assignedVendorUid: dispatchDecision.assignedVendor
      ? dispatchDecision.assignedVendor.uid
      : null,
    assignedVendorName: dispatchDecision.assignedVendor
      ? dispatchDecision.assignedVendor.displayName
      : null,
    customerNotes: combinedCustomerNotes,
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  const bookingEvent: BookingEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    bookingId: newBooking.id,
    bookingCode: newBooking.bookingCode,
    actorUid: newBooking.customerUid,
    actorRole: 'customer',
    actorName: customerName,
    fromStatus: 'draft',
    toStatus: newBooking.status,
    eventType: dispatchDecision.assignedVendor
      ? 'customer_booking_created_and_dispatched'
      : 'customer_booking_created_pending_admin_review',
    note: dispatchDecision.assignedVendor
      ? `Booking created by ${customerName} (${pinCode}) and assigned to ${dispatchDecision.assignedVendor.displayName} via ${dispatchDecision.assignmentPolicyUsed} policy.`
      : dispatchDecision.adminAlertReason ||
        `Booking created by ${customerName} (${pinCode}) and queued for Admin review.`,
    createdAtIso: nowIso,
  };

  // Step 8: Generate Vendor & Admin in-panel notifications
  const notifications: PortalNotification[] = [];

  if (dispatchDecision.assignedVendor) {
    notifications.push({
      id: `notif_vnd_${Date.now()}_1`,
      recipientRole: 'vendor',
      recipientUid: dispatchDecision.assignedVendor.uid,
      title: `New Booking Assigned: ${newBooking.bookingCode}`,
      message: `${newBooking.serviceTitle} (${newBooking.variantName}) in ${newBooking.zoneLabel} (${newBooking.pinCode}) for ${newBooking.scheduledDate} · ${newBooking.timeWindow}. Please accept in your Job Console to unlock customer contact details.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: 'vendor_assigned',
      severity: 'info',
      read: false,
      createdAtIso: nowIso,
    });

    notifications.push({
      id: `notif_adm_${Date.now()}_2`,
      recipientRole: 'admin',
      recipientUid: 'ALL_ADMINS',
      title: `New Booking Dispatched (${newBooking.bookingCode})`,
      message: `${customerName} booked ${newBooking.serviceTitle} in ${city.name} (${pinCode}). Assigned to ${dispatchDecision.assignedVendor.displayName} via ${dispatchDecision.assignmentPolicyUsed}.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: 'booking_created',
      severity: 'success',
      read: false,
      createdAtIso: nowIso,
    });
  } else {
    notifications.push({
      id: `notif_adm_${Date.now()}_3`,
      recipientRole: 'admin',
      recipientUid: 'ALL_ADMINS',
      title: `Admin Review Required: ${newBooking.bookingCode}`,
      message:
        dispatchDecision.adminAlertReason ||
        `New booking ${newBooking.bookingCode} in ${city.name} (${pinCode}) requires manual vendor assignment.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: 'system_alert',
      severity: 'warning',
      read: false,
      createdAtIso: nowIso,
    });
  }

  return {
    ok: true,
    duplicatePrevented: false,
    booking: newBooking,
    dispatchDecision,
    quote,
    bookingEvent,
    notifications,
  };
}
