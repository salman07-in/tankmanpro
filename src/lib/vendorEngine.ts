/**
 * TankmanPro — Pure Vendor Portal Domain & RBAC Engine
 *
 * Implements deterministic, side-effect-free business logic for:
 * 1. Strict Vendor Booking Isolation (prevents cross-vendor booking access)
 * 2. Customer PII & Address Masking prior to booking acceptance ("only when needed to fulfil")
 * 3. Permitted Vendor Job Lifecycle State Machine & Reason Validation
 * 4. Vendor Dashboard KPIs, Completion Rate, and Net Earnings / Commission Calculation in integer paise
 */

import type { Booking, BookingStatus, Vendor } from '../types/domain.ts';

export interface VendorDashboardMetrics {
  totalAssignedBookings: number;
  awaitingAcceptanceCount: number;
  todaysJobsCount: number;
  upcomingJobsCount: number;
  inProgressJobsCount: number;
  completedJobsCount: number;
  rejectedOrCancelledCount: number;
  completionRatePercent: number;
  commissionPercent: number;
  grossCompletedPaise: number;
  platformCommissionPaise: number;
  netVendorEarningsPaise: number;
  pendingPipelineGrossPaise: number;
  pendingPipelineNetPaise: number;
}

export interface VendorTransitionValidation {
  allowed: boolean;
  error?: string;
}

/**
 * Returns only bookings strictly assigned to the authenticated vendor UID.
 * Never exposes unassigned bookings or other vendors' bookings.
 */
export function filterVendorScopedBookings(
  bookings: Booking[],
  vendorUid: string,
  supportedAreaPins?: string[]
): Booking[] {
  const cleanUid = (vendorUid || '').trim();
  if (!cleanUid) return [];
  return bookings.filter((b) => {
    if (b.assignedVendorUid !== cleanUid) return false;
    if (Array.isArray(supportedAreaPins) && supportedAreaPins.length > 0) {
      return supportedAreaPins.includes(b.pinCode);
    }
    return true;
  });
}

/**
 * Masks a phone number for pre-acceptance display (e.g. "+91 97942 11098" -> "+91 97••• ••098").
 */
export function maskCustomerPhone(phone: string): string {
  const clean = (phone || '').trim();
  if (clean.length <= 4) return '••••';
  const last3 = clean.slice(-3);
  const prefix = clean.slice(0, Math.min(6, clean.length - 3));
  return `${prefix}•••${last3}`;
}

/**
 * Enforces "Customer location and service details, only when needed to fulfil the booking":
 * - Before a vendor accepts a booking (`assigned_to_vendor`, `vendor_rejected`, `cancelled`),
 *   only the locality/zone (`zoneLabel`), `cityName`, and `pinCode` are shown, while the exact
 *   house/flat number and full phone number are masked.
 * - Once accepted (`vendor_accepted`, `in_progress`, `completed`), full street address,
 *   landmark, and phone number are provided for field execution.
 */
export function sanitizeBookingForVendorView(
  booking: Booking,
  vendorUid: string
): (Booking & { piiRevealed: boolean }) | null {
  if (!booking || booking.assignedVendorUid !== vendorUid) {
    return null;
  }

  const piiRevealed =
    booking.status === 'vendor_accepted' ||
    booking.status === 'in_progress' ||
    booking.status === 'completed';

  if (piiRevealed) {
    return {
      ...booking,
      piiRevealed: true,
    };
  }

  return {
    ...booking,
    customerPhone: maskCustomerPhone(booking.customerPhone),
    customerEmail: undefined,
    addressLine: `${booking.zoneLabel} (Full street/flat address unlocked upon accepting job)`,
    landmark: booking.landmark ? 'Visible after job acceptance' : undefined,
    piiRevealed: false,
  };
}

/**
 * Validates whether a vendor is permitted to transition a booking from `currentStatus` to `targetStatus`.
 * Vendors can NEVER mark payments as paid/refunded or jump directly from assigned to completed.
 */
