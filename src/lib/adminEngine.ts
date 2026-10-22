/**
 * TankmanPro — Pure Admin & Dispatch Domain Engine
 *
 * Implements side-effect-free, deterministic business rules for:
 * 1. Dashboard KPIs & City-wise Booking/Revenue aggregation (strictly from recorded data)
 * 2. Service Deletion Referential Guard (blocks hard-delete when referenced by bookings; recommends archive)
 * 3. PIN Code CSV Bulk Import Parser, Validator & Multi-City Conflict Detector
 * 4. Unique Vendor Code Generator (TMP-VND-XXXX)
 * 5. Eligible Vendor Dispatch Matcher & Auto-Assignment Selector
 */

import type {
  Booking,
  Category,
  City,
  Service,
  ServiceArea,
  Vendor,
} from '../types/domain.ts';
import { isValidIndianPin } from './portalRouting.ts';

export interface CityBookingStat {
  cityId: string;
  cityName: string;
  state: string;
  active: boolean;
  pinCount: number;
  activeVendorsCount: number;
  totalBookings: number;
  pendingBookings: number;
  acceptedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  grossBookedValuePaise: number;
  paidRevenuePaise: number;
  pendingCollectionPaise: number;
}

export interface AdminDashboardMetrics {
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  acceptedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  rejectedByVendorBookings: number;
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  suspendedVendors: number;
  totalServices: number;
  publishedServices: number;
  draftServices: number;
  archivedServices: number;
  totalCategories: number;
  grossBookedValuePaise: number;
  paidRevenuePaise: number;
  pendingCollectionPaise: number;
  refundedValuePaise: number;
  cityStats: CityBookingStat[];
}

export function computeAdminDashboardMetrics(params: {
  bookings: Booking[];
  vendors: Vendor[];
  services: Service[];
  categories: Category[];
  cities: City[];
  serviceAreas: ServiceArea[];
  todayDateStr: string; // YYYY-MM-DD
  filterCityId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}): AdminDashboardMetrics {
  const {
    bookings,
    vendors,
    services,
    categories,
    cities,
    serviceAreas,
    todayDateStr,
    filterCityId,
    dateFrom,
    dateTo,
  } = params;

  const filteredBookings = bookings.filter((b) => {
    if (filterCityId && filterCityId !== 'ALL' && b.cityId !== filterCityId) {
      return false;
    }
    const createdDate = (b.createdAtIso || '').slice(0, 10);
    const serviceDate = b.preferredDate || createdDate;
    if (dateFrom && serviceDate < dateFrom && createdDate < dateFrom) {
      return false;
    }
    if (dateTo && serviceDate > dateTo && createdDate > dateTo) {
      return false;
    }
    return true;
  });

  let todayBookings = 0;
  let pendingBookings = 0;
  let acceptedBookings = 0;
  let inProgressBookings = 0;
  let completedBookings = 0;
  let cancelledBookings = 0;
  let rejectedByVendorBookings = 0;

  let grossBookedValuePaise = 0;
  let paidRevenuePaise = 0;
  let pendingCollectionPaise = 0;
  let refundedValuePaise = 0;

  for (const b of filteredBookings) {
    const createdDate = (b.createdAtIso || '').slice(0, 10);
    if (b.preferredDate === todayDateStr || createdDate === todayDateStr) {
      todayBookings += 1;
    }

    if (
      b.status === 'requested' ||
      b.status === 'confirmed' ||
      b.status === 'assigned_to_vendor'
    ) {
      pendingBookings += 1;
    } else if (b.status === 'vendor_accepted') {
      acceptedBookings += 1;
    } else if (b.status === 'in_progress') {
      inProgressBookings += 1;
    } else if (b.status === 'completed') {
      completedBookings += 1;
    } else if (b.status === 'cancelled' || b.status === 'refunded') {
      cancelledBookings += 1;
    } else if (b.status === 'vendor_rejected') {
      rejectedByVendorBookings += 1;
      pendingBookings += 1; // Requires dispatch attention
    }

    const totalPaise = b.quoteSnapshot?.finalTotalPaise || 0;

    if (b.status !== 'cancelled' && b.status !== 'refunded') {
      grossBookedValuePaise += totalPaise;
    }

    if (b.paymentStatus === 'paid' || b.paymentStatus === 'captured') {
      paidRevenuePaise += totalPaise;
    } else if (b.paymentStatus === 'refunded' || b.status === 'refunded') {
      refundedValuePaise += totalPaise;
    } else if (b.status !== 'cancelled') {
      pendingCollectionPaise += totalPaise;
    }
  }

  const cityStats: CityBookingStat[] = cities.map((city) => {
    const cityBookings = filteredBookings.filter((b) => b.cityId === city.id);
    const cityPins = serviceAreas.filter((a) => a.cityId === city.id && a.active);
    const cityActiveVendors = vendors.filter(
      (v) => v.status === 'active' && v.supportedCityIds.includes(city.id)
    );

    let cPending = 0;
    let cAccepted = 0;
    let cInProgress = 0;
    let cCompleted = 0;
    let cCancelled = 0;
    let cGrossPaise = 0;
    let cPaidPaise = 0;
    let cPendingCollectionPaise = 0;

    for (const cb of cityBookings) {
      const amount = cb.quoteSnapshot?.finalTotalPaise || 0;
      if (
        cb.status === 'requested' ||
        cb.status === 'confirmed' ||
        cb.status === 'assigned_to_vendor' ||
        cb.status === 'vendor_rejected'
      ) {
        cPending += 1;
      } else if (cb.status === 'vendor_accepted') {
        cAccepted += 1;
      } else if (cb.status === 'in_progress') {
        cInProgress += 1;
      } else if (cb.status === 'completed') {
        cCompleted += 1;
      } else if (cb.status === 'cancelled' || cb.status === 'refunded') {
        cCancelled += 1;
      }

      if (cb.status !== 'cancelled' && cb.status !== 'refunded') {
        cGrossPaise += amount;
      }
      if (cb.paymentStatus === 'paid' || cb.paymentStatus === 'captured') {
        cPaidPaise += amount;
      } else if (cb.status !== 'cancelled' && cb.status !== 'refunded') {
        cPendingCollectionPaise += amount;
      }
    }

    return {
      cityId: city.id,
      cityName: city.name,
      state: city.state,
      active: city.active,
      pinCount: cityPins.length,
      activeVendorsCount: cityActiveVendors.length,
      totalBookings: cityBookings.length,
      pendingBookings: cPending,
      acceptedBookings: cAccepted,
      inProgressBookings: cInProgress,
      completedBookings: cCompleted,
      cancelledBookings: cCancelled,
      grossBookedValuePaise: cGrossPaise,
      paidRevenuePaise: cPaidPaise,
      pendingCollectionPaise: cPendingCollectionPaise,
    };
  });

  return {
    totalBookings: filteredBookings.length,
    todayBookings,
    pendingBookings,
    acceptedBookings,
    inProgressBookings,
    completedBookings,
    cancelledBookings,
    rejectedByVendorBookings,
    totalVendors: vendors.length,
    activeVendors: vendors.filter((v) => v.status === 'active').length,
    pendingVendors: vendors.filter(
      (v) => v.status === 'pending' || v.status === 'pending_verification'
    ).length,
    suspendedVendors: vendors.filter((v) => v.status === 'suspended').length,
    totalServices: services.length,
    publishedServices: services.filter((s) => s.status === 'published').length,
    draftServices: services.filter((s) => s.status === 'draft').length,
    archivedServices: services.filter((s) => s.status === 'archived').length,
    totalCategories: categories.length,
    grossBookedValuePaise,
    paidRevenuePaise,
    pendingCollectionPaise,
    refundedValuePaise,
    cityStats,
  };
}

