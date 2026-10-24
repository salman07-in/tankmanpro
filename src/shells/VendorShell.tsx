import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  IndianRupee,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { buildPortalHref } from '../lib/portalRouting.ts';
import { formatPaiseToInr as formatPaiseToRupees } from '../lib/pricingEngine.ts';
import type { VendorDashboardMetrics } from '../lib/vendorEngine.ts';
import {
  auth,
  db,
  doc,
  googleProvider,
  setDoc,
  signInWithPopup,
  signOut,
} from '../firebase.ts';
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  BookingSubStatus,
  City,
  PortalNotification,
  PriceOverride,
  Service,
  ServiceArea,
  Vendor,
} from '../types/domain.ts';
import { WhatsAppIcon } from '../components/WhatsAppIcon.tsx';
import {
  cleanIndianPhone,
  buildWhatsAppLink,
  buildVendorToCustomerEnRouteWhatsApp,
  buildVendorToCustomerArrivedWhatsApp,
} from '../lib/whatsappEngine.ts';

interface VendorShellProps {
  internalPath: string;
  isCustomDomainHost: boolean;
  onNavigate: (href: string) => void;
}

type VendorSection = 'dashboard' | 'jobs' | 'coverage' | 'earnings';

type JobFilterTab =
  | 'ALL'
  | 'AWAITING_ACCEPTANCE'
  | 'TODAY'
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED_CANCELLED';

interface SanitizedVendorBooking extends Booking {
  piiRevealed: boolean;
}

interface PartnerAccountPreview {
  uid: string;
  vendorCode: string;
  displayName: string;
  businessName: string;
  email: string;
  status: string;
  supportedCityIds: string[];
  supportedAreaPins: string[];
}

const VENDOR_SESSION_STORAGE_KEY = 'tankmanpro_vendor_session_v1';

const ALL_WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'confirmed':
      return 'Confirmed';
    case 'assigned_to_vendor':
      return 'Awaiting Your Acceptance';
    case 'vendor_accepted':
      return 'Accepted · Scheduled';
    case 'in_progress':
      return 'In Progress on Site';
    case 'completed':
      return 'Completed';
    case 'vendor_rejected':
      return 'Reassignment Requested';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

