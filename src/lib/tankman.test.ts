import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  resolvePortalFromLocation,
  buildPortalHref,
  isValidIndianPin,
  lookupPinCoverage,
} from './portalRouting.ts';
import {
  resolveEffectivePricePaise,
  evaluateCouponDiscount,
  calculateAuthoritativeQuote,
  listEligibleVendorOffers,
} from './pricingEngine.ts';
import {
  computeAdminDashboardMetrics,
  evaluateServiceDeletion,
  validateAndParsePinCsv,
  generateUniqueVendorCode,
  findEligibleVendorsForBooking,
} from './adminEngine.ts';
import {
  filterVendorScopedBookings,
  sanitizeBookingForVendorView,
  validateVendorJobTransition,
  computeVendorDashboardMetrics,
} from './vendorEngine.ts';
import {
  createCustomerBookingTransaction,
  evaluateSlotsForDate,
  selectVendorByDispatchPolicy,
} from './bookingEngine.ts';
import {
  computeRazorpaySignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  generateSimulatedRazorpayOrder,
} from './paymentEngine.ts';
import {
  cleanIndianPhone,
  buildWhatsAppLink,
  buildCustomerBookingConfirmedWhatsApp,
  buildCustomerTechnicianAssignedWhatsApp,
  buildVendorDispatchWhatsApp,
  buildVendorToCustomerEnRouteWhatsApp,
  buildCustomerJobCompletedWhatsApp,
} from './whatsappEngine.ts';
import {
  DEMO_CITIES,
  DEMO_SERVICE_AREAS,
  DEMO_SERVICES,
  DEMO_VENDORS,
  DEMO_PRICE_OVERRIDES,
  DEMO_COUPONS,
  DEMO_CATEGORIES,
} from '../data/demoCatalog.ts';
import type { Booking } from '../types/domain.ts';

test('Portal Routing: separates customer, admin, and vendor shells across domains and preview paths', () => {
  const customHostConfig = {
    customerHostnames: ['tankmanpro.com'],
    adminHostnames: ['admin.tankmanpro.com'],
    vendorHostnames: ['partner.tankmanpro.com'],
  };

  const prodCustomer = resolvePortalFromLocation('tankmanpro.com', '/services', undefined, customHostConfig);
  assert.equal(prodCustomer.portal, 'customer');
  assert.equal(prodCustomer.internalPath, '/services');
  assert.equal(prodCustomer.isCustomDomainHost, true);

  const prodCustomerAdminAttempt = resolvePortalFromLocation('tankmanpro.com', '/admin/login', undefined, customHostConfig);
  assert.equal(prodCustomerAdminAttempt.portal, 'customer');
  assert.equal(prodCustomerAdminAttempt.internalPath, '/404');
  assert.equal(prodCustomerAdminAttempt.redirectUrl, 'https://admin.tankmanpro.com/login');

  const prodAdmin = resolvePortalFromLocation('admin.tankmanpro.com', '/', undefined, customHostConfig);
  assert.equal(prodAdmin.portal, 'admin');
  assert.equal(prodAdmin.internalPath, '/login');
  assert.equal(prodAdmin.isCustomDomainHost, true);

  const prodVendor = resolvePortalFromLocation('partner.tankmanpro.com', '/orders', undefined, customHostConfig);
  assert.equal(prodVendor.portal, 'vendor');
  assert.equal(prodVendor.internalPath, '/orders');
  assert.equal(prodVendor.isCustomDomainHost, true);

  const previewAdmin = resolvePortalFromLocation('localhost', '/admin/bookings');
  assert.equal(previewAdmin.portal, 'admin');
  assert.equal(previewAdmin.internalPath, '/bookings');
  assert.equal(previewAdmin.isCustomDomainHost, false);

  const previewVendor = resolvePortalFromLocation('localhost', '/vendor/login');
  assert.equal(previewVendor.portal, 'vendor');
  assert.equal(previewVendor.internalPath, '/login');
  assert.equal(previewVendor.isCustomDomainHost, false);

  assert.equal(buildPortalHref('admin', '/dashboard', false), '/admin/dashboard');
  assert.equal(buildPortalHref('admin', '/dashboard', true), '/dashboard');
});

