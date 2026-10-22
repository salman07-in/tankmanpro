/**
 * TankmanPro — Authoritative Pricing Engine & Coupon Calculator (Integer Paise)
 *
 * Precedence Rules (PRD Section 9):
 * 1. Explicit vendor + service + city + variant override (when in vendor_offer mode and active)
 * 2. City + service + variant override
 * 3. Service variant base price
 * 4. If service is not supported in the city or no valid price exists, fail safely.
 */

import type {
  City,
  Coupon,
  PriceOverride,
  PriceResolutionResult,
  PricingMode,
  QuoteBreakdown,
  QuoteRequestPayload,
  Service,
  ServiceArea,
  Vendor,
  VendorOfferOption,
} from '../types/domain.ts';
import { lookupPinCoverage } from './portalRouting.ts';

/**
 * Formats integer paise into Indian Rupee display format (e.g., 79900 -> "₹799").
 */
export function formatPaiseToInr(amountPaise: number): string {
  const rupees = amountPaise / 100;
  const hasPaise = amountPaise % 100 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees);
}

/**
 * Determines the effective pricing mode for a given service and city.
 */
export function resolveServicePricingMode(service: Service, cityId: string): PricingMode {
  if (service.cityModeOverrides && service.cityModeOverrides[cityId]) {
    return service.cityModeOverrides[cityId];
  }
  return service.defaultPricingMode;
}

/**
 * Resolves the authoritative unit price in integer paise for a service, variant, city, and optional vendor.
 */
export function resolveEffectivePricePaise(params: {
  service: Service;
  variantId: string;
  cityId: string;
  vendorUid?: string;
  priceOverrides: PriceOverride[];
}): PriceResolutionResult {
  const { service, variantId, cityId, vendorUid, priceOverrides } = params;

  if (service.status !== 'published') {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: 'INR',
      pricingSource: 'unavailable',
      reason: 'Service is not published for booking.',
    };
  }

  if (!service.supportedCityIds.includes(cityId)) {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: 'INR',
      pricingSource: 'unavailable',
      reason: 'Service is not enabled in the selected city.',
    };
  }

  const variant = service.variants.find((v) => v.id === variantId && v.active);
  if (!variant) {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: 'INR',
      pricingSource: 'unavailable',
      reason: 'Selected service package/variant is not active.',
    };
  }

  const pricingMode = resolveServicePricingMode(service, cityId);

  // 1. Vendor + Service + City + Variant Override (when vendor_offer mode or explicit vendor selected)
  if (vendorUid) {
    const vendorOverride = priceOverrides.find(
      (po) =>
        po.active &&
        po.serviceId === service.id &&
        po.variantId === variantId &&
        po.cityId === cityId &&
        po.vendorUid === vendorUid
    );

    if (vendorOverride && vendorOverride.amountPaise > 0) {
      return {
        bookable: true,
        pricingMode,
        unitPricePaise: vendorOverride.amountPaise,
        currency: 'INR',
        pricingSource: 'vendor_override',
      };
    }

    if (pricingMode === 'vendor_offer') {
      return {
        bookable: false,
        pricingMode,
        unitPricePaise: null,
        currency: 'INR',
        pricingSource: 'unavailable',
        reason: 'Selected vendor does not have an Admin-approved offer price for this variant and city.',
      };
    }
  }

  // 2. City + Service + Variant Override
  const cityOverride = priceOverrides.find(
    (po) =>
      po.active &&
      po.serviceId === service.id &&
      po.variantId === variantId &&
      po.cityId === cityId &&
      !po.vendorUid
  );

  if (cityOverride && cityOverride.amountPaise > 0) {
    return {
      bookable: true,
      pricingMode,
      unitPricePaise: cityOverride.amountPaise,
      currency: 'INR',
      pricingSource: 'city_override',
    };
  }

  // 3. Variant Base Price Fallback
  if (variant.basePricePaise > 0) {
    return {
      bookable: true,
      pricingMode,
      unitPricePaise: variant.basePricePaise,
      currency: 'INR',
      pricingSource: 'base_price',
    };
  }

  return {
    bookable: false,
    pricingMode,
    unitPricePaise: null,
    currency: 'INR',
    pricingSource: 'unavailable',
    reason: 'Price is not configured for this service and city.',
  };
}