export const VendorShell: React.FC<VendorShellProps> = ({
  internalPath,
  isCustomDomainHost,
  onNavigate,
}) => {
  // 1. Persisted Server-Verified Partner Session
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem(VENDOR_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.token || null;
    } catch {
      return null;
    }
  });

  // Login Form State
  const [partnerAccounts, setPartnerAccounts] = useState<PartnerAccountPreview[]>([]);
  const [emailOrCode, setEmailOrCode] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authBanner, setAuthBanner] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);
  const [showResetBox, setShowResetBox] = useState(false);

  // Scoped Vendor Operational State
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);
  const [metrics, setMetrics] = useState<VendorDashboardMetrics | null>(null);
  const [bookings, setBookings] = useState<SanitizedVendorBooking[]>([]);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [assignedCities, setAssignedCities] = useState<City[]>([]);
  const [assignedServiceAreas, setAssignedServiceAreas] = useState<ServiceArea[]>([]);
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);
  const [vendorPriceOverrides, setVendorPriceOverrides] = useState<PriceOverride[]>([]);

  const [isLoadingState, setIsLoadingState] = useState(false);
  const [opToast, setOpToast] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Jobs Section Filters & Selected Booking Inspector
  const [jobFilter, setJobFilter] = useState<JobFilterTab>('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Job Action Inputs
  const [executionNoteInput, setExecutionNoteInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [safetyChecklistVerified, setSafetyChecklistVerified] = useState(true);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);

  // Availability & Shift Form
  const [shiftHoursInput, setShiftHoursInput] = useState('');
  const [shiftDaysInput, setShiftDaysInput] = useState<string[]>([]);
  const [maxJobsInput, setMaxJobsInput] = useState<number>(5);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  // Vendor Rate Card Form
  const [rateServiceId, setRateServiceId] = useState('');
  const [rateVariantId, setRateVariantId] = useState('');
  const [rateCityId, setRateCityId] = useState('');
  const [rateRupeesInput, setRateRupeesInput] = useState('599');
  const [isSavingRate, setIsSavingRate] = useState(false);

  const linkTo = useCallback(
    (path: string) => buildPortalHref('vendor', path, isCustomDomainHost),
    [isCustomDomainHost]
  );

  // Active Navigation Section derived from internalPath
  const activeSection: VendorSection = useMemo(() => {
    const clean = internalPath.replace(/^\/+/, '').split('/')[0];
    if (clean === 'jobs' || clean === 'bookings' || clean === 'orders') return 'jobs';
    if (clean === 'coverage' || clean === 'areas' || clean === 'availability') return 'coverage';
    if (clean === 'earnings' || clean === 'pricing' || clean === 'payouts') return 'earnings';
    return 'dashboard';
  }, [internalPath]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setOpToast({ type, text });
  }, []);

  // Partner Account directory not displayed on login
  useEffect(() => {
    setPartnerAccounts([]);
  }, []);

  // Fetch Scoped Vendor State from Authoritative Server
  const loadVendorState = useCallback(
    async (tokenToUse?: string | null) => {
      const tok = tokenToUse ?? sessionToken;
      if (!tok) return;

      setIsLoadingState(true);
      try {
        const res = await fetch('/api/vendor/state', {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.status === 401 || res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          sessionStorage.removeItem(VENDOR_SESSION_STORAGE_KEY);
          setSessionToken(null);
          setVendorProfile(null);
          setAuthBanner({
            type: 'error',
            message:
              errData.error ||
              'Your Partner Vendor session expired or your account was suspended by Main Admin.',
          });
          return;
        }

        const data = await res.json();
        const loadedVendor: Vendor = data.vendor;
        const loadedBookings: SanitizedVendorBooking[] = data.bookings || [];
        const loadedServices: Service[] = data.assignedServices || [];
        const loadedCities: City[] = data.assignedCities || [];

        setVendorProfile(loadedVendor);
        setMetrics(data.metrics || null);
        setBookings(loadedBookings);
        setBookingEvents(data.bookingEvents || []);
        setNotifications(data.notifications || []);
        setAssignedCities(loadedCities);
        setAssignedServiceAreas(data.assignedServiceAreas || []);
        setAssignedServices(loadedServices);
        setVendorPriceOverrides(data.vendorPriceOverrides || []);

        setShiftHoursInput(loadedVendor.workingHoursLabel || '08:30 AM – 07:00 PM');
        setShiftDaysInput(
          loadedVendor.workingDays && loadedVendor.workingDays.length > 0
            ? loadedVendor.workingDays
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        );
        setMaxJobsInput(loadedVendor.maxActiveJobs || 5);

        if (loadedServices.length > 0) {
          setRateServiceId((prev) => {
            const svc =
              loadedServices.find((s) => s.id === prev) || loadedServices[0];
            if (svc && svc.variants.length > 0) {
              setRateVariantId((vPrev) =>
                svc.variants.some((v) => v.id === vPrev)
                  ? vPrev
                  : svc.variants[0].id
              );
            }
            return svc.id;
          });
        }
        if (loadedCities.length > 0) {
          setRateCityId((prev) =>
            loadedCities.some((c) => c.id === prev) ? prev : loadedCities[0].id
          );
        }

        // Auto-select first awaiting acceptance or in-progress booking so inspector is populated
        setSelectedBookingId((prev) => {
          if (prev && loadedBookings.some((b) => b.id === prev)) return prev;
          const awaiting = loadedBookings.find((b) => b.status === 'assigned_to_vendor');
          if (awaiting) return awaiting.id;
          const inProg = loadedBookings.find((b) => b.status === 'in_progress');
          if (inProg) return inProg.id;
          return loadedBookings[0]?.id || null;
        });
      } catch {
        showToast('error', 'Failed to load Partner operational state from server.');
      } finally {
        setIsLoadingState(false);
      }
    },
    [sessionToken, showToast]
  );

  useEffect(() => {
    if (sessionToken) {
      loadVendorState(sessionToken);
    }
  }, [sessionToken, loadVendorState]);

  // Partner Login Handler
  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBanner(null);

    if (!emailOrCode.trim() || !vendorPassword.trim()) {
      setAuthBanner({
        type: 'error',
        message: 'Please enter your registered Partner Email or Vendor ID and password.',
      });
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const response = await fetch('/api/vendor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrCode: emailOrCode.trim(),
          password: vendorPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.authorized) {
        setAuthBanner({
          type: 'error',
          message:
            data.error || 'Partner authentication failed. Please check your credentials.',
        });
        return;
      }

      sessionStorage.setItem(
        VENDOR_SESSION_STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          vendor: data.vendor,
        })
      );
      setSessionToken(data.token);
      setVendorProfile(data.vendor);

      if (internalPath === '/login' || internalPath === '/') {
        onNavigate(linkTo('/dashboard'));
      }
    } catch {
      setAuthBanner({
        type: 'error',
        message: 'Unable to reach Partner authentication server (/api/vendor/session).',
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Optional Firebase Google Sign-In for Registered Partner Emails
  const handleGoogleVendorLogin = async () => {
    setAuthBanner(null);
    setIsSubmittingAuth(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const response = await fetch('/api/vendor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          firebaseEmail: user.email,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.authorized) {
        setAuthBanner({
          type: 'error',
          message:
            data.error ||
            'Your Google account is not linked to an active TankmanPro Partner Vendor profile.',
        });
        return;
      }

      sessionStorage.setItem(
        VENDOR_SESSION_STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          vendor: data.vendor,
        })
      );
      setSessionToken(data.token);
      setVendorProfile(data.vendor);
      onNavigate(linkTo('/dashboard'));
    } catch (err) {
      setAuthBanner({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Google Sign-In could not be completed. Use your Partner Email/ID and password below.',
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Password Reset Request Handler
  const handlePasswordResetRequest = async () => {
    if (!emailOrCode.trim()) {
      setAuthBanner({
        type: 'error',
        message: 'Enter your registered Partner Email or Vendor ID (e.g. TMP-VND-1003) first.',
      });
      return;
    }

    try {
      const res = await fetch('/api/vendor/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrCode: emailOrCode.trim() }),
      });
      const data = await res.json();
      setAuthBanner({
        type: 'info',
        message:
          data.message ||
          'Password reset request sent to Main Admin Dispatch for verification.',
      });
      setShowResetBox(false);
    } catch {
      setAuthBanner({
        type: 'error',
        message: 'Could not submit password reset request.',
      });
    }
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem(VENDOR_SESSION_STORAGE_KEY);
    setSessionToken(null);
    setVendorProfile(null);
    try {
      await signOut(auth);
    } catch {
      // Ignore Firebase sign-out errors
    }
    onNavigate(linkTo('/login'));
  };

  // Booking Lifecycle Transition Handler (Accept, Reject/Reassign, Start, Complete)
  const handleBookingTransition = async (
    bookingId: string,
    targetStatus: BookingStatus,
    options?: { reason?: string; executionNote?: string; subStatus?: BookingSubStatus }
  ) => {
    if (!sessionToken) return;
    setIsUpdatingJob(true);
    try {
      const res = await fetch(`/api/vendor/bookings/${bookingId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          targetStatus,
          reason: options?.reason,
          executionNote: options?.executionNote,
          subStatus: options?.subStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not update job status.');
        return;
      }

      // Sync to Firestore best-effort when authenticated
      if (data.booking && auth.currentUser) {
        setDoc(doc(db, 'bookings', data.booking.id), data.booking, { merge: true }).catch(
          () => {}
        );
      }

      setExecutionNoteInput('');
      setRejectionReasonInput('');
      setShowRejectForm(false);
      showToast('success', data.message || `Booking updated to ${targetStatus}.`);
      await loadVendorState(sessionToken);
    } catch {
      showToast('error', 'Network error while updating booking status.');
    } finally {
      setIsUpdatingJob(false);
    }
  };

  // Field Crew Sub-Status & Execution Note Handler
  const handleFieldSubStatusUpdate = async (
    bookingId: string,
    subStatus?: BookingSubStatus,
    noteText?: string
  ) => {
    if (!sessionToken) return;
    setIsUpdatingJob(true);
    try {
      const res = await fetch(`/api/vendor/bookings/${bookingId}/substatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          subStatus,
          executionNote: noteText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not update field log.');
        return;
      }
      setExecutionNoteInput('');
      showToast('success', data.message || 'Field log updated.');
      await loadVendorState(sessionToken);
    } catch {
      showToast('error', 'Failed to update field crew status.');
    } finally {
      setIsUpdatingJob(false);
    }
  };

  // Save Vendor Availability & Shift Settings
  const handleSaveAvailability = async (
    overrideAvailable?: boolean,
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();
    if (!sessionToken || !vendorProfile) return;

    setIsSavingAvailability(true);
    try {
      const nextAvailable =
        typeof overrideAvailable === 'boolean'
          ? overrideAvailable
          : Boolean(vendorProfile.isAvailable);

      const res = await fetch('/api/vendor/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          isAvailable: nextAvailable,
          workingHoursLabel: shiftHoursInput,
          workingDays: shiftDaysInput,
          maxActiveJobs: maxJobsInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not update availability.');
        return;
      }
      showToast('success', data.message || 'Availability settings saved.');
      await loadVendorState(sessionToken);
    } catch {
      showToast('error', 'Failed to save shift availability.');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  // Save Vendor-Specific Rate Card Override
  const handleSaveVendorRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    const rupees = Number(rateRupeesInput);
    if (!Number.isFinite(rupees) || rupees < 49) {
      showToast('error', 'Please enter a valid rate in Rupees (minimum ₹49).');
      return;
    }

    setIsSavingRate(true);
    try {
      const res = await fetch('/api/vendor/price-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          serviceId: rateServiceId,
          variantId: rateVariantId,
          cityId: rateCityId,
          amountPaise: Math.round(rupees * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Could not save Partner service rate.');
        return;
      }
      showToast('success', data.message || 'Partner service rate saved.');
      await loadVendorState(sessionToken);
    } catch {
      showToast('error', 'Failed to save Partner rate card.');
    } finally {
      setIsSavingRate(false);
    }
  };

  const handleMarkNotificationsRead = async (id?: string) => {
    if (!sessionToken) return;
    try {
      const res = await fetch('/api/vendor/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch {
      // Ignore error
    }
  };

  // Filtered Bookings for Jobs View
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Strictly show only orders for this vendor's authorized PIN code(s)
      if (vendorProfile?.supportedAreaPins && vendorProfile.supportedAreaPins.length > 0) {
        if (!vendorProfile.supportedAreaPins.includes(b.pinCode)) {
          return false;
        }
      }

      if (jobFilter === 'AWAITING_ACCEPTANCE' && b.status !== 'assigned_to_vendor') {
        return false;
      }
      if (jobFilter === 'TODAY') {
        const isCancelled =
          b.status === 'vendor_rejected' ||
          b.status === 'cancelled' ||
          b.status === 'refunded';
        if (b.preferredDate !== todayStr || isCancelled) return false;
      }
      if (jobFilter === 'UPCOMING') {
        const isCancelled =
          b.status === 'vendor_rejected' ||
          b.status === 'cancelled' ||
          b.status === 'refunded';
        if (b.preferredDate <= todayStr || isCancelled) return false;
      }
      if (jobFilter === 'IN_PROGRESS' && b.status !== 'in_progress') {
        return false;
      }
      if (jobFilter === 'COMPLETED' && b.status !== 'completed') {
        return false;
      }
      if (
        jobFilter === 'REJECTED_CANCELLED' &&
        b.status !== 'vendor_rejected' &&
        b.status !== 'cancelled' &&
        b.status !== 'refunded'
      ) {
        return false;
      }

      if (jobSearch.trim()) {
        const q = jobSearch.trim().toLowerCase();
        const matchNumber = b.bookingNumber.toLowerCase().includes(q);
        const matchCustomer = b.customerName.toLowerCase().includes(q);
        const matchService = b.serviceTitle.toLowerCase().includes(q);
        const matchPin = b.pinCode.includes(q);
        const matchZone = b.zoneLabel.toLowerCase().includes(q);
        if (!matchNumber && !matchCustomer && !matchService && !matchPin && !matchZone) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, jobFilter, jobSearch, todayStr]);

  const selectedBooking = useMemo(
    () =>
      bookings.find((b) => b.id === selectedBookingId) ||
      filteredBookings[0] ||
      bookings[0] ||
      null,
    [bookings, filteredBookings, selectedBookingId]
  );

  const selectedBookingEvents = useMemo(() => {
    if (!selectedBooking) return [];
    return bookingEvents.filter((e) => e.bookingId === selectedBooking.id);
  }, [bookingEvents, selectedBooking]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const selectedRateService = useMemo(
    () => assignedServices.find((s) => s.id === rateServiceId) || assignedServices[0] || null,
    [assignedServices, rateServiceId]
  );

  // ============================================================================
  // UNAUTHENTICATED VIEW — ISOLATED PARTNER VENDOR LOGIN (/vendor/login)
  // ============================================================================
  if (!sessionToken || !vendorProfile) {
    const attemptedProtectedRoute = internalPath !== '/login' && internalPath !== '/';

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
          <a
            href={linkTo('/login')}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(linkTo('/login'));
            }}
            className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-950"
          >
            <span className="w-7 h-7 rounded-md bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center">
              TP
            </span>
            <span>TankmanPro Partner</span>
          </a>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Isolated Partner Portal</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">/vendor/login</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Verified Service Partner &amp; Field Technician Portal</span>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                Service Partner Sign In
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Sign in with your Admin-assigned Partner Email or Vendor ID to accept jobs,
                update field execution status, and view city/PIN assignments.
              </p>
            </div>

            {attemptedProtectedRoute && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Authentication Required for {internalPath}
                  </div>
                  <div className="mt-0.5 text-slate-700">
                    Partner job queues and customer addresses are protected by server-side RBAC.
                    Sign in below to continue.
                  </div>
                </div>
              </div>
            )}

            {authBanner && (
              <div
                role="status"
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  authBanner.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-teal-50/80 border-teal-200 text-slate-800'
                }`}
              >
                <div className="font-bold mb-0.5">
                  {authBanner.type === 'error' ? 'Authentication Notice' : 'Partner Portal Info'}
                </div>
                <div>{authBanner.message}</div>
              </div>
            )}

            <form onSubmit={handleVendorLogin} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="vendor-identifier"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Partner Email or Vendor ID
                </label>
                <input
                  id="vendor-identifier"
                  name="partner_login_code"
                  type="text"
                  autoComplete="off"
                  value={emailOrCode}
                  onChange={(e) => setEmailOrCode(e.target.value)}
                  placeholder="Enter Partner Email or Vendor ID"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="vendor-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Partner Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetBox((prev) => !prev)}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Forgot / Reset Password?
                  </button>
                </div>
                <input
                  id="vendor-password"
                  name="partner_login_secret"
                  type="password"
                  autoComplete="new-password"
                  value={vendorPassword}
                  onChange={(e) => setVendorPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {showResetBox && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800">
                    Request Admin Password Reset
                  </div>
                  <p className="text-slate-600">
                    Vendor credentials are managed by Main Admin. Click below to notify Admin
                    Dispatch to issue a fresh password link for{' '}
                    <span className="font-mono font-semibold">
                      {emailOrCode || 'your account'}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={handlePasswordResetRequest}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Submit Reset Request to Admin
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isSubmittingAuth ? 'Verifying Partner Session...' : 'Sign In to Partner Portal'}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-xs text-slate-400">or</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleVendorLogin}
              disabled={isSubmittingAuth}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Sign In with Verified Partner Google Account</span>
            </button>

            <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Partner Security &amp; Access Rules</div>
              <div>
                • Vendors can view and update only bookings explicitly assigned to their Vendor ID.
              </div>
              <div>
                • Customer street address and phone number unlock only after job acceptance.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED VIEW — PHASE 2 PARTNER VENDOR WORKSPACE
  // ============================================================================
  const navItems: Array<{
    id: VendorSection;
    label: string;
    path: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Partner Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'jobs',
      label: 'Assigned Jobs',
      path: '/jobs',
      icon: ClipboardList,
      count: metrics?.awaitingAcceptanceCount || 0,
    },
    {
      id: 'coverage',
      label: 'Coverage & Shift',
      path: '/coverage',
      icon: MapPin,
    },
    {
      id: 'earnings',
      label: 'Pricing & Earnings',
      path: '/earnings',
      icon: IndianRupee,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Partner Operational Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href={linkTo('/dashboard')}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(linkTo('/dashboard'));
              }}
              className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-slate-950"
            >
              <span className="w-7 h-7 rounded-md bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center">
                TP
              </span>
              <span>TankmanPro Partner</span>
            </a>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4">
              <span className="font-semibold text-slate-900">{vendorProfile.displayName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-teal-700 font-semibold">
                {vendorProfile.vendorCode || vendorProfile.uid}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                PINs: <strong className="font-mono">{vendorProfile.supportedAreaPins.join(', ')}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Shift Online / Offline Quick Toggle */}
            <button
              type="button"
              disabled={isSavingAvailability}
              onClick={() => handleSaveAvailability(!vendorProfile.isAvailable)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                vendorProfile.isAvailable
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {vendorProfile.isAvailable ? 'Shift Status: Online' : 'Shift Status: Paused'}
            </button>

            <button
              type="button"
              onClick={() => loadVendorState(sessionToken)}
              disabled={isLoadingState}
              aria-label="Refresh Partner Data"
              className="p-2 text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingState ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav
          aria-label="Partner Portal Navigation"
          className="max-w-[1440px] mx-auto mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={linkTo(item.path)}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(linkTo(item.path));
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-amber-100 text-amber-900 font-bold'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </header>

      {/* Operation Feedback Toast */}
      {opToast && (
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            role="status"
            className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
              opToast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : opToast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-teal-50 border-teal-200 text-slate-900'
            }`}
          >
            <span>{opToast.text}</span>
            <button
              type="button"
              onClick={() => setOpToast(null)}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ====================================================================
            SECTION 1: VENDOR DASHBOARD (/vendor/dashboard)
           ==================================================================== */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Partner Identity & Coverage Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">
                  <span>{vendorProfile.businessName}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono font-semibold text-teal-700">
                    {vendorProfile.vendorCode}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>{vendorProfile.experienceYearsLabel}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                  Welcome back, {vendorProfile.displayName}
                </h1>
                <div className="text-xs text-slate-600">
                  <span>
                    Assigned Cities:{' '}
                    <strong>{assignedCities.map((c) => c.name).join(', ') || 'None'}</strong>
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>
                    Serviceable PINs:{' '}
                    <strong className="font-mono">
                      {vendorProfile.supportedAreaPins.join(', ')}
                    </strong>
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>Shift: {vendorProfile.workingHoursLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJobFilter('AWAITING_ACCEPTANCE');
                    onNavigate(linkTo('/jobs'));
                  }}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Review Assigned Jobs ({metrics?.awaitingAcceptanceCount || 0} New)
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(linkTo('/coverage'))}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Manage Shift &amp; Coverage
                </button>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Awaiting Acceptance</div>
                <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
                  {metrics?.awaitingAcceptanceCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">New dispatched jobs</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Today&apos;s Jobs</div>
                <div className="text-2xl font-extrabold text-slate-950 font-mono tabular-nums mt-1">
                  {metrics?.todaysJobsCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Scheduled for {todayStr}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Upcoming Jobs</div>
                <div className="text-2xl font-extrabold text-teal-700 font-mono tabular-nums mt-1">
                  {metrics?.upcomingJobsCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Future confirmed slots</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">In-Progress Now</div>
                <div className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums mt-1">
                  {metrics?.inProgressJobsCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Capacity: {metrics?.inProgressJobsCount ?? 0}/{vendorProfile.maxActiveJobs}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Completed Jobs</div>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
                  {metrics?.completedJobsCount ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Completion rate: {metrics?.completionRatePercent ?? 100}%
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Net Partner Earnings</div>
                <div className="text-2xl font-extrabold text-slate-950 font-mono tabular-nums mt-1">
                  {formatPaiseToRupees(metrics?.netVendorEarningsPaise || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  After {metrics?.commissionPercent ?? 18}% platform fee
                </div>
              </div>
            </div>

            {/* Two-Column Action Queue: Awaiting Acceptance & Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: New Dispatched Bookings & Active Queue */}
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-950">
                        Bookings Awaiting Your Acceptance
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Accept assigned bookings to unlock full customer contact details and
                        street address.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJobFilter('AWAITING_ACCEPTANCE');
                        onNavigate(linkTo('/jobs'));
                      }}
                      className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      Open Job Console
                    </button>
                  </div>

                  {bookings.filter((b) => b.status === 'assigned_to_vendor').length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      All assigned bookings have been reviewed. No pending acceptance requests right
                      now.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                      {bookings
                        .filter((b) => b.status === 'assigned_to_vendor')
                        .map((b) => (
                          <div
                            key={b.id}
                            className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="text-xs text-slate-500">
                                <span className="font-mono font-bold text-slate-900">
                                  {b.bookingNumber}
                                </span>
                                <span aria-hidden="true"> · </span>
                                <span>{b.cityName}</span>
                                <span aria-hidden="true"> · </span>
                                <span className="font-mono">PIN {b.pinCode}</span>
                              </div>
                              <div className="text-sm font-bold text-slate-950">
                                {b.serviceTitle} — {b.variantName}
                              </div>
                              <div className="text-xs text-slate-600">
                                <span>Slot: {b.preferredDate} ({b.preferredSlot})</span>
                                <span aria-hidden="true"> · </span>
                                <span>Zone: {b.zoneLabel}</span>
                                <span aria-hidden="true"> · </span>
                                <span className="font-mono font-semibold text-slate-900">
                                  Quote: {formatPaiseToRupees(b.quoteSnapshot?.finalTotalPaise || 0)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isUpdatingJob}
                                onClick={() =>
                                  handleBookingTransition(b.id, 'vendor_accepted', {
                                    executionNote:
                                      'Partner accepted booking from Vendor Dashboard.',
                                  })
                                }
                                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Accept Booking
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBookingId(b.id);
                                  setShowRejectForm(true);
                                  onNavigate(linkTo('/jobs'));
                                }}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Inspect / Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                {/* Today's & Upcoming Active Jobs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-950">
                        Active &amp; Scheduled Jobs Queue
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your accepted and in-progress field assignments across assigned PIN codes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJobFilter('ALL');
                        onNavigate(linkTo('/jobs'));
                      }}
                      className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      View All ({bookings.length})
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">
                            <span className="font-mono font-bold text-slate-900">
                              {b.bookingNumber}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-semibold text-teal-800">
                              {formatStatusLabel(b.status)}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono">
                              {b.preferredDate} ({b.preferredSlot})
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-950">
                            {b.serviceTitle} ({b.variantName})
                          </div>
                          <div className="text-xs text-slate-600">
                            <span>Customer: {b.customerName}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono">PIN {b.pinCode}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{b.addressLine}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {b.piiRevealed && (
                            <a
                              href={buildWhatsAppLink(
                                b.customerPhone,
                                `Hello ${b.customerName}, this is your TankmanPro service technician regarding booking #${b.bookingNumber}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`WhatsApp Customer ${b.customerName} (${b.customerPhone})`}
                              className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {formatPaiseToRupees(b.quoteSnapshot?.finalTotalPaise || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingId(b.id);
                              onNavigate(linkTo('/jobs'));
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Manage Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right 5 Cols: Partner Notifications & Assigned Locations Summary */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-700" />
                      <h2 className="text-base font-extrabold text-slate-950">
                        Dispatch Notifications ({unreadNotificationCount} unread)
                      </h2>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMarkNotificationsRead()}
                        className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500">
                      No partner notifications recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                      {notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs space-y-1 ${
                            n.read ? 'bg-white text-slate-600' : 'bg-teal-50/40 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-950">{n.title}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {n.createdAtIso.slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-950">
                    Assigned Territory &amp; Service Matrix
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-700 mb-1">
                        Authorized Service Areas ({assignedServiceAreas.length} PIN Codes)
                      </div>
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                        {assignedServiceAreas.map((area) => (
                          <div
                            key={area.pinCode}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-950">
                                {area.pinCode}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span className="text-slate-700">{area.zoneLabel}</span>
                            </div>
                            <span className="text-slate-500">{area.cityName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-700 mb-1">
                        Authorized Service Categories ({assignedServices.length} Services)
                      </div>
                      <div className="text-slate-600 leading-relaxed">
                        {assignedServices.map((s) => s.title).join(' · ')}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SECTION 2: VENDOR BOOKING & JOB EXECUTION CONSOLE (/vendor/jobs)
           ==================================================================== */}
        {activeSection === 'jobs' && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-950">
                  Assigned Bookings &amp; Field Execution Console
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Showing strictly bookings assigned to{' '}
                  <strong className="font-mono">{vendorProfile.vendorCode}</strong> (
                  {vendorProfile.displayName}). Other vendors&apos; bookings are isolated.
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search booking #, customer, PIN, service..."
                  aria-label="Search assigned bookings"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* Interactive Segmented Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `All Assigned (${bookings.length})` },
                  {
                    id: 'AWAITING_ACCEPTANCE',
                    label: `Awaiting Acceptance (${metrics?.awaitingAcceptanceCount ?? 0})`,
                  },
                  { id: 'TODAY', label: `Today's Jobs (${metrics?.todaysJobsCount ?? 0})` },
                  { id: 'UPCOMING', label: `Upcoming (${metrics?.upcomingJobsCount ?? 0})` },
                  {
                    id: 'IN_PROGRESS',
                    label: `In Progress (${metrics?.inProgressJobsCount ?? 0})`,
                  },
                  { id: 'COMPLETED', label: `Completed (${metrics?.completedJobsCount ?? 0})` },
                  {
                    id: 'REJECTED_CANCELLED',
                    label: `Rejected / Cancelled (${metrics?.rejectedOrCancelledCount ?? 0})`,
                  },
                ] as Array<{ id: JobFilterTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setJobFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    jobFilter === tab.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Split-Pane Queue + Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 5 Cols: Filtered Assigned Jobs List */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Assigned Job Queue ({filteredBookings.length})</span>
                  <span className="font-mono text-slate-500">{vendorProfile.vendorCode}</span>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No assigned bookings match the current filter.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredBookings.map((b) => {
                      const isSelected = selectedBooking?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBookingId(b.id);
                            setShowRejectForm(false);
                          }}
                          className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                            isSelected ? 'bg-teal-50/60' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-extrabold text-slate-950">
                              {b.bookingNumber}
                            </span>
                            <span className="font-semibold text-teal-800">
                              {formatStatusLabel(b.status)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-950 mt-1">
                            {b.serviceTitle}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{b.variantName}</div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>
                              <strong className="font-mono text-slate-700">{b.pinCode}</strong> ·{' '}
                              {b.preferredDate} ({b.preferredSlot})
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatPaiseToRupees(b.quoteSnapshot?.finalTotalPaise || 0)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right 7 Cols: Detailed Job Execution & Lifecycle Inspector */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                {!selectedBooking ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Select an assigned booking on the left to inspect customer details and manage
                    job execution.
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-950">
                            {selectedBooking.bookingNumber}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span>{selectedBooking.cityName}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono">PIN {selectedBooking.pinCode}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{selectedBooking.propertyType}</span>
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-950">
                          {selectedBooking.serviceTitle} — {selectedBooking.variantName}
                        </h2>
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>
                            Scheduled: <strong>{selectedBooking.preferredDate}</strong> (
                            {selectedBooking.preferredSlot})
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <div className="text-xs text-slate-500">Current Job Status</div>
                        <div className="text-sm font-extrabold text-teal-800">
                          {formatStatusLabel(selectedBooking.status)}
                        </div>
                        {selectedBooking.subStatus && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Field Stage: <strong className="uppercase">{selectedBooking.subStatus}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Contact & Service Location (Enforces Pre-Acceptance Privacy Masking) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-extrabold text-slate-900">
                          Customer &amp; Fulfilment Location
                        </h3>
                        <span className="text-xs text-slate-500">
                          {selectedBooking.piiRevealed
                            ? 'Unlocked for Active Fulfilment'
                            : 'Masked Prior to Job Acceptance'}
                        </span>
                      </div>

                      {!selectedBooking.piiRevealed && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                          For customer privacy, exact flat/house numbers and full phone numbers are
                          revealed only after you <strong>Accept</strong> the booking.
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-slate-500">Customer Name</div>
                          <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                            <span>{selectedBooking.customerName}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">Customer Phone</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-teal-700" />
                              <span>{selectedBooking.customerPhone}</span>
                            </div>
                            {selectedBooking.piiRevealed && (
                              <a
                                href={buildWhatsAppLink(
                                  selectedBooking.customerPhone,
                                  `Hello ${selectedBooking.customerName}, this is ${vendorProfile?.displayName || 'your technician'} from TankmanPro regarding booking #${selectedBooking.bookingNumber}.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`WhatsApp Customer ${selectedBooking.customerName}`}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="text-slate-500">Service Address &amp; Zone</div>
                          <div className="font-semibold text-slate-900 mt-0.5">
                            {selectedBooking.addressLine}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            <span>Zone: {selectedBooking.zoneLabel}</span>
                            {selectedBooking.landmark && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>Landmark: {selectedBooking.landmark}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {selectedBooking.customerNotes && (
                          <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                            <div className="text-slate-500">Customer Instructions / Notes</div>
                            <div className="font-medium text-slate-800 mt-0.5">
                              {selectedBooking.customerNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 1-Click WhatsApp Direct Dispatch Panel (Visible when job is accepted / active) */}
                    {selectedBooking.piiRevealed && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <WhatsAppIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-extrabold text-emerald-950">
                                1-Click WhatsApp Direct Dispatch
                              </h3>
                              <p className="text-[11px] text-emerald-800">
                                Customer ko 1 click me update bhejein · Poora message already typed aayega
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 uppercase">
                            Instant · ₹0 Cost
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {/* Action 1: En Route */}
                          <a
                            href={buildWhatsAppLink(
                              selectedBooking.customerPhone,
                              buildVendorToCustomerEnRouteWhatsApp(selectedBooking, {
                                displayName: vendorProfile?.displayName || 'Lead Technician',
                                phone: vendorProfile?.phone || '+91 96481 75639',
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>🚗 Send &quot;En Route&quot; Alert</span>
                          </a>

                          {/* Action 2: Arrived */}
                          <a
                            href={buildWhatsAppLink(
                              selectedBooking.customerPhone,
                              buildVendorToCustomerArrivedWhatsApp(selectedBooking, {
                                displayName: vendorProfile?.displayName || 'Lead Technician',
                                phone: vendorProfile?.phone || '+91 96481 75639',
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>📍 Send &quot;Arrived&quot; Alert</span>
                          </a>

                          {/* Action 3: General Direct Chat */}
                          <a
                            href={buildWhatsAppLink(
                              selectedBooking.customerPhone,
                              `Hello ${selectedBooking.customerName}, this is ${vendorProfile?.displayName || 'your lead technician'} from TankmanPro regarding your booking #${selectedBooking.bookingNumber} (${selectedBooking.serviceTitle}). Please let me know if we can begin the service setup.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>💬 Direct WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Permitted Lifecycle Actions Panel */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Job Execution &amp; Status Controls
                      </h3>

                      {/* State 1: Awaiting Acceptance (assigned_to_vendor) */}
                      {selectedBooking.status === 'assigned_to_vendor' && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600">
                            Review the service scope, PIN code ({selectedBooking.pinCode}), and
                            time slot ({selectedBooking.preferredDate} ·{' '}
                            {selectedBooking.preferredSlot}). Accept to confirm your crew&apos;s
                            dispatch or request reassignment if unavailable.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() =>
                                handleBookingTransition(selectedBooking.id, 'vendor_accepted', {
                                  executionNote:
                                    'Booking accepted by Partner. Crew scheduled for slot.',
                                })
                              }
                              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept Booking &amp; Unlock Address</span>
                            </button>

                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() => setShowRejectForm((prev) => !prev)}
                              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject / Request Reassignment</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State 2: Accepted (vendor_accepted) -> En Route / Arrived / Start Job */}
                      {selectedBooking.status === 'vendor_accepted' && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-600 mr-1">
                              Update Crew Field Stage:
                            </span>
                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() =>
                                handleFieldSubStatusUpdate(
                                  selectedBooking.id,
                                  'en_route',
                                  'Technician crew is en route to customer location.'
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                selectedBooking.subStatus === 'en_route'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              1. Crew En Route
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() =>
                                handleFieldSubStatusUpdate(
                                  selectedBooking.id,
                                  'arrived',
                                  'Technician arrived at customer premises.'
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                selectedBooking.subStatus === 'arrived'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              2. Arrived at Site
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() =>
                                handleBookingTransition(selectedBooking.id, 'in_progress', {
                                  executionNote:
                                    executionNoteInput.trim() ||
                                    'Technician started mechanised service on site.',
                                  subStatus: 'working',
                                })
                              }
                              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Start Job (Mark In Progress)
                            </button>

                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() => setShowRejectForm((prev) => !prev)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Request Reassignment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State 3: In Progress (in_progress) -> Add Execution Notes & Complete Job */}
                      {selectedBooking.status === 'in_progress' && (
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="vendor-exec-note"
                              className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                              Field Execution &amp; Hygiene Log Note
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="vendor-exec-note"
                                type="text"
                                value={executionNoteInput}
                                onChange={(e) => setExecutionNoteInput(e.target.value)}
                                placeholder="e.g. Dewatering, sludge extraction & UV sanitization completed"
                                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                              />
                              <button
                                type="button"
                                disabled={isUpdatingJob || !executionNoteInput.trim()}
                                onClick={() =>
                                  handleFieldSubStatusUpdate(
                                    selectedBooking.id,
                                    'working',
                                    executionNoteInput.trim()
                                  )
                                }
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                Add Log Note
                              </button>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={safetyChecklistVerified}
                              onChange={(e) => setSafetyChecklistVerified(e.target.checked)}
                              className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                            />
                            <span>
                              I confirm all service inclusions, post-service cleanup, and customer
                              inspection sign-off are complete.
                            </span>
                          </label>

                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              disabled={isUpdatingJob || !safetyChecklistVerified}
                              onClick={() =>
                                handleBookingTransition(selectedBooking.id, 'completed', {
                                  executionNote:
                                    executionNoteInput.trim() ||
                                    'Service completed and verified with customer sign-off.',
                                })
                              }
                              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mark Job Completed</span>
                            </button>

                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() => setShowRejectForm((prev) => !prev)}
                              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Unable to Complete / Request Reassignment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Rejection / Reassignment Reason Form */}
                      {showRejectForm && (
                        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3">
                          <label
                            htmlFor="vendor-reject-reason"
                            className="block text-xs font-bold text-red-950"
                          >
                            Reason for Rejection / Reassignment Request (Required)
                          </label>
                          <input
                            id="vendor-reject-reason"
                            type="text"
                            value={rejectionReasonInput}
                            onChange={(e) => setRejectionReasonInput(e.target.value)}
                            placeholder="Explain why you cannot fulfil this slot (min 5 characters)..."
                            className="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUpdatingJob}
                              onClick={() =>
                                handleBookingTransition(selectedBooking.id, 'vendor_rejected', {
                                  reason: rejectionReasonInput,
                                })
                              }
                              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Submit Reassignment Request to Admin
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectForm(false)}
                              className="px-3 py-2 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Locked / Completed Notice */}
                      {(selectedBooking.status === 'completed' ||
                        selectedBooking.status === 'vendor_rejected' ||
                        selectedBooking.status === 'cancelled') && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                          This booking is in <strong>{formatStatusLabel(selectedBooking.status)}</strong>{' '}
                          state. Further status transitions are locked. Contact Main Admin Dispatch if
                          an adjustment is required.
                        </div>
                      )}
                    </div>

                    {/* Locked Price Snapshot & Vendor Payout Breakdown (Read-Only for Vendor) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">
                          Locked Quote Snapshot &amp; Partner Payout
                        </span>
                        <span className="text-slate-500">
                          Payment: <strong className="uppercase">{selectedBooking.paymentStatus}</strong> (
                          {selectedBooking.paymentMethod.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <div className="text-slate-500">Base + Add-ons</div>
                          <div className="font-mono font-bold text-slate-900">
                            {formatPaiseToRupees(selectedBooking.quoteSnapshot?.subtotalPaise || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Coupon Discount</div>
                          <div className="font-mono font-bold text-slate-900">
                            -{formatPaiseToRupees(selectedBooking.quoteSnapshot?.discountPaise || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Customer Final Total</div>
                          <div className="font-mono font-extrabold text-slate-950">
                            {formatPaiseToRupees(
                              selectedBooking.quoteSnapshot?.finalTotalPaise || 0
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            Your Net Share ({100 - (vendorProfile.commissionPercent ?? 18)}%)
                          </div>
                          <div className="font-mono font-extrabold text-teal-800">
                            {formatPaiseToRupees(
                              Math.round(
                                ((selectedBooking.quoteSnapshot?.finalTotalPaise || 0) *
                                  (100 - (vendorProfile.commissionPercent ?? 18))) /
                                  100
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Security Policy: Final customer booking prices and verified payment statuses
                        are locked on the server and cannot be altered from the Vendor Portal.
                      </p>
                    </div>

                    {/* Field Execution Notes & Audit History */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Field Execution Notes &amp; Audit Trail ({selectedBookingEvents.length})
                      </h3>
                      {selectedBooking.vendorExecutionNotes.length > 0 && (
                        <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 text-xs space-y-1">
                          <div className="font-bold text-teal-950">Recorded Technician Notes:</div>
                          {selectedBooking.vendorExecutionNotes.map((note, idx) => (
                            <div key={idx} className="text-slate-700">
                              • {note}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl text-xs">
                        {selectedBookingEvents.map((ev) => (
                          <div key={ev.id} className="p-3 flex items-start justify-between gap-3">
                            <div>
                              <span className="font-bold text-slate-900">{ev.actorName}</span>
                              <span aria-hidden="true"> · </span>
                              <span className="text-teal-800 font-semibold">{ev.toStatus}</span>
                              <div className="text-slate-600 mt-0.5">{ev.note}</div>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              {ev.createdAtIso.slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SECTION 3: ASSIGNED COVERAGE & SHIFT AVAILABILITY (/vendor/coverage)
           ==================================================================== */}
        {activeSection === 'coverage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Shift Availability & Capacity Controls */}
            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-700" />
                <h1 className="text-lg font-extrabold text-slate-950">
                  Shift Availability &amp; Crew Capacity
                </h1>
              </div>
              <p className="text-xs text-slate-600">
                Configure your working hours, active days, and maximum concurrent jobs. The dispatch
                engine checks these settings before assigning new customer bookings.
              </p>

              <form
                onSubmit={(e) => handleSaveAvailability(undefined, e)}
                className="space-y-4 text-xs"
              >
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900">
                      Real-Time Dispatch Availability
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {vendorProfile.isAvailable
                        ? 'Your crew is marked Online and eligible for new bookings in your PIN codes.'
                        : 'Your crew is Paused and will not receive automatic bookings.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAvailability(!vendorProfile.isAvailable)}
                    className={`px-3.5 py-2 rounded-lg font-semibold cursor-pointer ${
                      vendorProfile.isAvailable
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {vendorProfile.isAvailable ? 'Online (Click to Pause)' : 'Paused (Go Online)'}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="shift-hours"
                    className="block font-semibold text-slate-700 mb-1.5"
                  >
                    Working Hours Window
                  </label>
                  <input
                    id="shift-hours"
                    type="text"
                    value={shiftHoursInput}
                    onChange={(e) => setShiftHoursInput(e.target.value)}
                    placeholder="e.g. 08:30 AM – 07:00 PM"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <div className="font-semibold text-slate-700 mb-1.5">Active Working Days</div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_WEEK_DAYS.map((day) => {
                      const active = shiftDaysInput.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setShiftDaysInput((prev) =>
                              prev.includes(day)
                                ? prev.filter((d) => d !== day)
                                : [...prev, day]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                            active
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="max-active-jobs"
                    className="block font-semibold text-slate-700 mb-1.5"
                  >
                    Maximum Concurrent Active Jobs (Crew Capacity)
                  </label>
                  <input
                    id="max-active-jobs"
                    type="number"
                    min={1}
                    max={20}
                    value={maxJobsInput}
                    onChange={(e) => setMaxJobsInput(Number(e.target.value))}
                    className="w-36 px-3.5 py-2 font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingAvailability}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isSavingAvailability
                    ? 'Saving Shift Configuration...'
                    : 'Save Shift & Capacity Settings'}
                </button>
              </form>
            </section>

            {/* Right 6 Cols: Admin-Assigned Cities, PIN Codes & Services */}
            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Admin-Assigned Cities, PIN Codes &amp; Services
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Territory and service mappings are governed by Main Admin. To expand your PIN
                  code coverage, contact TankmanPro City Operations.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="font-bold text-slate-800 mb-2">
                    Assigned Cities ({assignedCities.length})
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {assignedCities.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-950">{c.name}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="text-slate-500">{c.state}</span>
                        </div>
                        <span className="font-mono text-teal-700">Active Territory</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-800 mb-2">
                    Assigned 6-Digit PIN Codes ({assignedServiceAreas.length})
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {assignedServiceAreas.map((a) => (
                      <div key={a.pinCode} className="p-3 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-slate-950">{a.pinCode}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="text-slate-700">{a.zoneLabel}</span>
                        </div>
                        <span className="text-slate-500">{a.cityName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-800 mb-2">
                    Authorized Services ({assignedServices.length})
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                    {assignedServices.map((s) => (
                      <div key={s.id} className="p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{s.title}</div>
                          <div className="text-slate-500">
                            Duration: {s.durationMinutes} mins · {s.variants.length} package
                            variants
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900">
                          Base {formatPaiseToRupees(s.basePricePaise)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ====================================================================
            SECTION 4: SERVICE PRICING & PARTNER EARNINGS (/vendor/earnings)
           ==================================================================== */}
        {activeSection === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Gross Completed Value</div>
                <div className="text-2xl font-extrabold text-slate-950 font-mono tabular-nums mt-1">
                  {formatPaiseToRupees(metrics?.grossCompletedPaise || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Across {metrics?.completedJobsCount ?? 0} completed jobs
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">
                  Platform Commission ({metrics?.commissionPercent ?? 18}%)
                </div>
                <div className="text-2xl font-extrabold text-slate-700 font-mono tabular-nums mt-1">
                  -{formatPaiseToRupees(metrics?.platformCommissionPaise || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Marketplace &amp; dispatch fee</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Net Partner Earnings</div>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
                  {formatPaiseToRupees(metrics?.netVendorEarningsPaise || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Verified completed jobs</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Active Pipeline (Est. Net)</div>
                <div className="text-2xl font-extrabold text-teal-700 font-mono tabular-nums mt-1">
                  {formatPaiseToRupees(metrics?.pendingPipelineNetPaise || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Assigned + In-Progress bookings
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 5 Cols: Configure Partner-Specific Service Rate Override */}
              <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">
                    Configure Partner Service Rate Card
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Set or update your vendor-specific rate for assigned services and cities. When
                    vendor-offer pricing is enabled, your rate overrides the city/base tariff for new
                    quotes. Historical bookings keep their locked price snapshot.
                  </p>
                </div>

                <form onSubmit={handleSaveVendorRate} className="space-y-3.5 text-xs">
                  <div>
                    <label
                      htmlFor="rate-city"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Assigned City
                    </label>
                    <select
                      id="rate-city"
                      value={rateCityId}
                      onChange={(e) => setRateCityId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    >
                      {assignedCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rate-service"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Assigned Service
                    </label>
                    <select
                      id="rate-service"
                      value={rateServiceId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setRateServiceId(nextId);
                        const svc = assignedServices.find((s) => s.id === nextId);
                        if (svc && svc.variants.length > 0) {
                          setRateVariantId(svc.variants[0].id);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    >
                      {assignedServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rate-variant"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Package / Variant
                    </label>
                    <select
                      id="rate-variant"
                      value={rateVariantId}
                      onChange={(e) => setRateVariantId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    >
                      {(selectedRateService?.variants || []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (Base: {formatPaiseToRupees(v.basePricePaise)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rate-rupees"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Your Partner Rate (in ₹ INR)
                    </label>
                    <input
                      id="rate-rupees"
                      type="number"
                      min={49}
                      step={1}
                      value={rateRupeesInput}
                      onChange={(e) => setRateRupeesInput(e.target.value)}
                      className="w-full px-3.5 py-2 font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingRate}
                    className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {isSavingRate ? 'Saving Partner Rate...' : 'Save Partner Service Rate'}
                  </button>
                </form>

                {/* Active Vendor Overrides List */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Your Active Vendor Rate Overrides (
                    {vendorPriceOverrides.filter((po) => po.vendorUid === vendorProfile.uid).length}
                    )
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl text-xs">
                    {vendorPriceOverrides
                      .filter((po) => po.vendorUid === vendorProfile.uid)
                      .map((po) => {
                        const svc = assignedServices.find((s) => s.id === po.serviceId);
                        const variant = svc?.variants.find((v) => v.id === po.variantId);
                        const city = assignedCities.find((c) => c.id === po.cityId);
                        return (
                          <div
                            key={po.id}
                            className="p-3 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {svc?.title || po.serviceId}
                              </div>
                              <div className="text-slate-500">
                                {variant?.name || po.variantId} · {city?.name || po.cityId}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-teal-800">
                              {formatPaiseToRupees(po.amountPaise)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </section>

              {/* Right 7 Cols: Job-by-Job Earnings & Payout Ledger */}
              <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">
                    Job-by-Job Payout &amp; Settlement Ledger
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Transparent breakdown of customer invoice amount, platform commission (
                    {vendorProfile.commissionPercent ?? 18}%), and your net partner share.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold">Booking #</th>
                        <th className="py-2.5 px-3 font-semibold">Service &amp; Date</th>
                        <th className="py-2.5 px-3 font-semibold">Job Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Gross Quote</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Net Partner Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bookings.map((b) => {
                        const gross = b.quoteSnapshot?.finalTotalPaise || 0;
                        const comm = Math.round(
                          (gross * (vendorProfile.commissionPercent ?? 18)) / 100
                        );
                        const net = Math.max(0, gross - comm);
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-950">
                              {b.bookingNumber}
                              <div className="font-normal text-slate-500">PIN {b.pinCode}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{b.serviceTitle}</div>
                              <div className="text-slate-500">
                                {b.preferredDate} ({b.preferredSlot})
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">
                                {formatStatusLabel(b.status)}
                              </div>
                              <div className="text-slate-500">Payment: {b.paymentStatus}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                              {formatPaiseToRupees(gross)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-teal-800">
                              {formatPaiseToRupees(net)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