test('PIN Code Validation & Serviceability Lookup: validates 6-digit Indian PINs and active areas', () => {
  assert.equal(isValidIndianPin('110001'), true);
  assert.equal(isValidIndianPin('242001'), true);
  assert.equal(isValidIndianPin('010001'), false);
  assert.equal(isValidIndianPin('11001'), false);
  assert.equal(isValidIndianPin('1100012'), false);

  const delhiRes = lookupPinCoverage('110001', DEMO_CITIES, DEMO_SERVICE_AREAS);
  assert.equal(delhiRes.serviceable, true);
  assert.equal(delhiRes.city?.id, 'city_delhi');

  const spnRes = lookupPinCoverage('242001', DEMO_CITIES, DEMO_SERVICE_AREAS);
  assert.equal(spnRes.serviceable, true);
  assert.equal(spnRes.city?.id, 'city_shahjahanpur');

  const knpRes = lookupPinCoverage('208002', DEMO_CITIES, DEMO_SERVICE_AREAS);
  assert.equal(knpRes.serviceable, true);
  assert.equal(knpRes.city?.id, 'city_kanpur');

  const uncoveredRes = lookupPinCoverage('400001', DEMO_CITIES, DEMO_SERVICE_AREAS);
  assert.equal(uncoveredRes.validFormat, true);
  assert.equal(uncoveredRes.serviceable, false);
});

test('Pricing Precedence: vendor_override > city_override > base_price in integer paise', () => {
  const tankService = DEMO_SERVICES.find((s) => s.id === 'srv_mechanized_tank_clean')!;
  const variant500 = 'var_tank_500_1000';

  const delhiCityOverride = resolveEffectivePricePaise({
    service: tankService,
    variantId: variant500,
    cityId: 'city_delhi',
    priceOverrides: DEMO_PRICE_OVERRIDES,
  });
  assert.equal(delhiCityOverride.bookable, true);
  assert.equal(delhiCityOverride.unitPricePaise, 49900);
  assert.equal(delhiCityOverride.pricingSource, 'city_override');

  const spnVendorOverride = resolveEffectivePricePaise({
    service: tankService,
    variantId: variant500,
    cityId: 'city_shahjahanpur',
    vendorUid: 'vendor_demo_spn_1',
    priceOverrides: DEMO_PRICE_OVERRIDES,
  });
  assert.equal(spnVendorOverride.bookable, true);
  assert.equal(spnVendorOverride.unitPricePaise, 85000);
  assert.equal(spnVendorOverride.pricingSource, 'vendor_override');

  const acService = DEMO_SERVICES.find((s) => s.id === 'srv_ac_foam_jet')!;
  const acVariant = 'var_ac_single';

  const vendorOfferPrice = resolveEffectivePricePaise({
    service: acService,
    variantId: acVariant,
    cityId: 'city_delhi',
    vendorUid: 'vendor_demo_del_1',
    priceOverrides: DEMO_PRICE_OVERRIDES,
  });
  assert.equal(vendorOfferPrice.bookable, true);
  assert.equal(vendorOfferPrice.unitPricePaise, 59900);
  assert.equal(vendorOfferPrice.pricingSource, 'vendor_override');
});

test('Vendor Offer Listing: lists only active vendors matching city, PIN, service, and approved override', () => {
  const acService = DEMO_SERVICES.find((s) => s.id === 'srv_ac_foam_jet')!;
  const offers = listEligibleVendorOffers({
    service: acService,
    variantId: 'var_ac_single',
    cityId: 'city_delhi',
    pinCode: '110001',
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
  });

  assert.equal(offers.length, 2);
  assert.equal(offers[0].vendorUid, 'vendor_demo_del_1');
  assert.equal(offers[0].amountPaise, 59900);
  assert.equal(offers[1].vendorUid, 'vendor_demo_del_2');
  assert.equal(offers[1].amountPaise, 62900);
});

