import React, { useCallback, useEffect, useState } from 'react';
import {
  MapPin,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Search,
  Menu,
  X,
  PhoneCall,
  HelpCircle,
  FileText,
  User,
  Calendar,
  Sparkles,
  Instagram,
} from 'lucide-react';
import {
  DEMO_CATEGORIES as INITIAL_DEMO_CATEGORIES,
  DEMO_CITIES as INITIAL_DEMO_CITIES,
  DEMO_COUPONS as INITIAL_DEMO_COUPONS,
  DEMO_PRICE_OVERRIDES as INITIAL_DEMO_PRICE_OVERRIDES,
  DEMO_SERVICES as INITIAL_DEMO_SERVICES,
  DEMO_SERVICE_AREAS as INITIAL_DEMO_SERVICE_AREAS,
  DEMO_VENDORS as INITIAL_DEMO_VENDORS,
} from '../data/demoCatalog.ts';
import { lookupPinCoverage } from '../lib/portalRouting.ts';
import {
  calculateAuthoritativeQuote,
  formatPaiseToInr,
  listEligibleVendorOffers,
  resolveEffectivePricePaise,
  resolveServicePricingMode,
} from '../lib/pricingEngine.ts';
import {
  STANDARD_TIME_WINDOWS,
  evaluateSlotsForDate,
  type DispatchDecision,
  type SlotWindowEvaluation,
} from '../lib/bookingEngine.ts';
import type {
  AssignmentPolicy,
  Booking,
  BookingEvent,
  Category,
  City,
  CmsSettings,
  Coupon,
  PaymentMethod,
  PinLookupResult,
  PriceOverride,
  QuoteBreakdown,
  Service,
  ServiceArea,
  Vendor,
} from '../types/domain.ts';
import { ServicePhoto } from '../components/ServiceIllustration.tsx';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';
import {
  cleanIndianPhone,
  buildWhatsAppLink,
} from '../lib/whatsappEngine.ts';

interface CustomerShellProps {
  internalPath: string;
  redirectUrl?: string;
  onNavigate: (href: string) => void;
}

interface BookingDraft {
  serviceId: string;
  variantId: string;
  addonQuantities: Record<string, number>;
  selectedVendorUid?: string;
  selectedSlot: string;
  couponCode: string;
  questionAnswers: Record<string, string>;
}

interface CustomerBookingRecord {
  booking: Booking;
  assignedVendorSummary: {
    uid: string;
    vendorCode?: string;
    displayName: string;
    businessName: string;
    experienceYearsLabel: string;
  } | null;
  events: BookingEvent[];
}

const DEFAULT_SLOTS = [
  'Tomorrow · 09:00 AM – 11:00 AM',
  'Tomorrow · 12:00 PM – 02:00 PM',
  'Tomorrow · 03:30 PM – 05:30 PM',
];