/**
 * Lists eligible vendor offers in a city/PIN for a service variant when pricingMode === 'vendor_offer'.
 */
export function listEligibleVendorOffers(params: {
  service: Service;
  variantId: string;
  cityId: string;
  pinCode: string;
  vendors: Vendor[];
  priceOverrides: PriceOverride[];
}): VendorOfferOption[] {
  const { service, variantId, cityId, pinCode, vendors, priceOverrides } = params;

  const eligibleVendors = vendors.filter(
    (v) =>
      v.status === 'active' &&
      v.supportedCityIds.includes(cityId) &&
      v.supportedAreaPins.includes(pinCode) &&
      v.supportedServiceIds.includes(service.id) &&
      v.activeAssignedJobs < v.maxActiveJobs
  );

  const offers: VendorOfferOption[] = [];

  for (const vendor of eligibleVendors) {
    const resolution = resolveEffectivePricePaise({
      service,
      variantId,
      cityId,
      vendorUid: vendor.uid,
      priceOverrides,
    });

    if (
      resolution.bookable &&
      resolution.unitPricePaise !== null &&
      resolution.pricingSource === 'vendor_override'
    ) {
      offers.push({
        vendorUid: vendor.uid,
        vendorDisplayName: vendor.displayName,
        businessName: vendor.businessName,
        experienceYearsLabel: vendor.experienceYearsLabel,
        amountPaise: resolution.unitPricePaise,
        pricingSource: 'vendor_override',
        availableSlots: ['09:00 AM – 11:00 AM', '12:00 PM – 02:00 PM', '03:30 PM – 05:30 PM'],
        isDemo: vendor.isDemo,
      });
    }
  }

  return offers.sort((a, b) => a.amountPaise - b.amountPaise);
}

/**
 * Validates a coupon code against server-authoritative rules and returns the discount in integer paise.
 */