test('Coupon Evaluation: validates min order subtotal, city restrictions, and discount caps in paise', () => {
  const validPct = evaluateCouponDiscount({
    couponCode: 'CLEAN10',
    subtotalPaise: 100000,
    cityId: 'city_delhi',
    serviceId: 'srv_mechanized_tank_clean',
    coupons: DEMO_COUPONS,
    nowIso: '2025-06-01T10:00:00.000Z',
  });
  assert.equal(validPct.valid, true);
  assert.equal(validPct.discountPaise, 10000);

  const belowMin = evaluateCouponDiscount({
    couponCode: 'DELHI150',
    subtotalPaise: 49900,
    cityId: 'city_delhi',
    serviceId: 'srv_mechanized_tank_clean',
    coupons: DEMO_COUPONS,
    nowIso: '2025-06-01T10:00:00.000Z',
  });
  assert.equal(belowMin.valid, false);
  assert.equal(belowMin.discountPaise, 0);

  const wrongCity = evaluateCouponDiscount({
    couponCode: 'DELHI150',
    subtotalPaise: 100000,
    cityId: 'city_kanpur',
    serviceId: 'srv_mechanized_tank_clean',
    coupons: DEMO_COUPONS,
    nowIso: '2025-06-01T10:00:00.000Z',
  });
  assert.equal(wrongCity.valid, false);
});