function getOffsetDateIso(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

export const CustomerShell: React.FC<CustomerShellProps> = ({
  internalPath,
  redirectUrl,
  onNavigate,
}) => {
  // Live Catalog & Operational State synced with /api/public/catalog
  const [DEMO_CITIES, setLiveCities] = useState<City[]>(INITIAL_DEMO_CITIES);
  const [DEMO_SERVICE_AREAS, setLiveServiceAreas] = useState<ServiceArea[]>(
    INITIAL_DEMO_SERVICE_AREAS
  );
  const [DEMO_CATEGORIES, setLiveCategories] = useState<Category[]>(
    INITIAL_DEMO_CATEGORIES
  );
  const [DEMO_SERVICES, setLiveServices] = useState<Service[]>(INITIAL_DEMO_SERVICES);
  const [DEMO_VENDORS, setLiveVendors] = useState<Vendor[]>(INITIAL_DEMO_VENDORS);
  const [DEMO_PRICE_OVERRIDES, setLivePriceOverrides] = useState<PriceOverride[]>(
    INITIAL_DEMO_PRICE_OVERRIDES
  );
  const [DEMO_COUPONS, setLiveCoupons] = useState<Coupon[]>(INITIAL_DEMO_COUPONS);
  const [liveCmsSettings, setLiveCmsSettings] = useState<CmsSettings | null>(null);

  // Active PIN / Location state (persisted in sessionStorage for seamless navigation)
  const [pinInput, setPinInput] = useState<string>(() => {
    return sessionStorage.getItem('tankman_active_pin') || '110001';
  });
  const [pinLookup, setPinLookup] = useState<PinLookupResult>(() =>
    lookupPinCoverage(
      sessionStorage.getItem('tankman_active_pin') || '110001',
      INITIAL_DEMO_CITIES,
      INITIAL_DEMO_SERVICE_AREAS
    )
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Urban Company–style Interactive Service & Package Modal state
  const [activeModalServiceId, setActiveModalServiceId] = useState<string | null>(null);

  // Waitlist form state for uncovered PINs (e.g., 400001)
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistContact, setWaitlistContact] = useState('');
  const [waitlistConsent, setWaitlistConsent] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Catalog filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Booking draft state for Service Modal, Service Detail & Checkout
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({
    serviceId: 'srv_mechanized_tank_clean',
    variantId: 'var_tank_500_1000',
    addonQuantities: {},
    selectedVendorUid: undefined,
    selectedSlot: DEFAULT_SLOTS[0],
    couponCode: '',
    questionAnswers: {},
  });

  // Phase 3 Date & Time-Slot Availability state
  const [scheduledDate, setScheduledDate] = useState<string>(() => getOffsetDateIso(1));
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>(
    STANDARD_TIME_WINDOWS[0]
  );
  const [slotEvaluations, setSlotEvaluations] = useState<SlotWindowEvaluation[]>([]);
  const [activeAssignmentPolicy, setActiveAssignmentPolicy] =
    useState<AssignmentPolicy>('auto_score');

  // Phase 3 Checkout customer details & authoritative booking creation state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('tankman_customer_phone') || '';
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [tankCapacityLitres, setTankCapacityLitres] = useState('500 L – 1000 L');
  const [unitCount, setUnitCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pay_after_service');
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string>(
    () => `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedDemoBookingId, setConfirmedDemoBookingId] = useState<string | null>(
    null
  );
  const [confirmedBookingResult, setConfirmedBookingResult] = useState<{
    booking: Booking;
    dispatchDecision?: DispatchDecision;
    events: BookingEvent[];
    duplicatePrevented?: boolean;
  } | null>(null);

  // Phase 3 Customer Account Bookings & Live Tracker state
  const [customerBookings, setCustomerBookings] = useState<CustomerBookingRecord[]>([]);
  const [lookupPhoneInput, setLookupPhoneInput] = useState(() => {
    return localStorage.getItem('tankman_customer_phone') || '9810044210';
  });
  const [lookupCodeInput, setLookupCodeInput] = useState('');
  const [isLoadingCustomerBookings, setIsLoadingCustomerBookings] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [accountActionFeedback, setAccountActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFeedback, setContactFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // Fetch live catalog from server so Admin changes immediately reflect on Customer Storefront
  const refreshPublicCatalog = useCallback(async (pin: string) => {
    try {
      const res = await fetch(
        `/api/public/catalog?pin=${encodeURIComponent(pin.trim())}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.cities) && data.cities.length > 0) {
        setLiveCities(data.cities);
      }
      if (Array.isArray(data.serviceAreas) && data.serviceAreas.length > 0) {
        setLiveServiceAreas(data.serviceAreas);
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setLiveCategories(data.categories);
      }
      if (Array.isArray(data.services) && data.services.length > 0) {
        setLiveServices(data.services);
      }
      if (Array.isArray(data.vendors) && data.vendors.length > 0) {
        setLiveVendors(data.vendors);
      }
      if (Array.isArray(data.priceOverrides)) {
        setLivePriceOverrides(data.priceOverrides);
      }
      if (Array.isArray(data.coupons)) {
        setLiveCoupons(data.coupons);
      }
      if (data.cmsSettings) {
        setLiveCmsSettings(data.cmsSettings);
        if (data.cmsSettings.defaultAssignmentPolicy) {
          setActiveAssignmentPolicy(data.cmsSettings.defaultAssignmentPolicy);
        }
      }
      if (data.pinResolution) {
        setPinLookup(data.pinResolution);
      }
    } catch {
      // Keep local fallback catalog if offline
    }
  }, []);

  useEffect(() => {
    refreshPublicCatalog(pinInput);
  }, [internalPath, refreshPublicCatalog]);

  const selectServiceForDraft = (service: Service, preferredVariantId?: string) => {
    const chosenVariant =
      (preferredVariantId && service.variants.find((v) => v.id === preferredVariantId)) ||
      service.variants.find((v) => v.active) ||
      service.variants[0];
    const cityId = pinLookup.serviceable ? pinLookup.city?.id : undefined;
    let defaultVendorUid: string | undefined = undefined;
    if (cityId && resolveServicePricingMode(service, cityId) === 'vendor_offer') {
      const offers = listEligibleVendorOffers({
        service,
        variantId: chosenVariant.id,
        cityId,
        pinCode: pinLookup.pinCode,
        vendors: DEMO_VENDORS,
        priceOverrides: DEMO_PRICE_OVERRIDES,
      });
      if (offers.length > 0) {
        defaultVendorUid = offers[0].vendorUid;
      }
    }
    setBookingDraft((prev) => ({
      ...prev,
      serviceId: service.id,
      variantId: chosenVariant.id,
      addonQuantities: {},
      selectedVendorUid: defaultVendorUid,
    }));
  };

  const openServiceModal = (service: Service, preferredVariantId?: string) => {
    selectServiceForDraft(service, preferredVariantId);
    setActiveModalServiceId(service.id);
  };

  const applyPinLookup = (targetPin: string) => {
    const clean = targetPin.trim();
    setPinInput(clean);
    const result = lookupPinCoverage(clean, DEMO_CITIES, DEMO_SERVICE_AREAS);
    setPinLookup(result);
    setWaitlistStatus(null);
    refreshPublicCatalog(clean);
    if (result.serviceable && result.city) {
      sessionStorage.setItem('tankman_active_pin', clean);
      // Re-sync default vendor offer if current service is in vendor_offer mode in the new city
      const srv = DEMO_SERVICES.find((s) => s.id === bookingDraft.serviceId) || DEMO_SERVICES[0];
      if (resolveServicePricingMode(srv, result.city.id) === 'vendor_offer') {
        const offers = listEligibleVendorOffers({
          service: srv,
          variantId: bookingDraft.variantId,
          cityId: result.city.id,
          pinCode: clean,
          vendors: DEMO_VENDORS,
          priceOverrides: DEMO_PRICE_OVERRIDES,
        });
        setBookingDraft((prev) => ({
          ...prev,
          selectedVendorUid: offers[0]?.vendorUid,
        }));
      }
    }
  };

  // Synchronize bookingDraft when entering `/services/:slug`
  useEffect(() => {
    if (internalPath.startsWith('/services/')) {
      const slug = internalPath.slice('/services/'.length);
      const found = DEMO_SERVICES.find((s) => s.slug === slug || s.id === slug);
      if (found) {
        selectServiceForDraft(found);
      }
    }
  }, [internalPath, pinLookup.pinCode, pinLookup.serviceable, pinLookup.city?.id]);

  // Helper to resolve starting price for a service card in current PIN
  const getServiceCardPricing = (service: Service) => {
    const primaryVariant = service.variants.find((v) => v.active) || service.variants[0];
    if (!pinLookup.serviceable || !pinLookup.city) {
      return {
        available: false,
        priceLabel: formatPaiseToInr(primaryVariant.basePricePaise),
        regularLabel: primaryVariant.regularPricePaise
          ? formatPaiseToInr(primaryVariant.regularPricePaise)
          : undefined,
        modeLabel: 'PIN verification required',
      };
    }

    const cityId = pinLookup.city.id;
    const mode = resolveServicePricingMode(service, cityId);

    if (mode === 'vendor_offer') {
      const offers = listEligibleVendorOffers({
        service,
        variantId: primaryVariant.id,
        cityId,
        pinCode: pinLookup.pinCode,
        vendors: DEMO_VENDORS,
        priceOverrides: DEMO_PRICE_OVERRIDES,
      });
      if (offers.length === 0) {
        return {
          available: false,
          priceLabel: 'Unavailable in PIN',
          regularLabel: undefined,
          modeLabel: 'Vendor-Offer Mode',
        };
      }
      return {
        available: true,
        priceLabel: formatPaiseToInr(offers[0].amountPaise),
        regularLabel: primaryVariant.regularPricePaise
          ? formatPaiseToInr(primaryVariant.regularPricePaise)
          : undefined,
        modeLabel: `${offers.length} Partner Offers · ${pinLookup.city.name}`,
      };
    }

    const res = resolveEffectivePricePaise({
      service,
      variantId: primaryVariant.id,
      cityId,
      priceOverrides: DEMO_PRICE_OVERRIDES,
    });

    if (!res.bookable || res.unitPricePaise === null) {
      return {
        available: false,
        priceLabel: 'Unavailable in PIN',
        regularLabel: undefined,
        modeLabel: 'City-Fixed Mode',
      };
    }

    return {
      available: true,
      priceLabel: formatPaiseToInr(res.unitPricePaise),
      regularLabel: primaryVariant.regularPricePaise
        ? formatPaiseToInr(primaryVariant.regularPricePaise)
        : undefined,
      modeLabel: `Fixed City Tariff · ${pinLookup.city.name}`,
    };
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistStatus(null);
    try {
      const response = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinCode: pinLookup.pinCode || pinInput,
          customerName: waitlistName,
          phoneOrEmail: waitlistContact,
          consentGiven: waitlistConsent,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setWaitlistStatus({
          type: 'error',
          text: data.error || 'Could not submit waitlist request.',
        });
        return;
      }
      setWaitlistStatus({ type: 'success', text: data.message });
      setWaitlistName('');
      setWaitlistContact('');
      setWaitlistConsent(false);
    } catch {
      setWaitlistStatus({
        type: 'error',
        text: 'Network error while saving waitlist entry.',
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          emailOrPhone: contactEmailOrPhone,
          pinCode: pinLookup.pinCode,
          message: contactMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setContactFeedback({ type: 'error', text: data.error || 'Validation failed.' });
        return;
      }
      setContactFeedback({ type: 'success', text: data.message });
      setContactName('');
      setContactEmailOrPhone('');
      setContactMessage('');
    } catch {
      setContactFeedback({ type: 'error', text: 'Unable to submit contact inquiry right now.' });
    }
  };

  // Authoritative quote for current bookingDraft
  const currentService =
    DEMO_SERVICES.find((s) => s.id === bookingDraft.serviceId) || DEMO_SERVICES[0];
  const currentPricingMode =
    pinLookup.serviceable && pinLookup.city
      ? resolveServicePricingMode(currentService, pinLookup.city.id)
      : currentService.defaultPricingMode;

  const currentVendorOffers =
    pinLookup.serviceable && pinLookup.city && currentPricingMode === 'vendor_offer'
      ? listEligibleVendorOffers({
          service: currentService,
          variantId: bookingDraft.variantId,
          cityId: pinLookup.city.id,
          pinCode: pinLookup.pinCode,
          vendors: DEMO_VENDORS,
          priceOverrides: DEMO_PRICE_OVERRIDES,
        })
      : [];

  const activeQuote: QuoteBreakdown = calculateAuthoritativeQuote({
    request: {
      pinCode: pinLookup.pinCode,
      serviceId: bookingDraft.serviceId,
      variantId: bookingDraft.variantId,
      addonQuantities: bookingDraft.addonQuantities,
      selectedVendorUid:
        currentPricingMode === 'vendor_offer' ? bookingDraft.selectedVendorUid : undefined,
      couponCode: bookingDraft.couponCode,
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: DEMO_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    taxRatePercent: liveCmsSettings?.defaultTaxRatePercent || 0,
  });

  // Step 3: Real-time slot availability & conflict check against /api/bookings/slots
  const refreshSlotAvailability = useCallback(async () => {
    if (!pinLookup.serviceable || !pinLookup.city) {
      setSlotEvaluations([]);
      return;
    }

    // Immediate local fallback calculation
    const localSlots = evaluateSlotsForDate({
      service: currentService,
      variantId: bookingDraft.variantId,
      cityId: pinLookup.city.id,
      pinCode: pinLookup.pinCode,
      scheduledDate,
      vendors: DEMO_VENDORS,
      existingBookings: [],
      priceOverrides: DEMO_PRICE_OVERRIDES,
      selectedVendorUid:
        currentPricingMode === 'vendor_offer' ? bookingDraft.selectedVendorUid : undefined,
    });
    setSlotEvaluations(localSlots);

    try {
      const qs = new URLSearchParams({
        pinCode: pinLookup.pinCode,
        serviceId: currentService.id,
        variantId: bookingDraft.variantId,
        scheduledDate,
      });
      if (currentPricingMode === 'vendor_offer' && bookingDraft.selectedVendorUid) {
        qs.set('selectedVendorUid', bookingDraft.selectedVendorUid);
      }
      const res = await fetch(`/api/bookings/slots?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.slots)) {
        setSlotEvaluations(data.slots);
        // If current selectedTimeWindow is unavailable, auto-select the first available slot if one exists
        const currentSlotObj = data.slots.find(
          (s: SlotWindowEvaluation) => s.timeWindow === selectedTimeWindow
        );
        if (currentSlotObj && !currentSlotObj.available) {
          const firstOpen = data.slots.find((s: SlotWindowEvaluation) => s.available);
          if (firstOpen) {
            setSelectedTimeWindow(firstOpen.timeWindow);
          }
        }
      }
      if (data.assignmentPolicy) {
        setActiveAssignmentPolicy(data.assignmentPolicy);
      }
    } catch {
      // Keep local evaluation if offline
    }
  }, [
    pinLookup.serviceable,
    pinLookup.city,
    pinLookup.pinCode,
    currentService,
    bookingDraft.variantId,
    bookingDraft.selectedVendorUid,
    currentPricingMode,
    scheduledDate,
    selectedTimeWindow,
    DEMO_VENDORS,
    DEMO_PRICE_OVERRIDES,
  ]);

  useEffect(() => {
    refreshSlotAvailability();
  }, [refreshSlotAvailability]);

  const startFreshCheckout = () => {
    setConfirmedDemoBookingId(null);
    setConfirmedBookingResult(null);
    setCheckoutError(null);
    setCheckoutIdempotencyKey(
      `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    );
    onNavigate('/checkout');
  };

  // Fetch customer's live bookings for /account and /account/bookings
  const loadCustomerBookings = useCallback(
    async (overridePhone?: string, overrideCode?: string) => {
      setIsLoadingCustomerBookings(true);
      try {
        const storedIdsRaw = localStorage.getItem('tankman_customer_booking_ids') || '';
        const phoneToQuery = (
          overridePhone !== undefined ? overridePhone : lookupPhoneInput
        )
          .replace(/\D/g, '')
          .slice(-10);
        const codeToQuery = (
          overrideCode !== undefined ? overrideCode : lookupCodeInput
        ).trim();

        const qs = new URLSearchParams();
        if (storedIdsRaw) qs.set('ids', storedIdsRaw);
        if (phoneToQuery.length === 10) qs.set('phone', phoneToQuery);
        if (codeToQuery) qs.set('bookingCode', codeToQuery);

        const res = await fetch(`/api/customer/bookings?${qs.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.bookings)) {
          setCustomerBookings(data.bookings);
        }
      } catch {
        // Ignore network errors
      } finally {
        setIsLoadingCustomerBookings(false);
      }
    },
    [lookupPhoneInput, lookupCodeInput]
  );

  useEffect(() => {
    if (internalPath.startsWith('/account')) {
      loadCustomerBookings();
    }
  }, [internalPath, loadCustomerBookings]);

  // Step 6, 7 & 8: Submit authoritative customer booking to POST /api/bookings
  const handleCreateAuthoritativeBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!pinLookup.serviceable || !pinLookup.city) {
      setCheckoutError(
        pinLookup.message ||
          `PIN ${pinLookup.pinCode} is unsupported. Bookings from unserviceable locations are blocked.`
      );
      return;
    }

    if (!activeQuote.bookable) {
      setCheckoutError(
        activeQuote.reason || 'Selected service or package is not available in this PIN code.'
      );
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (customerName.trim().length < 2) {
      setCheckoutError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setCheckoutError(
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      );
      return;
    }
    if (addressLine.trim().length < 5) {
      setCheckoutError('Please enter your complete flat/house number, building, and street address.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: checkoutIdempotencyKey,
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          addressLine: addressLine.trim(),
          landmark: landmark.trim() || undefined,
          pinCode: pinLookup.pinCode,
          serviceId: currentService.id,
          variantId: bookingDraft.variantId,
          addonQuantities: bookingDraft.addonQuantities,
          selectedVendorUid:
            currentPricingMode === 'vendor_offer' ? bookingDraft.selectedVendorUid : undefined,
          scheduledDate,
          timeWindow: selectedTimeWindow,
          couponCode: bookingDraft.couponCode.trim() || undefined,
          customerNotes: customerNotes.trim() || undefined,
          tankCapacityLitres: currentService.bookingRequirements?.requireTankCapacity
            ? tankCapacityLitres
            : undefined,
          unitCount: currentService.bookingRequirements?.requireUnitCount
            ? unitCount
            : undefined,
          paymentMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setCheckoutError(data.error || 'Could not confirm booking. Please verify your details.');
        return;
      }

      let finalBooking: Booking = data.booking;
      const initialEvents: BookingEvent[] = data.events || [];

      // If customer selected Razorpay Online Prepaid
      if (paymentMethod === 'razorpay_online') {
        try {
          const orderRes = await fetch('/api/payments/razorpay/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: finalBooking.id,
              bookingCode: finalBooking.bookingCode,
              amountPaise: activeQuote.finalTotalPaise,
              customerName: customerName.trim(),
              customerPhone: cleanPhone,
              customerEmail: customerEmail.trim() || undefined,
              serviceTitle: currentService.title,
            }),
          });
          const orderData = await orderRes.json();

          if (orderRes.ok && orderData.ok) {
            // Check if live/test Razorpay SDK modal can be opened
            if (
              typeof (window as any).Razorpay === 'function' &&
              !orderData.isSimulated &&
              orderData.keyId &&
              !orderData.keyId.includes('mock')
            ) {
              const rzp = new (window as any).Razorpay({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'TankmanPro',
                description: `${currentService.title}`,
                order_id: orderData.orderId,
                prefill: {
                  name: customerName.trim(),
                  contact: cleanPhone,
                  email: customerEmail.trim() || undefined,
                },
                theme: { color: '#0f766e' },
                handler: async function (response: any) {
                  try {
                    const verifyRes = await fetch('/api/payments/razorpay/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        bookingId: finalBooking.id,
                      }),
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.ok && verifyData.booking) {
                      setConfirmedBookingResult({
                        booking: verifyData.booking,
                        dispatchDecision: data.dispatchDecision,
                        events: [
                          ...initialEvents,
                          {
                            id: `ev_pay_${Date.now()}`,
                            bookingId: finalBooking.id,
                            actorUid: 'system_razorpay',
                            actorRole: 'system',
                            actorName: 'Razorpay Gateway',
                            fromStatus: finalBooking.status,
                            toStatus: finalBooking.status,
                            note: `Online payment of ${formatPaiseToInr(activeQuote.finalTotalPaise)} captured successfully (${response.razorpay_payment_id}).`,
                            createdAtIso: new Date().toISOString(),
                          },
                        ],
                        duplicatePrevented: data.duplicatePrevented,
                      });
                    }
                  } catch {
                    // Fallback to initial booking state
                  }
                },
              });
              rzp.open();
            } else {
              // Simulated Mode: Verify test payment seamlessly
              const verifyRes = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderData.orderId,
                  razorpay_payment_id: `pay_sim_${Date.now().toString().slice(-8)}`,
                  razorpay_signature: 'simulated_dev_signature',
                  bookingId: finalBooking.id,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.ok && verifyData.booking) {
                finalBooking = verifyData.booking;
              }
            }
          }
        } catch {
          // Continue with created booking
        }
      }

      setConfirmedDemoBookingId(finalBooking.bookingCode || finalBooking.bookingNumber);
      setConfirmedBookingResult({
        booking: finalBooking,
        dispatchDecision: data.dispatchDecision,
        events: initialEvents,
        duplicatePrevented: data.duplicatePrevented,
      });

      // Persist in localStorage so /account/bookings automatically displays this customer's bookings
      localStorage.setItem('tankman_customer_phone', cleanPhone);
      setLookupPhoneInput(cleanPhone);
      const existingIds = (
        localStorage.getItem('tankman_customer_booking_ids') || ''
      )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!existingIds.includes(finalBooking.id)) {
        existingIds.unshift(finalBooking.id);
        localStorage.setItem(
          'tankman_customer_booking_ids',
          existingIds.slice(0, 25).join(',')
        );
      }

      refreshSlotAvailability();
      refreshPublicCatalog(pinLookup.pinCode);
    } catch {
      setCheckoutError('Network error while creating booking. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Customer booking cancellation handler
  const handleCancelCustomerBooking = async (bookingId: string) => {
    setAccountActionFeedback(null);
    try {
      const res = await fetch(`/api/customer/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason:
            cancelReasonInput.trim() ||
            'Customer requested cancellation via My Bookings portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountActionFeedback({
          type: 'error',
          text: data.error || 'Unable to cancel booking.',
        });
        return;
      }
      setAccountActionFeedback({
        type: 'success',
        text: data.message || 'Booking cancelled.',
      });
      setCancellingBookingId(null);
      setCancelReasonInput('');
      loadCustomerBookings();
      refreshSlotAvailability();
    } catch {
      setAccountActionFeedback({
        type: 'error',
        text: 'Network error while cancelling booking.',
      });
    }
  };

  // Render production domain redirect / 404 state if someone hit `/admin/*` on `tankmanpro.com`
  if (internalPath === '/404') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-slate-200 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Available on Storefront</h1>
          <p className="text-sm text-slate-600 mb-6">
            This path is not available on the public customer website.
            {redirectUrl ? ` Dedicated portal hostname: ${redirectUrl}` : ''}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to TankmanPro Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* 1. Slim Admin-configurable announcement strip (<= 36px height) */}
      {showAnnouncement && (
        <div className="bg-slate-950 text-slate-200 text-xs px-4 py-2 flex items-center justify-between gap-4">
          <div className="max-w-[1220px] mx-auto flex items-center justify-between w-full gap-4">
            <p className="truncate">
              TankmanPro Home Services · Active PINs:{' '}
              <span className="font-mono text-teal-300">110001</span> (New Delhi),{' '}
              <span className="font-mono text-teal-300">242001</span> (Shahjahanpur),{' '}
              <span className="font-mono text-teal-300">208002</span> (Kanpur) · Uncovered Test:{' '}
              <span className="font-mono text-amber-300">400001</span>
            </p>
            <button
              type="button"
              onClick={() => setShowAnnouncement(false)}
              aria-label="Dismiss announcement banner"
              className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Bar — Urban Company Clean Commercial Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <span className="w-8 h-8 rounded-lg bg-slate-950 text-white font-display font-extrabold text-sm flex items-center justify-center tracking-tighter">
              TP
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-950 whitespace-nowrap font-display">
              TankmanPro
            </span>
          </a>

          {/* Zone 2: Concise Navigation Links */}
          <nav
            aria-label="Customer Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="/services"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/services');
              }}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                internalPath.startsWith('/services') ? 'text-slate-950 font-bold' : ''
              }`}
            >
              Services
            </a>
            <a
              href="/service-areas"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/service-areas');
              }}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                internalPath === '/service-areas' ? 'text-slate-950 font-bold' : ''
              }`}
            >
              Service Areas
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/how-it-works');
              }}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                internalPath === '/how-it-works' ? 'text-slate-950 font-bold' : ''
              }`}
            >
              How It Works
            </a>
            <a
              href="/help"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/help');
              }}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                internalPath === '/help' ? 'text-slate-950 font-bold' : ''
              }`}
            >
              Help
            </a>
            <a
              href="/account"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/account');
              }}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                internalPath.startsWith('/account') || internalPath === '/login'
                  ? 'text-slate-950 font-bold'
                  : ''
              }`}
            >
              Account
            </a>
          </nav>

          {/* Zone 3: Urban Company Location Pill Selector & Instagram */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Instagram Social Link */}
            <a
              href="https://www.instagram.com/tankmanpro.in/"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow @tankmanpro.in on Instagram"
              className="px-2.5 py-2 text-xs font-semibold text-pink-700 bg-pink-50/80 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span className="hidden sm:inline">@tankmanpro.in</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              aria-label="Change service location or PIN code"
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:border-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate max-w-[180px]">
                {pinLookup.serviceable && pinLookup.city
                  ? `${pinLookup.city.name} · ${pinLookup.pinCode}`
                  : `PIN ${pinLookup.pinCode || 'Select Area'}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/services', label: 'Services Catalog' },
              { href: '/service-areas', label: 'Service Areas & PIN Coverage' },
              { href: '/how-it-works', label: 'How It Works' },
              { href: '/help', label: 'Help & FAQs' },
              { href: '/contact', label: 'Contact Support' },
              { href: '/account', label: 'My Account & Bookings' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  onNavigate(link.href);
                }}
                className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://www.instagram.com/tankmanpro.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 px-3 text-sm font-semibold text-pink-700 hover:bg-pink-50 rounded-lg"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Follow on Instagram (@tankmanpro.in)</span>
            </a>
          </div>
        )}
      </header>

      {/* Location / PIN Selector Modal */}
      {isLocationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="location-modal-title" className="text-lg font-bold text-slate-900">
                Select Your City or 6-Digit PIN Code
              </h2>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                aria-label="Close location modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Service availability, technician assignment, and city/vendor pricing are resolved by
              your verified 6-digit Indian PIN code.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyPinLookup(pinInput);
              }}
              className="flex gap-2 mb-5"
            >
              <label htmlFor="modal-pin-input" className="sr-only">
                6-Digit Indian PIN Code
              </label>
              <input
                id="modal-pin-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit PIN (e.g. 110001, 242001, 208002)"
                className="flex-1 px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Verify PIN
              </button>
            </form>

            {/* Quick City/PIN Presets */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Active Service Cities &amp; PIN Zones:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {DEMO_SERVICE_AREAS.map((area) => {
                  const city = DEMO_CITIES.find((c) => c.id === area.cityId);
                  const isSelected = pinLookup.pinCode === area.pinCode && pinLookup.serviceable;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        applyPinLookup(area.pinCode);
                        setIsLocationModalOpen(false);
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-slate-950 bg-slate-50 text-slate-950'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-900 font-mono">
                        {area.pinCode} · {city?.name}
                      </div>
                      <div className="text-slate-500 truncate mt-0.5">{area.zoneLabel}</div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    applyPinLookup('400001');
                  }}
                  className="text-left p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-xs text-slate-800 cursor-pointer"
                >
                  <div className="font-bold font-mono text-amber-900">
                    400001 · Uncovered Test PIN
                  </div>
                  <div className="text-slate-600 truncate mt-0.5">
                    Test unmapped area &amp; waitlist flow
                  </div>
                </button>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs ${
                pinLookup.serviceable
                  ? 'bg-teal-50/70 border-teal-200 text-slate-800'
                  : 'bg-amber-50/70 border-amber-200 text-slate-800'
              }`}
            >
              <div className="font-semibold mb-0.5">
                {pinLookup.serviceable ? 'Coverage Confirmed' : 'Coverage Notice'}
              </div>
              <div>{pinLookup.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== URBAN COMPANY INTERACTIVE SERVICE & PACKAGE MODAL ======================== */}
      {activeModalServiceId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="uc-service-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Top Header with Photo & Close Button */}
            <div className="relative h-48 sm:h-56 w-full bg-slate-900 shrink-0">
              <ServicePhoto
                src={currentService.imageUrl}
                alt={currentService.title}
                fallbackKind={currentService.illustrationKey}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveModalServiceId(null)}
                aria-label="Close service packages modal"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="text-xs font-medium text-teal-300 mb-1">
                  {pinLookup.serviceable && pinLookup.city
                    ? `${pinLookup.city.name} (${pinLookup.pinCode}) · ${
                        currentPricingMode === 'vendor_offer'
                          ? 'Vendor-Offer Mode'
                          : 'City-Fixed Tariff'
                      }`
                    : `PIN ${pinLookup.pinCode} · Select Covered Area`}
                </div>
                <h2
                  id="uc-service-modal-title"
                  className="text-xl sm:text-2xl font-extrabold tracking-tight"
                >
                  {currentService.title}
                </h2>
              </div>
            </div>

            {/* Modal Scrollable Body: Packages, Vendor Offers, Add-ons, Inclusions */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentService.fullDescription}
              </p>

              {/* 1. Select Package / Variant with Real Thumbnail & +Add Button */}
              <div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">
                  Select Service Package
                </h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {currentService.variants.map((variant) => {
                    const isSelected = bookingDraft.variantId === variant.id;
                    const variantPriceRes =
                      pinLookup.serviceable && pinLookup.city
                        ? resolveEffectivePricePaise({
                            service: currentService,
                            variantId: variant.id,
                            cityId: pinLookup.city.id,
                            vendorUid:
                              currentPricingMode === 'vendor_offer'
                                ? bookingDraft.selectedVendorUid
                                : undefined,
                            priceOverrides: DEMO_PRICE_OVERRIDES,
                          })
                        : null;
                    const displayPaise =
                      variantPriceRes?.unitPricePaise ?? variant.basePricePaise;

                    return (
                      <div
                        key={variant.id}
                        className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                          isSelected ? 'bg-teal-50/40' : 'bg-white hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900">{variant.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {variant.scopeSummary} · {variant.durationMinutes} mins
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-sm font-extrabold text-slate-950 font-mono tabular-nums">
                              {formatPaiseToInr(displayPaise)}
                            </span>
                            {variant.regularPricePaise &&
                              variant.regularPricePaise > displayPaise && (
                                <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                                  {formatPaiseToInr(variant.regularPricePaise)}
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Urban Company Thumbnail + Add Button */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <ServicePhoto
                            src={variant.imageUrl || currentService.imageUrl}
                            alt={variant.name}
                            fallbackKind={currentService.illustrationKey}
                            className="w-20 h-16 rounded-lg border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setBookingDraft((prev) => ({ ...prev, variantId: variant.id }))
                            }
                            className={`px-3.5 py-1 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'bg-white text-teal-700 border-teal-700 hover:bg-teal-50'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span>Selected</span>
                              </>
                            ) : (
                              '+ Add'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Vendor Offer Selection (if service is in vendor_offer mode in active city) */}
              {pinLookup.serviceable && currentPricingMode === 'vendor_offer' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-900">
                    Compare Verified Partner Offers in {pinLookup.city?.name} ({pinLookup.pinCode})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentVendorOffers.map((offer) => {
                      const isChosen = bookingDraft.selectedVendorUid === offer.vendorUid;
                      return (
                        <button
                          key={offer.vendorUid}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({
                              ...prev,
                              selectedVendorUid: offer.vendorUid,
                            }))
                          }
                          className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                            isChosen
                              ? 'border-teal-700 bg-white shadow-xs'
                              : 'border-slate-200 bg-white/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {offer.vendorDisplayName}
                            </span>
                            <span className="text-sm font-extrabold text-teal-700 font-mono tabular-nums">
                              {formatPaiseToInr(offer.amountPaise)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {offer.businessName} · {offer.experienceYearsLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Optional Frequently Added Add-ons */}
              {currentService.addons.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">
                    Frequently Added Together
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentService.addons.map((addon) => {
                      const qty = bookingDraft.addonQuantities[addon.id] || 0;
                      return (
                        <div
                          key={addon.id}
                          className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {addon.imageUrl && (
                              <ServicePhoto
                                src={addon.imageUrl}
                                alt={addon.name}
                                className="w-12 h-12 rounded-lg shrink-0 border border-slate-200"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {addon.name}
                              </div>
                              <div className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                                {formatPaiseToInr(addon.pricePaise)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              aria-label={`Remove ${addon.name}`}
                              onClick={() =>
                                setBookingDraft((prev) => ({
                                  ...prev,
                                  addonQuantities: {
                                    ...prev.addonQuantities,
                                    [addon.id]: Math.max(0, qty - 1),
                                  },
                                }))
                              }
                              className="w-7 h-7 rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-mono font-bold">
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Add ${addon.name}`}
                              onClick={() =>
                                setBookingDraft((prev) => ({
                                  ...prev,
                                  addonQuantities: {
                                    ...prev.addonQuantities,
                                    [addon.id]: Math.min(addon.maxQuantity, qty + 1),
                                  },
                                }))
                              }
                              className="w-7 h-7 rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Standard SOP Inclusions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-900 mb-2">
                  What Is Included in TankmanPro SOP:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {currentService.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Sticky Footer Bar */}
            <div className="p-4 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-[11px] text-slate-500">
                  {activeQuote.variantName}
                  {activeQuote.addonsTotalPaise > 0 ? ' + Add-ons' : ''}
                </div>
                <div className="text-lg font-extrabold text-slate-950 font-mono tabular-nums">
                  {activeQuote.bookable
                    ? formatPaiseToInr(activeQuote.finalTotalPaise)
                    : 'Select Serviceable PIN'}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const slug = currentService.slug;
                    setActiveModalServiceId(null);
                    onNavigate(`/services/${slug}`);
                  }}
                  className="px-4 py-2.5 border border-slate-300 hover:border-slate-900 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Full Service Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalServiceId(null);
                    startFreshCheckout();
                  }}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Proceed to Slot &amp; Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN ROUTE VIEW SWITCHER */}
      <main className="flex-1">
        {/* ======================== 1. HOME PAGE (`/`) — URBAN COMPANY LAYOUT ======================== */}
        {internalPath === '/' && (
          <div>
            {/* Urban Company Split Hero Section: Left Category Grid + PIN Checker | Right 4-Photo Bento Collage */}
            <section className="bg-white border-b border-slate-200 py-8 lg:py-12">
              <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                  {/* Left Column (6 Cols): Headline + PIN Checker + "What are you looking for?" 8-Tile Grid */}
                  <div className="lg:col-span-6 space-y-6">
                    <div>
                      <h1
                        className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-950 tracking-tight leading-[1.14]"
                        style={{ textWrap: 'balance' }}
                      >
                        Home services at your doorstep
                      </h1>
                      <p className="text-sm text-slate-600 mt-2">
                        Mechanized water tank cleaning, AC service, bathroom &amp; kitchen deep
                        cleaning, sofa shampooing, car wash, and Beedare skin aesthetics.
                      </p>
                    </div>

                    {/* What are you looking for? — Urban Company Signature Category Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h2 className="text-base font-bold text-slate-800">
                          What are you looking for?
                        </h2>
                        <span className="text-xs font-medium text-teal-700">
                          Click any category to view packages
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {DEMO_CATEGORIES.filter((c) => c.status === 'published').map((cat) => {
                          const matchingService =
                            DEMO_SERVICES.find((s) => s.categoryId === cat.id) || DEMO_SERVICES[0];
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => openServiceModal(matchingService)}
                              className="group flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 hover:border-slate-300 transition-all cursor-pointer"
                            >
                              <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-white border border-slate-200/60">
                                <ServicePhoto
                                  src={cat.imageUrl}
                                  alt={cat.name}
                                  fallbackKind={cat.iconKey}
                                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950 leading-snug line-clamp-2">
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Integrated 6-Digit PIN Code Availability & City Tariff Bar */}
                      <div className="mt-5 pt-5 border-t border-slate-200">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            applyPinLookup(pinInput);
                          }}
                          className="space-y-2.5"
                        >
                          <label
                            htmlFor="hero-pin-input"
                            className="block text-xs font-bold text-slate-700"
                          >
                            Check Service Availability &amp; City Tariff by 6-Digit PIN Code
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <MapPin className="w-4 h-4 text-teal-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                id="hero-pin-input"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinInput}
                                onChange={(e) =>
                                  setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                placeholder="Enter 6-digit PIN (110001, 242001, 208002)"
                                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                            </div>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Check Availability
                            </button>
                          </div>

                          {/* Quick PIN Switchers */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                            <span className="text-slate-500">Quick select:</span>
                            {[
                              { pin: '110001', label: '110001 (New Delhi)' },
                              { pin: '242001', label: '242001 (Shahjahanpur)' },
                              { pin: '208002', label: '208002 (Kanpur)' },
                              { pin: '400001', label: '400001 (Uncovered)' },
                            ].map((preset) => (
                              <button
                                key={preset.pin}
                                type="button"
                                onClick={() => applyPinLookup(preset.pin)}
                                className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                                  pinLookup.pinCode === preset.pin
                                    ? preset.pin === '400001'
                                      ? 'bg-amber-700 text-white font-semibold'
                                      : 'bg-teal-700 text-white font-semibold'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </form>

                        {/* Live PIN Coverage Banner or Waitlist Opt-In */}
                        <div className="mt-3">
                          {pinLookup.serviceable && pinLookup.city && pinLookup.serviceArea ? (
                            <div
                              role="status"
                              className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-teal-950">
                                    {pinLookup.city.name} ({pinLookup.pinCode}):
                                  </span>{' '}
                                  <span className="text-slate-700">
                                    {pinLookup.serviceArea.zoneLabel}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onNavigate('/services')}
                                className="text-teal-800 font-bold hover:underline shrink-0 cursor-pointer"
                              >
                                All Services
                              </button>
                            </div>
                          ) : (
                            <div
                              role="region"
                              aria-label="Uncovered PIN Code Waitlist"
                              className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3"
                            >
                              <div className="flex items-start gap-2 text-xs text-amber-950">
                                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold">
                                    Not available in PIN {pinLookup.pinCode || pinInput} yet
                                  </div>
                                  <div className="text-slate-700 mt-0.5">{pinLookup.message}</div>
                                </div>
                              </div>

                              {pinLookup.validFormat && !pinLookup.serviceable && (
                                <form
                                  onSubmit={handleWaitlistSubmit}
                                  className="bg-white border border-amber-200 rounded-lg p-3 space-y-2.5"
                                >
                                  <div className="text-xs font-semibold text-slate-900">
                                    Request Launch Notification for PIN {pinLookup.pinCode}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      aria-label="Your Name"
                                      value={waitlistName}
                                      onChange={(e) => setWaitlistName(e.target.value)}
                                      placeholder="Your full name"
                                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                                    />
                                    <input
                                      type="text"
                                      aria-label="Phone or Email"
                                      value={waitlistContact}
                                      onChange={(e) => setWaitlistContact(e.target.value)}
                                      placeholder="10-digit mobile or email"
                                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                                    />
                                  </div>
                                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={waitlistConsent}
                                      onChange={(e) => setWaitlistConsent(e.target.checked)}
                                      className="mt-0.5 rounded border-slate-300 text-teal-700"
                                    />
                                    <span>
                                      Notify me when TankmanPro launches in PIN {pinLookup.pinCode}.
                                    </span>
                                  </label>
                                  {waitlistStatus && (
                                    <div
                                      className={`text-xs font-medium ${
                                        waitlistStatus.type === 'success'
                                          ? 'text-teal-800'
                                          : 'text-red-700'
                                      }`}
                                    >
                                      {waitlistStatus.text}
                                    </div>
                                  )}
                                  <button
                                    type="submit"
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    Join Area Waitlist
                                  </button>
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (6 Cols): Urban Company 4-Photo Asymmetric Bento Collage from tankmanpro.com */}
                  <div className="lg:col-span-6 grid grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-3.5 sm:space-y-4">
                      {/* Photo 1: Water Tank Cleaning */}
                      <button
                        type="button"
                        onClick={() => openServiceModal(DEMO_SERVICES[0])}
                        className="group relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 text-left block cursor-pointer"
                      >
                        <ServicePhoto
                          src="/assets/tankmanpro/water-tank.jpg"
                          alt="Mechanized Water Tank Cleaning"
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                          <div className="text-[11px] font-medium text-teal-300">
                            500L to 5000L Capacities
                          </div>
                          <div className="text-sm sm:text-base font-bold">
                            Mechanized Water Tank Cleaning
                          </div>
                          <div className="text-xs font-mono text-slate-200 mt-0.5">
                            Starts at ₹499
                          </div>
                        </div>
                      </button>

                      {/* Photo 2: Kitchen & Chimney Deep Cleaning */}
                      <button
                        type="button"
                        onClick={() => openServiceModal(DEMO_SERVICES[3])}
                        className="group relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 text-left block cursor-pointer"
                      >
                        <ServicePhoto
                          src="/assets/tankmanpro/kitchen-chimney.png"
                          alt="Kitchen and Chimney Deep Cleaning"
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                          <div className="text-sm font-bold">Kitchen, Chimney &amp; Fridge</div>
                          <div className="text-xs font-mono text-teal-300 mt-0.5">
                            Chimney ₹399 · Full Kitchen ₹999
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="space-y-3.5 sm:space-y-4 pt-0 sm:pt-6">
                      {/* Photo 3: Split & Window AC Service */}
                      <button
                        type="button"
                        onClick={() => openServiceModal(DEMO_SERVICES[1])}
                        className="group relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 text-left block cursor-pointer"
                      >
                        <ServicePhoto
                          src="/assets/tankmanpro/ac-service.jpg"
                          alt="AC Service and Installation"
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                          <div className="text-sm font-bold">AC Service &amp; Installation</div>
                          <div className="text-xs font-mono text-teal-300 mt-0.5">
                            Service ₹599 · Install ₹1,499
                          </div>
                        </div>
                      </button>

                      {/* Photo 4: Bathroom Deep Cleaning */}
                      <button
                        type="button"
                        onClick={() => openServiceModal(DEMO_SERVICES[2])}
                        className="group relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 text-left block cursor-pointer"
                      >
                        <ServicePhoto
                          src="/assets/tankmanpro/bathroom-deep.jpg"
                          alt="Bathroom Machine and Hand Scrub Cleaning"
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                          <div className="text-[11px] font-medium text-teal-300">
                            Tiles, Grout, Basin &amp; Fittings
                          </div>
                          <div className="text-sm sm:text-base font-bold">
                            Bathroom Machine &amp; Deep Clean
                          </div>
                          <div className="text-xs font-mono text-slate-200 mt-0.5">
                            Hand Scrub ₹399 · Machine ₹499
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Full-Width Rate Card Highlights Strip inside Right Hero Column */}
                    <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="font-bold text-slate-900">
                        TankmanPro Standard Tariffs:
                      </div>
                      <div className="flex flex-wrap items-center gap-3 font-mono text-slate-700">
                        <span>Tank 500L ₹499</span>
                        <span className="text-slate-300">|</span>
                        <span>AC Service ₹599</span>
                        <span className="text-slate-300">|</span>
                        <span>Sofa ₹149/seat</span>
                        <span className="text-slate-300">|</span>
                        <span>Car Wash ₹299</span>
                        <span className="text-slate-300">|</span>
                        <span>Fan ₹49</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ======================== URBAN COMPANY RAIL 1: MOST BOOKED SERVICES ======================== */}
            <section className="py-10 lg:py-14 border-b border-slate-200">
              <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                      Most Booked Home Services
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {pinLookup.serviceable && pinLookup.city
                        ? `Transparent TankmanPro tariffs for ${pinLookup.city.name} (${pinLookup.pinCode})`
                        : 'Select a covered 6-digit PIN code for city-specific pricing'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services')}
                    className="text-xs font-bold text-slate-900 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>See All 8 Service Lines</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {DEMO_SERVICES.map((service) => {
                    const cardPricing = getServiceCardPricing(service);
                    return (
                      <article
                        key={service.id}
                        className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-2xs"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => openServiceModal(service)}
                            className="relative h-44 w-full block text-left overflow-hidden cursor-pointer"
                          >
                            <ServicePhoto
                              src={service.imageUrl}
                              alt={service.title}
                              fallbackKind={service.illustrationKey}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute bottom-2.5 left-2.5 bg-slate-950/80 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md">
                              {service.variants.length} Packages
                            </span>
                          </button>

                          <div className="p-4">
                            <div className="text-[11px] text-slate-500 mb-1">
                              {service.durationMinutes} mins · {cardPricing.modeLabel}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-snug mb-1.5">
                              {service.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {service.shortDescription}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                              Starts at
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold text-slate-950 font-mono tabular-nums">
                                {cardPricing.priceLabel}
                              </span>
                              {cardPricing.regularLabel && (
                                <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                                  {cardPricing.regularLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openServiceModal(service)}
                              className="px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              + Add
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate(`/services/${service.slug}`)}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ======================== URBAN COMPANY RAIL 2: WATER TANK & HOME HYGIENE PACKAGES ======================== */}
            <section className="py-10 lg:py-14 bg-slate-50 border-b border-slate-200">
              <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="text-xs font-semibold text-teal-700 mb-1">
                      Direct from TankmanPro Rate Card
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                      Water Tank, Kitchen &amp; Bathroom Packages
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => openServiceModal(DEMO_SERVICES[0])}
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Compare All Tank Capacities (500L – 5000L)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      service: DEMO_SERVICES[0],
                      variantId: 'var_tank_500_1000',
                      title: 'Water Tank Cleaning (500L – 750L)',
                      sub: 'Dewatering, sludge vacuum, high-pressure jet & UV',
                      price: '₹499',
                      oldPrice: '₹699',
                      img: '/assets/tankmanpro/water-tank.jpg',
                    },
                    {
                      service: DEMO_SERVICES[0],
                      variantId: 'var_tank_1000_1500',
                      title: 'Water Tank Cleaning (1000L – 1500L)',
                      sub: '6-stage mechanized cleaning for medium tanks',
                      price: '₹899',
                      oldPrice: '₹1,099',
                      img: '/assets/tankmanpro/water-tank.jpg',
                    },
                    {
                      service: DEMO_SERVICES[2],
                      variantId: 'var_bath_machine_scrub',
                      title: 'Bathroom Floor & Tile Machine Scrub',
                      sub: 'Rotary machine descaling, toilet, basin & fittings',
                      price: '₹499',
                      oldPrice: '₹649',
                      img: '/assets/tankmanpro/bathroom-scrub.webp',
                    },
                    {
                      service: DEMO_SERVICES[3],
                      variantId: 'var_empty_kitchen_chimney',
                      title: 'Empty Kitchen + Chimney Deep Clean',
                      sub: 'Complete slab/cabinet degreasing + chimney wash',
                      price: '₹1,299',
                      oldPrice: '₹1,599',
                      img: '/assets/tankmanpro/kitchen-deep.png',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <ServicePhoto
                          src={item.img}
                          alt={item.title}
                          className="h-36 w-full rounded-lg mb-3 border border-slate-100"
                        />
                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.sub}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-slate-950 font-mono">
                            {item.price}
                          </span>
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {item.oldPrice}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openServiceModal(item.service, item.variantId)}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Book Package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ======================== URBAN COMPANY RAIL 3: BEEDARE BY TANKMANPRO AESTHETICS ======================== */}
            <section className="py-10 lg:py-14 border-b border-slate-200">
              <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
                <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Beedare by TankmanPro · Clinical Aesthetics at Home</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Advanced Skin Peels, Laser &amp; Dermapen at Home
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
                        Professional aesthetic care in the comfort of your home — Glycolic, Vitamin
                        C &amp; Salicylic peels, TCA pigmentation care, and collagen microneedling.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openServiceModal(DEMO_SERVICES[7])}
                      className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Explore Beedare Treatments
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        variantId: 'var_plumb_standard',
                        title: 'Glycolic / Vitamin C / Salicylic Peel',
                        desc: 'Skin resurfacing, brightening, even tone & acne control',
                        price: '₹1,999',
                        img: '/assets/tankmanpro/chemical-peel.jpg',
                      },
                      {
                        variantId: 'var_prp_laser',
                        title: 'Full Face Laser / PRP Rejuvenation',
                        desc: 'At-home diode laser hair reduction or PRP facial therapy',
                        price: '₹3,999',
                        img: '/assets/tankmanpro/laser-skin.jpg',
                      },
                      {
                        variantId: 'var_dermapen',
                        title: 'Dermapen / Micro-Needle Therapy',
                        desc: 'Collagen induction, scar reduction & skin texture renewal',
                        price: '₹4,999',
                        img: '/assets/tankmanpro/aesthetic-facial.jpg',
                      },
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <ServicePhoto
                            src={card.img}
                            alt={card.title}
                            className="h-40 w-full"
                          />
                          <div className="p-4">
                            <h3 className="text-sm font-bold text-white">{card.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                          </div>
                        </div>
                        <div className="px-4 pb-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-base font-extrabold text-teal-300 font-mono">
                            {card.price}
                          </span>
                          <button
                            type="button"
                            onClick={() => openServiceModal(DEMO_SERVICES[7], card.variantId)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Add Session
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ======================== HOW IT WORKS & ACTIVE CITIES ======================== */}
            <section className="py-10 lg:py-14 bg-slate-50 border-b border-slate-200">
              <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5">
                    <div className="text-xs font-semibold text-teal-700 mb-1">
                      PIN-Verified Coverage Directory
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight mb-3">
                      Active Service Cities &amp; PIN Zones
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                      TankmanPro routes every booking strictly by verified 6-digit Indian PIN code.
                      Switch between New Delhi, Shahjahanpur, and Kanpur below to test City-Fixed
                      and Vendor-Offer pricing modes.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('/service-areas')}
                      className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-900 text-xs font-bold text-slate-900 rounded-lg transition-colors cursor-pointer"
                    >
                      View Full Service Area Directory
                    </button>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {DEMO_CITIES.map((city) => {
                      const areas = DEMO_SERVICE_AREAS.filter(
                        (a) => a.cityId === city.id && a.active
                      );
                      return (
                        <div
                          key={city.id}
                          className="bg-white border border-slate-200 rounded-xl p-4"
                        >
                          <div className="text-[11px] text-slate-500">{city.state}</div>
                          <h3 className="text-base font-bold text-slate-950 mb-2.5">{city.name}</h3>
                          <div className="space-y-2">
                            {areas.map((area) => (
                              <div
                                key={area.id}
                                className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100"
                              >
                                <span className="font-mono font-bold text-teal-700">
                                  {area.pinCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => applyPinLookup(area.pinCode)}
                                  className="text-slate-900 hover:text-teal-700 font-semibold underline cursor-pointer"
                                >
                                  Select PIN
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================== 2. SERVICES CATALOG (`/services`) ======================== */}
        {internalPath === '/services' && (
          <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 mb-1">
                  TankmanPro Rate Card &amp; Service Catalog · Active PIN: {pinLookup.pinCode}
                </div>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  All Home Cleaning, Repair &amp; Aesthetic Services
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <label htmlFor="catalog-search" className="sr-only">
                    Search services
                  </label>
                  <input
                    id="catalog-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tank, AC, kitchen, sofa..."
                    className="pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg cursor-pointer"
                >
                  Location:{' '}
                  {pinLookup.city
                    ? `${pinLookup.city.name} (${pinLookup.pinCode})`
                    : pinLookup.pinCode}
                </button>
              </div>
            </div>

            {/* Interactive Category Filter Buttons */}
            <div className="py-6 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Categories (8)
              </button>
              {DEMO_CATEGORIES.filter((c) => c.status === 'published').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Filtered Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEMO_SERVICES.filter((srv) => {
                if (srv.status !== 'published') return false;
                if (selectedCategoryId !== 'all' && srv.categoryId !== selectedCategoryId) {
                  return false;
                }
                if (
                  searchQuery.trim() &&
                  !`${srv.title} ${srv.shortDescription}`
                    .toLowerCase()
                    .includes(searchQuery.trim().toLowerCase())
                ) {
                  return false;
                }
                return true;
              }).map((service) => {
                const cat = DEMO_CATEGORIES.find((c) => c.id === service.categoryId);
                const pricing = getServiceCardPricing(service);
                return (
                  <article
                    key={service.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <ServicePhoto
                        src={service.imageUrl}
                        alt={service.title}
                        fallbackKind={service.illustrationKey}
                        className="h-52 w-full"
                      />
                      <div className="p-6">
                        <div className="text-xs text-slate-500 mb-1.5">
                          <span>{cat?.name}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{service.durationMinutes} mins</span>
                          <span aria-hidden="true"> · </span>
                          <span>{service.variants.length} Options</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-950 mb-2">{service.title}</h2>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          {service.shortDescription}
                        </p>
                        <div className="text-xs text-slate-600 space-y-1">
                          {service.inclusions.slice(0, 2).map((inc) => (
                            <div key={inc} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{inc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] text-slate-500">{pricing.modeLabel}</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-slate-950 font-mono tabular-nums">
                            {pricing.priceLabel}
                          </span>
                          {pricing.regularLabel && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {pricing.regularLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openServiceModal(service)}
                          className="px-3.5 py-2.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-700 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Quick Modal
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate(`/services/${service.slug}`)}
                          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Configure &amp; Book
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================== 3. SERVICE DETAIL (`/services/:slug`) ======================== */}
        {internalPath.startsWith('/services/') && (
          <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
            {/* Breadcrumbs */}
            <nav
              aria-label="Breadcrumb"
              className="text-xs text-slate-500 mb-6 flex items-center gap-2"
            >
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="hover:text-slate-900"
              >
                Home
              </a>
              <span aria-hidden="true">/</span>
              <a
                href="/services"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/services');
                }}
                className="hover:text-slate-900"
              >
                Services
              </a>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 font-medium truncate">{currentService.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Service Overview, Variants, Add-ons, Vendor Offers, Inclusions */}
              <div className="lg:col-span-7 space-y-8">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <ServicePhoto
                    src={currentService.imageUrl}
                    alt={currentService.title}
                    fallbackKind={currentService.illustrationKey}
                    className="h-64 sm:h-72 w-full"
                  />
                  <div className="p-6 sm:p-8">
                    <div className="text-xs text-slate-500 mb-2">
                      <span>Standard Duration: {currentService.durationMinutes} mins</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        Pricing Mode:{' '}
                        {currentPricingMode === 'vendor_offer'
                          ? 'Vendor-Offer (Customer Selects Partner)'
                          : 'City-Fixed (Auto-Assigned Partner)'}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-3">
                      {currentService.title}
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {currentService.fullDescription}
                    </p>
                  </div>
                </div>

                {/* Step 1: Select Package / Variant */}
                <section className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h2 className="text-base font-bold text-slate-950 mb-1">
                    1. Select Service Package / Variant
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Prices automatically adjust for {pinLookup.city?.name || 'your selected city'}.
                  </p>
                  <div className="space-y-3">
                    {currentService.variants.map((variant) => {
                      const isSelected = bookingDraft.variantId === variant.id;
                      const variantPriceRes =
                        pinLookup.serviceable && pinLookup.city
                          ? resolveEffectivePricePaise({
                              service: currentService,
                              variantId: variant.id,
                              cityId: pinLookup.city.id,
                              vendorUid:
                                currentPricingMode === 'vendor_offer'
                                  ? bookingDraft.selectedVendorUid
                                  : undefined,
                              priceOverrides: DEMO_PRICE_OVERRIDES,
                            })
                          : null;
                      const effectivePaise =
                        variantPriceRes?.unitPricePaise ?? variant.basePricePaise;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({ ...prev, variantId: variant.id }))
                          }
                          className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                            isSelected
                              ? 'border-teal-700 bg-teal-50/40'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <ServicePhoto
                              src={variant.imageUrl || currentService.imageUrl}
                              alt={variant.name}
                              fallbackKind={currentService.illustrationKey}
                              className="w-16 h-14 rounded-lg shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900">{variant.name}</div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                {variant.scopeSummary} · Est. {variant.durationMinutes} mins
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-extrabold text-slate-950 font-mono tabular-nums">
                              {formatPaiseToInr(effectivePaise)}
                            </div>
                            {variant.regularPricePaise &&
                              variant.regularPricePaise > effectivePaise && (
                                <div className="text-[11px] text-slate-400 line-through font-mono">
                                  {formatPaiseToInr(variant.regularPricePaise)}
                                </div>
                              )}
                            <div className="text-[11px] text-teal-700 font-bold mt-0.5">
                              {isSelected ? 'Selected' : '+ Select'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 2: Pricing Mode & Vendor Offer Selection */}
                <section className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h2 className="text-base font-bold text-slate-900">
                      2.{' '}
                      {currentPricingMode === 'vendor_offer'
                        ? 'Choose Your Service Partner Offer (Vendor-Offer Mode)'
                        : 'Service Partner Routing (City-Fixed Mode)'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      Change PIN ({pinLookup.pinCode})
                    </button>
                  </div>

                  {!pinLookup.serviceable ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      PIN <span className="font-mono font-bold">{pinLookup.pinCode}</span> is not in
                      an active service area. Switch to <span className="font-mono">110001</span>{' '}
                      (New Delhi), <span className="font-mono">242001</span> (Shahjahanpur), or{' '}
                      <span className="font-mono">208002</span> (Kanpur) to see bookable city
                      tariffs and partner offers.
                    </div>
                  ) : currentPricingMode === 'vendor_offer' ? (
                    <div className="space-y-3 mt-3">
                      <p className="text-xs text-slate-600">
                        In <strong>{pinLookup.city?.name}</strong>, Admin has enabled{' '}
                        <strong>Vendor-Offer Mode</strong> for this service. Compare eligible
                        Admin-approved partner prices below; your chosen partner and price are
                        locked into your booking snapshot:
                      </p>
                      {currentVendorOffers.map((offer) => {
                        const isChosen = bookingDraft.selectedVendorUid === offer.vendorUid;
                        return (
                          <button
                            key={offer.vendorUid}
                            type="button"
                            onClick={() =>
                              setBookingDraft((prev) => ({
                                ...prev,
                                selectedVendorUid: offer.vendorUid,
                              }))
                            }
                            className={`w-full text-left p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                              isChosen
                                ? 'border-teal-700 bg-teal-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {offer.vendorDisplayName}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {offer.businessName} · {offer.experienceYearsLabel}
                              </div>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                                {formatPaiseToInr(offer.amountPaise)}
                              </div>
                              <div className="text-xs font-semibold text-teal-700">
                                {isChosen ? 'Selected Partner Offer' : 'Choose Offer'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed mt-2">
                      In <strong>{pinLookup.city?.name}</strong>, this service uses{' '}
                      <strong>City-Fixed Mode</strong>. You pay the single configured city tariff
                      shown in your quote, and TankmanPro automatically assigns the least-active
                      eligible partner crew covering PIN{' '}
                      <span className="font-mono font-semibold">{pinLookup.pinCode}</span>.
                      <div className="mt-2 text-slate-500">
                        Tip: Switch to PIN <span className="font-mono">242001</span> (Shahjahanpur)
                        on Water Tank Cleaning or <span className="font-mono">110001</span> (New
                        Delhi) on AC Service to test Vendor-Offer selection mode.
                      </div>
                    </div>
                  )}
                </section>

                {/* Step 3: Optional Add-ons */}
                {currentService.addons.length > 0 && (
                  <section className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1">
                      3. Optional Add-Ons
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Add extra sanitization or fixture care to your visit.
                    </p>
                    <div className="space-y-3">
                      {currentService.addons.map((addon) => {
                        const qty = bookingDraft.addonQuantities[addon.id] || 0;
                        return (
                          <div
                            key={addon.id}
                            className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              {addon.imageUrl && (
                                <ServicePhoto
                                  src={addon.imageUrl}
                                  alt={addon.name}
                                  className="w-14 h-14 rounded-lg shrink-0 border border-slate-200"
                                />
                              )}
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {addon.name}
                                </div>
                                <div className="text-xs text-slate-600 mt-0.5">
                                  {addon.description} ·{' '}
                                  <span className="font-mono font-semibold text-slate-900">
                                    {formatPaiseToInr(addon.pricePaise)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                aria-label={`Decrease quantity for ${addon.name}`}
                                onClick={() =>
                                  setBookingDraft((prev) => ({
                                    ...prev,
                                    addonQuantities: {
                                      ...prev.addonQuantities,
                                      [addon.id]: Math.max(0, qty - 1),
                                    },
                                  }))
                                }
                                className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity for ${addon.name}`}
                                onClick={() =>
                                  setBookingDraft((prev) => ({
                                    ...prev,
                                    addonQuantities: {
                                      ...prev.addonQuantities,
                                      [addon.id]: Math.min(addon.maxQuantity, qty + 1),
                                    },
                                  }))
                                }
                                className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Inclusions, Exclusions & Preparation Checklist */}
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-3">
                      What Is Included in This Service
                    </h2>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {currentService.inclusions.map((inc) => (
                        <li key={inc} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 border-t border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      Exclusions &amp; Scope Notes
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentService.exclusions.map((exc) => (
                        <li key={exc}>• {exc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 border-t border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      Before Technician Arrival
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {currentService.preparationInstructions.map((prep) => (
                        <li key={prep}>• {prep}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>

              {/* Right 5 Columns: Sticky Contiguous Purchase & Quote Module */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="pb-4 border-b border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">
                    Authoritative Quote Summary · Integer-Paise Engine
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{currentService.title}</h2>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Area:{' '}
                    {pinLookup.serviceable && pinLookup.city
                      ? `${pinLookup.city.name} (${pinLookup.pinCode})`
                      : `Uncovered PIN (${pinLookup.pinCode})`}
                  </div>
                </div>

                {activeQuote.bookable ? (
                  <>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-700">
                        <span>{activeQuote.variantName}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatPaiseToInr(activeQuote.baseServicePaise)}
                        </span>
                      </div>
                      {activeQuote.selectedVendorName && (
                        <div className="flex justify-between text-teal-800">
                          <span>Selected Offer Partner</span>
                          <span className="font-medium">{activeQuote.selectedVendorName}</span>
                        </div>
                      )}
                      {activeQuote.addons.map((ad) => (
                        <div key={ad.addonId} className="flex justify-between text-slate-600">
                          <span>
                            {ad.name} × {ad.quantity}
                          </span>
                          <span className="font-mono tabular-nums">
                            {formatPaiseToInr(ad.lineTotalPaise)}
                          </span>
                        </div>
                      ))}

                      <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-950 text-sm">
                        <span>Estimated Subtotal</span>
                        <span className="font-mono tabular-nums">
                          {formatPaiseToInr(activeQuote.finalTotalPaise)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      Price Source: <span className="font-mono">{activeQuote.pricingSource}</span> ·{' '}
                      {currentService.cancellationPolicySummary}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        startFreshCheckout();
                      }}
                      className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Proceed to Slot &amp; Checkout ({formatPaiseToInr(activeQuote.finalTotalPaise)})
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
                    <div className="font-semibold">{activeQuote.reason}</div>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Select Covered PIN Code
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* ======================== 4. CHECKOUT (`/checkout`) — PHASE 3 8-STEP WORKFLOW ======================== */}
        {internalPath === '/checkout' && (
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Instant Technician Booking · 100% Verified Crew</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  Fast &amp; Easy Checkout
                </h1>
                <p className="text-xs text-slate-500">
                  Select your slot, enter address, and our verified specialist will arrive at your doorstep.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-3 py-1.5 border border-slate-300 hover:border-slate-900 rounded-lg font-medium text-slate-800 cursor-pointer"
                >
                  Change PIN ({pinLookup.pinCode})
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                >
                  Switch Service
                </button>
              </div>
            </div>

            {/* Step 1 Guard: Unserviceable PIN Code Blocked */}
            {!pinLookup.serviceable && !confirmedBookingResult && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Step 1 Blocked: PIN {pinLookup.pinCode || 'Entered'} Is Not Serviceable
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {pinLookup.message} Bookings from unsupported locations are blocked by the
                    server. Select an active PIN code (e.g. 110001, 242001, or 208002) to proceed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  Select Serviceable PIN
                </button>
              </div>
            )}

            {/* Step 6, 7 & 8 Confirmation Receipt View */}
            {confirmedBookingResult ? (
              <div className="bg-white border border-teal-200 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                      <Check className="w-4 h-4" />
                      <span>
                        {confirmedBookingResult.duplicatePrevented
                          ? 'Idempotency Guard Active · Existing Booking Returned'
                          : 'Booking Confirmed & Dispatched'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Booking Reference:{' '}
                      <span className="font-mono text-teal-700">
                        {confirmedBookingResult.booking.bookingCode}
                      </span>
                    </h2>
                    <div className="text-xs text-slate-500">
                      Created {confirmedBookingResult.booking.createdAtIso.slice(0, 19).replace('T', ' ')} UTC
                      {' · '}Customer: {confirmedBookingResult.booking.customerName} (
                      {confirmedBookingResult.booking.customerPhone})
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Job Status · Payment Status
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      {confirmedBookingResult.booking.status} ·{' '}
                      <span
                        className={
                          confirmedBookingResult.booking.paymentStatus === 'paid'
                            ? 'text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded'
                            : 'text-teal-700'
                        }
                      >
                        {confirmedBookingResult.booking.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    {confirmedBookingResult.booking.razorpayPaymentId && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Payment Ref: {confirmedBookingResult.booking.razorpayPaymentId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 7 & 8 Vendor Assignment & Dispatch Outcome */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    Vendor Assignment &amp; Notification Status (Step 7 &amp; Step 8)
                  </div>
                  {confirmedBookingResult.booking.assignedVendorUid ? (
                    <div className="space-y-1 text-slate-700">
                      <div>
                        <strong>Assigned Partner Crew:</strong>{' '}
                        {confirmedBookingResult.booking.assignedVendorName} (
                        <span className="font-mono">
                          {confirmedBookingResult.dispatchDecision?.assignedVendor?.vendorCode ||
                            confirmedBookingResult.booking.assignedVendorUid}
                        </span>
                        )
                      </div>
                      <div>
                        <strong>Assignment Policy Applied:</strong>{' '}
                        <span className="font-mono">
                          {confirmedBookingResult.booking.assignmentMode}
                        </span>{' '}
                        · Verified active status, {confirmedBookingResult.booking.cityName} (
                        {confirmedBookingResult.booking.pinCode}) coverage, service authorization,
                        slot availability, and crew capacity.
                      </div>
                      <div className="text-teal-800 font-medium pt-1">
                        In-panel dispatch notification sent to{' '}
                        {confirmedBookingResult.booking.assignedVendorName}&apos;s Partner Job
                        Console (/vendor/jobs). Customer phone &amp; house address remain masked
                        until the vendor accepts the job.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-amber-950">
                      <div>
                        <strong>Status:</strong> Queued for Main Admin Review (
                        <span className="font-mono">
                          {confirmedBookingResult.booking.subStatus}
                        </span>
                        )
                      </div>
                      <div>
                        {confirmedBookingResult.dispatchDecision?.customerMessage ||
                          'Your booking has been routed to the Admin Dispatch Console for specialist assignment.'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Service, Address, Slot & Price Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">Service &amp; Slot Details</div>
                    <div>
                      <strong>Service:</strong> {confirmedBookingResult.booking.serviceTitle} (
                      {confirmedBookingResult.booking.variantName})
                    </div>
                    <div>
                      <strong>Date &amp; Slot:</strong>{' '}
                      <span className="font-mono">
                        {confirmedBookingResult.booking.scheduledDate}
                      </span>{' '}
                      · {confirmedBookingResult.booking.timeWindow}
                    </div>
                    <div>
                      <strong>Verified Location:</strong>{' '}
                      {confirmedBookingResult.booking.addressLine},{' '}
                      {confirmedBookingResult.booking.zoneLabel},{' '}
                      {confirmedBookingResult.booking.cityName} — PIN{' '}
                      <span className="font-mono">{confirmedBookingResult.booking.pinCode}</span>
                    </div>
                    {confirmedBookingResult.booking.customerNotes && (
                      <div>
                        <strong>Notes / Requirements:</strong>{' '}
                        {confirmedBookingResult.booking.customerNotes}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const snap =
                      confirmedBookingResult.booking.priceSnapshot ||
                      confirmedBookingResult.booking.quoteSnapshot;
                    return (
                      <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="font-bold text-slate-900">
                          Locked Server Price Snapshot
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Base Package ({snap.pricingSource})</span>
                          <span className="font-mono tabular-nums">
                            {formatPaiseToInr(snap.baseServicePaise)}
                          </span>
                        </div>
                        {snap.addonsTotalPaise > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Add-ons</span>
                            <span className="font-mono tabular-nums">
                              {formatPaiseToInr(snap.addonsTotalPaise)}
                            </span>
                          </div>
                        )}
                        {snap.discountPaise > 0 && (
                          <div className="flex justify-between text-teal-700 font-semibold">
                            <span>Coupon ({snap.couponCode})</span>
                            <span className="font-mono tabular-nums">
                              -{formatPaiseToInr(snap.discountPaise)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>GST ({snap.taxRatePercent}%)</span>
                          <span className="font-mono tabular-nums">
                            {formatPaiseToInr(snap.taxPaise)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                          <span>Final Locked Total</span>
                          <span className="font-mono tabular-nums text-teal-700">
                            {formatPaiseToInr(snap.finalTotalPaise)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={buildWhatsAppLink(
                      '9648175639',
                      `Hello TankmanPro Support, I have just booked a service appointment.\nBooking Reference: ${confirmedBookingResult.booking.bookingCode}\nCustomer Name: ${confirmedBookingResult.booking.customerName}\nService: ${confirmedBookingResult.booking.serviceTitle} (${confirmedBookingResult.booking.variantName})\nDate: ${confirmedBookingResult.booking.preferredDate} (${confirmedBookingResult.booking.preferredSlot})\nPlease share confirmation and technician assignment details.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Get Updates on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onNavigate('/account/bookings')}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Track Live Booking Status (/account/bookings)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedBookingResult(null);
                      setConfirmedDemoBookingId(null);
                      setCheckoutIdempotencyKey(
                        `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
                      );
                      onNavigate('/services');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Book Another Service
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form
                  onSubmit={handleCreateAuthoritativeBooking}
                  className="lg:col-span-7 space-y-5"
                >
                  {/* Card 1: Selected Service & Variant Selector */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                          1. Selected Service
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-950 mt-0.5">
                          {currentService.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-teal-700" />
                        <span>{pinLookup.city?.name || 'Area'} ({pinLookup.pinCode})</span>
                      </div>
                    </div>

                    {/* Variant Pills (Quick 1-Click Selection) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Select Tank Size / Package:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentService.variants
                          .filter((v) => v.active)
                          .map((v) => {
                            const isSelected = bookingDraft.variantId === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  setBookingDraft((prev) => ({
                                    ...prev,
                                    variantId: v.id,
                                  }))
                                }
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-teal-700 bg-teal-50/70 text-teal-950 ring-2 ring-teal-700 shadow-2xs'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs">{v.name}</span>
                                  {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                  <span>⏱ {v.durationMinutes} mins service</span>
                                  <span className="font-mono font-bold text-teal-800 text-xs">
                                    {formatPaiseToInr(v.basePricePaise)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Vendor Offer Mode (if applicable in active city) */}
                    {pinLookup.serviceable &&
                      currentPricingMode === 'vendor_offer' &&
                      currentVendorOffers.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="text-xs font-bold text-slate-700 mb-2">
                            Select Verified Specialist Crew:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentVendorOffers.map((offer) => {
                              const isChosen =
                                bookingDraft.selectedVendorUid === offer.vendorUid;
                              return (
                                <button
                                  key={offer.vendorUid}
                                  type="button"
                                  onClick={() =>
                                    setBookingDraft((prev) => ({
                                      ...prev,
                                      selectedVendorUid: offer.vendorUid,
                                    }))
                                  }
                                  className={`text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                                    isChosen
                                      ? 'border-teal-700 bg-teal-50/60 text-slate-950 ring-1 ring-teal-700'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span>{offer.vendorDisplayName}</span>
                                    <span className="font-mono text-teal-700">
                                      {formatPaiseToInr(offer.amountPaise)}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {offer.businessName} · {offer.experienceYearsLabel}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Card 2: Choose Date & Time Slot */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div>
                      <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                        2. Service Schedule
                      </div>
                      <h2 className="text-base font-extrabold text-slate-950 mt-0.5">
                        When should our crew arrive?
                      </h2>
                    </div>

                    {/* Quick Date Pills */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Select Preferred Day:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Today', date: getOffsetDateIso(0) },
                          { label: 'Tomorrow', date: getOffsetDateIso(1) },
                          { label: 'Day After', date: getOffsetDateIso(2) },
                          { label: '+3 Days', date: getOffsetDateIso(3) },
                        ].map((d) => (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => setScheduledDate(d.date)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              scheduledDate === d.date
                                ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div>{d.label}</div>
                            <div
                              className={`text-[10px] font-mono font-normal mt-0.5 ${
                                scheduledDate === d.date ? 'text-teal-100' : 'text-slate-500'
                              }`}
                            >
                              {d.date.slice(5)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Window Slots */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Select Preferred Time Slot:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(slotEvaluations.length > 0
                          ? slotEvaluations
                          : STANDARD_TIME_WINDOWS.map((tw) => ({
                              timeWindow: tw,
                              available: true,
                              availableCrewCount: 1,
                              eligibleVendorUids: [],
                              reason: 'Available',
                            }))
                        ).map((slotObj) => {
                          const isSelected = selectedTimeWindow === slotObj.timeWindow;
                          return (
                            <button
                              key={slotObj.timeWindow}
                              type="button"
                              onClick={() => setSelectedTimeWindow(slotObj.timeWindow)}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-bold ring-2 ring-teal-700 shadow-2xs'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white font-medium'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5 text-xs">
                                <Clock
                                  className={`w-3.5 h-3.5 ${
                                    isSelected ? 'text-teal-700' : 'text-slate-400'
                                  }`}
                                />
                                <span>{slotObj.timeWindow}</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                                Available Slot ✅
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Contact & Address Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div>
                      <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                        3. Contact &amp; Service Location
                      </div>
                      <h2 className="text-base font-extrabold text-slate-950 mt-0.5">
                        Where should we reach?
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="chk-name"
                          className="block text-xs font-bold text-slate-800 mb-1"
                        >
                          Customer Full Name *
                        </label>
                        <input
                          id="chk-name"
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="chk-phone"
                          className="block text-xs font-bold text-slate-800 mb-1"
                        >
                          WhatsApp / Mobile Number *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">
                            +91
                          </span>
                          <input
                            id="chk-phone"
                            type="tel"
                            required
                            inputMode="numeric"
                            maxLength={10}
                            value={customerPhone}
                            onChange={(e) =>
                              setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                            }
                            placeholder="9876543210"
                            className="w-full pl-12 pr-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-bold"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                          <WhatsAppIcon className="w-3 h-3 shrink-0" />
                          <span>Booking confirmation &amp; live tracking link will be sent here</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="chk-address"
                        className="block text-xs font-bold text-slate-800 mb-1"
                      >
                        House / Flat No., Society &amp; Street Address *
                      </label>
                      <input
                        id="chk-address"
                        type="text"
                        required
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="e.g. Flat 402, Block B, Royal Palms, Civil Lines"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="chk-landmark"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Landmark / Nearby Spot (Optional)
                        </label>
                        <input
                          id="chk-landmark"
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Water Tank / Metro Pillar 42"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="chk-notes"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Special Instructions for Crew (Optional)
                        </label>
                        <input
                          id="chk-notes"
                          type="text"
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="e.g. Rooftop ladder access, gate code"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Payment Method */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div>
                      <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                        4. Payment Method
                      </div>
                      <h2 className="text-base font-extrabold text-slate-950 mt-0.5">
                        How would you like to pay?
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Pay after service */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pay_after_service')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                          paymentMethod === 'pay_after_service'
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                          ⭐ Recommended
                        </span>
                        <div className="font-extrabold text-xs text-slate-950 flex items-center gap-1.5">
                          <span>💵 Pay After Service</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                          Pay via UPI (GPay/PhonePe) or Cash on site once tank is cleaned &amp; inspected.
                        </div>
                      </button>

                      {/* Option 2: Razorpay Online */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('razorpay_online')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          paymentMethod === 'razorpay_online'
                            ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-700 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-950 flex items-center gap-1.5">
                          <span>💳 Pay Online Prepaid</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-100 text-teal-800">
                            Instant
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                          Pay securely via UPI (GPay/PhonePe), Credit/Debit Cards, or NetBanking.
                        </div>
                      </button>
                    </div>

                    {checkoutError && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!activeQuote.bookable || isSubmittingBooking}
                      className="w-full py-4 px-5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        {isSubmittingBooking
                          ? 'Booking Your Appointment...'
                          : paymentMethod === 'razorpay_online'
                          ? `Pay Online Now — ${formatPaiseToInr(activeQuote.finalTotalPaise)}`
                          : `Confirm Booking Now — ${formatPaiseToInr(activeQuote.finalTotalPaise)} (Pay Later)`}
                      </span>
                    </button>
                    <div className="text-center text-[11px] text-slate-500">
                      🔒 Zero cancellation fee · 7-Day TankmanPro Quality Guarantee Included
                    </div>
                  </div>
                </form>

                {/* Right Column: Clean Order Summary (like Urban Company / Swiggy) */}
                <aside className="lg:col-span-5 space-y-4 sticky top-20">
                  {/* Coupon Box */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-700" />
                        <span>Offers &amp; Promo Codes</span>
                      </div>
                      <span className="text-[11px] text-teal-700 font-semibold">10% OFF Available</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="coupon-input"
                        type="text"
                        value={bookingDraft.couponCode}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({
                            ...prev,
                            couponCode: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="Enter CLEAN10"
                        className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setBookingDraft((prev) => ({ ...prev, couponCode: 'CLEAN10' }))
                        }
                        className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl cursor-pointer border border-teal-200 transition-colors"
                      >
                        Apply CLEAN10
                      </button>
                    </div>

                    {activeQuote.couponMessage && (
                      <div
                        className={`text-xs font-semibold ${
                          activeQuote.couponValid ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {activeQuote.couponMessage}
                      </div>
                    )}
                  </div>

                  {/* Bill Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
                    <h3 className="text-sm font-extrabold text-slate-950 border-b border-slate-100 pb-2">
                      Bill Details
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>
                          {activeQuote.serviceTitle} ({activeQuote.variantName})
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatPaiseToInr(activeQuote.baseServicePaise)}
                        </span>
                      </div>

                      {activeQuote.addonsTotalPaise > 0 && (
                        <div className="flex justify-between">
                          <span>Add-ons</span>
                          <span className="font-mono tabular-nums">
                            {formatPaiseToInr(activeQuote.addonsTotalPaise)}
                          </span>
                        </div>
                      )}

                      {activeQuote.discountPaise > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Coupon Discount ({activeQuote.couponCode})</span>
                          <span className="font-mono tabular-nums">
                            -{formatPaiseToInr(activeQuote.discountPaise)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-500">
                        <span>Mechanized Sanitization Kit</span>
                        <span className="text-emerald-700 font-bold uppercase text-[10px]">
                          FREE
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-500">
                        <span>GST / Taxes ({activeQuote.taxRatePercent}%)</span>
                        <span className="font-mono tabular-nums">
                          {formatPaiseToInr(activeQuote.taxPaise)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-950">
                      <span>Total Amount Payable</span>
                      <span className="font-mono text-base text-teal-800 tabular-nums">
                        {formatPaiseToInr(activeQuote.finalTotalPaise)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-teal-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-700" />
                        <span>7-Day Service Guarantee Included</span>
                      </div>
                      <p className="text-[11px] text-teal-800">
                        If you are not 100% satisfied with the cleanliness, we re-clean free of cost.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        )}

        {/* ======================== 5. SERVICE AREAS (`/service-areas`) ======================== */}
        {internalPath === '/service-areas' && (
          <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                City &amp; PIN Coverage Directory · Demo Seed Records
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Serviceable Cities &amp; 6-Digit PIN Codes
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                TankmanPro validates coverage at the 6-digit Indian PIN code level. Select any
                active PIN below to browse services and effective prices for that area.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_CITIES.map((city) => {
                const areas = DEMO_SERVICE_AREAS.filter((a) => a.cityId === city.id);
                return (
                  <div
                    key={city.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <div>
                      <div className="text-xs text-slate-500">{city.state}</div>
                      <h2 className="text-xl font-bold text-slate-900">{city.name}</h2>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          className="py-3.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              PIN {area.pinCode}
                            </div>
                            <div className="text-xs text-slate-600">{area.zoneLabel}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {area.neighbourhoods.join(' · ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              applyPinLookup(area.pinCode);
                              onNavigate('/services');
                            }}
                            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                          >
                            View {area.pinCode}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================== 6. HOW IT WORKS (`/how-it-works`) ======================== */}
        {internalPath === '/how-it-works' && (
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div>
              <div className="text-xs text-slate-500 mb-1">Standard Operating Procedure</div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                How TankmanPro Home Services Work
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: '01. Area & PIN Verification',
                  desc: 'Enter your 6-digit Indian PIN code. Our backend resolves your PIN to an active canonical city and service zone before displaying prices.',
                },
                {
                  title: '02. Transparent Pricing Resolution',
                  desc: 'Depending on the service configuration in your city, you either see a single City-Fixed price or select from eligible partner offers.',
                },
                {
                  title: '03. Mechanized Equipment & Checklist',
                  desc: 'For water tank cleaning, crews use 6-stage dewatering, sludge vacuuming, high-pressure rotary jets, and UV-C irradiation.',
                },
                {
                  title: '04. Verified Completion & Receipts',
                  desc: 'Track your booking status from assignment to completion, download your itemized receipt, and rate the service once finished.',
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-2"
                >
                  <h2 className="text-base font-bold text-slate-900">{step.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================== 7. ABOUT (`/about`) ======================== */}
        {internalPath === '/about' && (
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="text-xs text-slate-500">About TankmanPro</div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Structured Home Hygiene, Repair &amp; Aesthetic Care
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              TankmanPro connects households with area-verified service specialists for mechanized
              overhead and underground water tank cleaning, split/window AC servicing, bathroom and
              kitchen deep cleaning, sofa/mattress shampooing, vehicle wash, and Beedare at-home
              aesthetic treatments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-teal-700 mb-2" />
                <h2 className="text-sm font-bold text-slate-900">No Hidden Charges</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Every booking locks an immutable server-calculated price snapshot before checkout.
                </p>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <SlidersHorizontal className="w-5 h-5 text-teal-700 mb-2" />
                <h2 className="text-sm font-bold text-slate-900">Dual Pricing Modes</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Supports both City-Fixed auto-assignment and customer-selected Vendor Offers.
                </p>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <Clock className="w-5 h-5 text-teal-700 mb-2" />
                <h2 className="text-sm font-bold text-slate-900">Time-Slot Holds</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Server-side slot capacity checks prevent overbooking during peak hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================== 8. HELP & FAQ (`/help`) ======================== */}
        {internalPath === '/help' && (
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
              <HelpCircle className="w-4 h-4" />
              <span>Customer Support &amp; Help Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h1>
            <div className="space-y-3">
              {[
                {
                  q: 'How do I check if my neighbourhood is covered?',
                  a: 'Enter your 6-digit PIN code in the top bar or homepage availability checker. Active demo PINs include 110001, 110016, 110075 (New Delhi), 242001, 242226 (Shahjahanpur), and 208001, 208002 (Kanpur).',
                },
                {
                  q: 'What happens if my PIN code is not covered yet?',
                  a: 'We display an honest unavailable state and invite you to join the opt-in area waitlist. We never collect payment for an unserviceable PIN code.',
                },
                {
                  q: 'Can I reschedule or cancel my booking?',
                  a: 'Bookings can be rescheduled or cancelled free of charge up to 4 hours prior to the scheduled slot, subject to Admin-configured cancellation policy.',
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5"
                >
                  <h2 className="text-sm font-bold text-slate-900">{item.q}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="px-4 py-2.5 bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Contact Customer Support
              </button>
            </div>
          </div>
        )}

        {/* ======================== 9. CONTACT (`/contact`) ======================== */}
        {internalPath === '/contact' && (
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
                <PhoneCall className="w-4 h-4" />
                <span>Support Desk</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Contact TankmanPro Support
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Have a question about service scope, water tank capacity, or an existing booking?
                Send us a message and our operations team will assist you.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-teal-700 shrink-0" />
                  <div>
                    <strong>Customer Support:</strong>{' '}
                    <a href="tel:+919648175639" className="font-semibold text-teal-700 hover:underline">
                      +91 96481 75639
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong>WhatsApp Helpline:</strong>{' '}
                    <a
                      href="https://wa.me/919648175639"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:underline"
                    >
                      +91 96481 75639
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <div>
                    <strong>Official Instagram:</strong>{' '}
                    <a
                      href="https://www.instagram.com/tankmanpro.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-pink-600 hover:underline"
                    >
                      @tankmanpro.in
                    </a>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <strong>Support Email:</strong> support@tankmanpro.com
                </div>
                <div>
                  <strong>Operating Hours:</strong> 08:00 AM – 08:00 PM IST (Mon–Sun)
                </div>
              </div>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="cnt-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="cnt-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="cnt-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Email or 10-Digit Mobile
                </label>
                <input
                  id="cnt-email"
                  type="text"
                  value={contactEmailOrPhone}
                  onChange={(e) => setContactEmailOrPhone(e.target.value)}
                  placeholder="you@example.com or 9810012345"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="cnt-msg"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  How can we help?
                </label>
                <textarea
                  id="cnt-msg"
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your service question or tank/appliance details..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              {contactFeedback && (
                <div
                  role="status"
                  className={`text-xs font-medium ${
                    contactFeedback.type === 'success' ? 'text-teal-700' : 'text-red-700'
                  }`}
                >
                  {contactFeedback.text}
                </div>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Send Support Inquiry
              </button>
            </form>
          </div>
        )}

        {/* ======================== 10. CUSTOMER AUTH (`/login`, `/register`, `/forgot-password`) ======================== */}
        {(internalPath === '/login' ||
          internalPath === '/register' ||
          internalPath === '/forgot-password') && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
                <User className="w-4 h-4" />
                <span>Customer Account Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {internalPath === '/register'
                  ? 'Create Customer Account'
                  : internalPath === '/forgot-password'
                    ? 'Reset Customer Password'
                    : 'Customer Sign In'}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage your saved addresses, view service bookings, and download invoices. Public
                registration creates a standard Customer profile only.
              </p>

              {authFeedback && (
                <div
                  role="status"
                  className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-slate-800"
                >
                  {authFeedback}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!authEmail.trim()) {
                    setAuthFeedback('Please enter a valid email address.');
                    return;
                  }
                  setAuthFeedback(
                    'Phase 1 Preview: Firebase Authentication connects in Phase 2. You can inspect the Customer Account shell at /account.'
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="cust-auth-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="cust-auth-email"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                {internalPath !== '/forgot-password' && (
                  <div>
                    <label
                      htmlFor="cust-auth-pass"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="cust-auth-pass"
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {internalPath === '/register'
                    ? 'Register Customer Account'
                    : internalPath === '/forgot-password'
                      ? 'Send Password Reset Link'
                      : 'Sign In'}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-medium">
                {internalPath !== '/login' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                )}
                {internalPath === '/login' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate('/register')}
                      className="hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/forgot-password')}
                      className="hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================== 11. CUSTOMER ACCOUNT (`/account*`) ======================== */}
        {internalPath.startsWith('/account') && (
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 mb-1">
                  Customer Booking &amp; Live Dispatch Tracker
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  My Bookings, Dispatch Timeline &amp; Receipts
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { path: '/account', label: 'Overview & Bookings' },
                  { path: '/account/bookings', label: 'My Bookings' },
                  { path: '/account/addresses', label: 'Saved Addresses' },
                  { path: '/account/reviews', label: 'My Reviews' },
                ].map((tab) => (
                  <button
                    key={tab.path}
                    type="button"
                    onClick={() => onNavigate(tab.path)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                      internalPath === tab.path
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lookup Bar by 10-Digit Mobile or Booking Code */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadCustomerBookings(lookupPhoneInput, lookupCodeInput);
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div>
                  <label
                    htmlFor="cust-lookup-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Lookup by 10-Digit Mobile Number
                  </label>
                  <input
                    id="cust-lookup-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={lookupPhoneInput}
                    onChange={(e) =>
                      setLookupPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="e.g. 9810044210"
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-lookup-code"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Or Booking Reference Code
                  </label>
                  <input
                    id="cust-lookup-code"
                    type="text"
                    value={lookupCodeInput}
                    onChange={(e) => setLookupCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. TMP-2026-1001"
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isLoadingCustomerBookings ? 'Loading...' : 'Find Bookings'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  + New Booking
                </button>
              </div>
            </form>

            {accountActionFeedback && (
              <div
                role="status"
                className={`p-3.5 rounded-xl border text-xs font-medium ${
                  accountActionFeedback.type === 'success'
                    ? 'bg-teal-50 border-teal-200 text-teal-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {accountActionFeedback.text}
              </div>
            )}

            {/* Bookings List */}
            {customerBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <div className="text-sm font-bold text-slate-900">
                  No Recorded Bookings Found for Current Filter
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Create a booking on the storefront or enter a registered mobile number (such as{' '}
                  <span className="font-mono font-semibold">9810044210</span>) or booking reference
                  (such as <span className="font-mono font-semibold">TMP-2026-1001</span>) above.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLookupPhoneInput('9810044210');
                      setLookupCodeInput('');
                      loadCustomerBookings('9810044210', '');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Load Demo Customer (9810044210)
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/services')}
                    className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Browse Services
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {customerBookings.map(({ booking, assignedVendorSummary, events }) => {
                  const canCancel =
                    booking.status === 'pending_admin_assignment' ||
                    booking.status === 'assigned_to_vendor' ||
                    booking.status === 'vendor_accepted';

                  return (
                    <div
                      key={booking.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-mono">
                            {booking.bookingCode} · {booking.cityName} (PIN {booking.pinCode}) ·{' '}
                            {booking.zoneLabel}
                          </div>
                          <h2 className="text-lg font-extrabold text-slate-900">
                            {booking.serviceTitle} — {booking.variantName}
                          </h2>
                          <div className="text-xs text-slate-600">
                            Scheduled:{' '}
                            <span className="font-mono font-semibold">{booking.scheduledDate}</span>{' '}
                            · {booking.timeWindow} · Address: {booking.addressLine}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 space-y-1">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Job Status · Payment Status
                          </div>
                          <div className="text-xs font-bold font-mono text-slate-900">
                            {booking.status} ·{' '}
                            <span className="text-teal-700">{booking.paymentStatus}</span>
                          </div>
                          <div className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                            {formatPaiseToInr(
                              (booking.priceSnapshot || booking.quoteSnapshot).finalTotalPaise
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Assigned Specialist Card */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="font-bold text-slate-900">
                            Assigned Partner Specialist
                          </div>
                          {assignedVendorSummary ? (
                            <>
                              <div className="text-slate-800 font-semibold">
                                {assignedVendorSummary.displayName} (
                                <span className="font-mono">
                                  {assignedVendorSummary.vendorCode || assignedVendorSummary.uid}
                                </span>
                                )
                              </div>
                              <div className="text-slate-600">
                                {assignedVendorSummary.businessName} ·{' '}
                                {assignedVendorSummary.experienceYearsLabel}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Dispatch Mode:{' '}
                                <span className="font-mono">{booking.assignmentMode || 'auto_score'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-amber-900">
                              Pending Admin Review / Specialist Assignment ({booking.subStatus})
                            </div>
                          )}
                        </div>

                        {/* Price Snapshot Card */}
                        {(() => {
                          const snap = booking.priceSnapshot || booking.quoteSnapshot;
                          return (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <div className="font-bold text-slate-900">
                                Immutable Price Snapshot ({snap.pricingSource})
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Base Service</span>
                                <span className="font-mono tabular-nums">
                                  {formatPaiseToInr(snap.baseServicePaise)}
                                </span>
                              </div>
                              {snap.addonsTotalPaise > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Add-ons</span>
                                  <span className="font-mono tabular-nums">
                                    {formatPaiseToInr(snap.addonsTotalPaise)}
                                  </span>
                                </div>
                              )}
                              {snap.discountPaise > 0 && (
                                <div className="flex justify-between text-teal-700 font-semibold">
                                  <span>Discount ({snap.couponCode})</span>
                                  <span className="font-mono tabular-nums">
                                    -{formatPaiseToInr(snap.discountPaise)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                                <span>Final Total</span>
                                <span className="font-mono tabular-nums">
                                  {formatPaiseToInr(snap.finalTotalPaise)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Audit Event Timeline */}
                      {events.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <div className="text-xs font-bold text-slate-800">
                            Live Dispatch &amp; Job Timeline
                          </div>
                          <div className="space-y-1 text-xs text-slate-600">
                            {events.slice(0, 4).map((ev) => (
                              <div key={ev.id} className="flex items-baseline gap-2">
                                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                                  {ev.createdAtIso.slice(11, 16)}
                                </span>
                                <span className="font-semibold text-slate-800">{ev.toStatus}:</span>
                                <span>{ev.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 1-Click WhatsApp Live Assistance & Actions Toolbar */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={buildWhatsAppLink(
                              '9648175639',
                              `Hello TankmanPro Support, I need assistance regarding my booking #${booking.bookingCode}.\nCustomer: ${booking.customerName}\nService: ${booking.serviceTitle}\nSlot: ${booking.scheduledDate} (${booking.timeWindow})`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>WhatsApp Support Desk</span>
                          </a>

                          {assignedVendorSummary?.displayName && (
                            <a
                              href={buildWhatsAppLink(
                                '9648175639',
                                `Hello TankmanPro Support, please share an arrival status update for assigned technician "${assignedVendorSummary.displayName}" regarding booking #${booking.bookingCode}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Crew Updates on WhatsApp</span>
                            </a>
                          )}
                        </div>

                        {/* Customer Cancellation Control */}
                        {canCancel && (
                          <div>
                            {cancellingBookingId === booking.id ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={cancelReasonInput}
                                  onChange={(e) => setCancelReasonInput(e.target.value)}
                                  placeholder="Reason for cancellation (e.g. Rescheduling next week)"
                                  className="min-w-[200px] px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCancelCustomerBooking(booking.id)}
                                  className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Confirm Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingBookingId(null);
                                    setCancelReasonInput('');
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Keep Booking
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCancellingBookingId(booking.id)}
                                className="px-3.5 py-1.5 border border-red-200 hover:border-red-400 text-red-700 text-xs font-semibold rounded-lg cursor-pointer"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================== 12. POLICIES (`/privacy`, `/terms`, `/cancellation-refund-policy`) ======================== */}
        {(internalPath === '/privacy' ||
          internalPath === '/terms' ||
          internalPath === '/cancellation-refund-policy') && (
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 space-y-5">
            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
              <FileText className="w-4 h-4" />
              <span>Admin-Configurable Policy Document</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {internalPath === '/privacy'
                ? 'Privacy & Data Protection Policy'
                : internalPath === '/terms'
                  ? 'Terms of Service'
                  : 'Cancellation & Refund Policy'}
            </h1>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>1. Scope &amp; Transparency:</strong> TankmanPro collects only the customer
                contact details, service address, and 6-digit PIN code required to verify area
                coverage and dispatch an assigned technician.
              </p>
              <p>
                <strong>2. Role &amp; Data Isolation:</strong> Customer contact and address details
                are shared exclusively with the single assigned vendor crew handling that booking,
                and never exposed to unassigned vendors.
              </p>
              <p>
                <strong>3. Cancellations &amp; Refunds:</strong> Customers may cancel or reschedule
                within the Admin-configured free window prior to the slot. Online payment refunds
                are initiated only by authorized Admins via verified Razorpay gateway operations.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Quiet Customer Storefront Footer — ZERO Admin or Vendor Portal Links */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-16">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-200 text-xs">
            <div className="space-y-3">
              <div className="text-base font-extrabold text-slate-950 font-display">TankmanPro</div>
              <p className="text-slate-600 leading-relaxed">
                Doorstep home services for mechanized water tank cleaning, AC service, bathroom &amp;
                kitchen deep cleaning, sofa shampooing, car wash, and Beedare skin aesthetics.
              </p>
              <div className="pt-2 space-y-2 border-t border-slate-200/80">
                <a
                  href="tel:+919648175639"
                  className="flex items-center gap-2 text-slate-700 hover:text-teal-700 font-medium"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Call: <strong>+91 96481 75639</strong></span>
                </a>
                <a
                  href="https://wa.me/919648175639"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 font-medium"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>WhatsApp: <strong>+91 96481 75639</strong></span>
                </a>
                <a
                  href="https://www.instagram.com/tankmanpro.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-700 hover:text-pink-800 font-semibold"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                  <span>Instagram: <strong>@tankmanpro.in</strong></span>
                </a>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3">Popular Services</div>
              <ul className="space-y-2 text-slate-600">
                {DEMO_SERVICES.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <a
                      href={`/services/${s.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/services/${s.slug}`);
                      }}
                      className="hover:text-slate-900"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3">Customer Links</div>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="/service-areas"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/service-areas');
                    }}
                    className="hover:text-slate-900"
                  >
                    Serviceable Cities &amp; PINs
                  </a>
                </li>
                <li>
                  <a
                    href="/how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/how-it-works');
                    }}
                    className="hover:text-slate-900"
                  >
                    How TankmanPro Works
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/about');
                    }}
                    className="hover:text-slate-900"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/help"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/help');
                    }}
                    className="hover:text-slate-900"
                  >
                    Help &amp; FAQs
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/contact');
                    }}
                    className="hover:text-slate-900"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-3">Policies</div>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/privacy');
                    }}
                    className="hover:text-slate-900"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/terms');
                    }}
                    className="hover:text-slate-900"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/cancellation-refund-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/cancellation-refund-policy');
                    }}
                    className="hover:text-slate-900"
                  >
                    Cancellation &amp; Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>© {new Date().getFullYear()} TankmanPro India. All prices in INR (₹).</div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/tankmanpro.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-pink-700 hover:text-pink-900 font-semibold transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Follow @tankmanpro.in</span>
              </a>
              <span>·</span>
              <div>New Delhi · Shahjahanpur · Kanpur</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating 1-Click WhatsApp Support Widget */}
      <aside
        aria-label="Instant WhatsApp Support"
        className="fixed bottom-5 right-5 z-40"
      >
        <a
          href={buildWhatsAppLink(
            '9648175639',
            'Hello TankmanPro Support, I would like to inquire about professional mechanized water tank cleaning services.'
          )}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with TankmanPro on WhatsApp (+91 96481 75639)"
          className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Help (+91 96481 75639)</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      </aside>
    </div>
  );
};
