import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  MapPin,
  Users,
  FileEdit,
  Bell,
  LogOut,
  Plus,
  Search,
  Check,
  X,
  Upload,
  RefreshCw,
  Archive,
  Trash2,
  Eye,
  KeyRound,
  SlidersHorizontal,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  FileSpreadsheet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Database,
  Download,
} from 'lucide-react';
import { buildPortalHref } from '../lib/portalRouting.ts';
import { formatPaiseToInr } from '../lib/pricingEngine.ts';
import {
  computeAdminDashboardMetrics,
  evaluateServiceDeletion,
  findEligibleVendorsForBooking,
  type PinCsvValidationResult,
} from '../lib/adminEngine.ts';
import {
  auth,
  db,
  doc,
  setDoc,
  deleteDoc,
  googleProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  Category,
  City,
  CmsSettings,
  Coupon,
  PaymentStatus,
  PortalNotification,
  PriceOverride,
  PricingMode,
  PublishStatus,
  Service,
  ServiceArea,
  Vendor,
  VendorStatus,
  WaitlistEntry,
} from '../types/domain.ts';
import {
  cleanIndianPhone,
  buildWhatsAppLink,
  buildCustomerBookingConfirmedWhatsApp,
  buildCustomerTechnicianAssignedWhatsApp,
  buildVendorDispatchWhatsApp,
  buildCustomerJobCompletedWhatsApp,
} from '../lib/whatsappEngine.ts';

export function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 2c-5.502 0-9.969 4.467-9.969 9.969 0 1.761.458 3.479 1.328 4.992l-1.39 5.039 5.176-1.359c1.469.802 3.125 1.229 4.855 1.229 5.502 0 9.969-4.467 9.969-9.969 0-5.502-4.467-9.969-9.969-9.969zm5.824 14.078c-.244.686-1.42 1.31-1.957 1.394-.516.082-1.189.117-3.844-.959-3.21-1.302-5.275-4.572-5.436-4.787-.156-.215-1.295-1.724-1.295-3.287 0-1.564.819-2.334 1.111-2.65.293-.316.639-.395.852-.395.215 0 .428.002.615.012.2.01.467-.076.73.555.275.66.938 2.285 1.018 2.451.082.166.137.361.027.576-.11.215-.164.348-.328.539-.164.191-.346.428-.494.574-.164.164-.336.344-.145.672.191.328.848 1.4 1.816 2.264 1.246 1.111 2.297 1.455 2.625 1.621.328.164.518.145.711-.076.191-.221.822-.957 1.041-1.285.221-.328.441-.275.742-.164.301.11 1.908.9 2.236 1.064.328.164.547.244.629.383.082.137.082.801-.162 1.488z" />
    </svg>
  );
}

interface AdminShellProps {
  internalPath: string;
  isCustomDomainHost: boolean;
  onNavigate: (href: string) => void;
}

type AdminSection =
  | 'dashboard'
  | 'bookings'
  | 'services'
  | 'cities-pins'
  | 'vendors'
  | 'cms';

interface AdminSessionInfo {
  token: string;
  email: string;
  displayName: string;
  role: 'admin';
  issuedAtIso: string;
}

const ADMIN_SESSION_STORAGE_KEY = 'tankman_admin_session_v1';

const AVAILABLE_SERVICE_IMAGES = [
  { label: 'Water Tank Cleaning', url: '/assets/tankmanpro/water-tank.jpg' },
  { label: 'Bathroom Deep Cleaning', url: '/assets/tankmanpro/bathroom-deep.jpg' },
  { label: 'Bathroom Scrubbing', url: '/assets/tankmanpro/bathroom-scrub.webp' },
  { label: 'Kitchen & Chimney Deep Cleaning', url: '/assets/tankmanpro/kitchen-chimney.png' },
  { label: 'Kitchen Deep Scrub', url: '/assets/tankmanpro/kitchen-deep.png' },
  { label: 'Kitchen Sink & Drain Sanitation', url: '/assets/tankmanpro/kitchen-sink.jpeg' },
  { label: 'Chimney Degreasing', url: '/assets/tankmanpro/chimney-clean.png' },
  { label: 'Gas Stove & Burner Cleaning', url: '/assets/tankmanpro/gas-stove.jpg' },
  { label: 'AC Foam-Jet Servicing', url: '/assets/tankmanpro/ac-service.jpg' },
  { label: 'Sofa & Upholstery Spa', url: '/assets/tankmanpro/sofa-clean.jpg' },
  { label: 'Mattress Sanitizing & Anti-Allergen', url: '/assets/tankmanpro/mattress-clean.png' },
  { label: 'Car Wash & Pressure Detailing', url: '/assets/tankmanpro/car-wash.jpg' },
  { label: 'Bike Foam Wash', url: '/assets/tankmanpro/bike-wash.jpg' },
  { label: 'Carpet Deep Cleaning', url: '/assets/tankmanpro/carpet-clean.webp' },
  { label: 'Ceiling & Exhaust Fan Care', url: '/assets/tankmanpro/fan-clean.jpg' },
  { label: 'Toilet Intensive Stain Removal', url: '/assets/tankmanpro/toilet-clean.jpg' },
  { label: 'Washbasin & Ceramic Polish', url: '/assets/tankmanpro/washbasin.jpg' },
  { label: 'Floor Deep Scrubbing', url: '/assets/tankmanpro/floor-clean.jpg' },
  { label: 'HydraFacial Skin Treatment', url: '/assets/tankmanpro/aesthetic-facial.jpg' },
];