test('Authoritative Quote Calculation: computes base + addons - discount = finalTotalPaise', () => {
  const quote = calculateAuthoritativeQuote({
    request: {
      pinCode: '110001',
      serviceId: 'srv_mechanized_tank_clean',
      variantId: 'var_tank_1000_1500',
      addonQuantities: {
        addon_float_valve: 1,
        addon_pipeline_flush: 1,
      },
      couponCode: 'DELHI150',
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    taxRatePercent: 0,
    nowIso: '2025-06-01T10:00:00.000Z',
  });

  assert.equal(quote.bookable, true);
  assert.equal(quote.baseServicePaise, 89900);
  assert.equal(quote.addonsTotalPaise, 44800);
  assert.equal(quote.subtotalPaise, 134700);
  assert.equal(quote.discountPaise, 15000);
  assert.equal(quote.finalTotalPaise, 119700);
});

test('Admin Engine: Service Deletion Guard blocks deletion when bookings exist and allows when unreferenced', () => {
  const sampleBooking: Booking = {
    id: 'bk_1',
    bookingNumber: 'TMP-2026-1001',
    customerUid: 'cust_1',
    customerName: 'Aarav Sharma',
    customerPhone: '9876543210',
    cityId: 'city_kanpur',
    cityName: 'Kanpur',
    pinCode: '208001',
    zoneLabel: 'Civil Lines',
    addressLine: '14/2 Mall Road',
    propertyType: 'residential',
    serviceId: 'srv_mechanized_tank_clean',
    serviceTitle: 'Mechanized Water Tank Cleaning',
    variantId: 'var_tank_500_1000',
    variantName: '500L - 750L',
    addons: [],
    preferredDate: '2026-10-20',
    preferredSlot: '10:00 AM - 12:00 PM',
    pricingMode: 'city_fixed',
    quoteSnapshot: {} as Booking['quoteSnapshot'],
    status: 'confirmed',
    paymentMethod: 'pay_after_service',
    paymentStatus: 'pending',
    assignedVendorUid: null,
    assignedVendorName: null,
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: '2026-10-20T08:00:00.000Z',
    updatedAtIso: '2026-10-20T08:00:00.000Z',
  };

  const blocked = evaluateServiceDeletion('srv_mechanized_tank_clean', [sampleBooking]);
  assert.equal(blocked.canHardDelete, false);
  assert.equal(blocked.referencedBookingsCount, 1);
  assert.equal(blocked.recommendedAction, 'archive');

  const allowed = evaluateServiceDeletion('srv_unused_test', [sampleBooking]);
  assert.equal(allowed.canHardDelete, true);
  assert.equal(allowed.referencedBookingsCount, 0);
  assert.equal(allowed.recommendedAction, 'delete');
});

test('Admin Engine: CSV PIN Code Bulk Validator catches invalid PINs, duplicates, and multi-city conflicts', () => {
  const csvSample = [
    'pinCode,cityName,state,zoneLabel,active',
    '208012,Kanpur,Uttar Pradesh,Gumti No. 5 & Lajpat Nagar,true',
    '110001,Lucknow,Uttar Pradesh,Hazratganj Conflict Test,true',
    '00123,Kanpur,Uttar Pradesh,Invalid Format Zone,true',
    '208012,Kanpur,Uttar Pradesh,Duplicate In Same CSV,true',
  ].join('\n');

  const result = validateAndParsePinCsv(csvSample, DEMO_CITIES, DEMO_SERVICE_AREAS);
  assert.equal(result.summary.totalRows, 4);
  assert.equal(result.summary.validCount, 1);
  assert.equal(result.summary.conflictCount, 1);
  assert.equal(result.summary.invalidCount, 2);
  assert.equal(result.validRows[0].pinCode, '208012');
  assert.equal(result.conflictRows[0].pinCode, '110001');
});

test('Admin Engine: Dashboard Metrics, Vendor ID Generator, and Eligible Vendor Dispatch Matcher', () => {
  const nextCode = generateUniqueVendorCode([
    { ...DEMO_VENDORS[0], vendorCode: 'TMP-VND-1004' },
  ]);
  assert.equal(nextCode, 'TMP-VND-1005');

  const eligible = findEligibleVendorsForBooking(
    {
      cityId: 'city_kanpur',
      pinCode: '208001',
      serviceId: 'srv_mechanized_tank_clean',
    },
    DEMO_VENDORS
  );
  assert.equal(eligible.length > 0, true);
  assert.equal(eligible[0].supportedCityIds.includes('city_kanpur'), true);

  const metrics = computeAdminDashboardMetrics({
    bookings: [],
    vendors: DEMO_VENDORS,
    services: DEMO_SERVICES,
    categories: DEMO_CATEGORIES,
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    todayDateStr: '2026-10-20',
  });
  assert.equal(metrics.totalBookings, 0);
  assert.equal(metrics.grossBookedValuePaise, 0);
  assert.equal(metrics.cityStats.length, DEMO_CITIES.length);
});

test('Vendor Engine: isolates bookings per vendor, masks PII before acceptance, and validates job transitions', () => {
  const baseBooking: Booking = {
    id: 'bk_vtest_1',
    bookingNumber: 'TMP-2026-2001',
    customerUid: 'cust_1',
    customerName: 'Mohd. Salman Khan',
    customerPhone: '+91 97942 11098',
    customerEmail: 'salman@example.com',
    cityId: 'city_shahjahanpur',
    cityName: 'Shahjahanpur',
    pinCode: '242001',
    zoneLabel: 'Civil Lines, Shahjahanpur',
    addressLine: 'House No. 48, Civil Lines',
    landmark: 'Collectorate Road',
    propertyType: 'residential',
    serviceId: 'srv_mechanized_tank_clean',
    serviceTitle: 'Mechanized Water Tank Cleaning',
    variantId: 'var_tank_500_1000',
    variantName: '500L - 750L',
    addons: [],
    preferredDate: '2026-10-20',
    preferredSlot: '04:00 PM - 06:00 PM',
    pricingMode: 'vendor_offer',
    quoteSnapshot: {
      finalTotalPaise: 100000,
    } as Booking['quoteSnapshot'],
    status: 'assigned_to_vendor',
    paymentMethod: 'pay_after_service',
    paymentStatus: 'pending',
    assignedVendorUid: 'vendor_demo_spn_1',
    assignedVendorName: 'Rohilkhand Tank & Hydro Care',
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: '2026-10-20T08:00:00.000Z',
    updatedAtIso: '2026-10-20T08:00:00.000Z',
  };

  const otherVendorBooking: Booking = {
    ...baseBooking,
    id: 'bk_vtest_2',
    bookingNumber: 'TMP-2026-2002',
    assignedVendorUid: 'vendor_demo_del_1',
    status: 'completed',
  };

  // 1. Strict Vendor Scoping
  const scopedSpn = filterVendorScopedBookings([baseBooking, otherVendorBooking], 'vendor_demo_spn_1');
  assert.equal(scopedSpn.length, 1);
  assert.equal(scopedSpn[0].id, 'bk_vtest_1');

  // Cross-vendor access returns null
  assert.equal(sanitizeBookingForVendorView(otherVendorBooking, 'vendor_demo_spn_1'), null);

  // 2. PII Masking prior to acceptance vs after acceptance
  const preAcceptView = sanitizeBookingForVendorView(baseBooking, 'vendor_demo_spn_1')!;
  assert.equal(preAcceptView.piiRevealed, false);
  assert.equal(preAcceptView.customerPhone.includes('•••'), true);
  assert.equal(preAcceptView.addressLine.includes('unlocked upon accepting job'), true);

  const postAcceptView = sanitizeBookingForVendorView(
    { ...baseBooking, status: 'vendor_accepted' },
    'vendor_demo_spn_1'
  )!;
  assert.equal(postAcceptView.piiRevealed, true);
  assert.equal(postAcceptView.customerPhone, '+91 97942 11098');
  assert.equal(postAcceptView.addressLine, 'House No. 48, Civil Lines');

  // 3. Job Lifecycle Transition Validation
  assert.equal(
    validateVendorJobTransition({
      currentStatus: 'assigned_to_vendor',
      targetStatus: 'vendor_accepted',
    }).allowed,
    true
  );
  assert.equal(
    validateVendorJobTransition({
      currentStatus: 'assigned_to_vendor',
      targetStatus: 'completed',
    }).allowed,
    false
  );
  assert.equal(
    validateVendorJobTransition({
      currentStatus: 'assigned_to_vendor',
      targetStatus: 'vendor_rejected',
      reason: '',
    }).allowed,
    false
  );
  assert.equal(
    validateVendorJobTransition({
      currentStatus: 'assigned_to_vendor',
      targetStatus: 'vendor_rejected',
      reason: 'Crew vehicle breakdown in Civil Lines',
    }).allowed,
    true
  );

  // 4. Vendor Dashboard & Commission Metrics
  const vendorMetrics = computeVendorDashboardMetrics({
    bookings: [
      baseBooking,
      { ...baseBooking, id: 'bk_vtest_done', status: 'completed' },
      otherVendorBooking,
    ],
    vendor: { ...DEMO_VENDORS[2], commissionPercent: 18 },
    todayDateStr: '2026-10-20',
  });
  assert.equal(vendorMetrics.totalAssignedBookings, 2);
  assert.equal(vendorMetrics.awaitingAcceptanceCount, 1);
  assert.equal(vendorMetrics.completedJobsCount, 1);
  assert.equal(vendorMetrics.grossCompletedPaise, 100000);
  assert.equal(vendorMetrics.platformCommissionPaise, 18000);
  assert.equal(vendorMetrics.netVendorEarningsPaise, 82000);
});

test('Phase 3 Booking & Dispatch Engine: slot conflict check, server price snapshot, idempotency, and dispatch modes', () => {
  // 1. Block unsupported PIN code (400001)
  const blockedPinRes = createCustomerBookingTransaction({
    input: {
      customerName: 'Vikram Singh',
      customerPhone: '9811122233',
      addressLine: '12 Marine Drive',
      pinCode: '400001',
      serviceId: 'srv_mechanized_tank_clean',
      variantId: 'var_tank_500_1000',
      scheduledDate: '2026-10-22',
      timeWindow: '09:00 AM – 11:00 AM',
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    existingBookings: [],
    assignmentPolicy: 'auto_score',
  });
  assert.equal(blockedPinRes.ok, false);
  assert.equal(blockedPinRes.errorCode, 'UNSERVICEABLE_PIN');

  // 2. Authoritative Server Price & Automatic Vendor Assignment (ignores tampered clientSubmittedTotalPaise)
  const autoDispatchRes = createCustomerBookingTransaction({
    input: {
      idempotencyKey: 'idem_test_101',
      customerName: 'Ananya Verma',
      customerPhone: '9876543210',
      addressLine: 'H-42, Civil Lines, Near Collectorate',
      pinCode: '242001', // Shahjahanpur -> vendor_demo_spn_1
      serviceId: 'srv_mechanized_tank_clean',
      variantId: 'var_tank_500_1000',
      scheduledDate: '2026-10-22',
      timeWindow: '09:00 AM – 11:00 AM',
      couponCode: 'CLEAN10',
      clientSubmittedTotalPaise: 100, // Tampered 1 Rupee from browser
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    existingBookings: [],
    assignmentPolicy: 'auto_score',
    nowIso: '2026-06-15T10:00:00.000Z',
  });
  assert.equal(autoDispatchRes.ok, true);
  assert.ok(autoDispatchRes.booking);
  // Shahjahanpur vendor override for var_tank_500_1000 is ₹850 (85000 paise); CLEAN10 gives 10% (8500) -> 76500 paise
  assert.equal(autoDispatchRes.booking.priceSnapshot.finalTotalPaise, 76500);
  assert.equal(autoDispatchRes.booking.status, 'assigned_to_vendor');
  assert.equal(autoDispatchRes.booking.assignedVendorUid, 'vendor_demo_spn_1');
  assert.equal(autoDispatchRes.booking.paymentStatus, 'pay_after_service');
  assert.equal(autoDispatchRes.notifications?.length, 2); // 1 vendor + 1 admin notification

  // 3. Idempotency Guard prevents duplicate creation on network retry
  const retryRes = createCustomerBookingTransaction({
    input: {
      idempotencyKey: 'idem_test_101',
      customerName: 'Ananya Verma',
      customerPhone: '9876543210',
      addressLine: 'H-42, Civil Lines, Near Collectorate',
      pinCode: '242001',
      serviceId: 'srv_mechanized_tank_clean',
      variantId: 'var_tank_500_1000',
      scheduledDate: '2026-10-22',
      timeWindow: '09:00 AM – 11:00 AM',
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    existingBookings: [autoDispatchRes.booking],
    assignmentPolicy: 'auto_score',
  });
  assert.equal(retryRes.ok, true);
  assert.equal(retryRes.duplicatePrevented, true);
  assert.equal(retryRes.booking?.id, autoDispatchRes.booking.id);

  // 4. Slot Conflict Check: Vendor already booked in 2026-10-22 · 09:00 AM – 11:00 AM in PIN 242001
  const slotsAfterFirstBooking = evaluateSlotsForDate({
    service: DEMO_SERVICES[0],
    variantId: 'var_tank_500_1000',
    cityId: 'city_shahjahanpur',
    pinCode: '242001',
    scheduledDate: '2026-10-22',
    vendors: DEMO_VENDORS,
    existingBookings: [autoDispatchRes.booking],
    priceOverrides: DEMO_PRICE_OVERRIDES,
    selectedVendorUid: 'vendor_demo_spn_1',
  });
  const nineAmSlot = slotsAfterFirstBooking.find(
    (s) => s.timeWindow === '09:00 AM – 11:00 AM'
  );
  const noonSlot = slotsAfterFirstBooking.find(
    (s) => s.timeWindow === '12:00 PM – 02:00 PM'
  );
  assert.equal(nineAmSlot?.available, false); // Only 1 vendor in 242001, now booked at 09:00 AM
  assert.equal(noonSlot?.available, true); // Free at 12:00 PM

  // 5. Round-Robin Dispatch rotation between multiple eligible vendors in New Delhi (110001)
  const delhiVendors = DEMO_VENDORS.filter((v) =>
    v.supportedAreaPins.includes('110001')
  );
  assert.equal(delhiVendors.length, 2); // vendor_demo_del_1 and vendor_demo_del_2
  const rr1 = selectVendorByDispatchPolicy({
    eligibleVendors: delhiVendors,
    policy: 'round_robin',
    existingBookings: [
      {
        ...autoDispatchRes.booking,
        id: 'bk_del_prev',
        assignedVendorUid: 'vendor_demo_del_1',
      },
    ],
    cityId: 'city_delhi',
    pinCode: '110001',
  });
  assert.equal(rr1.assignedVendor?.uid, 'vendor_demo_del_2');
});

test('Razorpay Payment & Webhook Engine: verifies HMAC SHA-256 signatures and timing-safe checks', () => {
  const secret = 'rzp_secret_test_key_sample_786';
  const orderId = 'order_DA1234567890';
  const paymentId = 'pay_XY9876543210';

  // 1. Compute valid client signature
  const validSignature = computeRazorpaySignature(orderId, paymentId, secret);
  assert.ok(validSignature && validSignature.length === 64);

  // 2. Validate valid client signature
  const isValid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: validSignature,
    secret,
  });
  assert.equal(isValid, true);

  // 3. Reject tampered signature
  const tamperedSig = validSignature.slice(0, -2) + 'aa';
  const isInvalid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: tamperedSig,
    secret,
  });
  assert.equal(isInvalid, false);

  // 4. Webhook verification with raw JSON payload
  const webhookSecret = 'whsec_tankmanpro_live_secret_456';
  const rawWebhookBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 59900,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  const expectedHmac = crypto.createHmac('sha256', webhookSecret).update(rawWebhookBody).digest('hex');

  const webhookCheck = verifyRazorpayWebhookSignature({
    rawBody: rawWebhookBody,
    signature: expectedHmac,
    webhookSecret,
  });
  assert.equal(webhookCheck, true);

  // 5. Reject tampered webhook body
  const tamperedWebhookCheck = verifyRazorpayWebhookSignature({
    rawBody: rawWebhookBody + ' ',
    signature: expectedHmac,
    webhookSecret,
  });
  assert.equal(tamperedWebhookCheck, false);

  // 6. Simulated Order generation
  const simOrder = generateSimulatedRazorpayOrder({
    bookingId: 'bk_sim_123',
    bookingCode: 'TMP-DEL-8901',
    amountPaise: 79900,
    customerPhone: '9876543210',
    serviceTitle: 'Mechanized Water Tank Cleaning',
  });
  assert.equal(simOrder.amount, 79900);
  assert.equal(simOrder.currency, 'INR');
  assert.equal(simOrder.receipt, 'TMP-DEL-8901');
  assert.ok(simOrder.id.startsWith('order_sim_'));
});

