/**
 * TankmanPro — Core Domain Models & Type Contracts
 * All monetary amounts are stored and calculated in integer paise (INR: 100 paise = ₹1).
 */

export type PortalKind = 'customer' | 'admin' | 'vendor';

export type UserRole = 'customer' | 'admin' | 'vendor';

export type PricingMode = 'city_fixed' | 'vendor_offer';

export type PublishStatus = 'published' | 'draft' | 'archived';

export type VendorStatus =
  | 'active'
  | 'pending'
  | 'pending_verification'
  | 'suspended'
  | 'rejected';

export type AssignmentStatus =
  | 'unassigned'
  | 'assigned'
  | 'accepted'
  | 'rejected'
  | 'reassignment_required';

export type JobStatus =
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type AssignmentPolicy =
  | 'auto_score'
  | 'auto_lowest_load'
  | 'round_robin'
  | 'manual_admin'
  | 'manual';

export type PaymentMethod = 'pay_after_service' | 'razorpay_online' | 'online_razorpay';

export type BookingStatus =
  | 'draft'
  | 'requested'
  | 'confirmed'
  | 'pending_admin_assignment'
  | 'assigned_to_vendor'
  | 'vendor_accepted'
  | 'vendor_rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type BookingSubStatus =
  | 'en_route'
  | 'arrived'
  | 'working'
  | 'awaiting_vendor_acceptance'
  | 'manual_admin_hold'
  | 'unassigned_no_eligible_vendor'
  | 'customer_cancelled'
  | 'unable_to_complete'
  | 'reassignment_requested'
  | null;

export type PaymentStatus =
  | 'unpaid'
  | 'pay_after_service'
  | 'pending'
  | 'created'
  | 'authorized'
  | 'paid'
  | 'captured'
  | 'failed'
  | 'refund_pending'
  | 'refunded'
  | 'partial_refund';

export interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  supportPhone?: string;
  active: boolean;
  isDemo: boolean;
  updatedAtIso?: string;
}

export interface ServiceArea {
  id: string;
  cityId: string;
  cityName?: string;
  state?: string;
  pinCode: string; // 6-digit Indian PIN code
  zoneLabel: string;
  neighbourhoods: string[];
  supportedServiceIds?: string[];
  assignedVendorUids?: string[];
  conflictFlag?: boolean;
  conflictNotes?: string;
  active: boolean;
  isDemo: boolean;
  updatedAtIso?: string;
}

export type CategoryIconKey =
  | 'water-tank'
  | 'bathroom'
  | 'kitchen'
  | 'ac-service'
  | 'sofa-mattress'
  | 'vehicle-wash'
  | 'fan-appliances'
  | 'aesthetics'
  | 'appliance-repair'
  | 'plumbing';

export interface Category {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: CategoryIconKey;
  imageUrl: string;
  sortOrder: number;
  status: PublishStatus;
  isDemo: boolean;
}

export interface ServiceVariant {
  id: string;
  serviceId: string;
  name: string;
  scopeSummary: string;
  durationMinutes: number;
  basePricePaise: number;
  regularPricePaise?: number;
  imageUrl?: string;
  active: boolean;
}

export interface ServiceAddon {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl?: string;
  required: boolean;
  maxQuantity: number;
  active: boolean;
}

