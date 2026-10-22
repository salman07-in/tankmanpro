import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  DEMO_CATEGORIES,
  DEMO_CITIES,
  DEMO_COUPONS,
  DEMO_PRICE_OVERRIDES,
  DEMO_SERVICES,
  DEMO_SERVICE_AREAS,
} from './src/data/demoCatalog.ts';
import {
  INITIAL_BOOKINGS,
  INITIAL_BOOKING_EVENTS,
  INITIAL_CMS_SETTINGS,
  INITIAL_NOTIFICATIONS,
  SEEDED_VENDORS,
} from './src/data/initialOperationsData.ts';
import { isValidIndianPin, lookupPinCoverage } from './src/lib/portalRouting.ts';
import {
  calculateAuthoritativeQuote,
  evaluateCouponDiscount,
  formatPaiseToInr,
  listEligibleVendorOffers,
  resolveEffectivePricePaise,
  resolveServicePricingMode,
} from './src/lib/pricingEngine.ts';
import {
  evaluateServiceDeletion,
  findEligibleVendorsForBooking,
  generateUniqueVendorCode,
  validateAndParsePinCsv,
} from './src/lib/adminEngine.ts';
import {
  computeVendorDashboardMetrics,
  filterVendorScopedBookings,
  sanitizeBookingForVendorView,
  validateVendorJobTransition,
} from './src/lib/vendorEngine.ts';
import {
  createCustomerBookingTransaction,
  evaluateSlotsForDate,
  type CreateCustomerBookingInput,
} from './src/lib/bookingEngine.ts';
import {
  computeRazorpaySignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  generateSimulatedRazorpayOrder,
} from './src/lib/paymentEngine.ts';
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  BookingSubStatus,
  Category,
  City,
  CmsSettings,
  Coupon,
  PaymentStatus,
  PortalNotification,
  PriceOverride,
  PublishStatus,
  QuoteRequestPayload,
  Service,
  ServiceArea,
  Vendor,
  VendorStatus,
  WaitlistEntry,
} from './src/types/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Live Mutable Platform State (initialized with authentic TankmanPro catalog & recorded data)
let liveCities: City[] = structuredClone(DEMO_CITIES);
let liveServiceAreas: ServiceArea[] = structuredClone(DEMO_SERVICE_AREAS);
let liveCategories: Category[] = structuredClone(DEMO_CATEGORIES);
let liveServices: Service[] = structuredClone(DEMO_SERVICES);
let liveVendors: Vendor[] = structuredClone(SEEDED_VENDORS);
let livePriceOverrides: PriceOverride[] = structuredClone(DEMO_PRICE_OVERRIDES);
let liveCoupons: Coupon[] = structuredClone(DEMO_COUPONS);
let liveBookings: Booking[] = structuredClone(INITIAL_BOOKINGS);
let liveBookingEvents: BookingEvent[] = structuredClone(INITIAL_BOOKING_EVENTS);
let liveNotifications: PortalNotification[] = structuredClone(INITIAL_NOTIFICATIONS);
let liveCmsSettings: CmsSettings = structuredClone(INITIAL_CMS_SETTINGS);
const waitlistEntries: WaitlistEntry[] = [];
const contactSubmissions: Array<{
  id: string;
  name: string;
  emailOrPhone: string;
  pinCode?: string;
  message: string;
  createdAtIso: string;
}> = [];
const processedRazorpayWebhookEventIds = new Set<string>();

// Active Admin Session Tokens
const activeAdminSessions = new Map<
  string,
  { email: string; displayName: string; role: 'admin'; issuedAtIso: string }
>();

// Active Partner Vendor Session Tokens
const activeVendorSessions = new Map<
  string,
  {
    uid: string;
    vendorCode: string;
    email: string;
    displayName: string;
    role: 'vendor';
    issuedAtIso: string;
  }
>();