test('WhatsApp 1-Click Engine: sanitizes Indian phone numbers and builds pre-filled wa.me links', () => {
  // 1. Phone sanitization
  assert.equal(cleanIndianPhone('9794200100'), '919794200100');
  assert.equal(cleanIndianPhone('+91 97942 00100'), '919794200100');
  assert.equal(cleanIndianPhone('09794200100'), '919794200100');
  assert.equal(cleanIndianPhone('919794200100'), '919794200100');

  // 2. Click-to-chat URL generation
  const link = buildWhatsAppLink('9794200100', 'Namaste Salman ji! Aapka booking confirm hai.');
  assert.ok(link.startsWith('https://wa.me/919794200100?text='));
  assert.ok(link.includes(encodeURIComponent('Namaste Salman ji!')));

  // 3. Customer Booking Confirmation Template
  const sampleBooking: Booking = {
    id: 'bk_wa_test',
    bookingNumber: 'TMP-2026-1001',
    bookingCode: 'TMP-2026-1001',
    customerUid: 'cust_wa',
    customerName: 'Salman Khan',
    customerPhone: '9794200100',
    customerEmail: 'skhan786spn@gmail.com',
    cityId: 'city_kanpur',
    cityName: 'Kanpur',
    pinCode: '208001',
    zoneLabel: 'Civil Lines',
    addressLine: 'Flat 402, Civil Lines',
    pricingMode: 'city_fixed',
    propertyType: 'residential',
    serviceId: 'srv_mechanized_tank_clean',
    serviceTitle: 'Mechanized Water Tank Cleaning',
    variantId: 'var_tank_500_1000',
    variantName: '500L – 1000L Underground / Overhead',
    addons: [],
    priceSnapshot: {
      pricingMode: 'city_fixed',
      pricingSource: 'city_override',
      baseServicePaise: 149900,
      addonsTotalPaise: 0,
      subtotalPaise: 149900,
      discountPaise: 0,
      taxRatePercent: 0,
      taxPaise: 0,
      finalTotalPaise: 149900,
      currency: 'INR',
    },
    quoteSnapshot: {
      bookable: true,
      cityId: 'city_kanpur',
      cityName: 'Kanpur',
      pinCode: '208001',
      zoneLabel: 'Civil Lines Zone',
      pricingMode: 'city_fixed',
      pricingSource: 'city_override',
      serviceId: 'srv_mechanized_tank_clean',
      serviceTitle: 'Mechanized Water Tank Cleaning',
      variantId: 'var_tank_500_1000',
      variantName: '500L – 1000L Underground / Overhead',
      baseServicePaise: 149900,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 149900,
      discountPaise: 0,
      taxRatePercent: 0,
      taxPaise: 0,
      finalTotalPaise: 149900,
      currency: 'INR',
      quoteExpiresAtIso: '2026-10-25T10:00:00.000Z',
      isDemoData: false,
    },
    preferredDate: '2026-10-25',
    preferredSlot: '09:00 AM – 11:00 AM',
    paymentMethod: 'pay_after_service',
    paymentStatus: 'pending',
    status: 'requested',
    vendorExecutionNotes: [],
    assignedVendorUid: 'vnd_1',
    assignedVendorName: 'AquaPure Crew',
    vendorRejectionReason: null,
    subStatus: null,
    createdAtIso: '2026-10-23T10:00:00.000Z',
    updatedAtIso: '2026-10-23T10:00:00.000Z',
    completionPhotos: [],
  };

  const customerMsg = buildCustomerBookingConfirmedWhatsApp(sampleBooking, 'https://tankmanpro.com');
  assert.ok(customerMsg.includes('TMP-2026-1001'));
  assert.ok(customerMsg.includes('Mechanized Water Tank Cleaning'));
  assert.ok(customerMsg.includes('Salman Khan'));
  assert.ok(customerMsg.includes('https://tankmanpro.com/track?bookingCode=TMP-2026-1001'));

  // 4. Vendor Dispatch Template
  const vendorDispatchMsg = buildVendorDispatchWhatsApp(
    sampleBooking,
    { displayName: 'AquaPure Techs', vendorCode: 'TMP-VND-1001' },
    'https://tankmanpro.com'
  );
  assert.ok(vendorDispatchMsg.includes('NEW JOB DISPATCH'));
  assert.ok(vendorDispatchMsg.includes('TMP-2026-1001'));
  assert.ok(vendorDispatchMsg.includes('208001'));

  // 5. Technician En-Route Template
  const enRouteMsg = buildVendorToCustomerEnRouteWhatsApp(sampleBooking, {
    displayName: 'Ramesh Kumar',
    phone: '9876543210',
  });
  assert.ok(enRouteMsg.includes('TECHNICIAN EN ROUTE'));
  assert.ok(enRouteMsg.includes('Ramesh Kumar'));
  assert.ok(enRouteMsg.includes('9876543210'));

  // 6. Job Completed Template
  const completedMsg = buildCustomerJobCompletedWhatsApp(sampleBooking, 'https://tankmanpro.com');
  assert.ok(completedMsg.includes('SERVICE COMPLETED'));
  assert.ok(completedMsg.includes('7-Day TankmanPro Service Guarantee'));
});




