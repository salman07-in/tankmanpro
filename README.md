# TankmanPro — Home-Services Marketplace & City-Wise Vendor Routing

TankmanPro is a full-stack Indian home-services booking platform built with React 19, TypeScript, Tailwind CSS v4, and an Express API server. It enforces strict role and app-shell separation across three portals (Customer Storefront, Main Admin Console, and Partner Vendor Portal), integer-paise pricing precedence, and PIN-code coverage verification.

---

## 1. Architecture Summary & Separate Portal URLs

### Three Hostname-Aware App Shells (One Shared Backend & Authoritative Database)

| Portal | Production URL | AI Studio Preview Fallback | Target Audience & Permissions |
| :--- | :--- | :--- | :--- |
| **Customer Storefront** | `https://tankmanpro.com/` | `/` | Public browsing, 6-digit PIN lookup, service variants/add-ons, city-fixed or vendor-offer quotes, checkout, and own bookings. **Contains zero links, buttons, or switchers to Admin or Vendor portals.** |
| **Main Admin Console** | `https://admin.tankmanpro.com/login` | `/admin/login` & `/admin/*` | Operational CRUD for cities, PIN areas, categories, services, price overrides, vendor approvals, assignments, coupons, refunds, and audit logs. |
| **Partner Vendor Portal** | `https://partner.tankmanpro.com/login` | `/vendor/login` & `/vendor/*` | Scoped strictly to bookings where `assignedVendorId == auth.uid`. Vendors can accept/reject assigned jobs and update permitted work statuses (`assigned -> accepted -> in_progress -> completed`). |

- **No Obscurity as Security**: Hostname and route separation only select the UI shell. Every API endpoint and Firestore Security Rule validates the user's authenticated UID and authoritative role.
- **Cross-Subdomain Origin Isolation**: Browser storage (`indexedDB`/`localStorage`) is origin-specific. Each subdomain authenticates independently against the same Firebase project.

---

## 2. Repository & Module Structure

```text
/
├── .env.example                 # Documented environment variable placeholders (no secrets)
├── index.html                   # HTML entry point with Plus Jakarta Sans, DM Sans & JetBrains Mono
├── metadata.json                # AI Studio application metadata
├── package.json                 # Full-stack scripts (dev, build, start, lint, test)
├── server.ts                    # Express API server + Vite middleware (Port 3000)
└── src/
    ├── App.tsx                  # Hostname & path-fallback portal router
    ├── index.css                # Tailwind v4 theme & typography definitions
    ├── main.tsx                 # React DOM root
    ├── types/
    │   └── domain.ts            # Typed models (City, ServiceArea, Service, Vendor, PriceOverride, QuoteBreakdown)
    ├── data/
    │   └── demoCatalog.ts       # Seeded Phase 1 demo records (flagged isDemo: true; 110001, 242001, uncovered 400001)
    ├── lib/
    │   ├── portalRouting.ts     # Hostname/path portal resolution & 6-digit Indian PIN validation
    │   ├── pricingEngine.ts     # Authoritative integer-paise price resolver & coupon engine
    │   └── tankman.test.ts      # Node built-in test runner suite (node --test)
    ├── components/
    │   └── ServiceIllustration.tsx # Bespoke technical SVG illustrations with zero broken external URLs
    └── shells/
        ├── CustomerShell.tsx    # Public storefront, catalog, service detail, PIN modal, checkout preview
        ├── AdminShell.tsx       # Isolated Main Admin portal shell (/admin/login & module routes)
        └── VendorShell.tsx      # Isolated Partner Vendor portal shell (/vendor/login & assigned order routes)
```

---

## 3. Proposed Firestore Collection Schema & Indexes (Phase 2+)

- `users/{uid}` — Customer profile and addresses; role field is read-only to the client and managed only via server-side Admin SDK / protected bootstrap.
- `cities/{cityId}` — `name`, `state`, `slug`, `active`, `isDemo`.
- `serviceAreas/{areaId}` — `cityId`, `pinCode` (indexed), `zoneLabel`, `neighbourhoods`, `active`.
- `categories/{categoryId}` — `name`, `slug`, `sortOrder`, `status` (`published` | `draft` | `archived`).
- `services/{serviceId}` — Catalog metadata, `basePricePaise`, `defaultPricingMode`, `cityModeOverrides`, `variants`, `addons`, `questions`, `supportedCityIds`, `status`.
- `vendors/{vendorUid}` — Business profile, `status` (`active` | `pending` | `suspended`), `supportedCityIds`, `supportedAreaPins`, `supportedServiceIds`, `maxActiveJobs`, `activeAssignedJobs`.
- `priceOverrides/{priceId}` — Composite lookup on `(serviceId, variantId, cityId, vendorUid, active)` with `amountPaise` and audit fields.
- `slotPolicies/{policyId}` & `slotHolds/{holdId}` — Expiring transactional holds preventing slot overbooking.
- `bookings/{bookingId}` — `customerUid`, `assignedVendorId`, `assignmentStatus`, `jobStatus`, `paymentStatus`, immutable `serviceSnapshot`, `addressSnapshot`, `priceSnapshot`, `couponSnapshot`, and server timestamps.
- `payments/{paymentId}` — Linked `bookingId`, Razorpay `orderId`, `paymentId`, `amountPaise`, `status`, raw-body verified webhook event IDs.
- `coupons/{couponId}` & `couponRedemptions/{redemptionId}` — Atomic redemption tracking.
- `reviews/{reviewId}` — Verified completed-booking reviews with Admin moderation state.
- `auditLogs/{logId}` — Append-only privileged action log.
- `siteSettings/{settingId}` — Non-secret operational configuration (announcement strip, tax rate, cancellation window).

---

## 4. Phased Implementation Plan

- **Phase 0 (Completed)**: Architecture, folder structure, typed domain models, hostname/fallback portal routing, integer-paise pricing engine, unit tests, and documentation.
- **Phase 1 (Completed)**: Original light-theme TankmanPro Customer Storefront, 6-digit PIN coverage checker (`110001` New Delhi, `242001` Shahjahanpur, `400001` uncovered waitlist), category/service catalog, service detail with City-Fixed and Vendor-Offer modes, interactive checkout quote preview, and isolated Admin (`/admin/login`) & Vendor (`/vendor/login`) portal shells.
- **Phase 2 (Next)**: Provision Firebase Authentication and Cloud Firestore, deploy default-deny `firestore.rules`, implement one-time Admin bootstrap, and add cross-role isolation tests.
- **Phase 3**: Full Admin CRUD for cities, PIN codes, categories, services, variants, add-ons, vendors, and price overrides.
- **Phase 4**: Persistent server pricing resolver, CSV price import/export preview, and atomic coupon CRUD/validation.
- **Phase 5**: Transactional slot holds, booking creation, automated round-robin/least-active vendor assignment, Admin reassignment, and live Vendor Portal order state machine.
- **Phase 6**: Razorpay Test Mode order creation, server signature verification, raw-body webhook idempotency, and Admin-initiated refunds.
- **Phase 7**: Customer saved addresses, booking timeline, downloadable GST/non-GST invoice receipts, completed-booking reviews, and Admin financial reports.
- **Phase 8**: Full P0 acceptance audit, Cloud Run custom domain mapping (`tankmanpro.com`, `admin.tankmanpro.com`, `partner.tankmanpro.com`), and launch readiness checklist.