export interface ServiceQuestion {
  id: string;
  label: string;
  helpText?: string;
  options: string[];
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceBookingRequirements {
  requireTankCapacity: boolean;
  requireUnitCount: boolean;
  allowCustomerPhotos: boolean;
  safetyChecklistRequired: boolean;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  illustrationKey:
    | 'water-tank'
    | 'bathroom'
    | 'kitchen'
    | 'ac-service'
    | 'sofa-mattress'
    | 'vehicle-wash'
    | 'fan-appliances'
    | 'aesthetics'
    | 'appliance-repair'
    | 'plumbing'
    | 'hero';
  imageUrl: string;
  galleryUrls?: string[];
  durationMinutes: number;
  basePricePaise: number;
  regularPricePaise?: number;
  defaultPricingMode: PricingMode;
  cityModeOverrides?: Record<string, PricingMode>;
  inclusions: string[];
  exclusions: string[];
  preparationInstructions: string[];
  warrantySummary?: string;
  cancellationPolicySummary: string;
  variants: ServiceVariant[];
  addons: ServiceAddon[];
  questions: ServiceQuestion[];
  faqs: ServiceFAQ[];
  supportedCityIds: string[];
  bookingRequirements?: ServiceBookingRequirements;
  status: PublishStatus;
  isDemo: boolean;
  updatedAtIso?: string;
}

export interface Vendor {
  uid: string;
  vendorCode?: string;
  displayName: string;
  businessName: string;
  phone: string;
  email?: string;
  status: VendorStatus;
  isAvailable?: boolean;
  supportedCityIds: string[];
  supportedAreaPins: string[];
  supportedServiceIds: string[];
  workingDays: string[];
  workingHoursLabel?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  maxActiveJobs: number;
  activeAssignedJobs: number;
  assignmentPriority: number;
  slaScore?: number;
  completionRatePercent?: number;
  experienceYearsLabel: string;
  commissionPercent?: number;
  kycNotes?: string;
  password?: string;
  passwordResetRequestedAtIso?: string;
  createdAtIso?: string;
  updatedAtIso?: string;
  isDemo: boolean;
}

export interface PriceOverride {
  id: string;
  serviceId: string;
  variantId: string;
  cityId: string;
  vendorUid?: string; // Present only for vendor-specific overrides
  amountPaise: number;
  currency: 'INR';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  active: boolean;
  updatedByUid: string;
  updatedAtIso: string;
  isDemo: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  internalName: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (e.g. 10 for 10%) or fixed paise (e.g. 15000 for ₹150)
  maxDiscountCapPaise?: number;
  minOrderSubtotalPaise: number;
  validFromIso: string;
  validUntilIso: string;
  applicableCityIds?: string[];
  applicableServiceIds?: string[];
  totalRedemptionLimit?: number;
  currentRedemptions: number;
  perCustomerLimit: number;
  newCustomerOnly: boolean;
  active: boolean;
  isDemo: boolean;
}

export interface VendorOfferOption {
  vendorUid: string;
  vendorDisplayName: string;
  businessName: string;
  experienceYearsLabel: string;
  amountPaise: number;
  pricingSource: 'vendor_override';
  availableSlots: string[];
  isDemo: boolean;
}

export interface PriceResolutionResult {
  bookable: boolean;
  pricingMode: PricingMode;
  unitPricePaise: number | null;
  currency: 'INR';
  pricingSource: 'vendor_override' | 'city_override' | 'base_price' | 'unavailable';
  reason?: string;
}

export interface QuoteRequestPayload {
  pinCode: string;
  serviceId: string;
  variantId: string;
  addonQuantities: Record<string, number>;
  selectedVendorUid?: string;
  couponCode?: string;
}

export interface QuoteBreakdown {
  bookable: boolean;
  reason?: string;
  cityId: string;
  cityName: string;
  pinCode: string;
  zoneLabel: string;
  pricingMode: PricingMode;
  pricingSource: 'vendor_override' | 'city_override' | 'base_price' | 'unavailable';
  serviceId: string;
  serviceTitle: string;
  variantId: string;
  variantName: string;
  selectedVendorUid?: string;
  selectedVendorName?: string;
  baseServicePaise: number;
  addons: Array<{
    addonId: string;
    name: string;
    quantity: number;
    unitPaise: number;
    lineTotalPaise: number;
  }>;
  addonsTotalPaise: number;
  subtotalPaise: number;
  couponCode?: string;
  couponValid?: boolean;
  couponMessage?: string;
  discountPaise: number;
  taxPaise: number;
  taxRatePercent: number;
  finalTotalPaise: number;
  currency: 'INR';
  quoteExpiresAtIso: string;
  isDemoData: boolean;
}

export interface PinLookupResult {
  validFormat: boolean;
  serviceable: boolean;
  pinCode: string;
  city?: City;
  serviceArea?: ServiceArea;
  message: string;
}

export interface WaitlistEntry {
  id: string;
  pinCode: string;
  customerName: string;
  phoneOrEmail: string;
  requestedServiceSlug?: string;
  consentGiven: boolean;
  createdAtIso: string;
}

export interface BookingAddonSelection {
  addonId: string;
  name: string;
  quantity: number;
  unitPaise?: number;
  lineTotalPaise?: number;
  unitPricePaise?: number;
  totalPaise?: number;
}

export interface BookingPriceSnapshot {
  pricingMode: PricingMode;
  pricingSource: 'vendor_override' | 'city_override' | 'base_price' | 'unavailable';
  baseServicePaise: number;
  addonsTotalPaise: number;
  subtotalPaise: number;
  couponCode?: string;
  discountPaise: number;
  taxRatePercent: number;
  taxPaise: number;
  finalTotalPaise: number;
  currency: 'INR';
  lockedAtIso?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  bookingCode?: string;
  idempotencyKey?: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  cityId: string;
  cityName: string;
  pinCode: string;
  zoneLabel: string;
  addressLine: string;
  landmark?: string;
  propertyType?: 'residential' | 'apartment' | 'commercial';
  serviceId: string;
  serviceSlug?: string;
  serviceTitle: string;
  categoryId?: string;
  variantId: string;
  variantName: string;
  addons: Array<{
    addonId: string;
    name: string;
    quantity: number;
    unitPaise: number;
    lineTotalPaise: number;
  }>;
  preferredDate: string; // YYYY-MM-DD
  preferredSlot: string;
  scheduledDate?: string;
  timeWindow?: string;
  customerNotes?: string;
  pricingMode: PricingMode;
  quoteSnapshot: QuoteBreakdown;
  priceSnapshot?: BookingPriceSnapshot;
  status: BookingStatus;
  subStatus?: BookingSubStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  assignmentMode?: AssignmentPolicy;
  assignedVendorUid: string | null;
  assignedVendorName: string | null;
  vendorRejectionReason?: string | null;
  cancellationReason?: string;
  vendorExecutionNotes: string[];
  completionPhotos: string[];
  createdAtIso: string;
  updatedAtIso: string;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  bookingCode?: string;
  actorUid: string;
  actorRole: 'customer' | 'vendor' | 'admin' | 'system';
  actorName: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  eventType?: string;
  note: string;
  createdAtIso: string;
}

export interface PortalNotification {
  id: string;
  recipientRole: 'admin' | 'vendor' | 'customer';
  recipientUid?: string; // 'ALL_ADMINS' or specific uid
  bookingId?: string;
  bookingCode?: string;
  title: string;
  message: string;
  type?:
    | 'booking_created'
    | 'vendor_assigned'
    | 'vendor_accepted'
    | 'vendor_rejected'
    | 'job_started'
    | 'job_completed'
    | 'booking_cancelled'
    | 'system_alert';
  severity?: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAtIso: string;
}

export interface CmsSettings {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  dispatchMode: 'manual' | 'auto_lowest_load' | 'round_robin';
  defaultAssignmentPolicy?: AssignmentPolicy;
  defaultTaxRatePercent?: number;
  trustBadges: string[];
  faqs: ServiceFAQ[];
  updatedAtIso: string;
}