export const AdminShell: React.FC<AdminShellProps> = ({
  internalPath,
  isCustomDomainHost,
  onNavigate,
}) => {
  const linkTo = (path: string) => buildPortalHref('admin', path, isCustomDomainHost);

  // 1. Session & Authentication State
  const [adminSession, setAdminSession] = useState<AdminSessionInfo | null>(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AdminSessionInfo) : null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 2. Active Navigation Section derived from internalPath
  const activeSection: AdminSection = useMemo(() => {
    const clean = internalPath.replace(/^\/+/, '').split('/')[0];
    if (clean === 'bookings') return 'bookings';
    if (clean === 'services') return 'services';
    if (clean === 'cities-pins' || clean === 'cities' || clean === 'pins') return 'cities-pins';
    if (clean === 'vendors') return 'vendors';
    if (clean === 'cms') return 'cms';
    return 'dashboard';
  }, [internalPath]);

  // 3. Live Platform Data State
  const [cities, setCities] = useState<City[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<PriceOverride[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingEvents, setBookingEvents] = useState<BookingEvent[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [cmsSettings, setCmsSettings] = useState<CmsSettings | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Feedback banner
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', message: string) => {
    setToast({ type, message });
  };

  // Notification Drawer
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Dashboard Filters
  const [dashCityFilter, setDashCityFilter] = useState<string>('ALL');
  const [dashDatePreset, setDashDatePreset] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [dashDateFrom, setDashDateFrom] = useState<string>('');
  const [dashDateTo, setDashDateTo] = useState<string>('');

  // Service Management State
  const [serviceTab, setServiceTab] = useState<'services' | 'categories' | 'pricing'>('services');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('ALL');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('ALL');
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [serviceImageMode, setServiceImageMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<Category['iconKey']>('water-tank');

  // Price Override Form State
  const [poServiceId, setPoServiceId] = useState('srv_mechanized_tank_clean');
  const [poVariantId, setPoVariantId] = useState('var_tank_500_1000');
  const [poCityId, setPoCityId] = useState('city_kanpur');
  const [poVendorUid, setPoVendorUid] = useState('');
  const [poAmountRupees, setPoAmountRupees] = useState('499');

  // Cities & PIN Codes State
  const [pinSearch, setPinSearch] = useState('');
  const [pinCityFilter, setPinCityFilter] = useState('ALL');
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('Uttar Pradesh');
  const [newCityPhone, setNewCityPhone] = useState('+91 96481 75639');
  const [newPinCode, setNewPinCode] = useState('');
  const [newPinCityId, setNewPinCityId] = useState('city_kanpur');
  const [newPinZone, setNewPinZone] = useState('');
  const [csvText, setCsvText] = useState(
    'pinCode,cityName,state,zoneLabel,active\n208012,Kanpur,Uttar Pradesh,Gumti No. 5 & Lajpat Nagar,true\n208024,Kanpur,Uttar Pradesh,Kakadeo & Ratanlal Nagar,true\n226001,Lucknow,Uttar Pradesh,Hazratganj & Vidhan Sabha Marg,true'
  );
  const [csvPreviewResult, setCsvPreviewResult] = useState<PinCsvValidationResult | null>(null);
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);

  // Vendor Management State
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('ALL');
  const [vendorCityFilter, setVendorCityFilter] = useState('ALL');
  const [editingVendor, setEditingVendor] = useState<Partial<Vendor> | null>(null);
  const [inspectingVendor, setInspectingVendor] = useState<Vendor | null>(null);

  // Booking Management State
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingCityFilter, setBookingCityFilter] = useState('ALL');
  const [bookingPinFilter, setBookingPinFilter] = useState('');
  const [bookingServiceFilter, setBookingServiceFilter] = useState('ALL');
  const [bookingVendorFilter, setBookingVendorFilter] = useState('ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState('ALL');
  const [bookingPage, setBookingPage] = useState(1);
  const BOOKINGS_PER_PAGE = 8;
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [assignVendorUid, setAssignVendorUid] = useState<string>('');
  const [adminActionNote, setAdminActionNote] = useState<string>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');

  // CMS & Coupon State
  const [cmsDraft, setCmsDraft] = useState<CmsSettings | null>(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('fixed');
  const [newCouponValue, setNewCouponValue] = useState('100');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('499');

  // Enterprise Database Persistence State
  const [dbMetrics, setDbMetrics] = useState<{
    storageType: string;
    dbFilePath: string;
    fileSizeKb: string;
    totalBookings: number;
    totalVendors: number;
    totalServices: number;
    totalCities: number;
    totalPinCodes: number;
    lastSavedIso: string;
  } | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);


  // Helper for authenticated Admin API calls
  const adminFetch = async (url: string, options: RequestInit = {}) => {
    if (!adminSession) throw new Error('Not signed in');
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${adminSession.token}`);
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (res.status === 401) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      setAdminSession(null);
      throw new Error(data.error || 'Admin session expired. Please sign in again.');
    }
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  // Optional Firestore mirror when Firebase Auth user is active
  const syncDocToFirestore = async (collectionName: string, docId: string, payload: unknown) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, collectionName, docId), JSON.parse(JSON.stringify(payload)));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  };

  const loadAdminState = async (sessionOverride?: AdminSessionInfo) => {
    const activeSess = sessionOverride || adminSession;
    if (!activeSess) return;
    setIsLoadingState(true);
    try {
      const res = await fetch('/api/admin/state', {
        headers: { Authorization: `Bearer ${activeSess.token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        setAdminSession(null);
        return;
      }
      const data = await res.json();
      setCities(data.cities || []);
      setServiceAreas(data.serviceAreas || []);
      setCategories(data.categories || []);
      setServices(data.services || []);
      setVendors(data.vendors || []);
      setPriceOverrides(data.priceOverrides || []);
      setCoupons(data.coupons || []);
      const loadedBookings: Booking[] = data.bookings || [];
      setBookings(loadedBookings);
      setSelectedBookingId((prev) => {
        if (prev && loadedBookings.some((b) => b.id === prev)) return prev;
        const firstUnassigned = loadedBookings.find(
          (b) => !b.assignedVendorUid && b.status !== 'cancelled'
        );
        const chosen = firstUnassigned || loadedBookings[0] || null;
        if (chosen) {
          setRescheduleDate(chosen.preferredDate);
          setRescheduleSlot(chosen.preferredSlot);
        }
        return chosen ? chosen.id : null;
      });
      setBookingEvents(data.bookingEvents || []);
      setNotifications(data.notifications || []);
      setCmsSettings(data.cmsSettings || null);
      setCmsDraft(data.cmsSettings || null);
      setWaitlistEntries(data.waitlistEntries || []);

      // Also refresh persistent database metrics
      try {
        const dbRes = await fetch('/api/admin/database/status', {
          headers: { Authorization: `Bearer ${activeSess.token}` },
        });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.metrics) {
            setDbMetrics(dbData.metrics);
          }
        }
      } catch {
        // Non-blocking
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load Admin state.');
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleForceDbSync = async () => {
    setIsSyncingDb(true);
    try {
      const data = await adminFetch('/api/admin/database/sync', { method: 'POST' });
      if (data?.metrics) {
        setDbMetrics(data.metrics);
      }
      showToast('success', 'Database permanently written to disk and mirrored to Firestore.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to sync database.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!adminSession) return;
    window.open(`/api/admin/database/backup?token=${encodeURIComponent(adminSession.token)}`, '_blank');
    showToast('success', 'Database JSON backup download started.');
  };

  useEffect(() => {
    if (adminSession) {
      loadAdminState(adminSession);
    }
  }, [adminSession?.token]);

  // Login Handlers
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setLoginError(data.error || 'Invalid Admin credentials.');
        return;
      }
      const session: AdminSessionInfo = {
        token: data.token,
        email: data.admin.email,
        displayName: data.admin.displayName,
        role: 'admin',
        issuedAtIso: data.admin.issuedAtIso,
      };
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      setAdminSession(session);
      if (internalPath === '/login' || internalPath === '/') {
        onNavigate(linkTo('/dashboard'));
      }
    } catch {
      setLoginError('Could not connect to server authentication endpoint.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          firebaseEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setLoginError(data.error || 'Google account is not authorized as Admin.');
        return;
      }
      const session: AdminSessionInfo = {
        token: data.token,
        email: data.admin.email,
        displayName: data.admin.displayName,
        role: 'admin',
        issuedAtIso: data.admin.issuedAtIso,
      };
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      setAdminSession(session);
      onNavigate(linkTo('/dashboard'));
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setAdminSession(null);
    onNavigate(linkTo('/login'));
  };

  // Computed Dashboard Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const computedDateFilter = useMemo(() => {
    if (dashDatePreset === 'today') {
      return { from: todayStr, to: todayStr };
    }
    if (dashDatePreset === '7d') {
      const d = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      return { from: d, to: todayStr };
    }
    if (dashDatePreset === '30d') {
      const d = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      return { from: d, to: todayStr };
    }
    if (dashDatePreset === 'custom') {
      return { from: dashDateFrom || undefined, to: dashDateTo || undefined };
    }
    return { from: undefined, to: undefined };
  }, [dashDatePreset, dashDateFrom, dashDateTo, todayStr]);

  const dashboardMetrics = useMemo(
    () =>
      computeAdminDashboardMetrics({
        bookings,
        vendors,
        services,
        categories,
        cities,
        serviceAreas,
        todayDateStr: todayStr,
        filterCityId: dashCityFilter,
        dateFrom: computedDateFilter.from,
        dateTo: computedDateFilter.to,
      }),
    [
      bookings,
      vendors,
      services,
      categories,
      cities,
      serviceAreas,
      todayStr,
      dashCityFilter,
      computedDateFilter,
    ]
  );

  // Filtered Bookings for Booking Management
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingCityFilter !== 'ALL' && b.cityId !== bookingCityFilter) return false;
      if (bookingPinFilter.trim() && !b.pinCode.includes(bookingPinFilter.trim())) return false;
      if (bookingServiceFilter !== 'ALL' && b.serviceId !== bookingServiceFilter) return false;
      if (bookingVendorFilter !== 'ALL') {
        if (bookingVendorFilter === 'UNASSIGNED' && b.assignedVendorUid) return false;
        if (bookingVendorFilter !== 'UNASSIGNED' && b.assignedVendorUid !== bookingVendorFilter)
          return false;
      }
      if (bookingStatusFilter !== 'ALL' && b.status !== bookingStatusFilter) return false;
      if (bookingPaymentFilter !== 'ALL' && b.paymentStatus !== bookingPaymentFilter) return false;

      if (bookingSearch.trim()) {
        const q = bookingSearch.trim().toLowerCase();
        const match =
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.toLowerCase().includes(q) ||
          b.serviceTitle.toLowerCase().includes(q) ||
          b.pinCode.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    bookings,
    bookingCityFilter,
    bookingPinFilter,
    bookingServiceFilter,
    bookingVendorFilter,
    bookingStatusFilter,
    bookingPaymentFilter,
    bookingSearch,
  ]);

  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * BOOKINGS_PER_PAGE,
    bookingPage * BOOKINGS_PER_PAGE
  );

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  const selectedBookingEvents = useMemo(
    () =>
      bookingEvents
        .filter((e) => e.bookingId === selectedBookingId)
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [bookingEvents, selectedBookingId]
  );

  const eligibleVendorsForSelectedBooking = useMemo(() => {
    if (!selectedBooking) return [];
    return findEligibleVendorsForBooking(selectedBooking, vendors);
  }, [selectedBooking, vendors]);

  // Service Actions
  const handleServiceImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please choose a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL(file.type || 'image/jpeg', 0.88);
            setEditingService((prev) => (prev ? { ...prev, imageUrl: optimized } : null));
            showToast('success', `Cover photo "${file.name}" uploaded & optimized.`);
          } else {
            setEditingService((prev) => (prev ? { ...prev, imageUrl: dataUrl } : null));
            showToast('success', `Cover photo "${file.name}" loaded.`);
          }
        };
        img.onerror = () => {
          setEditingService((prev) => (prev ? { ...prev, imageUrl: dataUrl } : null));
          showToast('success', `Cover photo "${file.name}" loaded.`);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.title || !editingService.categoryId) {
      showToast('error', 'Service title and category are required.');
      return;
    }
    try {
      const data = await adminFetch('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(editingService),
      });
      await syncDocToFirestore('services', data.service.id, data.service);
      showToast('success', data.message);
      setEditingService(null);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save service.');
    }
  };

  const handleServiceStatusChange = async (serviceId: string, status: PublishStatus) => {
    try {
      const data = await adminFetch(`/api/admin/services/${serviceId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      await syncDocToFirestore('services', data.service.id, data.service);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update service status.');
    }
  };

  const handleDeleteOrArchiveService = async (serviceId: string, force = false) => {
    const targetSvc = services.find((s) => s.id === serviceId);
    const serviceName = targetSvc?.title || serviceId;
    if (!window.confirm(`Are you sure you want to delete service "${serviceName}"?`)) {
      return;
    }
    try {
      const data = await adminFetch(`/api/admin/services/${serviceId}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
      if (data.archivedInstead) {
        await syncDocToFirestore('services', serviceId, data.service);
        showToast('warning', data.message);
      } else {
        if (auth.currentUser) {
          try {
            await deleteDoc(doc(db, 'services', serviceId));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
          }
        }
        showToast('success', data.message);
      }
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete service.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const data = await adminFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCategoryName.trim(),
          shortDescription: newCategoryDesc.trim() || `${newCategoryName.trim()} services`,
          iconKey: newCategoryIcon,
          status: 'published',
        }),
      });
      await syncDocToFirestore('categories', data.category.id, data.category);
      setNewCategoryName('');
      setNewCategoryDesc('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const handleSavePriceOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(Number(poAmountRupees) * 100);
    if (!amountPaise || amountPaise <= 0) {
      showToast('error', 'Please enter a valid price in INR.');
      return;
    }
    try {
      const data = await adminFetch('/api/admin/price-overrides', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: poServiceId,
          variantId: poVariantId,
          cityId: poCityId,
          vendorUid: poVendorUid || undefined,
          amountPaise,
          active: true,
        }),
      });
      await syncDocToFirestore('price_overrides', data.priceOverride.id, data.priceOverride);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save price override.');
    }
  };

  // City & PIN Actions
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newCityState.trim()) return;
    try {
      const data = await adminFetch('/api/admin/cities', {
        method: 'POST',
        body: JSON.stringify({
          name: newCityName.trim(),
          state: newCityState.trim(),
          supportPhone: newCityPhone.trim(),
          active: true,
        }),
      });
      await syncDocToFirestore('cities', data.city.id, data.city);
      setNewCityName('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add city.');
    }
  };

  const handleToggleCity = async (city: City) => {
    try {
      const data = await adminFetch('/api/admin/cities', {
        method: 'POST',
        body: JSON.stringify({
          id: city.id,
          name: city.name,
          state: city.state,
          active: !city.active,
        }),
      });
      await syncDocToFirestore('cities', data.city.id, data.city);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle city.');
    }
  };

  const handleDeleteCity = async (cityId: string, cityName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete city "${cityName}" and all its mapped PIN areas? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const data = await adminFetch(`/api/admin/cities/${encodeURIComponent(cityId)}`, {
        method: 'DELETE',
      });
      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'cities', cityId));
        } catch {
          // offline/local sync
        }
      }
      showToast('success', data.message || `City "${cityName}" deleted successfully.`);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete city.');
    }
  };

  const handleAddPinCode = async (e: React.FormEvent, forceOverrideConflict = false) => {
    e.preventDefault();
    try {
      const data = await adminFetch('/api/admin/service-areas', {
        method: 'POST',
        body: JSON.stringify({
          pinCode: newPinCode.trim(),
          cityId: newPinCityId,
          zoneLabel: newPinZone.trim(),
          active: true,
          forceOverrideConflict,
        }),
      });
      await syncDocToFirestore('service_areas', data.serviceArea.pinCode, data.serviceArea);
      setNewPinCode('');
      setNewPinZone('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save PIN code.');
    }
  };

  const handleTogglePinArea = async (area: ServiceArea) => {
    try {
      const data = await adminFetch('/api/admin/service-areas', {
        method: 'POST',
        body: JSON.stringify({
          pinCode: area.pinCode,
          cityId: area.cityId,
          zoneLabel: area.zoneLabel,
          active: !area.active,
          forceOverrideConflict: true,
        }),
      });
      await syncDocToFirestore('service_areas', data.serviceArea.pinCode, data.serviceArea);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update PIN status.');
    }
  };

  const handlePreviewCsv = async () => {
    try {
      const data = await adminFetch('/api/admin/service-areas/import-csv', {
        method: 'POST',
        body: JSON.stringify({ csvText, mode: 'preview' }),
      });
      setCsvPreviewResult(data.validation);
      showToast(
        'success',
        `CSV Validated: ${data.validation.summary.validCount} valid, ${data.validation.summary.conflictCount} conflict(s), ${data.validation.summary.invalidCount} invalid.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'CSV validation failed.');
    }
  };

  const handleCommitCsv = async () => {
    try {
      const data = await adminFetch('/api/admin/service-areas/import-csv', {
        method: 'POST',
        body: JSON.stringify({
          csvText,
          mode: 'commit',
          allowConflictOverride,
        }),
      });
      setCsvPreviewResult(data.validation);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'CSV commit failed.');
    }
  };

  // Vendor Actions
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !editingVendor.displayName || !editingVendor.email || !editingVendor.phone) {
      showToast('error', 'Vendor name, email, and phone are required.');
      return;
    }
    try {
      const data = await adminFetch('/api/admin/vendors', {
        method: 'POST',
        body: JSON.stringify(editingVendor),
      });
      await syncDocToFirestore('vendors', data.vendor.uid, data.vendor);
      showToast('success', data.message);
      setEditingVendor(null);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save vendor.');
    }
  };

  const handleVendorStatusChange = async (uid: string, status: VendorStatus) => {
    try {
      const data = await adminFetch(`/api/admin/vendors/${uid}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      await syncDocToFirestore('vendors', data.vendor.uid, data.vendor);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update vendor status.');
    }
  };

  const handleVendorPasswordReset = async (vendor: Vendor) => {
    try {
      const data = await adminFetch(`/api/admin/vendors/${vendor.uid}/reset-password`, {
        method: 'POST',
      });
      try {
        if (vendor.email) {
          await sendPasswordResetEmail(auth, vendor.email);
        }
      } catch {
        // Optional Firebase email trigger if vendor already exists in Auth pool
      }
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to trigger password reset.');
    }
  };

  const handleDeleteVendor = async (uid: string, displayName: string, vendorCode?: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete vendor "${displayName}" (${vendorCode || uid})? This will unassign any active jobs and revoke vendor portal access.`
      )
    ) {
      return;
    }
    try {
      const data = await adminFetch(`/api/admin/vendors/${encodeURIComponent(uid)}`, {
        method: 'DELETE',
      });
      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'vendors', uid));
        } catch {
          // offline/local sync
        }
      }
      showToast('success', data.message || `Vendor "${displayName}" deleted.`);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete vendor.');
    }
  };

  // Booking Dispatch & Status Actions
  const handleAssignVendor = async (bookingId: string, autoAssign = false) => {
    try {
      const data = await adminFetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          vendorUid: autoAssign ? undefined : assignVendorUid,
          autoAssign,
          note: adminActionNote.trim() || undefined,
        }),
      });
      await syncDocToFirestore('bookings', data.booking.id, data.booking);
      setAdminActionNote('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Vendor assignment failed.');
    }
  };

  const handleBookingStatusUpdate = async (
    bookingId: string,
    updates: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      preferredDate?: string;
      preferredSlot?: string;
    }
  ) => {
    try {
      const data = await adminFetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          ...updates,
          note: adminActionNote.trim() || undefined,
        }),
      });
      await syncDocToFirestore('bookings', data.booking.id, data.booking);
      setAdminActionNote('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update booking.');
    }
  };

  const handleDeleteBooking = async (bookingId: string, bookingNumber: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete booking "${bookingNumber}"?`
      )
    ) {
      return;
    }
    try {
      const data = await adminFetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'DELETE',
      });
      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'bookings', bookingId));
        } catch {
          // offline sync
        }
      }
      if (selectedBookingId === bookingId) {
        setSelectedBookingId(null);
      }
      showToast('success', data.message || `Booking "${bookingNumber}" deleted.`);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete booking.');
    }
  };

  const handleClearAllBookings = async () => {
    if (
      !window.confirm(
        'DANGER: Are you sure you want to permanently clear ALL booking history and events? You will start fresh with 0 bookings.'
      )
    ) {
      return;
    }
    try {
      const data = await adminFetch('/api/admin/bookings/clear-all', {
        method: 'DELETE',
      });
      setSelectedBookingId(null);
      showToast('success', data.message || 'All booking history cleared successfully.');
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to clear all bookings.');
    }
  };

  // CMS & Coupon Actions
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsDraft) return;
    try {
      const data = await adminFetch('/api/admin/cms', {
        method: 'POST',
        body: JSON.stringify(cmsDraft),
      });
      await syncDocToFirestore('cms_settings', 'global', data.cmsSettings);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save CMS settings.');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const discountValue =
      newCouponType === 'percentage'
        ? Number(newCouponValue)
        : Math.round(Number(newCouponValue) * 100);
    const minOrderSubtotalPaise = Math.round(Number(newCouponMinOrder || 0) * 100);
    try {
      const data = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          description: newCouponDesc.trim() || `Save with code ${newCouponCode.toUpperCase()}`,
          discountType: newCouponType,
          discountValue,
          minOrderSubtotalPaise,
          active: true,
        }),
      });
      await syncDocToFirestore('coupons', data.coupon.id, data.coupon);
      setNewCouponCode('');
      setNewCouponDesc('');
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save coupon.');
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const data = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          active: !coupon.active,
        }),
      });
      await syncDocToFirestore('coupons', data.coupon.id, data.coupon);
      showToast('success', data.message);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update coupon.');
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${couponCode}"?`)) {
      return;
    }
    try {
      const data = await adminFetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
        method: 'DELETE',
      });
      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'coupons', couponId));
        } catch {
          // local/offline sync
        }
      }
      showToast('success', data.message || `Coupon ${couponCode} deleted.`);
      await loadAdminState();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete coupon.');
    }
  };

  // ============================================================================
  // UNAUTHENTICATED VIEW: /admin/login
  // ============================================================================
  if (!adminSession) {
    const attemptedProtectedRoute = internalPath !== '/login' && internalPath !== '/';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
              TP
            </span>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">
                TankmanPro · Main Admin Console
              </div>
              <div className="text-[11px] text-slate-400">
                Isolated Administration Portal · {isCustomDomainHost ? 'admin.tankmanpro.com' : '/admin/login'}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 bg-teal-950/70 border border-teal-800 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5" />
            Role-Protected Portal
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Admin Authentication
              </span>
              <span className="text-[11px] text-slate-400 font-mono">/admin/login</span>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Sign in to Main Admin
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Control cities, 6-digit PIN code serviceability, services & tariffs, vendor KYC,
                and real-time booking dispatch.
              </p>
            </div>

            {attemptedProtectedRoute && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-700/70 text-xs text-amber-200 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Required ({internalPath})</div>
                  <div className="mt-0.5 text-amber-300/90">
                    Please authenticate with your verified Admin account to open this module.
                  </div>
                </div>
              </div>
            )}

            {loginError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="admin-login-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Admin Work Email
                </label>
                <input
                  id="admin-login-email"
                  name="admin_direct_user_id"
                  type="email"
                  autoComplete="off"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter admin email (e.g. admin@tankmanpro.com)"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Admin Password
                </label>
                <input
                  id="admin-login-password"
                  name="admin_direct_secret_key"
                  type="password"
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
              >
                {isLoggingIn ? 'Verifying Admin Session...' : 'Sign In to Admin Dashboard'}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-800" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Or Firebase Auth
              </span>
              <div className="grow border-t border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Sign In with Google (Super Admin)
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED ADMIN CONTROL CENTER (/admin/dashboard, /services, /cities-pins, etc.)
  // ============================================================================
  const unreadNotifCount = notifications.filter(
    (n) => !n.read && n.recipientRole === 'admin'
  ).length;

  const navItems: Array<{
    id: AdminSection;
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'bookings',
      label: 'Bookings & Dispatch',
      path: '/bookings',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: bookings.filter(
        (b) => b.status === 'requested' || b.status === 'vendor_rejected'
      ).length,
    },
    {
      id: 'services',
      label: 'Services & Pricing',
      path: '/services',
      icon: <Wrench className="w-4 h-4" />,
      badge: services.length,
    },
    {
      id: 'cities-pins',
      label: 'Cities & PIN Codes',
      path: '/cities-pins',
      icon: <MapPin className="w-4 h-4" />,
      badge: serviceAreas.filter((a) => a.active).length,
    },
    {
      id: 'vendors',
      label: 'Vendors & KYC',
      path: '/vendors',
      icon: <Users className="w-4 h-4" />,
      badge: vendors.filter((v) => v.status === 'active').length,
    },
    {
      id: 'cms',
      label: 'Website CMS & Promos',
      path: '/cms',
      icon: <FileEdit className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-slate-950 text-slate-200 shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
                TP
              </span>
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight">
                  TankmanPro Admin
                </div>
                <div className="text-[11px] text-teal-400 font-medium">
                  Multi-City Control Center
                </div>
              </div>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(linkTo(item.path))}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-slate-950 text-teal-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="font-bold text-white truncate">{adminSession.displayName}</div>
            <div className="text-slate-400 text-[11px] truncate">{adminSession.email}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Firestore & Server Synced
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out of Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extrabold text-slate-950 tracking-tight capitalize">
              {activeSection === 'cities-pins'
                ? 'Cities & 6-Digit PIN Codes'
                : activeSection === 'cms'
                  ? 'Website CMS & Coupons'
                  : activeSection}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              Dispatch Mode:{' '}
              <strong className="text-slate-950">
                {cmsSettings?.dispatchMode === 'auto_lowest_load'
                  ? 'Auto-Assign (Lowest Load)'
                  : 'Manual Admin Review'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadAdminState()}
              disabled={isLoadingState}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingState ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-slate-950">
                      Operational Notifications ({notifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminFetch('/api/admin/notifications/read', {
                          method: 'POST',
                          body: JSON.stringify({}),
                        });
                        await loadAdminState();
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs ${
                          n.read
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-teal-50/70 border-teal-200 text-slate-900'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between gap-2">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {n.recipientRole}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] leading-relaxed">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Action Toast Feedback */}
        {toast && (
          <div className="px-6 pt-4">
            <div
              role="status"
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : toast.type === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 hover:bg-black/5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Section Body */}
        <main className="p-6 space-y-6 flex-1">
          {/* =================================================================
              SECTION 1: EXECUTIVE DASHBOARD
              ================================================================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <SlidersHorizontal className="w-4 h-4 text-teal-700" />
                    <span>Filter Metrics:</span>
                  </div>

                  <select
                    aria-label="Filter dashboard by city"
                    value={dashCityFilter}
                    onChange={(e) => setDashCityFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">All Cities ({cities.length})</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.state})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    {(
                      [
                        { id: 'all', label: 'All Recorded' },
                        { id: 'today', label: 'Today' },
                        { id: '7d', label: 'Last 7 Days' },
                        { id: '30d', label: 'Last 30 Days' },
                        { id: 'custom', label: 'Custom Range' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDashDatePreset(preset.id)}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          dashDatePreset === preset.id
                            ? 'bg-slate-950 text-white font-bold'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {dashDatePreset === 'custom' && (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="date"
                        value={dashDateFrom}
                        onChange={(e) => setDashDateFrom(e.target.value)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg"
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={dashDateTo}
                        onChange={(e) => setDashDateTo(e.target.value)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  All KPIs & Revenue computed strictly from recorded database transactions
                </div>
              </div>

              {/* Permanent Storage & Cloud Sync Status Badge */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">
                          Enterprise Database Persistence
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Zero Data Loss Active
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Firestore Cloud Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Transactional JSON document engine (<code className="text-teal-300 font-mono text-[11px]">tankman_production_db.json</code>{dbMetrics?.fileSizeKb ? ` · ${dbMetrics.fileSizeKb} KB` : ''}) + Live Google Cloud Firestore Mirror. Safe against server restarts and reboots.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleForceDbSync}
                      disabled={isSyncingDb}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                      <span>{isSyncingDb ? 'Syncing...' : 'Force Sync Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>1-Click Backup (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-500">Total Bookings</div>
                  <div className="text-2xl font-extrabold text-slate-950 mt-1">
                    {dashboardMetrics.totalBookings}
                  </div>
                  <div className="text-[11px] text-teal-700 font-semibold mt-1">
                    Today: {dashboardMetrics.todayBookings} booking(s)
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-500">Pending / Dispatch</div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {dashboardMetrics.pendingBookings}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Accepted: {dashboardMetrics.acceptedBookings}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-500">In Progress / Completed</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {dashboardMetrics.inProgressBookings} / {dashboardMetrics.completedBookings}
                  </div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-1">
                    Cancelled: {dashboardMetrics.cancelledBookings}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-500">Vendors (Active / Total)</div>
                  <div className="text-2xl font-extrabold text-slate-950 mt-1">
                    {dashboardMetrics.activeVendors} / {dashboardMetrics.totalVendors}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Pending KYC: {dashboardMetrics.pendingVendors}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-500">Catalog Services</div>
                  <div className="text-2xl font-extrabold text-slate-950 mt-1">
                    {dashboardMetrics.publishedServices} / {dashboardMetrics.totalServices}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {dashboardMetrics.totalCategories} Categories · {dashboardMetrics.archivedServices} Archived
                  </div>
                </div>

                <div className="bg-slate-950 text-white rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-400">Recorded Revenue</div>
                  <div className="text-2xl font-extrabold text-teal-400 mt-1">
                    {formatPaiseToInr(dashboardMetrics.paidRevenuePaise)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Pending Collection: {formatPaiseToInr(dashboardMetrics.pendingCollectionPaise)}
                  </div>
                </div>
              </div>

              {/* City-Wise Booking & Revenue Statistics Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950">
                      City-Wise Booking & Revenue Statistics
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live breakdown of PIN coverage, active vendors, booking status counts, and
                      recorded revenue by city.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(linkTo('/cities-pins'))}
                    className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Cities & PINs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">City & State</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Active PINs</th>
                        <th className="py-3 px-3">Active Vendors</th>
                        <th className="py-3 px-3">Total Bookings</th>
                        <th className="py-3 px-3">Pending / Accepted / In-Prog</th>
                        <th className="py-3 px-3">Completed / Cancelled</th>
                        <th className="py-3 px-4 text-right">Paid Revenue</th>
                        <th className="py-3 px-4 text-right">Pending Collection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dashboardMetrics.cityStats.map((cs) => (
                        <tr key={cs.cityId} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-950">
                            {cs.cityName}{' '}
                            <span className="text-slate-500 font-normal">({cs.state})</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                cs.active
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {cs.active ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold">{cs.pinCount} PINs</td>
                          <td className="py-3 px-3 font-semibold">{cs.activeVendorsCount}</td>
                          <td className="py-3 px-3 font-extrabold text-slate-950">
                            {cs.totalBookings}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-amber-700 font-bold">{cs.pendingBookings}</span> /{' '}
                            <span className="text-blue-700 font-bold">{cs.acceptedBookings}</span> /{' '}
                            <span className="text-teal-700 font-bold">{cs.inProgressBookings}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-emerald-700 font-bold">
                              {cs.completedBookings}
                            </span>{' '}
                            /{' '}
                            <span className="text-rose-600 font-bold">{cs.cancelledBookings}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                            {formatPaiseToInr(cs.paidRevenuePaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            {formatPaiseToInr(cs.pendingCollectionPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Bookings & Notifications Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-slate-950">
                      Recent Bookings Requiring Attention
                    </h2>
                    <button
                      type="button"
                      onClick={() => onNavigate(linkTo('/bookings'))}
                      className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open All Bookings ({bookings.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {bookings.slice(0, 5).map((bk) => (
                      <div
                        key={bk.id}
                        className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-950 font-mono">
                              {bk.bookingNumber}
                            </span>
                            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              {bk.cityName} · {bk.pinCode}
                            </span>
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                              {bk.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800">
                            {bk.serviceTitle} ({bk.variantName})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Customer: {bk.customerName} ({bk.customerPhone}) · Slot:{' '}
                            {bk.preferredDate} {bk.preferredSlot}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-950">
                              {formatPaiseToInr(bk.quoteSnapshot?.finalTotalPaise || 0)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {bk.assignedVendorName || 'Unassigned'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingId(bk.id);
                              onNavigate(linkTo('/bookings'));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Notifications Feed */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-slate-950">
                      Important Notifications
                    </h2>
                    <span className="text-xs font-bold text-teal-700">
                      {unreadNotifCount} Unread
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                      >
                        <div className="font-bold text-slate-950">{n.title}</div>
                        <div className="text-slate-600 leading-relaxed">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 2: BOOKING & DISPATCH MANAGEMENT
              ================================================================= */}
          {activeSection === 'bookings' && (
            <div className="space-y-6">
              {/* Header with Title and Clear All Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">
                    Bookings & Dispatch Operations ({bookings.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track real-time bookings, assign partner technicians, update service status, or clear test data.
                  </p>
                </div>
                {bookings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllBookings}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Booking History</span>
                  </button>
                )}
              </div>

              {/* Filters Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="lg:col-span-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bookingSearch}
                      onChange={(e) => {
                        setBookingSearch(e.target.value);
                        setBookingPage(1);
                      }}
                      placeholder="Search booking #, customer name, phone, PIN..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <select
                    aria-label="Filter bookings by city"
                    value={bookingCityFilter}
                    onChange={(e) => {
                      setBookingCityFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ALL">All Cities</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={bookingPinFilter}
                    onChange={(e) => {
                      setBookingPinFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    placeholder="Filter by 6-digit PIN"
                    className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />

                  <select
                    aria-label="Filter bookings by status"
                    value={bookingStatusFilter}
                    onChange={(e) => {
                      setBookingStatusFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="requested">Requested (Unassigned)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="assigned_to_vendor">Assigned to Vendor</option>
                    <option value="vendor_accepted">Vendor Accepted</option>
                    <option value="vendor_rejected">Vendor Rejected</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  <select
                    aria-label="Filter bookings by vendor"
                    value={bookingVendorFilter}
                    onChange={(e) => {
                      setBookingVendorFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ALL">All Vendors</option>
                    <option value="UNASSIGNED">Unassigned Only</option>
                    {vendors.map((v) => (
                      <option key={v.uid} value={v.uid}>
                        {v.displayName} ({v.vendorCode || v.uid})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bookings Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-3 px-3">Booking # & Customer</th>
                          <th className="py-3 px-2.5">City & PIN</th>
                          <th className="py-3 px-2.5">Service & Slot</th>
                          <th className="py-3 px-2.5">Vendor</th>
                          <th className="py-3 px-2.5">Status & Total</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedBookings.map((bk) => {
                          const isSelected = selectedBookingId === bk.id;
                          return (
                            <tr
                              key={bk.id}
                              className={
                                isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                              }
                            >
                              <td className="py-3 px-3">
                                <div className="font-extrabold text-slate-950 font-mono whitespace-nowrap">
                                  {bk.bookingNumber}
                                </div>
                                <div className="font-semibold text-slate-800 mt-0.5">
                                  {bk.customerName}
                                </div>
                                <div className="text-[11px] text-slate-500 whitespace-nowrap">
                                  {bk.customerPhone}
                                </div>
                              </td>
                              <td className="py-3 px-2.5">
                                <div className="font-bold text-slate-900">{bk.cityName}</div>
                                <div className="text-[11px] font-mono text-teal-700 font-bold whitespace-nowrap">
                                  PIN {bk.pinCode}
                                </div>
                              </td>
                              <td className="py-3 px-2.5">
                                <div className="font-bold text-slate-900 max-w-[155px] truncate">
                                  {bk.serviceTitle}
                                </div>
                                <div className="text-[11px] text-slate-600 max-w-[155px] truncate">
                                  {bk.variantName}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {bk.preferredDate}
                                </div>
                              </td>
                              <td className="py-3 px-2.5">
                                {bk.assignedVendorName ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] max-w-[135px]">
                                    <UserCheck className="w-3 h-3 text-teal-700 shrink-0" />
                                    <span className="truncate">{bk.assignedVendorName}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2.5">
                                <div className="font-bold uppercase text-[10px] text-slate-900">
                                  {bk.status.replace(/_/g, ' ')}
                                </div>
                                <div className="text-xs font-extrabold text-teal-700 mt-0.5">
                                  {formatPaiseToInr(bk.quoteSnapshot?.finalTotalPaise || 0)}
                                </div>
                                <div className="text-[10px] uppercase font-semibold text-slate-500">
                                  {bk.paymentStatus}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={buildWhatsAppLink(
                                      bk.customerPhone,
                                      buildCustomerBookingConfirmedWhatsApp(bk)
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`1-Click WhatsApp to ${bk.customerName} (${bk.customerPhone})`}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBookingId(bk.id);
                                      setAssignVendorUid(bk.assignedVendorUid || '');
                                      setRescheduleDate(bk.preferredDate);
                                      setRescheduleSlot(bk.preferredSlot);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                                  >
                                    Inspect
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete Booking"
                                    onClick={() => handleDeleteBooking(bk.id, bk.bookingNumber)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Showing {paginatedBookings.length} of {filteredBookings.length} booking(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={bookingPage <= 1}
                        onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold">
                        Page {bookingPage} of {totalBookingPages}
                      </span>
                      <button
                        type="button"
                        disabled={bookingPage >= totalBookingPages}
                        onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Booking Inspector & Vendor Assignment Drawer */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
                  {selectedBooking ? (
                    <>
                      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-teal-700">
                            {selectedBooking.bookingNumber}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-950">
                            {selectedBooking.customerName}
                          </h3>
                          <p className="text-xs text-slate-600">
                            {selectedBooking.customerPhone} · {selectedBooking.addressLine},{' '}
                            {selectedBooking.cityName} ({selectedBooking.pinCode})
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold uppercase">
                          {selectedBooking.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Service & Quote Breakdown */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="font-bold text-slate-950">
                          {selectedBooking.serviceTitle} — {selectedBooking.variantName}
                        </div>
                        <div className="text-slate-600">
                          Scheduled: <strong>{selectedBooking.preferredDate}</strong> (
                          {selectedBooking.preferredSlot})
                        </div>
                        {selectedBooking.customerNotes && (
                          <div className="text-slate-600 italic">
                            Note: &ldquo;{selectedBooking.customerNotes}&rdquo;
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-950">
                          <div>
                            <div>Authoritative Total:</div>
                            <div className="text-[11px] font-normal text-slate-500">
                              Mode: {selectedBooking.paymentMethod === 'razorpay_online' ? 'Razorpay Prepaid' : 'Pay After Service'} · 
                              Status: <span className={selectedBooking.paymentStatus === 'paid' ? 'text-emerald-700 font-bold' : 'text-slate-700'}>{selectedBooking.paymentStatus.toUpperCase()}</span>
                              {selectedBooking.razorpayPaymentId && (
                                <span className="block font-mono text-[10px] text-teal-800">
                                  Ref: {selectedBooking.razorpayPaymentId}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-teal-700 text-sm">
                            {formatPaiseToInr(
                              selectedBooking.quoteSnapshot?.finalTotalPaise || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click WhatsApp Direct Dispatch Center */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-extrabold text-emerald-950 text-xs">
                            <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                            <span>1-Click WhatsApp Dispatch Center</span>
                          </div>
                          <span className="text-[10px] font-semibold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300/40">
                            Instant Web/App Send · ₹0 Cost
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Button 1: Send Booking Confirmation to Customer */}
                          <a
                            href={buildWhatsAppLink(
                              selectedBooking.customerPhone,
                              buildCustomerBookingConfirmedWhatsApp(selectedBooking)
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>WhatsApp Booking Confirm</span>
                          </a>

                          {/* Button 2: Send WhatsApp Job Alert to Assigned Vendor */}
                          {selectedBooking.assignedVendorUid ? (
                            <a
                              href={(() => {
                                const vnd = vendors.find(
                                  (v) => v.uid === selectedBooking.assignedVendorUid
                                );
                                return buildWhatsAppLink(
                                  vnd?.phone || '',
                                  buildVendorDispatchWhatsApp(selectedBooking, {
                                    displayName:
                                      selectedBooking.assignedVendorName ||
                                      vnd?.displayName ||
                                      'Partner',
                                    vendorCode: vnd?.vendorCode,
                                  })
                                );
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                              <span>WhatsApp Vendor Alert</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold cursor-not-allowed text-xs border border-slate-200"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5" />
                              <span>Assign Vendor to Alert</span>
                            </button>
                          )}

                          {/* Button 3: Send Technician Details to Customer (if vendor assigned) */}
                          {selectedBooking.assignedVendorUid && (
                            <a
                              href={(() => {
                                const vnd = vendors.find(
                                  (v) => v.uid === selectedBooking.assignedVendorUid
                                );
                                return buildWhatsAppLink(
                                  selectedBooking.customerPhone,
                                  buildCustomerTechnicianAssignedWhatsApp(selectedBooking, {
                                    displayName:
                                      selectedBooking.assignedVendorName ||
                                      vnd?.displayName ||
                                      'Lead Technician',
                                    phone: vnd?.phone || '+91 96481 75639',
                                    vendorCode: vnd?.vendorCode,
                                  })
                                );
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Send Tech Info to Customer</span>
                            </a>
                          )}

                          {/* Button 4: Send Completion & 7-Day Warranty */}
                          <a
                            href={buildWhatsAppLink(
                              selectedBooking.customerPhone,
                              buildCustomerJobCompletedWhatsApp(selectedBooking)
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold transition-colors cursor-pointer"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Job Completed & Warranty</span>
                          </a>
                        </div>
                      </div>

                      {/* Vendor Assignment Control */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-slate-950">
                            Vendor Assignment (PIN {selectedBooking.pinCode})
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAssignVendor(selectedBooking.id, true)}
                            className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Assign Best Vendor
                          </button>
                        </div>

                        <select
                          aria-label="Select vendor to assign"
                          value={assignVendorUid}
                          onChange={(e) => setAssignVendorUid(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                        >
                          <option value="">-- Select Eligible Vendor --</option>
                          {eligibleVendorsForSelectedBooking.map((v) => (
                            <option key={v.uid} value={v.uid}>
                              [Eligible] {v.displayName} ({v.vendorCode}) · Load:{' '}
                              {v.activeAssignedJobs}/{v.maxActiveJobs}
                            </option>
                          ))}
                          {vendors
                            .filter(
                              (v) =>
                                !eligibleVendorsForSelectedBooking.some((ev) => ev.uid === v.uid)
                            )
                            .map((v) => (
                              <option key={v.uid} value={v.uid}>
                                [Override] {v.displayName} ({v.status})
                              </option>
                            ))}
                        </select>

                        <input
                          type="text"
                          value={adminActionNote}
                          onChange={(e) => setAdminActionNote(e.target.value)}
                          placeholder="Optional dispatch / status audit note..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                        />

                        <button
                          type="button"
                          disabled={!assignVendorUid}
                          onClick={() => handleAssignVendor(selectedBooking.id, false)}
                          className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer"
                        >
                          Assign / Reassign Selected Vendor
                        </button>
                      </div>

                      {/* Status, Reschedule & Payment Controls */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-200">
                        <div className="text-xs font-extrabold text-slate-950">
                          Lifecycle Status & Payment Override
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { status: 'confirmed', label: 'Mark Confirmed' },
                              { status: 'in_progress', label: 'Mark In-Progress' },
                              { status: 'completed', label: 'Mark Completed & Paid' },
                              { status: 'cancelled', label: 'Cancel Booking' },
                              { status: 'refunded', label: 'Process Refund' },
                            ] as const
                          ).map((btn) => (
                            <button
                              key={btn.status}
                              type="button"
                              onClick={() =>
                                handleBookingStatusUpdate(selectedBooking.id, {
                                  status: btn.status,
                                })
                              }
                              className="py-1.5 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-800 cursor-pointer"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>

                        {/* Reschedule Slot */}
                        <div className="pt-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={rescheduleSlot}
                              onChange={(e) => setRescheduleSlot(e.target.value)}
                              placeholder="Slot e.g. 02:00 PM - 04:00 PM"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleBookingStatusUpdate(selectedBooking.id, {
                                preferredDate: rescheduleDate,
                                preferredSlot: rescheduleSlot,
                              })
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                          >
                            Reschedule Date & Time Slot
                          </button>
                        </div>
                      </div>

                      {/* Immutable Booking Audit Log */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="text-xs font-extrabold text-slate-950">
                          Audit Trail ({selectedBookingEvents.length} Events)
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {selectedBookingEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                            >
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 flex-wrap">
                                  <span>
                                    {ev.actorName} ({ev.actorRole})
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                  <span className="text-teal-700 uppercase">{ev.toStatus}</span>
                                </span>
                              </div>
                              <div className="text-slate-600 mt-0.5">{ev.note}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delete Booking Danger Action */}
                      <div className="pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteBooking(
                              selectedBooking.id,
                              selectedBooking.bookingNumber
                            )
                          }
                          className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Booking ({selectedBooking.bookingNumber})</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Select any booking on the left to inspect customer details, assign an
                      eligible vendor, reschedule, or review the audit trail.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 3: SERVICE, CATEGORY & PRICING MANAGEMENT
              ================================================================= */}
          {activeSection === 'services' && (
            <div className="space-y-6">
              {/* Sub-Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: 'services', label: `Services Catalog (${services.length})` },
                      { id: 'categories', label: `Categories (${categories.length})` },
                      {
                        id: 'pricing',
                        label: `City & Vendor Price Overrides (${priceOverrides.length})`,
                      },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setServiceTab(t.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        serviceTab === t.id
                          ? 'bg-slate-950 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {serviceTab === 'services' && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingService({
                        title: '',
                        categoryId: categories[0]?.id || 'cat_water_tank',
                        shortDescription: '',
                        fullDescription: '',
                        imageUrl: '/assets/tankmanpro/water-tank.jpg',
                        durationMinutes: 60,
                        basePricePaise: 49900,
                        defaultPricingMode: 'city_fixed',
                        supportedCityIds: cities.map((c) => c.id),
                        status: 'published',
                        bookingRequirements: {
                          requireTankCapacity: false,
                          requireUnitCount: true,
                          allowCustomerPhotos: true,
                          safetyChecklistRequired: true,
                        },
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Service
                  </button>
                )}
              </div>

              {/* Add / Edit Service Modal Form */}
              {editingService && (
                <form
                  onSubmit={handleSaveService}
                  className="bg-white border-2 border-teal-600 rounded-2xl p-6 space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      {editingService.id ? `Edit Service: ${editingService.title}` : 'Add New Service'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Service Name *</label>
                      <input
                        type="text"
                        required
                        value={editingService.title || ''}
                        onChange={(e) =>
                          setEditingService({ ...editingService, title: e.target.value })
                        }
                        placeholder="e.g. Pest Control & Herbal Sanitizing"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category *</label>
                      <select
                        value={editingService.categoryId || ''}
                        onChange={(e) =>
                          setEditingService({ ...editingService, categoryId: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Base Price (₹ INR) *
                      </label>
                      <input
                        type="number"
                        required
                        min={99}
                        value={Math.round((editingService.basePricePaise || 49900) / 100)}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            basePricePaise: Math.round(Number(e.target.value) * 100),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min={15}
                        value={editingService.durationMinutes || 60}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            durationMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pricing Mode</label>
                      <select
                        value={editingService.defaultPricingMode || 'city_fixed'}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            defaultPricingMode: e.target.value as PricingMode,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        <option value="city_fixed">City Fixed Tariff</option>
                        <option value="vendor_offer">Vendor Offer Pricing</option>
                      </select>
                    </div>

                  </div>

                  {/* Dedicated Service Image Section: Upload from Device, Image URL, or Verified Gallery */}
                  <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-900">
                          Service Cover Photo &amp; Visual Presentation
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Add an attractive photo for customers. Choose from your device, enter a link, or pick from our library.
                        </p>
                      </div>

                      {/* Mode Switcher Tabs */}
                      <div className="inline-flex rounded-xl bg-slate-200/90 p-0.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setServiceImageMode('upload')}
                          className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            serviceImageMode === 'upload'
                              ? 'bg-white text-teal-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload from Device
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceImageMode('url')}
                          className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            serviceImageMode === 'url'
                              ? 'bg-white text-teal-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Paste Web Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceImageMode('preset')}
                          className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            serviceImageMode === 'preset'
                              ? 'bg-white text-teal-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Verified Gallery ({AVAILABLE_SERVICE_IMAGES.length})
                        </button>
                      </div>
                    </div>

                    {/* Mode 1: Upload from Computer / Device */}
                    {serviceImageMode === 'upload' && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-dashed border-teal-600/40 hover:border-teal-600 transition-colors">
                        <label
                          htmlFor="service-image-file-input"
                          className="flex-1 w-full flex flex-col items-center justify-center p-5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-teal-50/50 cursor-pointer text-center group transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            Click to select an image from your device
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            Supports PNG, JPG, JPEG, WEBP (Auto-optimized for ultra fast loading)
                          </span>
                          <input
                            id="service-image-file-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleServiceImageFileUpload}
                          />
                        </label>

                        {editingService.imageUrl && (
                          <div className="shrink-0 flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <img
                              src={editingService.imageUrl}
                              alt="Active Service Preview"
                              className="w-20 h-20 object-cover rounded-lg border border-slate-300 shadow-xs"
                            />
                            <div className="text-[11px] space-y-1">
                              <div className="font-bold text-slate-900">Current Photo</div>
                              <div className="text-[10px] text-slate-500 max-w-[130px] truncate font-mono">
                                {editingService.imageUrl.startsWith('data:')
                                  ? 'Custom Uploaded File'
                                  : editingService.imageUrl}
                              </div>
                              <span className="inline-block text-[9px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                Ready to Save
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 2: Paste Direct Image URL */}
                    {serviceImageMode === 'url' && (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Direct Web Image URL (HTTPS)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/... or https://example.com/photo.jpg"
                              value={editingService.imageUrl || ''}
                              onChange={(e) =>
                                setEditingService({ ...editingService, imageUrl: e.target.value.trim() })
                              }
                              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:border-teal-700 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingService.imageUrl) {
                                  setEditingService({
                                    ...editingService,
                                    imageUrl: '/assets/tankmanpro/water-tank.jpg',
                                  });
                                }
                              }}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        </div>

                        {editingService.imageUrl && (
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                            <img
                              src={editingService.imageUrl}
                              alt="Web URL Preview"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/tankmanpro/water-tank.jpg';
                              }}
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                            />
                            <div className="text-[11px] text-slate-600">
                              <span className="font-bold text-slate-900 block">Preview Loaded</span>
                              If the image doesn&apos;t load, check URL correctness or browser CORS policy.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 3: Verified Visual Catalog Gallery */}
                    {serviceImageMode === 'preset' && (
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-700 mb-1">
                          Select from TankmanPro Verified High-Resolution Photos:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                          {AVAILABLE_SERVICE_IMAGES.map((img) => {
                            const isSelected = editingService.imageUrl === img.url;
                            return (
                              <button
                                key={img.url}
                                type="button"
                                onClick={() =>
                                  setEditingService({ ...editingService, imageUrl: img.url })
                                }
                                className={`relative group rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-teal-600 ring-2 ring-teal-600/30'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <img
                                  src={img.url}
                                  alt={img.label}
                                  className="w-full h-16 object-cover"
                                />
                                <div className="p-1.5 bg-white text-[10px] font-semibold text-slate-800 truncate">
                                  {img.label}
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-teal-600 text-white rounded-full p-0.5 shadow-sm">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Short Summary
                      </label>
                      <input
                        type="text"
                        value={editingService.shortDescription || ''}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            shortDescription: e.target.value,
                          })
                        }
                        placeholder="Brief 1-line summary shown on service cards"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Supported Cities
                      </label>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {cities.map((c) => {
                          const checked = (editingService.supportedCityIds || []).includes(c.id);
                          return (
                            <label key={c.id} className="inline-flex items-center gap-1.5 font-semibold">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const curr = editingService.supportedCityIds || [];
                                  setEditingService({
                                    ...editingService,
                                    supportedCityIds: e.target.checked
                                      ? [...curr, c.id]
                                      : curr.filter((id) => id !== c.id),
                                  });
                                }}
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold cursor-pointer"
                    >
                      Save & Publish Service
                    </button>
                  </div>
                </form>
              )}

              {serviceTab === 'services' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <select
                        value={serviceCategoryFilter}
                        onChange={(e) => setServiceCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="ALL">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={serviceStatusFilter}
                        onChange={(e) => setServiceStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft (Unpublished)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <span className="text-xs text-slate-500">
                      Services referenced by bookings are protected against hard deletion and archived instead.
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Base Price & Mode</th>
                          <th className="py-3 px-3">Packages</th>
                          <th className="py-3 px-3">Cities</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {services
                          .filter((s) => {
                            if (
                              serviceCategoryFilter !== 'ALL' &&
                              s.categoryId !== serviceCategoryFilter
                            )
                              return false;
                            if (serviceStatusFilter !== 'ALL' && s.status !== serviceStatusFilter)
                              return false;
                            if (
                              serviceSearch.trim() &&
                              !s.title.toLowerCase().includes(serviceSearch.trim().toLowerCase())
                            )
                              return false;
                            return true;
                          })
                          .map((svc) => {
                            const cat = categories.find((c) => c.id === svc.categoryId);
                            const delEval = evaluateServiceDeletion(svc.id, bookings);
                            return (
                              <tr key={svc.id} className="hover:bg-slate-50">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={svc.imageUrl}
                                      alt={svc.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                    <div>
                                      <div className="font-extrabold text-slate-950">
                                        {svc.title}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {svc.durationMinutes} mins · {delEval.referencedBookingsCount} booking(s)
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 font-semibold text-slate-700">
                                  {cat?.name || svc.categoryId}
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-extrabold text-slate-950">
                                    {formatPaiseToInr(svc.basePricePaise)}
                                  </div>
                                  <div className="text-[11px] text-teal-700 font-semibold">
                                    {svc.defaultPricingMode === 'vendor_offer'
                                      ? 'Vendor Offer'
                                      : 'City Fixed'}
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 font-semibold">
                                  {svc.variants.length} Variant(s) · {svc.addons.length} Add-on(s)
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="flex flex-wrap gap-1">
                                    {svc.supportedCityIds.map((cid) => {
                                      const cname =
                                        cities.find((c) => c.id === cid)?.name || cid;
                                      return (
                                        <span
                                          key={cid}
                                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold"
                                        >
                                          {cname}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                                      svc.status === 'published'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : svc.status === 'draft'
                                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                          : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {svc.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingService(svc)}
                                      className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    {svc.status === 'published' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleServiceStatusChange(svc.id, 'draft')}
                                        className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-bold cursor-pointer"
                                      >
                                        Unpublish
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleServiceStatusChange(svc.id, 'published')
                                        }
                                        className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold cursor-pointer"
                                      >
                                        Publish
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrArchiveService(svc.id)}
                                      title={delEval.message}
                                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                    >
                                      {delEval.canHardDelete ? (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      ) : (
                                        <Archive className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {serviceTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <form
                    onSubmit={handleCreateCategory}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit"
                  >
                    <h3 className="text-sm font-extrabold text-slate-950">
                      Create Service Category
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Pest Control & Fumigation"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={newCategoryDesc}
                          onChange={(e) => setNewCategoryDesc(e.target.value)}
                          placeholder="Herbal cockroach, termite & mosquito control"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-slate-950 text-white font-bold cursor-pointer"
                      >
                        Add Category
                      </button>
                    </div>
                  </form>

                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-3 px-4">Category Name</th>
                          <th className="py-3 px-3">Slug</th>
                          <th className="py-3 px-3">Description</th>
                          <th className="py-3 px-3">Services</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {categories.map((cat) => (
                          <tr key={cat.id}>
                            <td className="py-3 px-4 font-extrabold text-slate-950">{cat.name}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{cat.slug}</td>
                            <td className="py-3 px-3 text-slate-600">{cat.shortDescription}</td>
                            <td className="py-3 px-3 font-bold">
                              {services.filter((s) => s.categoryId === cat.id).length}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                                {cat.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {serviceTab === 'pricing' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <form
                    onSubmit={handleSavePriceOverride}
                    className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 text-xs h-fit"
                  >
                    <h3 className="text-sm font-extrabold text-slate-950">
                      Set City / Vendor Price Override
                    </h3>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Service</label>
                      <select
                        value={poServiceId}
                        onChange={(e) => {
                          const s = services.find((item) => item.id === e.target.value);
                          setPoServiceId(e.target.value);
                          if (s && s.variants[0]) setPoVariantId(s.variants[0].id);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Package / Variant
                      </label>
                      <select
                        value={poVariantId}
                        onChange={(e) => setPoVariantId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        {(
                          services.find((s) => s.id === poServiceId)?.variants || []
                        ).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} (Base: {formatPaiseToInr(v.basePricePaise)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <select
                        value={poCityId}
                        onChange={(e) => setPoCityId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Vendor (Optional — leave blank for City-wide Override)
                      </label>
                      <select
                        value={poVendorUid}
                        onChange={(e) => setPoVendorUid(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      >
                        <option value="">City-Level Fixed Override (All Vendors)</option>
                        {vendors.map((v) => (
                          <option key={v.uid} value={v.uid}>
                            Vendor: {v.displayName} ({v.vendorCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Override Tariff (₹ INR)
                      </label>
                      <input
                        type="number"
                        min={49}
                        required
                        value={poAmountRupees}
                        onChange={(e) => setPoAmountRupees(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-slate-950 text-white font-bold cursor-pointer"
                    >
                      Save Price Override
                    </button>
                  </form>

                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-3 px-4">Service & Variant</th>
                          <th className="py-3 px-3">City</th>
                          <th className="py-3 px-3">Scope</th>
                          <th className="py-3 px-4 text-right">Override Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {priceOverrides.map((po) => {
                          const svc = services.find((s) => s.id === po.serviceId);
                          const variant = svc?.variants.find((v) => v.id === po.variantId);
                          const city = cities.find((c) => c.id === po.cityId);
                          const vnd = vendors.find((v) => v.uid === po.vendorUid);
                          return (
                            <tr key={po.id}>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-950">
                                  {svc?.title || po.serviceId}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {variant?.name || po.variantId}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold">
                                {city?.name || po.cityId}
                              </td>
                              <td className="py-3 px-3">
                                {vnd ? (
                                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">
                                    Vendor: {vnd.displayName}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                    City Override
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold text-slate-950">
                                {formatPaiseToInr(po.amountPaise)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SECTION 4: CITIES & 6-DIGIT PIN CODE MANAGEMENT + CSV BULK IMPORT
              ================================================================= */}
          {activeSection === 'cities-pins' && (
            <div className="space-y-6">
              {/* Top Row: Add City & Add Single PIN Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* City Manager */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-slate-950">
                      Serviceable Cities ({cities.length})
                    </h2>
                  </div>

                  <form onSubmit={handleAddCity} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <input
                      type="text"
                      required
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder="City Name (e.g. Lucknow)"
                      className="px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      required
                      value={newCityState}
                      onChange={(e) => setNewCityState(e.target.value)}
                      placeholder="State (e.g. Uttar Pradesh)"
                      className="px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl bg-slate-950 text-white font-bold cursor-pointer"
                    >
                      + Add City
                    </button>
                  </form>

                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {cities.map((c) => {
                      const pinCount = serviceAreas.filter((a) => a.cityId === c.id).length;
                      return (
                        <div
                          key={c.id}
                          className="py-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-950">{c.name}</span>{' '}
                            <span className="text-slate-500">({c.state})</span>
                            <span className="ml-2 text-[11px] font-semibold text-teal-700">
                              {pinCount} PIN code(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCity(c)}
                              className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                                c.active
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {c.active ? 'Active' : 'Paused'}
                            </button>
                            <button
                              type="button"
                              title={`Delete city "${c.name}"`}
                              onClick={() => handleDeleteCity(c.id, c.name)}
                              className="p-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Single PIN Code Add / Conflict Check */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950">
                      Add / Update 6-Digit PIN Code
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Validates 6-digit Indian PIN format and checks for cross-city location conflicts.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => handleAddPinCode(e, false)}
                    className="space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          6-Digit PIN Code *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={newPinCode}
                          onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 208005"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Assign to City *
                        </label>
                        <select
                          value={newPinCityId}
                          onChange={(e) => setNewPinCityId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                        >
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.state})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Locality / Zone Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPinZone}
                        onChange={(e) => setNewPinZone(e.target.value)}
                        placeholder="e.g. Kidwai Nagar & Saket Nagar"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                    >
                      Verify & Save PIN Code Coverage
                    </button>
                  </form>
                </div>
              </div>

              {/* Bulk CSV Import & Conflict Review Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                      Bulk Import PIN Codes via Validated CSV
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Format: <code className="font-mono">pinCode,cityName,state,zoneLabel,active</code>.
                      Catches duplicate PINs, invalid formats, and cross-city location conflicts before committing.
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowConflictOverride}
                      onChange={(e) => setAllowConflictOverride(e.target.checked)}
                    />
                    <span>
                      Approve & Override Cross-City Location Conflicts (if any detected during review)
                    </span>
                  </label>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePreviewCsv}
                      className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold cursor-pointer"
                    >
                      1. Validate & Preview CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitCsv}
                      className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      2. Commit Validated PINs
                    </button>
                  </div>
                </div>

                {csvPreviewResult && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="font-extrabold text-slate-950">
                      CSV Validation Report: {csvPreviewResult.summary.validCount} Valid ·{' '}
                      <span className="text-amber-700">
                        {csvPreviewResult.summary.conflictCount} Location Conflict(s)
                      </span>{' '}
                      ·{' '}
                      <span className="text-rose-700">
                        {csvPreviewResult.summary.invalidCount} Invalid / Duplicate
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {csvPreviewResult.rows.map((r) => (
                        <div
                          key={`${r.rowNumber}_${r.pinCode}`}
                          className="flex items-center justify-between py-1 border-b border-slate-200/70"
                        >
                          <span className="font-mono font-bold">
                            Row {r.rowNumber}: {r.pinCode} ({r.cityName} — {r.zoneLabel})
                          </span>
                          <span
                            className={`font-semibold ${
                              r.status === 'conflict'
                                ? 'text-amber-700'
                                : r.status === 'invalid'
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                            }`}
                          >
                            {r.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active PIN Codes Directory */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pinSearch}
                      onChange={(e) => setPinSearch(e.target.value)}
                      placeholder="Search PIN code or locality..."
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                    <select
                      value={pinCityFilter}
                      onChange={(e) => setPinCityFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="ALL">All Cities</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Total Mapped PINs: {serviceAreas.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">6-Digit PIN</th>
                        <th className="py-3 px-3">City</th>
                        <th className="py-3 px-3">Zone / Neighbourhoods</th>
                        <th className="py-3 px-3">Covering Vendors</th>
                        <th className="py-3 px-3">Serviceability</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceAreas
                        .filter((a) => {
                          if (pinCityFilter !== 'ALL' && a.cityId !== pinCityFilter) return false;
                          if (pinSearch.trim()) {
                            const q = pinSearch.trim().toLowerCase();
                            return (
                              a.pinCode.includes(q) || a.zoneLabel.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((area) => {
                          const city = cities.find((c) => c.id === area.cityId);
                          const areaVendors = vendors.filter((v) =>
                            v.supportedAreaPins.includes(area.pinCode)
                          );
                          return (
                            <tr key={area.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono font-extrabold text-slate-950">
                                {area.pinCode}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-800">
                                {city?.name || area.cityName || area.cityId}
                              </td>
                              <td className="py-3 px-3 text-slate-600">{area.zoneLabel}</td>
                              <td className="py-3 px-3">
                                {areaVendors.length > 0 ? (
                                  <span className="font-semibold text-teal-700">
                                    {areaVendors.map((v) => v.displayName).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-semibold">
                                    No vendor assigned
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    area.active
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {area.active ? 'Serviceable' : 'Disabled'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinArea(area)}
                                  className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                                >
                                  {area.active ? 'Disable PIN' : 'Enable PIN'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 5: VENDOR MANAGEMENT & KYC
              ================================================================= */}
          {activeSection === 'vendors' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Search vendor name, ID (TMP-VND-...), phone..."
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl w-64"
                  />
                  <select
                    value={vendorCityFilter}
                    onChange={(e) => setVendorCityFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="ALL">All Cities</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={vendorStatusFilter}
                    onChange={(e) => setVendorStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active / Approved</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingVendor({
                      displayName: '',
                      businessName: '',
                      phone: '+91 ',
                      email: '',
                      password: 'TankmanPartner@2026',
                      status: 'active',
                      supportedCityIds: ['city_kanpur'],
                      supportedAreaPins: ['208001', '208002'],
                      supportedServiceIds: ['svc_water_tank_cleaning'],
                      maxActiveJobs: 6,
                      commissionPercent: 18,
                      experienceYearsLabel: '5+ Years Experience',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Register New Vendor
                </button>
              </div>

              {/* Register / Edit Vendor Form */}
              {editingVendor && (
                <form
                  onSubmit={handleSaveVendor}
                  className="bg-white border-2 border-teal-600 rounded-2xl p-6 space-y-4 shadow-lg text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      {editingVendor.uid
                        ? `Edit Vendor: ${editingVendor.displayName} (${editingVendor.vendorCode})`
                        : 'Register New Service Partner / Vendor'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingVendor(null)}
                      className="text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Vendor Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingVendor.displayName || ''}
                        onChange={(e) =>
                          setEditingVendor({ ...editingVendor, displayName: e.target.value })
                        }
                        placeholder="e.g. Suresh Kumar प्रजापति"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Business / Crew Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingVendor.businessName || ''}
                        onChange={(e) =>
                          setEditingVendor({ ...editingVendor, businessName: e.target.value })
                        }
                        placeholder="e.g. Ganga Mechanised Tank Cleaners"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Login Identity (Email) *
                      </label>
                      <input
                        type="email"
                        required
                        value={editingVendor.email || ''}
                        onChange={(e) =>
                          setEditingVendor({ ...editingVendor, email: e.target.value })
                        }
                        placeholder="partner@tankmanpro.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={editingVendor.phone || ''}
                        onChange={(e) =>
                          setEditingVendor({ ...editingVendor, phone: e.target.value })
                        }
                        placeholder="+91 98390 12345"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Partner Portal Password {editingVendor.uid ? '(Optional)' : '*'}
                      </label>
                      <input
                        type="text"
                        required={!editingVendor.uid}
                        value={editingVendor.password || ''}
                        onChange={(e) =>
                          setEditingVendor({ ...editingVendor, password: e.target.value })
                        }
                        placeholder={
                          editingVendor.uid ? 'Leave blank to keep existing' : 'e.g. Vendor@2026'
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Vendor uses this password to log in at /vendor/login with their email or ID.
                      </span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Max Concurrent Active Jobs
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={editingVendor.maxActiveJobs ?? 6}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            maxActiveJobs: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Platform Commission (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={editingVendor.commissionPercent ?? 18}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            commissionPercent: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Assign Cities, PINs & Services */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Assigned Cities
                      </label>
                      <div className="space-y-1">
                        {cities.map((c) => {
                          const checked = (editingVendor.supportedCityIds || []).includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const curr = editingVendor.supportedCityIds || [];
                                  setEditingVendor({
                                    ...editingVendor,
                                    supportedCityIds: e.target.checked
                                      ? [...curr, c.id]
                                      : curr.filter((id) => id !== c.id),
                                  });
                                }}
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Assigned 6-Digit PIN Codes
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                        {serviceAreas.map((a) => {
                          const checked = (editingVendor.supportedAreaPins || []).includes(
                            a.pinCode
                          );
                          return (
                            <label key={a.pinCode} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const curr = editingVendor.supportedAreaPins || [];
                                  setEditingVendor({
                                    ...editingVendor,
                                    supportedAreaPins: e.target.checked
                                      ? [...curr, a.pinCode]
                                      : curr.filter((p) => p !== a.pinCode),
                                  });
                                }}
                              />
                              <span className="font-mono font-bold">{a.pinCode}</span>
                              <span className="text-slate-500 truncate">{a.zoneLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Authorized Services
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
                        {services.map((s) => {
                          const checked = (editingVendor.supportedServiceIds || []).includes(
                            s.id
                          );
                          return (
                            <label key={s.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const curr = editingVendor.supportedServiceIds || [];
                                  setEditingVendor({
                                    ...editingVendor,
                                    supportedServiceIds: e.target.checked
                                      ? [...curr, s.id]
                                      : curr.filter((id) => id !== s.id),
                                  });
                                }}
                              />
                              <span className="truncate">{s.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingVendor(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-950 text-white font-bold cursor-pointer"
                    >
                      Save Vendor Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Vendors Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">Vendor ID & Name</th>
                        <th className="py-3 px-3">Login Identity & Phone</th>
                        <th className="py-3 px-3">Cities & PIN Coverage</th>
                        <th className="py-3 px-3">Authorized Services</th>
                        <th className="py-3 px-3">Performance & Load</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {vendors
                        .filter((v) => {
                          if (vendorStatusFilter !== 'ALL' && v.status !== vendorStatusFilter)
                            return false;
                          if (
                            vendorCityFilter !== 'ALL' &&
                            !v.supportedCityIds.includes(vendorCityFilter)
                          )
                            return false;
                          if (vendorSearch.trim()) {
                            const q = vendorSearch.trim().toLowerCase();
                            return (
                              v.displayName.toLowerCase().includes(q) ||
                              v.businessName.toLowerCase().includes(q) ||
                              (v.vendorCode || '').toLowerCase().includes(q) ||
                              v.phone.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((vnd) => {
                          const vBookings = bookings.filter(
                            (b) => b.assignedVendorUid === vnd.uid
                          );
                          const vCompleted = vBookings.filter((b) => b.status === 'completed');
                          return (
                            <tr key={vnd.uid} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-[11px] font-extrabold text-teal-700">
                                  {vnd.vendorCode || vnd.uid}
                                </span>
                                <div className="font-extrabold text-slate-950">
                                  {vnd.displayName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {vnd.businessName}
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-semibold text-slate-800">{vnd.email}</div>
                                <div className="text-[11px] text-slate-500">{vnd.phone}</div>
                                <div className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-teal-200">
                                  Pass: {vnd.password || 'TankmanPartner@2026'}
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {vnd.supportedCityIds
                                    .map((cid) => cities.find((c) => c.id === cid)?.name || cid)
                                    .join(', ')}
                                </div>
                                <div className="text-[11px] font-mono text-teal-700">
                                  PINs: {vnd.supportedAreaPins.join(', ')}
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="font-semibold text-slate-700">
                                  {vnd.supportedServiceIds.length} Service(s)
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-900">
                                  Active Load: {vnd.activeAssignedJobs} / {vnd.maxActiveJobs}
                                </div>
                                <div className="text-[11px] text-emerald-700 font-semibold">
                                  {vCompleted.length} Completed ({vBookings.length} Assigned)
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                                    vnd.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : vnd.status === 'suspended' || vnd.status === 'rejected'
                                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {vnd.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex flex-wrap justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingVendor(vnd)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                                  >
                                    Edit Scope
                                  </button>
                                  {vnd.status !== 'active' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleVendorStatusChange(vnd.uid, 'active')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleVendorStatusChange(vnd.uid, 'suspended')
                                      }
                                      className="px-2.5 py-1 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 font-bold cursor-pointer"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleVendorPasswordReset(vnd)}
                                    title="Send Secure Password Setup / Reset Link"
                                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={buildWhatsAppLink(
                                      vnd.phone,
                                      `Namaste ${vnd.displayName} ji, TankmanPro Operations Head Desk se message hai. Kripya apna Partner Portal dashboard check karein: ${typeof window !== 'undefined' ? window.location.origin : 'https://tankmanpro.com'}/vendor`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`1-Click WhatsApp to Partner ${vnd.displayName} (${vnd.phone})`}
                                    className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer inline-flex items-center justify-center transition-colors"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteVendor(vnd.uid, vnd.displayName, vnd.vendorCode)
                                    }
                                    title={`Delete vendor "${vnd.displayName}"`}
                                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 6: WEBSITE CONTENT MANAGEMENT (CMS) & COUPONS
              ================================================================= */}
          {activeSection === 'cms' && cmsDraft && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Storefront CMS Editor */}
              <form
                onSubmit={handleSaveCms}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-xs"
              >
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Customer Website Content Management (CMS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update homepage hero text, announcement banner, contact details, and dispatch automation mode.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Homepage Hero Headline
                  </label>
                  <input
                    type="text"
                    value={cmsDraft.heroTitle}
                    onChange={(e) => setCmsDraft({ ...cmsDraft, heroTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Homepage Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={cmsDraft.heroSubtitle}
                    onChange={(e) => setCmsDraft({ ...cmsDraft, heroSubtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Top Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={cmsDraft.announcementText}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, announcementText: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={cmsDraft.supportPhone}
                      onChange={(e) =>
                        setCmsDraft({ ...cmsDraft, supportPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={cmsDraft.supportEmail}
                      onChange={(e) =>
                        setCmsDraft({ ...cmsDraft, supportEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Default Dispatch Mode
                    </label>
                    <select
                      value={cmsDraft.dispatchMode}
                      onChange={(e) =>
                        setCmsDraft({
                          ...cmsDraft,
                          dispatchMode: e.target.value as CmsSettings['dispatchMode'],
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="manual">Manual Admin Dispatch</option>
                      <option value="auto_lowest_load">
                        Automatic (By City + PIN + Lowest Vendor Load)
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Publish CMS Changes to Customer Website
                </button>
              </form>

              {/* Promotional Coupons Manager */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-xs">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Promotional Coupons & Offers ({coupons.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create or toggle discount codes validated by the server-authoritative pricing engine.
                  </p>
                </div>

                <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon Code (e.g. KANPUR100)"
                    className="px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <select
                    value={newCouponType}
                    onChange={(e) =>
                      setNewCouponType(e.target.value as 'percentage' | 'fixed')
                    }
                    className="px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="fixed">Flat Discount (₹ INR)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                  </select>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder={
                      newCouponType === 'percentage' ? 'Discount % (e.g. 10)' : 'Flat ₹ (e.g. 100)'
                    }
                    className="px-3 py-2 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    placeholder="Min Order Subtotal ₹ (e.g. 499)"
                    className="px-3 py-2 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="Promo description shown at checkout"
                    className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                  >
                    + Create / Update Coupon
                  </button>
                </form>

                <div className="divide-y divide-slate-200 border-t border-slate-200">
                  {coupons.map((cpn) => (
                    <div
                      key={cpn.id}
                      className="py-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono font-extrabold text-slate-950">
                          {cpn.code}
                        </span>
                        <span className="ml-2 text-teal-700 font-bold">
                          {cpn.discountType === 'percentage'
                            ? `${cpn.discountValue}% OFF`
                            : `${formatPaiseToInr(cpn.discountValue)} OFF`}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {cpn.description} · Min order:{' '}
                          {formatPaiseToInr(cpn.minOrderSubtotalPaise)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(cpn)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                            cpn.active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {cpn.active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          title={`Delete coupon ${cpn.code}`}
                          onClick={() => handleDeleteCoupon(cpn.id, cpn.code)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