export function validateVendorJobTransition(params: {
  currentStatus: BookingStatus;
  targetStatus: BookingStatus;
  reason?: string;
}): VendorTransitionValidation {
  const { currentStatus, targetStatus, reason } = params;
  const cleanReason = (reason || '').trim();

  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      error: `Booking is already in "${currentStatus}" status.`,
    };
  }

  // 1. From assigned_to_vendor -> vendor_accepted or vendor_rejected
  if (currentStatus === 'assigned_to_vendor') {
    if (targetStatus === 'vendor_accepted') {
      return { allowed: true };
    }
    if (targetStatus === 'vendor_rejected') {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: 'Please provide a clear rejection/reassignment reason (at least 5 characters) for Admin Dispatch.',
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: 'New assigned bookings must first be Accepted or Rejected before starting field execution.',
    };
  }

  // 2. From vendor_accepted -> in_progress or vendor_rejected (reassignment request)
  if (currentStatus === 'vendor_accepted') {
    if (targetStatus === 'in_progress') {
      return { allowed: true };
    }
    if (targetStatus === 'vendor_rejected') {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: 'Please provide a valid reason (at least 5 characters) to request booking reassignment.',
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: 'Accepted bookings must be marked as Started (In Progress) before they can be completed.',
    };
  }

  // 3. From in_progress -> completed or vendor_rejected (unable to complete / emergency reassignment)
  if (currentStatus === 'in_progress') {
    if (targetStatus === 'completed') {
      return { allowed: true };
    }
    if (targetStatus === 'vendor_rejected') {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: 'Please explain why the job could not be completed so Admin can assist the customer.',
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Invalid transition from in_progress to ${targetStatus}.`,
    };
  }

  return {
    allowed: false,
    error: `Bookings in "${currentStatus}" status are locked and cannot be transitioned by the vendor.`,
  };
}

/**
 * Computes Vendor Dashboard KPIs and integer-paise earnings strictly from assigned bookings.
 */
export function computeVendorDashboardMetrics(params: {
  bookings: Booking[];
  vendor: Vendor;
  todayDateStr: string;
}): VendorDashboardMetrics {
  const { bookings, vendor, todayDateStr } = params;
  const scoped = filterVendorScopedBookings(bookings, vendor.uid, vendor.supportedAreaPins);
  const commissionPercent =
    typeof vendor.commissionPercent === 'number' && vendor.commissionPercent >= 0
      ? vendor.commissionPercent
      : 18;

  let awaitingAcceptanceCount = 0;
  let todaysJobsCount = 0;
  let upcomingJobsCount = 0;
  let inProgressJobsCount = 0;
  let completedJobsCount = 0;
  let rejectedOrCancelledCount = 0;

  let grossCompletedPaise = 0;
  let pendingPipelineGrossPaise = 0;

  for (const b of scoped) {
    const amountPaise = b.quoteSnapshot?.finalTotalPaise || 0;
    const isRejectedOrCancelled =
      b.status === 'vendor_rejected' || b.status === 'cancelled' || b.status === 'refunded';

    if (b.status === 'assigned_to_vendor') {
      awaitingAcceptanceCount += 1;
    } else if (b.status === 'in_progress') {
      inProgressJobsCount += 1;
    } else if (b.status === 'completed') {
      completedJobsCount += 1;
      grossCompletedPaise += amountPaise;
    } else if (isRejectedOrCancelled) {
      rejectedOrCancelledCount += 1;
    }

    if (
      b.status === 'assigned_to_vendor' ||
      b.status === 'vendor_accepted' ||
      b.status === 'in_progress'
    ) {
      pendingPipelineGrossPaise += amountPaise;
    }

    if (!isRejectedOrCancelled) {
      if (b.preferredDate === todayDateStr) {
        todaysJobsCount += 1;
      } else if (b.preferredDate > todayDateStr) {
        upcomingJobsCount += 1;
      }
    }
  }

  const platformCommissionPaise = Math.round((grossCompletedPaise * commissionPercent) / 100);
  const netVendorEarningsPaise = Math.max(0, grossCompletedPaise - platformCommissionPaise);

  const pendingCommissionPaise = Math.round(
    (pendingPipelineGrossPaise * commissionPercent) / 100
  );
  const pendingPipelineNetPaise = Math.max(
    0,
    pendingPipelineGrossPaise - pendingCommissionPaise
  );

  const actionableDenominator = completedJobsCount + rejectedOrCancelledCount;
  const completionRatePercent =
    actionableDenominator > 0
      ? Math.round((completedJobsCount / actionableDenominator) * 100)
      : 100;

  return {
    totalAssignedBookings: scoped.length,
    awaitingAcceptanceCount,
    todaysJobsCount,
    upcomingJobsCount,
    inProgressJobsCount,
    completedJobsCount,
    rejectedOrCancelledCount,
    completionRatePercent,
    commissionPercent,
    grossCompletedPaise,
    platformCommissionPaise,
    netVendorEarningsPaise,
    pendingPipelineGrossPaise,
    pendingPipelineNetPaise,
  };
}