export function evaluateCouponDiscount(params: {
  couponCode: string;
  subtotalPaise: number;
  cityId: string;
  serviceId: string;
  coupons: Coupon[];
  nowIso?: string;
}): {
  valid: boolean;
  discountPaise: number;
  message: string;
  coupon?: Coupon;
} {
  const normalizedCode = (params.couponCode || '').trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, discountPaise: 0, message: 'No coupon code provided.' };
  }

  const coupon = params.coupons.find(
    (c) => c.code.toUpperCase() === normalizedCode && c.active
  );

  if (!coupon) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" is invalid or inactive.`,
    };
  }

  const nowTime = params.nowIso ? new Date(params.nowIso).getTime() : Date.now();
  const startTime = new Date(coupon.validFromIso).getTime();
  const endTime = new Date(coupon.validUntilIso).getTime();

  if (nowTime < startTime || nowTime > endTime) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" has expired or is not yet active.`,
    };
  }

  if (
    coupon.totalRedemptionLimit !== undefined &&
    coupon.currentRedemptions >= coupon.totalRedemptionLimit
  ) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" has reached its maximum redemption limit.`,
    };
  }

  if (
    coupon.applicableCityIds &&
    coupon.applicableCityIds.length > 0 &&
    !coupon.applicableCityIds.includes(params.cityId)
  ) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" is not valid in the selected city.`,
    };
  }

  if (
    coupon.applicableServiceIds &&
    coupon.applicableServiceIds.length > 0 &&
    !coupon.applicableServiceIds.includes(params.serviceId)
  ) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" does not apply to this service.`,
    };
  }

  if (params.subtotalPaise < coupon.minOrderSubtotalPaise) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Minimum service subtotal of ${formatPaiseToInr(coupon.minOrderSubtotalPaise)} required for "${normalizedCode}".`,
    };
  }

  let rawDiscountPaise = 0;
  if (coupon.discountType === 'percentage') {
    rawDiscountPaise = Math.round((params.subtotalPaise * coupon.discountValue) / 100);
    if (coupon.maxDiscountCapPaise && rawDiscountPaise > coupon.maxDiscountCapPaise) {
      rawDiscountPaise = coupon.maxDiscountCapPaise;
    }
  } else {
    rawDiscountPaise = coupon.discountValue;
  }

  const discountPaise = Math.min(rawDiscountPaise, params.subtotalPaise);

  return {
    valid: true,
    discountPaise,
    message: `Coupon "${coupon.code}" applied (${formatPaiseToInr(discountPaise)} savings).`,
    coupon,
  };
}

/**
 * Computes a complete, authoritative quote breakdown in integer paise.
 */
export function calculateAuthoritativeQuote(params: {
  request: QuoteRequestPayload;
  cities: City[];
  serviceAreas: ServiceArea[];
  services: Service[];
  vendors: Vendor[];
  priceOverrides: PriceOverride[];
  coupons: Coupon[];
  taxRatePercent?: number;
  nowIso?: string;
}): QuoteBreakdown {
  const {
    request,
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    taxRatePercent = 0,
    nowIso,
  } = params;

  const pinLookup = lookupPinCoverage(request.pinCode, cities, serviceAreas);
  const service = services.find((s) => s.id === request.serviceId);

  const emptyExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  if (!pinLookup.serviceable || !pinLookup.city || !pinLookup.serviceArea) {
    return {
      bookable: false,
      reason: pinLookup.message,
      cityId: '',
      cityName: '',
      pinCode: request.pinCode,
      zoneLabel: '',
      pricingMode: service?.defaultPricingMode || 'city_fixed',
      pricingSource: 'unavailable',
      serviceId: request.serviceId,
      serviceTitle: service?.title || '',
      variantId: request.variantId,
      variantName: '',
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: 'INR',
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: true,
    };
  }

  if (!service) {
    return {
      bookable: false,
      reason: 'Requested service was not found.',
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode: 'city_fixed',
      pricingSource: 'unavailable',
      serviceId: request.serviceId,
      serviceTitle: '',
      variantId: request.variantId,
      variantName: '',
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: 'INR',
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: true,
    };
  }

  const pricingMode = resolveServicePricingMode(service, pinLookup.city.id);
  const variant = service.variants.find((v) => v.id === request.variantId && v.active);

  if (pricingMode === 'vendor_offer' && !request.selectedVendorUid) {
    return {
      bookable: false,
      reason: 'Please select an eligible vendor offer for this service in your city.',
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode,
      pricingSource: 'unavailable',
      serviceId: service.id,
      serviceTitle: service.title,
      variantId: request.variantId,
      variantName: variant?.name || '',
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: 'INR',
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: service.isDemo,
    };
  }

  let selectedVendor: Vendor | undefined;
  if (request.selectedVendorUid) {
    selectedVendor = vendors.find(
      (v) =>
        v.uid === request.selectedVendorUid &&
        v.status === 'active' &&
        v.supportedCityIds.includes(pinLookup.city!.id) &&
        v.supportedAreaPins.includes(pinLookup.pinCode) &&
        v.supportedServiceIds.includes(service.id)
    );
    if (!selectedVendor) {
      return {
        bookable: false,
        reason: 'Selected vendor is not eligible for this PIN code and service.',
        cityId: pinLookup.city.id,
        cityName: pinLookup.city.name,
        pinCode: pinLookup.pinCode,
        zoneLabel: pinLookup.serviceArea.zoneLabel,
        pricingMode,
        pricingSource: 'unavailable',
        serviceId: service.id,
        serviceTitle: service.title,
        variantId: request.variantId,
        variantName: variant?.name || '',
        baseServicePaise: 0,
        addons: [],
        addonsTotalPaise: 0,
        subtotalPaise: 0,
        discountPaise: 0,
        taxPaise: 0,
        taxRatePercent,
        finalTotalPaise: 0,
        currency: 'INR',
        quoteExpiresAtIso: emptyExpiry,
        isDemoData: service.isDemo,
      };
    }
  }

  const priceRes = resolveEffectivePricePaise({
    service,
    variantId: request.variantId,
    cityId: pinLookup.city.id,
    vendorUid: pricingMode === 'vendor_offer' ? request.selectedVendorUid : undefined,
    priceOverrides,
  });

  if (!priceRes.bookable || priceRes.unitPricePaise === null) {
    return {
      bookable: false,
      reason: priceRes.reason || 'Price not configured for this location.',
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode,
      pricingSource: 'unavailable',
      serviceId: service.id,
      serviceTitle: service.title,
      variantId: request.variantId,
      variantName: variant?.name || '',
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: 'INR',
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: service.isDemo,
    };
  }

  const addonsBreakdown: QuoteBreakdown['addons'] = [];
  let addonsTotalPaise = 0;

  for (const addon of service.addons) {
    if (!addon.active) continue;
    const requestedQty = request.addonQuantities?.[addon.id] || 0;
    const qty = Math.max(0, Math.min(requestedQty, addon.maxQuantity));
    if (qty > 0) {
      const lineTotalPaise = addon.pricePaise * qty;
      addonsTotalPaise += lineTotalPaise;
      addonsBreakdown.push({
        addonId: addon.id,
        name: addon.name,
        quantity: qty,
        unitPaise: addon.pricePaise,
        lineTotalPaise,
      });
    }
  }

  const baseServicePaise = priceRes.unitPricePaise;
  const subtotalPaise = baseServicePaise + addonsTotalPaise;

  let discountPaise = 0;
  let couponValid: boolean | undefined;
  let couponMessage: string | undefined;
  let appliedCouponCode: string | undefined;

  if (request.couponCode && request.couponCode.trim()) {
    const couponEval = evaluateCouponDiscount({
      couponCode: request.couponCode,
      subtotalPaise,
      cityId: pinLookup.city.id,
      serviceId: service.id,
      coupons,
      nowIso,
    });
    couponValid = couponEval.valid;
    couponMessage = couponEval.message;
    discountPaise = couponEval.discountPaise;
    if (couponEval.valid) {
      appliedCouponCode = couponEval.coupon?.code;
    }
  }

  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = taxRatePercent > 0 ? Math.round((taxablePaise * taxRatePercent) / 100) : 0;
  const finalTotalPaise = taxablePaise + taxPaise;

  return {
    bookable: true,
    cityId: pinLookup.city.id,
    cityName: pinLookup.city.name,
    pinCode: pinLookup.pinCode,
    zoneLabel: pinLookup.serviceArea.zoneLabel,
    pricingMode,
    pricingSource: priceRes.pricingSource,
    serviceId: service.id,
    serviceTitle: service.title,
    variantId: variant!.id,
    variantName: variant!.name,
    selectedVendorUid: selectedVendor?.uid,
    selectedVendorName: selectedVendor?.displayName,
    baseServicePaise,
    addons: addonsBreakdown,
    addonsTotalPaise,
    subtotalPaise,
    couponCode: appliedCouponCode || (request.couponCode ? request.couponCode.trim().toUpperCase() : undefined),
    couponValid,
    couponMessage,
    discountPaise,
    taxPaise,
    taxRatePercent,
    finalTotalPaise,
    currency: 'INR',
    quoteExpiresAtIso: emptyExpiry,
    isDemoData: service.isDemo,
  };
}