export interface ServiceDeletionEvaluation {
  canHardDelete: boolean;
  referencedBookingsCount: number;
  recommendedAction: 'delete' | 'archive';
  message: string;
}

/**
 * Prevents hard deletion of services referenced by existing bookings;
 * instructs the caller/UI to archive the service instead.
 */
export function evaluateServiceDeletion(
  serviceId: string,
  bookings: Booking[]
): ServiceDeletionEvaluation {
  const referenced = bookings.filter((b) => b.serviceId === serviceId);
  if (referenced.length > 0) {
    return {
      canHardDelete: false,
      referencedBookingsCount: referenced.length,
      recommendedAction: 'archive',
      message: `Cannot delete service because it is referenced by ${referenced.length} recorded booking(s). It has been safely archived instead to preserve booking history.`,
    };
  }
  return {
    canHardDelete: true,
    referencedBookingsCount: 0,
    recommendedAction: 'delete',
    message: 'Service has no booking references and can be permanently deleted.',
  };
}

export interface ParsedPinCsvRow {
  rowNumber: number;
  pinCode: string;
  cityName: string;
  state: string;
  zoneLabel: string;
  active: boolean;
  matchedCityId?: string;
  status: 'valid_new' | 'valid_update' | 'conflict' | 'invalid';
  reason?: string;
}

export interface PinCsvValidationResult {
  rows: ParsedPinCsvRow[];
  validRows: ParsedPinCsvRow[];
  conflictRows: ParsedPinCsvRow[];
  invalidRows: ParsedPinCsvRow[];
  summary: {
    totalRows: number;
    validCount: number;
    conflictCount: number;
    invalidCount: number;
  };
}

/**
 * Validates a CSV string of PIN codes (`pinCode,cityName,state,zoneLabel,active`).
 * - Rejects invalid 6-digit Indian PIN codes.
 * - Rejects duplicate PIN codes within the same CSV batch.
 * - Flags location conflicts when a PIN already exists mapped to a different city
 *   so the Admin can review and explicitly approve/reject conflict overrides.
 */