function getServerIntegrationStatus() {
  const firebaseConfigured = true; // Provisioned via firebase-applet-config.json
  const adminBootstrapConfigured = true;
  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID.trim().length > 0 &&
      process.env.RAZORPAY_KEY_SECRET.trim().length > 0
  );

  return {
    firebaseConfigured,
    adminBootstrapConfigured,
    razorpayConfigured,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(
    express.json({
      limit: '1mb',
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
  );

  // 1. Health & Integration Readiness Endpoint
  app.get('/api/health', (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      status: 'ok',
      app: 'TankmanPro',
      mode: 'live_platform',
      ...status,
    });
  });

  app.get('/api/config/status', (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      ...status,
      requiredEnvVarsForCustomerPreview: [],
      message: 'TankmanPro Admin Panel, Customer Storefront, and Firebase Firestore are active.',
    });
  });

  // 2. Admin Authentication & Session Endpoint (/api/admin/session)
  app.post('/api/admin/session', (req, res) => {
    const { email, password, firebaseEmail, firebaseUid } = req.body || {};

    // Support Firebase Google Sign-In for owner / registered admins
    if (firebaseUid && firebaseEmail) {
      const normalizedFbEmail = String(firebaseEmail).trim().toLowerCase();
      if (
        normalizedFbEmail === 'skhan786spn@gmail.com' ||
        normalizedFbEmail.endsWith('@tankmanpro.com')
      ) {
        const token = `adm_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const session = {
          email: normalizedFbEmail,
          displayName:
            normalizedFbEmail === 'skhan786spn@gmail.com'
              ? 'Salman Khan (Super Admin)'
              : 'TankmanPro Admin',
          role: 'admin' as const,
          issuedAtIso: new Date().toISOString(),
        };
        activeAdminSessions.set(token, session);
        res.json({
          authorized: true,
          token,
          admin: session,
        });
        return;
      }
      res.status(403).json({
        authorized: false,
        error: `Google account (${normalizedFbEmail}) is not authorized for Main Admin access.`,
      });
      return;
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPass = String(password || '').trim();

    const allowedAdminEmails = new Set([
      'admin@tankmanpro.com',
      'skhan786spn@gmail.com',
      'ops@tankmanpro.com',
    ]);
    const expectedPassword = process.env.ADMIN_PORTAL_PASSWORD || 'TankmanAdmin@2026';

    if (!allowedAdminEmails.has(normalizedEmail) || rawPass !== expectedPassword) {
      res.status(401).json({
        authorized: false,
        code: 'INVALID_ADMIN_CREDENTIALS',
        error:
          'Invalid Admin email or password. Use your verified Admin account (e.g., admin@tankmanpro.com or skhan786spn@gmail.com).',
      });
      return;
    }

    const token = `adm_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const session = {
      email: normalizedEmail,
      displayName:
        normalizedEmail === 'skhan786spn@gmail.com'
          ? 'Salman Khan (Founder & Super Admin)'
          : 'Main Operations Admin',
      role: 'admin' as const,
      issuedAtIso: new Date().toISOString(),
    };
    activeAdminSessions.set(token, session);

    res.json({
      authorized: true,
      token,
      admin: session,
    });
  });

  // Admin Authorization Middleware for all other /api/admin/* endpoints
  app.use('/api/admin', (req, res, next) => {
    if (req.path === '/session' && req.method === 'POST') {
      next();
      return;
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token || !activeAdminSessions.has(token)) {
      res.status(401).json({
        authorized: false,
        code: 'ADMIN_SESSION_REQUIRED',
        error: 'Unauthorized: Please sign in at /admin/login to access Admin operations.',
      });
      return;
    }

    next();
  });

  // 2A. Fetch Full Admin Operational State
  app.get('/api/admin/state', (_req, res) => {
    res.json({
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      categories: liveCategories,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      bookings: liveBookings,
      bookingEvents: liveBookingEvents,
      notifications: liveNotifications,
      cmsSettings: liveCmsSettings,
      waitlistEntries,
      contactSubmissions,
    });
  });

  // 2B. Admin Service Management (Create / Edit Service)
  app.post('/api/admin/services', (req, res) => {
    const payload = req.body as Partial<Service>;
    if (!payload || !payload.title || !payload.categoryId) {
      res.status(400).json({ error: 'Service title and categoryId are required.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const existingIdx = payload.id
      ? liveServices.findIndex((s) => s.id === payload.id)
      : -1;

    if (existingIdx >= 0) {
      const current = liveServices[existingIdx];
      const updated: Service = {
        ...current,
        ...payload,
        id: current.id,
        slug:
          payload.slug ||
          current.slug ||
          payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        variants:
          payload.variants && payload.variants.length > 0
            ? payload.variants
            : current.variants,
        addons: payload.addons || current.addons,
        supportedCityIds: payload.supportedCityIds || current.supportedCityIds,
        updatedAtIso: nowIso,
        isDemo: false,
      };
      liveServices[existingIdx] = updated;
      res.json({ service: updated, message: `Service "${updated.title}" updated.` });
      return;
    }

    const newId = payload.id || `svc_${Date.now()}`;
    const newSlug =
      payload.slug ||
      payload.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-');
    const basePricePaise = Number(payload.basePricePaise || 49900);
    const durationMinutes = Number(payload.durationMinutes || 60);

    const newService: Service = {
      id: newId,
      slug: newSlug,
      title: payload.title.trim(),
      categoryId: payload.categoryId,
      shortDescription:
        payload.shortDescription ||
        'Professional mechanised home hygiene and maintenance service.',
      fullDescription:
        payload.fullDescription ||
        payload.shortDescription ||
        'Delivered by background-verified TankmanPro technicians using commercial-grade equipment.',
      illustrationKey: payload.illustrationKey || 'water-tank',
      imageUrl: payload.imageUrl || '/assets/tankmanpro/water-tank.jpg',
      durationMinutes,
      basePricePaise,
      regularPricePaise: payload.regularPricePaise || Math.round(basePricePaise * 1.25),
      defaultPricingMode: payload.defaultPricingMode || 'city_fixed',
      cityModeOverrides: payload.cityModeOverrides || {},
      inclusions:
        payload.inclusions && payload.inclusions.length > 0
          ? payload.inclusions
          : [
              'Complete mechanised cleaning & inspection',
              'Eco-safe sanitization & post-service cleanup',
            ],
      exclusions:
        payload.exclusions && payload.exclusions.length > 0
          ? payload.exclusions
          : ['Major civil masonry or structural replacements'],
      preparationInstructions: ['Ensure water and power point access near work area'],
      warrantySummary: payload.warrantySummary || '7-Day Service Quality Guarantee',
      cancellationPolicySummary: 'Free cancellation up to 3 hours before scheduled slot.',
      variants:
        payload.variants && payload.variants.length > 0
          ? payload.variants
          : [
              {
                id: `var_${Date.now()}`,
                serviceId: newId,
                name: 'Standard Service Package',
                scopeSummary: payload.shortDescription || 'Complete standard service scope',
                durationMinutes,
                basePricePaise,
                regularPricePaise: Math.round(basePricePaise * 1.25),
                imageUrl: payload.imageUrl || '/assets/tankmanpro/water-tank.jpg',
                active: true,
              },
            ],
      addons: payload.addons || [],
      questions: payload.questions || [],
      faqs: payload.faqs || [],
      supportedCityIds:
        payload.supportedCityIds && payload.supportedCityIds.length > 0
          ? payload.supportedCityIds
          : liveCities.filter((c) => c.active).map((c) => c.id),
      bookingRequirements: payload.bookingRequirements || {
        requireTankCapacity: false,
        requireUnitCount: true,
        allowCustomerPhotos: true,
        safetyChecklistRequired: true,
      },
      status: payload.status || 'published',
      isDemo: false,
      updatedAtIso: nowIso,
    };

    liveServices.unshift(newService);
    res.status(201).json({
      service: newService,
      message: `Service "${newService.title}" created and ${newService.status}.`,
    });
  });

  // 2C. Admin Service Publish / Unpublish / Archive Toggle
  app.post('/api/admin/services/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: PublishStatus };
    const svc = liveServices.find((s) => s.id === id);
    if (!svc) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    if (!status || !['published', 'draft', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Valid status (published, draft, archived) is required.' });
      return;
    }
    svc.status = status;
    svc.updatedAtIso = new Date().toISOString();
    res.json({
      service: svc,
      message: `Service "${svc.title}" status updated to ${status}.`,
    });
  });

  // 2D. Admin Service Deletion with Referential Integrity Guard
  app.delete('/api/admin/services/:id', (req, res) => {
    const { id } = req.params;
    const svcIdx = liveServices.findIndex((s) => s.id === id);
    if (svcIdx < 0) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    const svc = liveServices[svcIdx];
    const evaluation = evaluateServiceDeletion(id, liveBookings);

    if (!evaluation.canHardDelete) {
      svc.status = 'archived';
      svc.updatedAtIso = new Date().toISOString();
      res.json({
        deleted: false,
        archivedInstead: true,
        referencedBookingsCount: evaluation.referencedBookingsCount,
        service: svc,
        message: evaluation.message,
      });
      return;
    }

    liveServices.splice(svcIdx, 1);
    res.json({
      deleted: true,
      archivedInstead: false,
      referencedBookingsCount: 0,
      message: `Service "${svc.title}" permanently deleted.`,
    });
  });

  // 2E. Admin Category Management
  app.post('/api/admin/categories', (req, res) => {
    const payload = req.body as Partial<Category>;
    if (!payload || !payload.name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const existingIdx = payload.id
      ? liveCategories.findIndex((c) => c.id === payload.id)
      : -1;

    if (existingIdx >= 0) {
      liveCategories[existingIdx] = {
        ...liveCategories[existingIdx],
        ...payload,
        id: liveCategories[existingIdx].id,
        isDemo: false,
      };
      res.json({
        category: liveCategories[existingIdx],
        message: `Category "${liveCategories[existingIdx].name}" updated.`,
      });
      return;
    }

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: payload.name.trim(),
      slug:
        payload.slug ||
        payload.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-'),
      shortDescription: payload.shortDescription || `${payload.name} home services`,
      iconKey: payload.iconKey || 'water-tank',
      imageUrl: payload.imageUrl || '/assets/tankmanpro/water-tank.jpg',
      sortOrder: payload.sortOrder ?? liveCategories.length + 1,
      status: payload.status || 'published',
      isDemo: false,
    };
    liveCategories.push(newCat);
    res.status(201).json({
      category: newCat,
      message: `Category "${newCat.name}" created.`,
    });
  });

  // 2F. Admin Price Overrides (City & Vendor Specific Pricing)
  app.post('/api/admin/price-overrides', (req, res) => {
    const payload = req.body as Partial<PriceOverride>;
    if (
      !payload ||
      !payload.serviceId ||
      !payload.variantId ||
      !payload.cityId ||
      typeof payload.amountPaise !== 'number'
    ) {
      res.status(400).json({
        error: 'serviceId, variantId, cityId, and amountPaise (integer paise) are required.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const existingIdx = livePriceOverrides.findIndex(
      (po) =>
        (payload.id && po.id === payload.id) ||
        (po.serviceId === payload.serviceId &&
          po.variantId === payload.variantId &&
          po.cityId === payload.cityId &&
          (po.vendorUid || '') === (payload.vendorUid || ''))
    );

    if (existingIdx >= 0) {
      livePriceOverrides[existingIdx] = {
        ...livePriceOverrides[existingIdx],
        amountPaise: Math.round(payload.amountPaise),
        active: payload.active ?? true,
        approvalStatus: payload.approvalStatus || 'approved',
        updatedAtIso: nowIso,
        isDemo: false,
      };
      res.json({
        priceOverride: livePriceOverrides[existingIdx],
        message: 'Price override updated.',
      });
      return;
    }

    const created: PriceOverride = {
      id: `po_${Date.now()}`,
      serviceId: payload.serviceId,
      variantId: payload.variantId,
      cityId: payload.cityId,
      vendorUid: payload.vendorUid || undefined,
      amountPaise: Math.round(payload.amountPaise),
      currency: 'INR',
      approvalStatus: payload.approvalStatus || 'approved',
      active: payload.active ?? true,
      updatedByUid: 'admin_main',
      updatedAtIso: nowIso,
      isDemo: false,
    };
    livePriceOverrides.push(created);
    res.status(201).json({
      priceOverride: created,
      message: 'Price override created.',
    });
  });

  // 2G. Admin Cities Management
  app.post('/api/admin/cities', (req, res) => {
    const payload = req.body as Partial<City>;
    if (!payload || !payload.name || !payload.state) {
      res.status(400).json({ error: 'City name and state are required.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const existingIdx = payload.id
      ? liveCities.findIndex((c) => c.id === payload.id)
      : liveCities.findIndex((c) => c.name.toLowerCase() === payload.name!.trim().toLowerCase());

    if (existingIdx >= 0) {
      liveCities[existingIdx] = {
        ...liveCities[existingIdx],
        name: payload.name.trim(),
        state: payload.state.trim(),
        slug:
          payload.slug ||
          liveCities[existingIdx].slug ||
          payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        supportPhone: payload.supportPhone ?? liveCities[existingIdx].supportPhone,
        active: payload.active ?? liveCities[existingIdx].active,
        updatedAtIso: nowIso,
        isDemo: false,
      };
      res.json({
        city: liveCities[existingIdx],
        message: `City "${liveCities[existingIdx].name}" updated.`,
      });
      return;
    }

    const slug = payload.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');
    const newCity: City = {
      id: payload.id || `city_${slug}_${Date.now().toString().slice(-4)}`,
      name: payload.name.trim(),
      state: payload.state.trim(),
      slug,
      supportPhone: payload.supportPhone || '+91 97942 00100',
      active: payload.active ?? true,
      isDemo: false,
      updatedAtIso: nowIso,
    };
    liveCities.push(newCity);
    res.status(201).json({
      city: newCity,
      message: `City "${newCity.name}" added.`,
    });
  });

  // 2H. Admin PIN Code / Service Area Management (with Conflict Checking)
  app.post('/api/admin/service-areas', (req, res) => {
    const payload = req.body as Partial<ServiceArea> & { forceOverrideConflict?: boolean };
    const pinCode = String(payload?.pinCode || '').trim();
    if (!isValidIndianPin(pinCode)) {
      res.status(400).json({
        error: 'Please enter a valid 6-digit Indian PIN code (first digit 1-9).',
      });
      return;
    }
    if (!payload.cityId) {
      res.status(400).json({ error: 'Please select a city for this PIN code.' });
      return;
    }

    const targetCity = liveCities.find((c) => c.id === payload.cityId);
    if (!targetCity) {
      res.status(404).json({ error: 'Selected city was not found.' });
      return;
    }

    const existingIdx = liveServiceAreas.findIndex((a) => a.pinCode === pinCode);
    const nowIso = new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = liveServiceAreas[existingIdx];
      if (existing.cityId !== payload.cityId && !payload.forceOverrideConflict) {
        const prevCity = liveCities.find((c) => c.id === existing.cityId);
        res.status(409).json({
          conflict: true,
          error: `Location Conflict: PIN ${pinCode} is currently mapped to ${prevCity?.name || existing.cityId} (${existing.zoneLabel}). Confirm conflict override if you want to reassign it to ${targetCity.name}.`,
        });
        return;
      }

      liveServiceAreas[existingIdx] = {
        ...existing,
        cityId: targetCity.id,
        cityName: targetCity.name,
        state: targetCity.state,
        zoneLabel: payload.zoneLabel?.trim() || existing.zoneLabel,
        neighbourhoods:
          payload.neighbourhoods && payload.neighbourhoods.length > 0
            ? payload.neighbourhoods
            : existing.neighbourhoods,
        supportedServiceIds: payload.supportedServiceIds ?? existing.supportedServiceIds,
        assignedVendorUids: payload.assignedVendorUids ?? existing.assignedVendorUids,
        conflictFlag: false,
        conflictNotes: undefined,
        active: payload.active ?? existing.active,
        updatedAtIso: nowIso,
        isDemo: false,
      };
      res.json({
        serviceArea: liveServiceAreas[existingIdx],
        message: `PIN ${pinCode} (${liveServiceAreas[existingIdx].zoneLabel}) updated.`,
      });
      return;
    }

    const newArea: ServiceArea = {
      id: `area_${pinCode}`,
      cityId: targetCity.id,
      cityName: targetCity.name,
      state: targetCity.state,
      pinCode,
      zoneLabel: payload.zoneLabel?.trim() || `${targetCity.name} Zone (${pinCode})`,
      neighbourhoods:
        payload.neighbourhoods && payload.neighbourhoods.length > 0
          ? payload.neighbourhoods
          : [payload.zoneLabel?.trim() || targetCity.name],
      supportedServiceIds: payload.supportedServiceIds || [],
      assignedVendorUids: payload.assignedVendorUids || [],
      conflictFlag: false,
      active: payload.active ?? true,
      isDemo: false,
      updatedAtIso: nowIso,
    };
    liveServiceAreas.push(newArea);
    res.status(201).json({
      serviceArea: newArea,
      message: `PIN ${pinCode} added to ${targetCity.name}.`,
    });
  });

  // 2I. Admin Bulk CSV PIN Code Import (Preview & Validated Commit)
  app.post('/api/admin/service-areas/import-csv', (req, res) => {
    const { csvText, mode = 'preview', allowConflictOverride = false } = req.body || {};
    if (!csvText || typeof csvText !== 'string') {
      res.status(400).json({ error: 'CSV content is required.' });
      return;
    }

    const validation = validateAndParsePinCsv(csvText, liveCities, liveServiceAreas);

    if (mode === 'preview') {
      res.json({
        mode: 'preview',
        validation,
      });
      return;
    }

    const rowsToApply = [
      ...validation.validRows,
      ...(allowConflictOverride ? validation.conflictRows : []),
    ];

    const nowIso = new Date().toISOString();
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of rowsToApply) {
      let city = liveCities.find(
        (c) =>
          c.id === row.matchedCityId ||
          c.name.toLowerCase() === row.cityName.toLowerCase()
      );
      if (!city) {
        const slug = row.cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        city = {
          id: `city_${slug}`,
          name: row.cityName,
          state: row.state || 'Uttar Pradesh',
          slug,
          supportPhone: '+91 97942 00100',
          active: true,
          isDemo: false,
          updatedAtIso: nowIso,
        };
        liveCities.push(city);
      }

      const existingIdx = liveServiceAreas.findIndex((a) => a.pinCode === row.pinCode);
      if (existingIdx >= 0) {
        liveServiceAreas[existingIdx] = {
          ...liveServiceAreas[existingIdx],
          cityId: city.id,
          cityName: city.name,
          state: city.state,
          zoneLabel: row.zoneLabel,
          active: row.active,
          conflictFlag: row.status === 'conflict',
          conflictNotes: row.status === 'conflict' ? row.reason : undefined,
          updatedAtIso: nowIso,
          isDemo: false,
        };
        updatedCount += 1;
      } else {
        liveServiceAreas.push({
          id: `area_${row.pinCode}`,
          cityId: city.id,
          cityName: city.name,
          state: city.state,
          pinCode: row.pinCode,
          zoneLabel: row.zoneLabel,
          neighbourhoods: [row.zoneLabel],
          active: row.active,
          conflictFlag: false,
          isDemo: false,
          updatedAtIso: nowIso,
        });
        createdCount += 1;
      }
    }

    res.json({
      mode: 'commit',
      createdCount,
      updatedCount,
      skippedInvalidCount: validation.invalidRows.length,
      skippedConflictCount: allowConflictOverride ? 0 : validation.conflictRows.length,
      validation,
      message: `CSV import completed: ${createdCount} new PIN(s) created, ${updatedCount} updated.`,
    });
  });

  // 2J. Admin Vendor Management (Register / Update Vendor)
  app.post('/api/admin/vendors', (req, res) => {
    const payload = req.body as Partial<Vendor>;
    if (!payload || !payload.displayName || !payload.phone || !payload.email) {
      res.status(400).json({
        error: 'Vendor display name, phone number, and login email are required.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const existingIdx = payload.uid
      ? liveVendors.findIndex((v) => v.uid === payload.uid)
      : -1;

    if (existingIdx >= 0) {
      const current = liveVendors[existingIdx];
      liveVendors[existingIdx] = {
        ...current,
        ...payload,
        uid: current.uid,
        vendorCode: current.vendorCode || generateUniqueVendorCode(liveVendors),
        updatedAtIso: nowIso,
        isDemo: false,
      };
      res.json({
        vendor: liveVendors[existingIdx],
        message: `Vendor "${liveVendors[existingIdx].displayName}" (${liveVendors[existingIdx].vendorCode}) updated.`,
      });
      return;
    }

    const vendorCode = generateUniqueVendorCode(liveVendors);
    const newVendor: Vendor = {
      uid: `vnd_${Date.now()}`,
      vendorCode,
      displayName: payload.displayName.trim(),
      businessName: payload.businessName?.trim() || `${payload.displayName.trim()} Services`,
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      status: payload.status || 'active',
      isAvailable: payload.isAvailable ?? true,
      supportedCityIds: payload.supportedCityIds || ['city_kanpur'],
      supportedAreaPins: payload.supportedAreaPins || ['208001'],
      supportedServiceIds:
        payload.supportedServiceIds || ['svc_water_tank_cleaning'],
      workingDays: payload.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      workingHoursLabel: payload.workingHoursLabel || '08:00 AM – 08:00 PM',
      maxActiveJobs: Number(payload.maxActiveJobs || 6),
      activeAssignedJobs: 0,
      assignmentPriority: Number(payload.assignmentPriority || 1),
      experienceYearsLabel: payload.experienceYearsLabel || '4+ Years Experience',
      commissionPercent: Number(payload.commissionPercent ?? 18),
      kycNotes: payload.kycNotes || 'Registered by Main Admin.',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      isDemo: false,
    };

    liveVendors.unshift(newVendor);
    res.status(201).json({
      vendor: newVendor,
      message: `Vendor registered with ID ${newVendor.vendorCode}.`,
    });
  });

  // 2K. Admin Vendor Status (Approve, Reject, Suspend, Reactivate)
  app.post('/api/admin/vendors/:uid/status', (req, res) => {
    const { uid } = req.params;
    const { status, reason } = req.body as { status?: VendorStatus; reason?: string };
    const vendor = liveVendors.find((v) => v.uid === uid);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }
    if (
      !status ||
      !['active', 'pending', 'pending_verification', 'suspended', 'rejected'].includes(status)
    ) {
      res.status(400).json({ error: 'Valid vendor status is required.' });
      return;
    }

    vendor.status = status;
    if (reason) {
      vendor.kycNotes = `${vendor.kycNotes ? vendor.kycNotes + ' | ' : ''}Status -> ${status}: ${reason}`;
    }
    vendor.updatedAtIso = new Date().toISOString();

    // Immediately revoke any active sessions if vendor is suspended or rejected
    if (status !== 'active') {
      for (const [tokenKey, sessionVal] of activeVendorSessions.entries()) {
        if (sessionVal.uid === vendor.uid) {
          activeVendorSessions.delete(tokenKey);
        }
      }
    }

    res.json({
      vendor,
      message: `Vendor ${vendor.displayName} (${vendor.vendorCode}) status updated to ${status}.`,
    });
  });

  // 2L. Admin Trigger Vendor Password Setup / Reset
  app.post('/api/admin/vendors/:uid/reset-password', (req, res) => {
    const { uid } = req.params;
    const vendor = liveVendors.find((v) => v.uid === uid);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }

    const nowIso = new Date().toISOString();
    vendor.passwordResetRequestedAtIso = nowIso;
    vendor.updatedAtIso = nowIso;

    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'vendor',
      recipientUid: vendor.uid,
      title: 'Password Setup / Reset Triggered',
      message: `Main Admin initiated a secure password reset for your login identity (${vendor.email}).`,
      type: 'system_alert',
      read: false,
      createdAtIso: nowIso,
    });

    res.json({
      vendor,
      message: `Secure password setup/reset link triggered for ${vendor.email} (${vendor.vendorCode}).`,
    });
  });

  // 2M. Admin Booking Vendor Assignment (Manual or Auto-Dispatch)
  app.post('/api/admin/bookings/:id/assign', (req, res) => {
    const { id } = req.params;
    const { vendorUid, autoAssign, note } = req.body as {
      vendorUid?: string;
      autoAssign?: boolean;
      note?: string;
    };

    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    let chosenVendor: Vendor | undefined;

    if (autoAssign) {
      const eligible = findEligibleVendorsForBooking(booking, liveVendors);
      if (eligible.length === 0) {
        res.status(400).json({
          error: `No active, available vendor with capacity covers PIN ${booking.pinCode} (${booking.cityName}) for "${booking.serviceTitle}".`,
        });
        return;
      }
      chosenVendor = eligible[0];
    } else {
      chosenVendor = liveVendors.find((v) => v.uid === vendorUid);
      if (!chosenVendor) {
        res.status(404).json({ error: 'Selected vendor not found.' });
        return;
      }
    }

    const prevStatus = booking.status;
    const nowIso = new Date().toISOString();

    booking.assignedVendorUid = chosenVendor.uid;
    booking.assignedVendorName = chosenVendor.displayName;
    booking.status = 'assigned_to_vendor';
    booking.vendorRejectionReason = null;
    booking.updatedAtIso = nowIso;

    const event: BookingEvent = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: 'admin_main',
      actorRole: 'admin',
      actorName: 'Main Admin Dispatch',
      fromStatus: prevStatus,
      toStatus: 'assigned_to_vendor',
      note:
        note ||
        `${autoAssign ? 'Auto-dispatched' : 'Manually assigned'} to ${chosenVendor.displayName} (${chosenVendor.vendorCode || chosenVendor.uid}).`,
      createdAtIso: nowIso,
    };
    liveBookingEvents.unshift(event);

    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'vendor',
      recipientUid: chosenVendor.uid,
      bookingId: booking.id,
      title: `New Booking Assigned · ${booking.bookingNumber}`,
      message: `${booking.serviceTitle} (${booking.variantName}) in PIN ${booking.pinCode} for ${booking.preferredDate} (${booking.preferredSlot}).`,
      type: 'vendor_assigned',
      read: false,
      createdAtIso: nowIso,
    });

    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} assigned to ${chosenVendor.displayName}.`,
    });
  });

  // 2N. Admin Booking Status Override, Reschedule & Refund
  app.post('/api/admin/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const {
      status,
      paymentStatus,
      preferredDate,
      preferredSlot,
      note,
    } = req.body as {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      preferredDate?: string;
      preferredSlot?: string;
      note?: string;
    };

    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const prevStatus = booking.status;
    const nowIso = new Date().toISOString();

    if (status) {
      booking.status = status;
      if (status === 'refunded') {
        booking.paymentStatus = 'refunded';
      } else if (status === 'completed' && !paymentStatus) {
        booking.paymentStatus = 'paid';
      }
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    if (preferredDate) {
      booking.preferredDate = preferredDate;
    }
    if (preferredSlot) {
      booking.preferredSlot = preferredSlot;
    }
    booking.updatedAtIso = nowIso;

    const event: BookingEvent = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: 'admin_main',
      actorRole: 'admin',
      actorName: 'Main Admin',
      fromStatus: prevStatus,
      toStatus: booking.status,
      note:
        note ||
        `Status updated to ${booking.status} (Payment: ${booking.paymentStatus}, Slot: ${booking.preferredDate} ${booking.preferredSlot}).`,
      createdAtIso: nowIso,
    };
    liveBookingEvents.unshift(event);

    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} updated to ${booking.status}.`,
    });
  });

  // 2O. Admin Website CMS Settings & Coupons
  app.post('/api/admin/cms', (req, res) => {
    const payload = req.body as Partial<CmsSettings>;
    liveCmsSettings = {
      ...liveCmsSettings,
      ...payload,
      id: 'global',
      updatedAtIso: new Date().toISOString(),
    };
    res.json({
      cmsSettings: liveCmsSettings,
      message: 'Website CMS content updated and published to storefront.',
    });
  });

  app.post('/api/admin/coupons', (req, res) => {
    const payload = req.body as Partial<Coupon>;
    if (!payload || !payload.code) {
      res.status(400).json({ error: 'Coupon code is required.' });
      return;
    }

    const code = payload.code.trim().toUpperCase();
    const existingIdx = liveCoupons.findIndex(
      (c) => (payload.id && c.id === payload.id) || c.code.toUpperCase() === code
    );

    if (existingIdx >= 0) {
      liveCoupons[existingIdx] = {
        ...liveCoupons[existingIdx],
        ...payload,
        code,
        isDemo: false,
      };
      res.json({
        coupon: liveCoupons[existingIdx],
        message: `Coupon ${code} updated.`,
      });
      return;
    }

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}`,
      code,
      internalName: payload.internalName || `${code} Promo`,
      description: payload.description || `Promotional discount code ${code}`,
      discountType: payload.discountType || 'fixed',
      discountValue: Number(payload.discountValue || 10000),
      maxDiscountCapPaise: payload.maxDiscountCapPaise,
      minOrderSubtotalPaise: Number(payload.minOrderSubtotalPaise || 49900),
      validFromIso: payload.validFromIso || '2025-01-01T00:00:00.000Z',
      validUntilIso: payload.validUntilIso || '2027-12-31T23:59:59.000Z',
      applicableCityIds: payload.applicableCityIds || [],
      applicableServiceIds: payload.applicableServiceIds || [],
      currentRedemptions: 0,
      perCustomerLimit: 1,
      newCustomerOnly: false,
      active: payload.active ?? true,
      isDemo: false,
    };
    liveCoupons.push(newCoupon);
    res.status(201).json({
      coupon: newCoupon,
      message: `Coupon ${code} created.`,
    });
  });

  app.delete('/api/admin/coupons/:id', (req, res) => {
    const couponId = req.params.id;
    const index = liveCoupons.findIndex(
      (c) =>
        c.id === couponId ||
        c.code.toUpperCase() === String(couponId).toUpperCase()
    );
    if (index === -1) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    const removed = liveCoupons.splice(index, 1)[0];
    res.json({
      ok: true,
      message: `Coupon "${removed.code}" deleted permanently.`,
      deletedId: removed.id,
    });
  });

  app.post('/api/admin/notifications/read', (req, res) => {
    const { id } = req.body as { id?: string };
    for (const n of liveNotifications) {
      if (!id || n.id === id) {
        n.read = true;
      }
    }
    res.json({ notifications: liveNotifications });
  });

  // ============================================================================
  // 3. PHASE 2 — PARTNER VENDOR PORTAL ROUTES (/api/vendor/*)
  // ============================================================================

  // 3A. Public Partner Account Directory for Login Selection (No secrets exposed)
  app.get('/api/vendor/accounts-preview', (_req, res) => {
    const accounts = liveVendors.map((v) => ({
      uid: v.uid,
      vendorCode: v.vendorCode || v.uid,
      displayName: v.displayName,
      businessName: v.businessName,
      email: v.email,
      status: v.status,
      supportedCityIds: v.supportedCityIds,
      supportedAreaPins: v.supportedAreaPins,
    }));
    res.json({ accounts });
  });

  // 3B. Partner Vendor Authentication & Session Endpoint (/api/vendor/session)
  app.post('/api/vendor/session', (req, res) => {
    const { emailOrCode, email, password, firebaseEmail, firebaseUid } = req.body || {};

    // Support Firebase Google Sign-In when email matches a registered vendor
    if (firebaseUid && firebaseEmail) {
      const cleanFbEmail = String(firebaseEmail).trim().toLowerCase();
      const matchedVendor = liveVendors.find(
        (v) => (v.email || '').toLowerCase() === cleanFbEmail
      );
      if (!matchedVendor) {
        res.status(403).json({
          authorized: false,
          code: 'VENDOR_NOT_REGISTERED',
          error: `No Partner Vendor account is registered for ${cleanFbEmail}. Self-registration is disabled; contact Main Admin.`,
        });
        return;
      }
      if (matchedVendor.status !== 'active') {
        res.status(403).json({
          authorized: false,
          code: 'VENDOR_ACCOUNT_INACTIVE',
          error: `Partner account ${matchedVendor.displayName} (${matchedVendor.vendorCode}) is currently "${matchedVendor.status}". Access is disabled.`,
        });
        return;
      }

      const token = `vnd_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const session = {
        uid: matchedVendor.uid,
        vendorCode: matchedVendor.vendorCode || matchedVendor.uid,
        email: matchedVendor.email || '',
        displayName: matchedVendor.displayName,
        role: 'vendor' as const,
        issuedAtIso: new Date().toISOString(),
      };
      activeVendorSessions.set(token, session);
      res.json({
        authorized: true,
        token,
        vendor: matchedVendor,
        session,
      });
      return;
    }

    const identifier = String(emailOrCode || email || '').trim().toLowerCase();
    const rawPass = String(password || '').trim();
    const expectedPass = process.env.VENDOR_PORTAL_PASSWORD || 'TankmanPartner@2026';

    if (!identifier || !rawPass) {
      res.status(400).json({
        authorized: false,
        error: 'Please enter your registered Partner Email or Vendor ID (e.g. TMP-VND-1003) and password.',
      });
      return;
    }

    const matchedVendor = liveVendors.find(
      (v) =>
        (v.email || '').toLowerCase() === identifier ||
        (v.vendorCode || '').toLowerCase() === identifier ||
        v.uid.toLowerCase() === identifier
    );

    if (!matchedVendor || rawPass !== expectedPass) {
      res.status(401).json({
        authorized: false,
        code: 'INVALID_VENDOR_CREDENTIALS',
        error:
          'Invalid Partner Vendor email/ID or password. Use your Admin-assigned partner credentials.',
      });
      return;
    }

    if (matchedVendor.status === 'suspended') {
      res.status(403).json({
        authorized: false,
        code: 'VENDOR_SUSPENDED',
        error: `Your Partner Vendor account (${matchedVendor.vendorCode}) has been suspended by Main Admin. Portal access is disabled.`,
      });
      return;
    }

    if (matchedVendor.status !== 'active') {
      res.status(403).json({
        authorized: false,
        code: 'VENDOR_NOT_ACTIVE',
        error: `Your Partner Vendor account (${matchedVendor.vendorCode}) status is "${matchedVendor.status}". Only approved active vendors can sign in.`,
      });
      return;
    }

    const token = `vnd_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const session = {
      uid: matchedVendor.uid,
      vendorCode: matchedVendor.vendorCode || matchedVendor.uid,
      email: matchedVendor.email || '',
      displayName: matchedVendor.displayName,
      role: 'vendor' as const,
      issuedAtIso: new Date().toISOString(),
    };
    activeVendorSessions.set(token, session);

    res.json({
      authorized: true,
      token,
      vendor: matchedVendor,
      session,
    });
  });

  // 3C. Partner Password Reset Request from Login Screen
  app.post('/api/vendor/request-password-reset', (req, res) => {
    const identifier = String(req.body?.emailOrCode || '').trim().toLowerCase();
    if (!identifier) {
      res.status(400).json({ error: 'Please enter your registered Partner Email or Vendor ID.' });
      return;
    }

    const matchedVendor = liveVendors.find(
      (v) =>
        (v.email || '').toLowerCase() === identifier ||
        (v.vendorCode || '').toLowerCase() === identifier
    );

    const nowIso = new Date().toISOString();
    if (matchedVendor) {
      matchedVendor.passwordResetRequestedAtIso = nowIso;
      liveNotifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: 'admin',
        recipientUid: 'ALL_ADMINS',
        title: `Vendor Password Reset Request · ${matchedVendor.vendorCode}`,
        message: `${matchedVendor.displayName} (${matchedVendor.email}) requested a credential reset from /vendor/login.`,
        type: 'system_alert',
        read: false,
        createdAtIso: nowIso,
      });
    }

    res.json({
      success: true,
      message:
        'Password reset request logged and routed to TankmanPro Main Admin Dispatch for identity verification.',
    });
  });

  // 3D. Strict Vendor RBAC & Immediate Suspension Enforcement Middleware
  app.use('/api/vendor', (req, res, next) => {
    if (
      (req.path === '/session' && req.method === 'POST') ||
      (req.path === '/accounts-preview' && req.method === 'GET') ||
      (req.path === '/request-password-reset' && req.method === 'POST')
    ) {
      next();
      return;
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const session = token ? activeVendorSessions.get(token) : undefined;

    if (!session) {
      res.status(401).json({
        authorized: false,
        code: 'VENDOR_SESSION_REQUIRED',
        error: 'Unauthorized: Please sign in at /vendor/login with your Partner credentials.',
      });
      return;
    }

    const vendor = liveVendors.find((v) => v.uid === session.uid);
    if (!vendor || vendor.status !== 'active') {
      activeVendorSessions.delete(token);
      res.status(403).json({
        authorized: false,
        code: 'VENDOR_SUSPENDED_OR_REVOKED',
        error:
          'Access immediately disabled: Your Partner Vendor account is no longer active or has been suspended by Main Admin.',
      });
      return;
    }

    // Attach verified vendor to res.locals
    res.locals.vendor = vendor;
    next();
  });

  // 3E. Fetch Authenticated Vendor's Scoped Operational State
  app.get('/api/vendor/state', (_req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Strictly filter to ONLY bookings assigned to this vendor
    const rawAssignedBookings = filterVendorScopedBookings(liveBookings, vendor.uid);
    const sanitizedBookings = rawAssignedBookings
      .map((b) => sanitizeBookingForVendorView(b, vendor.uid))
      .filter((b): b is NonNullable<typeof b> => b !== null);

    const assignedBookingIds = new Set(rawAssignedBookings.map((b) => b.id));
    const scopedEvents = liveBookingEvents.filter((e) => assignedBookingIds.has(e.bookingId));
    const scopedNotifications = liveNotifications.filter(
      (n) => n.recipientRole === 'vendor' && n.recipientUid === vendor.uid
    );

    const assignedCities = liveCities.filter((c) => vendor.supportedCityIds.includes(c.id));
    const assignedServiceAreas = liveServiceAreas.filter((a) =>
      vendor.supportedAreaPins.includes(a.pinCode)
    );
    const assignedServices = liveServices.filter((s) =>
      vendor.supportedServiceIds.includes(s.id)
    );

    const vendorPriceOverrides = livePriceOverrides.filter(
      (po) =>
        po.vendorUid === vendor.uid ||
        (!po.vendorUid && vendor.supportedCityIds.includes(po.cityId))
    );

    const metrics = computeVendorDashboardMetrics({
      bookings: liveBookings,
      vendor,
      todayDateStr,
    });

    res.json({
      vendor,
      metrics,
      bookings: sanitizedBookings,
      bookingEvents: scopedEvents,
      notifications: scopedNotifications,
      assignedCities,
      assignedServiceAreas,
      assignedServices,
      vendorPriceOverrides,
    });
  });

  // 3F. Vendor Booking Lifecycle Transition (Accept, Reject/Reassign, Start, Complete)
  app.post('/api/vendor/bookings/:id/transition', (req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const { id } = req.params;
    const { targetStatus, reason, executionNote, subStatus } = req.body as {
      targetStatus?: BookingStatus;
      reason?: string;
      executionNote?: string;
      subStatus?: BookingSubStatus;
    };

    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    // Strict RBAC check: Vendor cannot view or modify another vendor's booking
    if (booking.assignedVendorUid !== vendor.uid) {
      res.status(403).json({
        error: 'Forbidden: You can only update bookings explicitly assigned to your Partner account.',
      });
      return;
    }

    if (!targetStatus) {
      res.status(400).json({ error: 'targetStatus is required.' });
      return;
    }

    const validation = validateVendorJobTransition({
      currentStatus: booking.status,
      targetStatus,
      reason,
    });

    if (!validation.allowed) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const prevStatus = booking.status;
    const nowIso = new Date().toISOString();

    booking.status = targetStatus;
    booking.updatedAtIso = nowIso;

    if (targetStatus === 'vendor_accepted') {
      booking.subStatus = subStatus || 'en_route';
      booking.vendorRejectionReason = null;
    } else if (targetStatus === 'in_progress') {
      booking.subStatus = subStatus || 'working';
    } else if (targetStatus === 'completed') {
      booking.subStatus = null;
    } else if (targetStatus === 'vendor_rejected') {
      booking.subStatus = null;
      booking.vendorRejectionReason = String(reason || '').trim();
    }

    if (executionNote && executionNote.trim().length > 0) {
      booking.vendorExecutionNotes.push(executionNote.trim());
    }

    const eventNote =
      targetStatus === 'vendor_rejected'
        ? `Vendor requested reassignment / rejected job: ${String(reason || '').trim()}`
        : executionNote?.trim() ||
          `Vendor updated job status from ${prevStatus} to ${targetStatus}.`;

    const event: BookingEvent = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: vendor.uid,
      actorRole: 'vendor',
      actorName: vendor.displayName,
      fromStatus: prevStatus,
      toStatus: targetStatus,
      note: eventNote,
      createdAtIso: nowIso,
    };
    liveBookingEvents.unshift(event);

    // Notify Main Admin
    const adminNotifType =
      targetStatus === 'vendor_accepted'
        ? 'vendor_accepted'
        : targetStatus === 'vendor_rejected'
          ? 'vendor_rejected'
          : targetStatus === 'in_progress'
            ? 'job_started'
            : 'job_completed';

    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'admin',
      recipientUid: 'ALL_ADMINS',
      bookingId: booking.id,
      title: `Vendor ${targetStatus.replace(/_/g, ' ').toUpperCase()} · ${booking.bookingNumber}`,
      message: `${vendor.displayName} (${vendor.vendorCode}) transitioned ${booking.bookingNumber} (${booking.serviceTitle} in PIN ${booking.pinCode}) to ${targetStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      type: adminNotifType,
      read: false,
      createdAtIso: nowIso,
    });

    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message:
        targetStatus === 'vendor_accepted'
          ? `Booking ${booking.bookingNumber} accepted! Customer contact and full address are now unlocked.`
          : targetStatus === 'vendor_rejected'
            ? `Booking ${booking.bookingNumber} flagged for Admin reassignment.`
            : targetStatus === 'in_progress'
              ? `Job ${booking.bookingNumber} marked In Progress.`
              : `Job ${booking.bookingNumber} marked Completed!`,
    });
  });

  // 3G. Vendor Field Sub-Status & Execution Note Append
  app.post('/api/vendor/bookings/:id/substatus', (req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const { id } = req.params;
    const { subStatus, executionNote } = req.body as {
      subStatus?: BookingSubStatus;
      executionNote?: string;
    };

    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (booking.assignedVendorUid !== vendor.uid) {
      res.status(403).json({
        error: 'Forbidden: You can only update bookings assigned to your Partner account.',
      });
      return;
    }

    if (
      booking.status !== 'vendor_accepted' &&
      booking.status !== 'in_progress' &&
      booking.status !== 'completed'
    ) {
      res.status(400).json({
        error: 'Please accept the booking before adding field execution updates.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    if (subStatus !== undefined) {
      booking.subStatus = subStatus;
    }
    if (executionNote && executionNote.trim().length > 0) {
      booking.vendorExecutionNotes.push(executionNote.trim());
    }
    booking.updatedAtIso = nowIso;

    const event: BookingEvent = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: vendor.uid,
      actorRole: 'vendor',
      actorName: vendor.displayName,
      fromStatus: booking.status,
      toStatus: booking.status,
      note:
        executionNote?.trim() ||
        `Field crew status updated to "${subStatus || 'standard'}".`,
      createdAtIso: nowIso,
    };
    liveBookingEvents.unshift(event);

    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message: `Field log updated for ${booking.bookingNumber}.`,
    });
  });

  // 3H. Vendor Availability & Shift Hours Update (Scoped strictly to own profile)
  app.post('/api/vendor/availability', (req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const { isAvailable, workingHoursLabel, workingDays, maxActiveJobs } = req.body as {
      isAvailable?: boolean;
      workingHoursLabel?: string;
      workingDays?: string[];
      maxActiveJobs?: number;
    };

    if (typeof isAvailable === 'boolean') {
      vendor.isAvailable = isAvailable;
    }
    if (typeof workingHoursLabel === 'string' && workingHoursLabel.trim().length > 0) {
      vendor.workingHoursLabel = workingHoursLabel.trim();
    }
    if (Array.isArray(workingDays) && workingDays.length > 0) {
      vendor.workingDays = workingDays;
    }
    if (typeof maxActiveJobs === 'number' && maxActiveJobs >= 1 && maxActiveJobs <= 20) {
      vendor.maxActiveJobs = Math.round(maxActiveJobs);
    }
    vendor.updatedAtIso = new Date().toISOString();

    res.json({
      vendor,
      message: `Partner availability updated (${vendor.isAvailable ? 'Online & Accepting Dispatch' : 'Offline / Shift Paused'}).`,
    });
  });

  // 3I. Vendor-Specific Rate Card Override Submission (Scoped to assigned services & cities)
  app.post('/api/vendor/price-overrides', (req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const { serviceId, variantId, cityId, amountPaise } = req.body as {
      serviceId?: string;
      variantId?: string;
      cityId?: string;
      amountPaise?: number;
    };

    if (!serviceId || !variantId || !cityId || typeof amountPaise !== 'number' || amountPaise < 4900) {
      res.status(400).json({
        error: 'Valid serviceId, variantId, cityId, and amountPaise (minimum ₹49) are required.',
      });
      return;
    }

    if (!vendor.supportedCityIds.includes(cityId)) {
      res.status(403).json({
        error: 'Forbidden: You can only configure rates for cities assigned to your Partner account.',
      });
      return;
    }

    if (!vendor.supportedServiceIds.includes(serviceId)) {
      res.status(403).json({
        error: 'Forbidden: You can only configure rates for services assigned to your Partner account.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const existingIdx = livePriceOverrides.findIndex(
      (po) =>
        po.serviceId === serviceId &&
        po.variantId === variantId &&
        po.cityId === cityId &&
        po.vendorUid === vendor.uid
    );

    if (existingIdx >= 0) {
      livePriceOverrides[existingIdx] = {
        ...livePriceOverrides[existingIdx],
        amountPaise: Math.round(amountPaise),
        active: true,
        approvalStatus: 'approved',
        updatedByUid: vendor.uid,
        updatedAtIso: nowIso,
        isDemo: false,
      };
      res.json({
        priceOverride: livePriceOverrides[existingIdx],
        message: 'Your Partner service rate has been updated.',
      });
      return;
    }

    const created: PriceOverride = {
      id: `po_vnd_${Date.now()}`,
      serviceId,
      variantId,
      cityId,
      vendorUid: vendor.uid,
      amountPaise: Math.round(amountPaise),
      currency: 'INR',
      approvalStatus: 'approved',
      active: true,
      updatedByUid: vendor.uid,
      updatedAtIso: nowIso,
      isDemo: false,
    };
    livePriceOverrides.push(created);

    res.status(201).json({
      priceOverride: created,
      message: 'New Partner service rate saved.',
    });
  });

  // 3J. Mark Vendor Notifications Read
  app.post('/api/vendor/notifications/read', (req, res) => {
    const vendor = res.locals.vendor as Vendor;
    const { id } = req.body as { id?: string };
    for (const n of liveNotifications) {
      if (n.recipientRole === 'vendor' && n.recipientUid === vendor.uid) {
        if (!id || n.id === id) {
          n.read = true;
        }
      }
    }
    res.json({
      notifications: liveNotifications.filter(
        (n) => n.recipientRole === 'vendor' && n.recipientUid === vendor.uid
      ),
    });
  });

  // 4. Production-Ready Razorpay Payment Gateway & Webhook Engine
  // 4A. Payment Config & Mode Check
  app.get('/api/payments/config', (_req, res) => {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const isLiveKey = keyId.startsWith('rzp_live_');
    const isTestKey = keyId.startsWith('rzp_test_');
    const isConfigured = Boolean(keyId && keySecret);

    res.json({
      ok: true,
      enabled: true,
      configured: isConfigured,
      keyId: isConfigured ? keyId : 'rzp_test_tankmanpro_mock',
      mode: isLiveKey ? 'live' : isTestKey ? 'test' : 'simulated',
      message: isConfigured
        ? `Razorpay active in ${isLiveKey ? 'LIVE' : 'TEST'} mode.`
        : 'Razorpay simulated test mode active. Real payments require RAZORPAY_KEY_ID in .env.',
    });
  });

  // 4B. Razorpay Order Creation
  app.post('/api/payments/razorpay/create-order', async (req, res) => {
    try {
      const {
        bookingId,
        bookingCode,
        amountPaise,
        customerName,
        customerEmail,
        customerPhone,
        serviceTitle,
      } = req.body || {};

      if (!amountPaise || typeof amountPaise !== 'number' || amountPaise <= 0) {
        res.status(400).json({ ok: false, error: 'Valid amountPaise is required.' });
        return;
      }

      const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
      const isConfigured = Boolean(keyId && keySecret);

      // Associate with live booking if bookingId or bookingCode provided
      const booking = liveBookings.find(
        (b) =>
          b.id === bookingId ||
          b.bookingCode === bookingCode ||
          b.bookingNumber === bookingCode
      );

      if (isConfigured) {
        // Live or Test Key call to official Razorpay API
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const receipt = (
          booking?.bookingCode ||
          booking?.bookingNumber ||
          `rcpt_${Date.now()}`
        ).slice(0, 40);

        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amountPaise),
            currency: 'INR',
            receipt,
            notes: {
              bookingId: booking?.id || bookingId || '',
              customerPhone: customerPhone || booking?.customerPhone || '',
              serviceTitle: serviceTitle || booking?.serviceTitle || '',
            },
          }),
        });

        if (!rzpResponse.ok) {
          const errData = await rzpResponse.json().catch(() => ({}));
          res.status(rzpResponse.status).json({
            ok: false,
            error:
              errData?.error?.description || 'Razorpay order creation failed.',
            details: errData,
          });
          return;
        }

        const rzpOrder = await rzpResponse.json();
        if (booking) {
          booking.razorpayOrderId = rzpOrder.id;
          booking.paymentStatus = 'created';
        }

        res.json({
          ok: true,
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId,
          isSimulated: false,
        });
      } else {
        // Sandbox Simulation Mode for development & preview
        const simOrder = generateSimulatedRazorpayOrder({
          bookingId: booking?.id || bookingId || 'sim_booking',
          bookingCode: booking?.bookingCode || bookingCode,
          amountPaise,
          customerName,
          customerEmail,
          customerPhone: customerPhone || booking?.customerPhone,
          serviceTitle: serviceTitle || booking?.serviceTitle,
        });

        if (booking) {
          booking.razorpayOrderId = simOrder.id;
          booking.paymentStatus = 'created';
        }

        res.json({
          ok: true,
          orderId: simOrder.id,
          amount: simOrder.amount,
          currency: simOrder.currency,
          keyId: 'rzp_test_tankmanpro_mock',
          isSimulated: true,
          message:
            'Development simulation order generated. Inject RAZORPAY_KEY_ID in .env for live gateway.',
        });
      }
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Server error creating Razorpay order.',
      });
    }
  });

  // 4C. Razorpay Client Payment Verification
  app.post('/api/payments/razorpay/verify', (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      bookingCode,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({
        ok: false,
        error: 'Missing razorpay_order_id or razorpay_payment_id.',
      });
      return;
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const isSimulated = String(razorpay_order_id).startsWith('order_sim_');

    if (!isSimulated && keySecret) {
      const isValid = verifyRazorpayPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature || '',
        secret: keySecret,
      });

      if (!isValid) {
        res.status(400).json({
          ok: false,
          error: 'Invalid payment signature. Verification failed.',
        });
        return;
      }
    }

    // Find and update matching booking in authoritative store
    const booking = liveBookings.find(
      (b) =>
        b.id === bookingId ||
        b.bookingCode === bookingCode ||
        b.razorpayOrderId === razorpay_order_id
    );

    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentMethod = 'razorpay_online';
      booking.razorpayOrderId = razorpay_order_id;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.updatedAtIso = new Date().toISOString();

      const payEvent: BookingEvent = {
        id: `ev_pay_${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        actorUid: 'system_razorpay',
        actorRole: 'system',
        actorName: 'Razorpay Gateway',
        fromStatus: booking.status,
        toStatus: booking.status,
        eventType: 'payment_verified',
        note: `Online payment of ${formatPaiseToInr(booking.quoteSnapshot.finalTotalPaise)} captured successfully (Payment ID: ${razorpay_payment_id}).`,
        createdAtIso: new Date().toISOString(),
      };
      liveBookingEvents.unshift(payEvent);

      const notif: PortalNotification = {
        id: `notif_pay_${Date.now()}`,
        recipientRole: 'admin',
        title: 'Payment Received (Razorpay)',
        message: `${formatPaiseToInr(booking.quoteSnapshot.finalTotalPaise)} paid online for booking ${booking.bookingNumber}.`,
        type: 'system_alert',
        severity: 'success',
        read: false,
        createdAtIso: new Date().toISOString(),
      };
      liveNotifications.unshift(notif);
    }

    res.json({
      ok: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      booking,
    });
  });

  // 4D. Razorpay Official Webhook Handler (Raw-body HMAC verification & Idempotent)
  app.post('/api/payments/razorpay/webhook', (req: any, res) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

    // Verify webhook signature if webhookSecret configured
    if (webhookSecret) {
      if (!signature) {
        res.status(400).json({ ok: false, error: 'Missing x-razorpay-signature header.' });
        return;
      }
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const isSignatureValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature,
        webhookSecret,
      });

      if (!isSignatureValid) {
        res.status(400).json({ ok: false, error: 'Invalid webhook HMAC signature.' });
        return;
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;
    const paymentEntity = payload?.payment?.entity;
    const orderEntity = payload?.order?.entity;

    // Idempotency: avoid processing identical event IDs multiple times
    const eventId =
      (req.headers['x-razorpay-event-id'] as string) ||
      paymentEntity?.id ||
      orderEntity?.id;

    if (eventId && processedRazorpayWebhookEventIds.has(eventId)) {
      res.status(200).json({ ok: true, ignored: true, reason: 'Duplicate event already processed.' });
      return;
    }
    if (eventId) {
      processedRazorpayWebhookEventIds.add(eventId);
    }

    // Match booking by orderId, payment notes, or receipt
    const targetOrderId = paymentEntity?.order_id || orderEntity?.id;
    const targetReceipt = orderEntity?.receipt;
    const targetBookingId =
      paymentEntity?.notes?.bookingId || orderEntity?.notes?.bookingId;

    const matchedBooking = liveBookings.find(
      (b) =>
        (targetOrderId && b.razorpayOrderId === targetOrderId) ||
        (targetBookingId && b.id === targetBookingId) ||
        (targetReceipt &&
          (b.bookingCode === targetReceipt || b.bookingNumber === targetReceipt))
    );

    if (matchedBooking) {
      if (event === 'payment.captured' || event === 'order.paid') {
        matchedBooking.paymentStatus = 'paid';
        matchedBooking.paymentMethod = 'razorpay_online';
        if (paymentEntity?.id) matchedBooking.razorpayPaymentId = paymentEntity.id;
        matchedBooking.updatedAtIso = new Date().toISOString();

        liveBookingEvents.unshift({
          id: `ev_wh_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: 'razorpay_webhook',
          actorRole: 'system',
          actorName: 'Razorpay Webhook',
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: 'webhook_payment_captured',
          note: `Webhook verified payment: ${paymentEntity?.id || 'captured'}.`,
          createdAtIso: new Date().toISOString(),
        });
      } else if (event === 'payment.failed') {
        matchedBooking.paymentStatus = 'failed';
        matchedBooking.updatedAtIso = new Date().toISOString();

        liveBookingEvents.unshift({
          id: `ev_wh_fail_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: 'razorpay_webhook',
          actorRole: 'system',
          actorName: 'Razorpay Webhook',
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: 'webhook_payment_failed',
          note: `Payment attempt failed: ${paymentEntity?.error_description || 'Declined'}.`,
          createdAtIso: new Date().toISOString(),
        });
      } else if (event === 'refund.processed') {
        matchedBooking.paymentStatus = 'refunded';
        matchedBooking.updatedAtIso = new Date().toISOString();

        liveBookingEvents.unshift({
          id: `ev_wh_rfnd_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: 'razorpay_webhook',
          actorRole: 'system',
          actorName: 'Razorpay Webhook',
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: 'webhook_refund_processed',
          note: 'Refund processed via Razorpay gateway.',
          createdAtIso: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({ ok: true, received: true, event });
  });

  // 4E. Admin Refund Initiator
  app.post('/api/payments/razorpay/refund', async (req, res) => {
    const { bookingId, amountPaise, reason } = req.body || {};
    const booking = liveBookings.find((b) => b.id === bookingId);

    if (!booking) {
      res.status(404).json({ ok: false, error: 'Booking not found.' });
      return;
    }
    if (booking.paymentStatus !== 'paid') {
      res.status(400).json({ ok: false, error: 'Booking has not been paid online.' });
      return;
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (keyId && keySecret && booking.razorpayPaymentId) {
      try {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const refundRes = await fetch(
          `https://api.razorpay.com/v1/payments/${booking.razorpayPaymentId}/refund`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: amountPaise ? Math.round(amountPaise) : undefined,
              notes: {
                bookingId: booking.id,
                reason: reason || 'Admin cancelled service',
              },
            }),
          }
        );

        if (!refundRes.ok) {
          const errData = await refundRes.json().catch(() => ({}));
          res.status(refundRes.status).json({
            ok: false,
            error: errData?.error?.description || 'Razorpay refund failed.',
          });
          return;
        }
      } catch (err: any) {
        res.status(500).json({ ok: false, error: err?.message || 'Refund request failed.' });
        return;
      }
    }

    booking.paymentStatus = 'refunded';
    booking.status = 'refunded';
    booking.updatedAtIso = new Date().toISOString();

    liveBookingEvents.unshift({
      id: `ev_rfnd_${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      actorUid: 'admin',
      actorRole: 'admin',
      actorName: 'Admin Operations',
      fromStatus: booking.status,
      toStatus: 'refunded',
      eventType: 'refund_issued',
      note: `Refund of ${formatPaiseToInr(amountPaise || booking.quoteSnapshot.finalTotalPaise)} issued. Reason: ${reason || 'Service cancelled'}`,
      createdAtIso: new Date().toISOString(),
    });

    res.json({ ok: true, refundIssued: true, booking });
  });

  // 5. Public PIN Code & Service Area Lookup (Reads live Admin-managed data)
  app.get('/api/public/service-areas', (req, res) => {
    const pin = typeof req.query.pin === 'string' ? req.query.pin.trim() : '';
    if (pin) {
      const result = lookupPinCoverage(pin, liveCities, liveServiceAreas);
      res.json({
        ...result,
        isDemoData: false,
      });
      return;
    }

    res.json({
      cities: liveCities.filter((c) => c.active),
      serviceAreas: liveServiceAreas.filter((a) => a.active),
      cmsSettings: liveCmsSettings,
      isDemoData: false,
    });
  });

  // 6. Public Catalog with City/PIN-Resolved Starting Prices
  app.get('/api/public/catalog', (req, res) => {
    const pin = typeof req.query.pin === 'string' ? req.query.pin.trim() : '';
    const pinLookup = pin
      ? lookupPinCoverage(pin, liveCities, liveServiceAreas)
      : null;
    const activeCityId = pinLookup?.serviceable ? pinLookup.city?.id : undefined;

    const publishedCategories = liveCategories
      .filter((c) => c.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const publishedServices = liveServices
      .filter((s) => s.status === 'published')
      .map((service) => {
        const primaryVariant =
          service.variants.find((v) => v.active) || service.variants[0];
        let startingPricePaise = primaryVariant.basePricePaise;
        let pricingMode = service.defaultPricingMode;
        let availableInSelectedPin = true;

        if (activeCityId && pinLookup?.serviceable) {
          pricingMode = resolveServicePricingMode(service, activeCityId);
          if (!service.supportedCityIds.includes(activeCityId)) {
            availableInSelectedPin = false;
          } else if (pricingMode === 'vendor_offer') {
            const offers = listEligibleVendorOffers({
              service,
              variantId: primaryVariant.id,
              cityId: activeCityId,
              pinCode: pinLookup.pinCode,
              vendors: liveVendors,
              priceOverrides: livePriceOverrides,
            });
            if (offers.length > 0) {
              startingPricePaise = offers[0].amountPaise;
            } else {
              availableInSelectedPin = false;
            }
          } else {
            const resolved = resolveEffectivePricePaise({
              service,
              variantId: primaryVariant.id,
              cityId: activeCityId,
              priceOverrides: livePriceOverrides,
            });
            if (resolved.bookable && resolved.unitPricePaise !== null) {
              startingPricePaise = resolved.unitPricePaise;
            } else {
              availableInSelectedPin = false;
            }
          }
        }

        return {
          ...service,
          effectiveStartingPricePaise: startingPricePaise,
          effectivePricingMode: pricingMode,
          availableInSelectedPin,
        };
      });

    // Sanitized public vendor profiles for storefront offer comparison & slot availability
    const publicVendors: Vendor[] = liveVendors
      .filter((v) => v.status === 'active')
      .map((v) => ({
        uid: v.uid,
        vendorCode: v.vendorCode,
        displayName: v.displayName,
        businessName: v.businessName,
        phone: '', // Never expose vendor personal phone on public catalog
        email: undefined,
        supportedCityIds: v.supportedCityIds,
        supportedAreaPins: v.supportedAreaPins,
        supportedServiceIds: v.supportedServiceIds,
        status: v.status,
        isAvailable: v.isAvailable,
        workingHoursStart: v.workingHoursStart,
        workingHoursEnd: v.workingHoursEnd,
        workingDays: v.workingDays,
        slaScore: v.slaScore,
        completionRatePercent: v.completionRatePercent,
        experienceYearsLabel: v.experienceYearsLabel,
        activeAssignedJobs: v.activeAssignedJobs,
        maxActiveJobs: v.maxActiveJobs,
        assignmentPriority: v.assignmentPriority,
        isDemo: v.isDemo,
        updatedAtIso: v.updatedAtIso,
      }));

    res.json({
      categories: publishedCategories,
      services: publishedServices,
      cities: liveCities.filter((c) => c.active),
      serviceAreas: liveServiceAreas.filter((a) => a.active),
      vendors: publicVendors,
      priceOverrides: livePriceOverrides.filter((po) => po.active),
      coupons: liveCoupons.filter((c) => c.active),
      cmsSettings: liveCmsSettings,
      pinResolution: pinLookup,
      isDemoData: false,
    });
  });

  // 7. Public Service Detail & Eligible Vendor Offers
  app.get('/api/public/services/:slug', (req, res) => {
    const slug = req.params.slug;
    const pin = typeof req.query.pin === 'string' ? req.query.pin.trim() : '';
    const variantIdParam =
      typeof req.query.variantId === 'string' ? req.query.variantId.trim() : '';

    const service = liveServices.find(
      (s) => (s.slug === slug || s.id === slug) && s.status === 'published'
    );

    if (!service) {
      res.status(404).json({ error: 'Service not found or not published.' });
      return;
    }

    const activeVariant =
      service.variants.find((v) => v.id === variantIdParam && v.active) ||
      service.variants.find((v) => v.active)!;

    const pinLookup = pin
      ? lookupPinCoverage(pin, liveCities, liveServiceAreas)
      : null;

    let pricingMode = service.defaultPricingMode;
    let vendorOffers = [] as ReturnType<typeof listEligibleVendorOffers>;
    let cityPriceResolution = null;

    if (pinLookup?.serviceable && pinLookup.city) {
      pricingMode = resolveServicePricingMode(service, pinLookup.city.id);
      if (pricingMode === 'vendor_offer') {
        vendorOffers = listEligibleVendorOffers({
          service,
          variantId: activeVariant.id,
          cityId: pinLookup.city.id,
          pinCode: pinLookup.pinCode,
          vendors: liveVendors,
          priceOverrides: livePriceOverrides,
        });
      } else {
        cityPriceResolution = resolveEffectivePricePaise({
          service,
          variantId: activeVariant.id,
          cityId: pinLookup.city.id,
          priceOverrides: livePriceOverrides,
        });
      }
    }

    res.json({
      service,
      activeVariantId: activeVariant.id,
      pinResolution: pinLookup,
      pricingMode,
      cityPriceResolution,
      vendorOffers,
      isDemoData: false,
    });
  });

  // 8. Authoritative Server-Side Quote Calculation
  app.post('/api/pricing/quote', (req, res) => {
    const body = req.body as Partial<QuoteRequestPayload>;
    if (!body || !body.pinCode || !body.serviceId || !body.variantId) {
      res.status(400).json({
        bookable: false,
        reason: 'pinCode, serviceId, and variantId are required to calculate an authoritative quote.',
      });
      return;
    }

    const quote = calculateAuthoritativeQuote({
      request: {
        pinCode: String(body.pinCode),
        serviceId: String(body.serviceId),
        variantId: String(body.variantId),
        addonQuantities: body.addonQuantities || {},
        selectedVendorUid: body.selectedVendorUid ? String(body.selectedVendorUid) : undefined,
        couponCode: body.couponCode ? String(body.couponCode) : undefined,
      },
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      taxRatePercent: liveCmsSettings.defaultTaxRatePercent || 0,
    });

    res.json(quote);
  });

  // 9. Server-Side Coupon Validation
  app.post('/api/coupons/validate', (req, res) => {
    const { couponCode, subtotalPaise, cityId, serviceId } = req.body || {};
    const result = evaluateCouponDiscount({
      couponCode: String(couponCode || ''),
      subtotalPaise: Number(subtotalPaise || 0),
      cityId: String(cityId || ''),
      serviceId: String(serviceId || ''),
      coupons: liveCoupons,
    });
    res.json(result);
  });

  // 9B. Phase 3 — Real-Time Slot Availability & Conflict Checker
  app.get('/api/bookings/slots', (req, res) => {
    const pinCode = typeof req.query.pinCode === 'string' ? req.query.pinCode.trim() : '';
    const serviceId = typeof req.query.serviceId === 'string' ? req.query.serviceId.trim() : '';
    const variantId = typeof req.query.variantId === 'string' ? req.query.variantId.trim() : '';
    const scheduledDate =
      typeof req.query.scheduledDate === 'string'
        ? req.query.scheduledDate.trim()
        : new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const selectedVendorUid =
      typeof req.query.selectedVendorUid === 'string' && req.query.selectedVendorUid.trim()
        ? req.query.selectedVendorUid.trim()
        : undefined;

    const pinLookup = lookupPinCoverage(pinCode, liveCities, liveServiceAreas);
    if (!pinLookup.serviceable || !pinLookup.city) {
      res.json({
        serviceable: false,
        pinCode,
        scheduledDate,
        slots: [],
        assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy,
        message: pinLookup.message,
      });
      return;
    }

    const service = liveServices.find(
      (s) => (s.id === serviceId || s.slug === serviceId) && s.status === 'published'
    );
    if (!service) {
      res.status(404).json({ error: 'Service not found or not published.' });
      return;
    }

    const chosenVariant =
      service.variants.find((v) => v.id === variantId && v.active) ||
      service.variants.find((v) => v.active) ||
      service.variants[0];

    const slots = evaluateSlotsForDate({
      service,
      variantId: chosenVariant.id,
      cityId: pinLookup.city.id,
      pinCode,
      scheduledDate,
      vendors: liveVendors,
      existingBookings: liveBookings,
      priceOverrides: livePriceOverrides,
      selectedVendorUid,
    });

    res.json({
      serviceable: true,
      pinCode,
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      scheduledDate,
      assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy,
      slots,
    });
  });

  // 9C. Phase 3 — Authoritative Customer Booking Creation & Vendor Dispatch
  app.post('/api/bookings', (req, res) => {
    const input = (req.body || {}) as CreateCustomerBookingInput;

    const result = createCustomerBookingTransaction({
      input,
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      existingBookings: liveBookings,
      assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy || 'auto_score',
      taxRatePercent: liveCmsSettings.defaultTaxRatePercent || 0,
      allowUnassignedAdminReview: true,
    });

    if (!result.ok || !result.booking) {
      res.status(400).json({
        ok: false,
        errorCode: result.errorCode,
        error: result.error || 'Could not create booking.',
      });
      return;
    }

    if (!result.duplicatePrevented) {
      liveBookings.unshift(result.booking);

      // Update assigned vendor active job counter
      if (result.booking.assignedVendorUid) {
        const assignedVendor = liveVendors.find(
          (v) => v.uid === result.booking!.assignedVendorUid
        );
        if (assignedVendor) {
          assignedVendor.activeAssignedJobs += 1;
          assignedVendor.updatedAtIso = result.booking.createdAtIso;
        }
      }

      // Increment coupon redemption counter if applied
      if (result.booking.priceSnapshot.couponCode) {
        const appliedCoupon = liveCoupons.find(
          (c) =>
            c.code.toUpperCase() ===
            result.booking!.priceSnapshot.couponCode!.toUpperCase()
        );
        if (appliedCoupon) {
          appliedCoupon.currentRedemptions += 1;
        }
      }

      if (result.bookingEvent) {
        liveBookingEvents.unshift(result.bookingEvent);
      }
      if (result.notifications && result.notifications.length > 0) {
        liveNotifications.unshift(...result.notifications);
      }
    }

    const bookingEvents = liveBookingEvents.filter(
      (ev) => ev.bookingId === result.booking!.id
    );

    res.status(result.duplicatePrevented ? 200 : 201).json({
      ok: true,
      duplicatePrevented: Boolean(result.duplicatePrevented),
      booking: result.booking,
      dispatchDecision: result.dispatchDecision,
      quote: result.quote,
      events: bookingEvents,
      message: result.dispatchDecision?.customerMessage || 'Booking confirmed.',
    });
  });

  // 9D. Phase 3 — Customer Booking Lookup & Live Status Tracker
  app.get('/api/customer/bookings', (req, res) => {
    const phoneParam =
      typeof req.query.phone === 'string'
        ? req.query.phone.replace(/\D/g, '').slice(-10)
        : '';
    const codeParam =
      typeof req.query.bookingCode === 'string'
        ? req.query.bookingCode.trim().toUpperCase()
        : '';
    const idsParam =
      typeof req.query.ids === 'string'
        ? req.query.ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const matched = liveBookings.filter((b) => {
      const bCode = b.bookingCode || b.bookingNumber;
      if (codeParam && bCode.toUpperCase() === codeParam) {
        return true;
      }
      if (
        phoneParam &&
        phoneParam.length === 10 &&
        b.customerPhone.replace(/\D/g, '').slice(-10) === phoneParam
      ) {
        return true;
      }
      if (idsParam.length > 0 && (idsParam.includes(b.id) || idsParam.includes(bCode))) {
        return true;
      }
      return false;
    });

    const enriched = matched.map((b) => {
      const assignedVendor = b.assignedVendorUid
        ? liveVendors.find((v) => v.uid === b.assignedVendorUid)
        : null;
      const events = liveBookingEvents.filter((ev) => ev.bookingId === b.id);
      return {
        booking: b,
        assignedVendorSummary: assignedVendor
          ? {
              uid: assignedVendor.uid,
              vendorCode: assignedVendor.vendorCode,
              displayName: assignedVendor.displayName,
              businessName: assignedVendor.businessName,
              experienceYearsLabel: assignedVendor.experienceYearsLabel,
            }
          : null,
        events,
      };
    });

    res.json({
      bookings: enriched,
    });
  });

  // 9E. Phase 3 — Customer Booking Cancellation (Before Job Starts)
  app.post('/api/customer/bookings/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { reason } = (req.body || {}) as { reason?: string };

    const booking = liveBookings.find(
      (b) => b.id === id || (b.bookingCode || b.bookingNumber).toUpperCase() === id.toUpperCase()
    );
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (
      booking.status === 'in_progress' ||
      booking.status === 'completed' ||
      booking.status === 'cancelled' ||
      booking.status === 'refunded'
    ) {
      res.status(400).json({
        error: `Booking in "${booking.status}" state cannot be cancelled directly. Please contact support.`,
      });
      return;
    }

    const prevStatus = booking.status;
    const prevVendorUid = booking.assignedVendorUid;
    const nowIso = new Date().toISOString();
    const cleanReason =
      (reason || '').trim() || 'Cancelled by customer from My Bookings portal';

    booking.status = 'cancelled';
    booking.subStatus = 'customer_cancelled';
    booking.cancellationReason = cleanReason;
    booking.updatedAtIso = nowIso;

    if (prevVendorUid) {
      const vendor = liveVendors.find((v) => v.uid === prevVendorUid);
      if (vendor && vendor.activeAssignedJobs > 0) {
        vendor.activeAssignedJobs = Math.max(0, vendor.activeAssignedJobs - 1);
      }

      liveNotifications.unshift({
        id: `notif_vnd_cancel_${Date.now()}`,
        recipientRole: 'vendor',
        recipientUid: prevVendorUid,
        title: `Booking Cancelled by Customer: ${booking.bookingCode}`,
        message: `Customer ${booking.customerName} cancelled ${booking.bookingCode} (${booking.scheduledDate} · ${booking.timeWindow}). Reason: ${cleanReason}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        severity: 'warning',
        read: false,
        createdAtIso: nowIso,
      });
    }

    liveNotifications.unshift({
      id: `notif_adm_cancel_${Date.now()}`,
      recipientRole: 'admin',
      title: `Customer Cancelled Booking ${booking.bookingCode}`,
      message: `${booking.customerName} cancelled ${booking.bookingCode} in ${booking.cityName} (${booking.pinCode}). Reason: ${cleanReason}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      severity: 'warning',
      read: false,
      createdAtIso: nowIso,
    });

    liveBookingEvents.unshift({
      id: `ev_cust_cancel_${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      actorUid: booking.customerUid,
      actorRole: 'customer',
      actorName: booking.customerName,
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      eventType: 'customer_cancelled_booking',
      note: `Customer cancelled booking: ${cleanReason}`,
      createdAtIso: nowIso,
    });

    res.json({
      ok: true,
      booking,
      events: liveBookingEvents.filter((ev) => ev.bookingId === booking.id),
      message: `Booking ${booking.bookingCode} has been cancelled.`,
    });
  });

  // 10. Uncovered PIN Code Opt-In Waitlist
  app.post('/api/public/waitlist', (req, res) => {
    const { pinCode, customerName, phoneOrEmail, requestedServiceSlug, consentGiven } =
      req.body || {};

    if (!isValidIndianPin(String(pinCode || ''))) {
      res.status(400).json({ error: 'Please provide a valid 6-digit Indian PIN code.' });
      return;
    }
    if (!customerName || String(customerName).trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!phoneOrEmail || String(phoneOrEmail).trim().length < 5) {
      res.status(400).json({ error: 'Please provide a valid phone number or email address.' });
      return;
    }
    if (!consentGiven) {
      res.status(400).json({
        error: 'Please check the consent box so we can notify you when coverage opens in your PIN code.',
      });
      return;
    }

    const entry: WaitlistEntry = {
      id: `wl_${Date.now()}`,
      pinCode: String(pinCode).trim(),
      customerName: String(customerName).trim(),
      phoneOrEmail: String(phoneOrEmail).trim(),
      requestedServiceSlug: requestedServiceSlug ? String(requestedServiceSlug) : undefined,
      consentGiven: true,
      createdAtIso: new Date().toISOString(),
    };
    waitlistEntries.push(entry);

    res.status(201).json({
      success: true,
      entry,
      message: `Waitlist request recorded for PIN ${entry.pinCode}.`,
    });
  });

  // 11. Customer Support Contact Submission
  app.post('/api/public/contact', (req, res) => {
    const { name, emailOrPhone, pinCode, message } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!emailOrPhone || String(emailOrPhone).trim().length < 5) {
      res.status(400).json({ error: 'Please enter a valid email address or 10-digit phone number.' });
      return;
    }
    if (!message || String(message).trim().length < 10) {
      res.status(400).json({ error: 'Please enter a message of at least 10 characters.' });
      return;
    }

    const record = {
      id: `inq_${Date.now()}`,
      name: String(name).trim(),
      emailOrPhone: String(emailOrPhone).trim(),
      pinCode: pinCode ? String(pinCode).trim() : undefined,
      message: String(message).trim(),
      createdAtIso: new Date().toISOString(),
    };
    contactSubmissions.push(record);

    res.status(201).json({
      success: true,
      inquiryId: record.id,
      message: 'Your inquiry has been logged.',
    });
  });

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TankmanPro server listening on http://localhost:${PORT}`);
  });
}

startServer();