export function validateAndParsePinCsv(
  csvText: string,
  existingCities: City[],
  existingAreas: ServiceArea[]
): PinCsvValidationResult {
  const lines = (csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: ParsedPinCsvRow[] = [];
  const seenPinsInBatch = new Map<string, string>(); // pinCode -> cityName

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',').map((p) => p.trim());

    // Skip header row if detected
    if (
      i === 0 &&
      (parts[0].toLowerCase().includes('pin') || parts[0].toLowerCase() === 'pincode')
    ) {
      continue;
    }

    const rowNumber = i + 1;
    const [rawPin = '', rawCity = '', rawState = '', rawZone = '', rawActive = 'true'] = parts;
    const pinCode = rawPin.trim();
    const cityName = rawCity.trim();
    const state = rawState.trim() || 'Uttar Pradesh';
    const zoneLabel = rawZone.trim() || `${cityName} Central Zone`;
    const active =
      rawActive.toLowerCase() !== 'false' &&
      rawActive.toLowerCase() !== '0' &&
      rawActive.toLowerCase() !== 'inactive';

    if (!isValidIndianPin(pinCode)) {
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: 'invalid',
        reason: `Invalid 6-digit Indian PIN code "${pinCode}".`,
      });
      continue;
    }

    if (!cityName || cityName.length < 2) {
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: 'invalid',
        reason: 'City name is required for each PIN code row.',
      });
      continue;
    }

    // Check duplicate or conflicting PIN inside the same CSV upload
    if (seenPinsInBatch.has(pinCode)) {
      const firstCity = seenPinsInBatch.get(pinCode)!;
      const isDifferentCity = firstCity.toLowerCase() !== cityName.toLowerCase();
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: isDifferentCity ? 'conflict' : 'invalid',
        reason: isDifferentCity
          ? `Location conflict in CSV: PIN ${pinCode} was already listed for "${firstCity}" and now appears for "${cityName}".`
          : `Duplicate PIN ${pinCode} found within the same CSV file.`,
      });
      continue;
    }
    seenPinsInBatch.set(pinCode, cityName);

    const matchedCity = existingCities.find(
      (c) =>
        c.name.toLowerCase() === cityName.toLowerCase() ||
        c.slug.toLowerCase() === cityName.toLowerCase().replace(/\s+/g, '-')
    );

    const existingArea = existingAreas.find((a) => a.pinCode === pinCode);

    if (existingArea) {
      const existingCity = existingCities.find((c) => c.id === existingArea.cityId);
      const existingCityName = existingArea.cityName || existingCity?.name || '';
      if (
        existingCityName &&
        existingCityName.toLowerCase() !== cityName.toLowerCase()
      ) {
        rows.push({
          rowNumber,
          pinCode,
          cityName,
          state,
          zoneLabel,
          active,
          matchedCityId: matchedCity?.id,
          status: 'conflict',
          reason: `Location Conflict: PIN ${pinCode} is currently mapped to "${existingCityName}" (${existingArea.zoneLabel}), but CSV assigns it to "${cityName}". Admin review required.`,
        });
        continue;
      }

      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        matchedCityId: matchedCity?.id || existingArea.cityId,
        status: 'valid_update',
        reason: `Updates existing PIN ${pinCode} in ${cityName}.`,
      });
      continue;
    }

    rows.push({
      rowNumber,
      pinCode,
      cityName,
      state,
      zoneLabel,
      active,
      matchedCityId: matchedCity?.id,
      status: 'valid_new',
      reason: matchedCity
        ? `Maps new PIN ${pinCode} to existing city ${matchedCity.name}.`
        : `Maps new PIN ${pinCode} and will create new city "${cityName}" (${state}).`,
    });
  }

  const validRows = rows.filter(
    (r) => r.status === 'valid_new' || r.status === 'valid_update'
  );
  const conflictRows = rows.filter((r) => r.status === 'conflict');
  const invalidRows = rows.filter((r) => r.status === 'invalid');

  return {
    rows,
    validRows,
    conflictRows,
    invalidRows,
    summary: {
      totalRows: rows.length,
      validCount: validRows.length,
      conflictCount: conflictRows.length,
      invalidCount: invalidRows.length,
    },
  };
}

/**
 * Generates a unique human-readable Vendor ID (e.g., TMP-VND-1005).
 */
export function generateUniqueVendorCode(existingVendors: Vendor[]): string {
  let maxNumber = 1000;
  for (const v of existingVendors) {
    if (v.vendorCode) {
      const match = v.vendorCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  return `TMP-VND-${maxNumber + 1}`;
}

/**
 * Finds and ranks eligible active vendors for a booking based on City, 6-digit PIN code,
 * Service authorization, availability toggle, and active job capacity.
 */
export function findEligibleVendorsForBooking(
  booking: Pick<Booking, 'cityId' | 'pinCode' | 'serviceId'>,
  vendors: Vendor[]
): Vendor[] {
  return vendors
    .filter((v) => {
      if (v.status !== 'active') return false;
      if (v.isAvailable === false) return false;
      if (!v.supportedCityIds.includes(booking.cityId)) return false;
      if (!v.supportedAreaPins.includes(booking.pinCode)) return false;
      if (!v.supportedServiceIds.includes(booking.serviceId)) return false;
      if (v.activeAssignedJobs >= v.maxActiveJobs) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.activeAssignedJobs !== b.activeAssignedJobs) {
        return a.activeAssignedJobs - b.activeAssignedJobs;
      }
      return (a.assignmentPriority || 99) - (b.assignmentPriority || 99);
    });
}
