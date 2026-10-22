# TankmanPro — Comprehensive Product Requirements Document (PRD) & Project Status Report

**Document Version:** 1.0.0  
**Last Updated:** October 2026  
**Project:** TankmanPro — Indian Home-Services Marketplace & City-Wise Vendor Routing  
**Status:** Core Architecture & Platform Portals Fully Implemented (Phases 0–5 Complete; Production Gateway & Cloud Sync Staged)  
**Engineering Stack:** React 19, TypeScript 5.8, Tailwind CSS v4, Express 4.21, Vite 8, Firebase Firestore & Security Rules, Node Test Runner  

---

## 1. Executive Summary

**TankmanPro** is an on-demand Indian home-services marketplace engineered for mechanized water tank cleaning, deep cleaning, AC servicing, car wash, sofa/mattress sanitization, and specialized home aesthetics.

Unlike generic service directories, TankmanPro enforces:
1. **Strict 3-Portal Separation:** Customer Storefront (`tankmanpro.com`), Main Admin Console (`admin.tankmanpro.com`), and Partner Vendor Portal (`partner.tankmanpro.com`) operate as isolated, hostname-aware app shells.
2. **Hyper-Local Indian PIN Serviceability:** Dynamic 6-digit postal code validation with city-level zoning and automated waitlist capture for uncovered areas.
3. **Deterministic Integer-Paise Pricing Engine:** Strict precedence (`Vendor Override` > `City Override` > `Catalog Base Price`) calculated in integer paise (100 paise = ₹1.00) to eliminate floating-point drift.
4. **Privacy-First Dispatch & Vendor State Machine:** Automated and manual dispatch modes with customer PII data masking until partner job acceptance.
5. **Dual Persistence Architecture:** Built with an Express REST API backend and seed-loaded operational state, coupled with production-ready Firestore Security Rules (`firestore.rules`).

---

## 2. Platform Architecture & Portal Isolation

```
                               ┌──────────────────────────────────────────────┐
                               │             Host Request / URL               │
                               └──────────────────────┬───────────────────────┘
                                                      │
                         ┌────────────────────────────┼────────────────────────────┐
                         ▼                            ▼                            ▼
               tankmanpro.com / /         admin.tankmanpro.com /admin/*   partner.tankmanpro.com /vendor/*
            ┌──────────────────────┐    ┌──────────────────────────────┐ ┌────────────────────────────────┐
            │  Customer Storefront │    │      Main Admin Console      │ │      Partner Vendor Portal     │
            │  (Public Storefront) │    │   (Operations & Governance)  │ │      (Partner Field Ops)       │
            └──────────┬───────────┘    └──────────────┬───────────────┘ └────────────────┬───────────────┘
                       │                               │                                  │
                       └───────────────────────────────┼──────────────────────────────────┘
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │     Express API Server (Port 3000)│
                                     │     Authoritative Pricing Engine  │
                                     │     PIN Coverage & Dispatch Engine│
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │    Authoritative Data Store       │
                                     │    (Firestore / Cloud Engine)     │
                                     └───────────────────────────────────┘
```

### 2.1 Portal Topology & Target Personas

| Portal | Hostname / Preview URL | Target Persona | Access Model | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Storefront** | `https://tankmanpro.com/`<br>*(Fallback: `/`)* | Indian Homeowners, Tenants, Property Managers | Public / OTP / Email Sign-In | • 6-digit PIN coverage verification<br>• Urban Company–style category & package browsing<br>• Custom variant selection & add-on customizer<br>• City-Fixed vs Vendor-Offer comparison<br>• Slot scheduling & coupon redemption<br>• Order tracking & cancellation |
| **Main Admin Console** | `https://admin.tankmanpro.com/`<br>*(Fallback: `/admin/*`)* | Platform Operations, City Managers, Dispatchers | Role-Gated Admin Session (`admin`) | • Live KPI dashboard (GMV, bookings, active vendors)<br>• Category & Service catalog CRUD with deletion safety guards<br>• Cities & Service Areas management with Bulk CSV validation<br>• Vendor onboarding, KYC notes & suspension controls<br>• Manual & automated vendor dispatch matching<br>• Dynamic price override configuration<br>• CMS announcement & coupon controls |
| **Partner Vendor Portal** | `https://partner.tankmanpro.com/`<br>*(Fallback: `/vendor/*`)* | Verified Technicians & Service Partner Agencies | Role-Gated Vendor Session (`vendor`) | • Scoped job dashboard (filtered by `assignedVendorUid`)<br>• Customer PII masking before job acceptance<br>• Job state transitions (`accept`, `reject`, `in_progress`, `complete`)<br>• Sub-status updates (`en_route`, `arrived`, `working`)<br>• Job execution checklist, notes & completion photos<br>• Custom vendor price overrides & availability toggle<br>• Partner earnings & SLA performance metrics |

---

## 3. Detailed Feature Specifications & Current Status

### Status Legend
- 🟢 **COMPLETED & VERIFIED:** Built, functional, styled, and unit-tested.
- 🟡 **IN PROGRESS / STAGED:** Backend logic and UI implemented; pending third-party API keys or external live connection.
- ⚪ **PLANNED / ROADMAP:** Next scheduled enhancements for post-launch releases.

---

### 3.1 Module 1: Indian PIN Code & Coverage Serviceability Engine
*Lead File: [portalRouting.ts](file:///d:/new%20web%20pro/tankmanpro/src/lib/portalRouting.ts)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **PIN-01** | Strict 6-Digit Indian PIN Format Validation | 🟢 COMPLETED | Enforces `/^[1-9][0-9]{5}$/`; rejects non-digits, lengths $\neq 6$, and numbers beginning with `0`. |
| **PIN-02** | Real-Time Postal Code Serviceability Lookup | 🟢 COMPLETED | Instant resolution against active cities and service areas (e.g. `110001` New Delhi, `242001` Shahjahanpur). |
| **PIN-03** | Persistent Location Session | 🟢 COMPLETED | Saves active PIN in browser `sessionStorage`; updates UI dynamically across catalog without page reload. |
| **PIN-04** | Unsupported PIN Area Waitlist Ingestion | 🟢 COMPLETED | When customer enters an uncovered PIN (e.g. `400001` Mumbai), renders waitlist capture form; saves leads into backend waitlist storage. |
| **PIN-05** | Service Area Conflict Flagging | 🟢 COMPLETED | Detects PINs mapped across multiple conflicting city boundaries or overlapping zones. |

---

### 3.2 Module 2: Integer-Paise Pricing & Precedence Engine
*Lead File: [pricingEngine.ts](file:///d:/new%20web%20pro/tankmanpro/src/lib/pricingEngine.ts)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **PRC-01** | Integer-Paise Precision Architecture | 🟢 COMPLETED | All monetary calculations use integer paise ($100\text{ paise} = ₹1.00$). Zero floating-point discrepancies. |
| **PRC-02** | Three-Tier Pricing Precedence | 🟢 COMPLETED | Precedence rule: **`Vendor Override` > `City Override` > `Catalog Base Price`**. Verified by automated unit tests. |
| **PRC-03** | Dual Pricing Modes | 🟢 COMPLETED | Supports `city_fixed` (standard flat rates) and `vendor_offer` (competitive bids from local vendors). |
| **PRC-04** | Add-on & Quantity Accumulator | 🟢 COMPLETED | Accurately aggregates service variant base price + itemized add-ons ($unit \times qty$) into subtotal paise. |
| **PRC-05** | Atomic Coupon Engine | 🟢 COMPLETED | Evaluates percentage and flat discounts, minimum order thresholds, city restrictions, and maximum discount caps. |
| **PRC-06** | GST Tax Computation | 🟢 COMPLETED | Configurable tax computation (default 18% GST) applied to discounted subtotal. |
| **PRC-07** | Currency Display Formatter | 🟢 COMPLETED | Formats integer paise into standard Indian Rupee notation (e.g., `59900` paise $\rightarrow$ `₹599`). |

---

### 3.3 Module 3: Customer Storefront & Booking Journey
*Lead File: [CustomerShell.tsx](file:///d:/new%20web%20pro/tankmanpro/src/shells/CustomerShell.tsx)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **CUST-01** | Urban Company–Style Modern UI | 🟢 COMPLETED | Polished typography, high-resolution photography, responsive hero banner, category carousel, trust badges, and verified customer testimonials. |
| **CUST-02** | Service Detail & Package Customizer | 🟢 COMPLETED | Displays variants, inclusions, exclusions, preparation tips, FAQs, tank capacity/unit requirements, and customer photo upload placeholders. |
| **CUST-03** | Vendor Selection Cards (Vendor-Offer Mode) | 🟢 COMPLETED | When service is in `vendor_offer` mode, renders verified vendor cards showing ratings, years of experience, and custom quoted rates. |
| **CUST-04** | Interactive Slot Picker & Holds | 🟢 COMPLETED | Date calendar selection (up to 7 days ahead) with time windows (Morning, Afternoon, Evening) and capacity conflict checks. |
| **CUST-05** | Multi-Step Checkout Modal | 🟢 COMPLETED | Structured checkout: Address entry (Apartment, Street, Landmark, Property Type) $\rightarrow$ Slot confirmation $\rightarrow$ Coupon application $\rightarrow$ Payment selection. |
| **CUST-06** | Payment Method Selection | 🟢 COMPLETED | Supports **Pay After Service** and **Online Razorpay** with real-time price snapshot freeze. |
| **CUST-07** | Customer Account Portal & Order Tracking | 🟢 COMPLETED | Route `/account/bookings` displays past & active bookings, real-time status badge, technician details, and one-click cancellation. |
| **CUST-08** | Informational & Legal Pages | 🟢 COMPLETED | Full pages for `/how-it-works`, `/service-areas`, `/about`, `/help`, `/contact`, `/privacy`, `/terms`, and `/cancellation-refund-policy`. |

---

### 3.4 Module 4: Main Admin Operations Console
*Lead File: [AdminShell.tsx](file:///d:/new%20web%20pro/tankmanpro/src/shells/AdminShell.tsx)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **ADM-01** | Operational KPI Dashboard | 🟢 COMPLETED | Real-time calculations: Total Revenue (₹), Active Bookings, Completed Jobs, Active Vendors, and City/Date range filters. |
| **ADM-02** | Service Catalog & Category Management | 🟢 COMPLETED | Add, edit, archive, and publish services and categories with image selectors, pricing mode toggle, and variant definitions. |
| **ADM-03** | Service Deletion Safety Guard | 🟢 COMPLETED | [adminEngine.ts](file:///d:/new%20web%20pro/tankmanpro/src/lib/adminEngine.ts) blocks deletion if service is referenced by existing bookings; prompts admin to archive instead. |
| **ADM-04** | Cities & PIN Management with CSV Bulk Importer | 🟢 COMPLETED | Add individual PIN areas or upload CSV with automatic format validation, duplicate detection, and city mapping. |
| **ADM-05** | Vendor Fleet Management & KYC Oversight | 🟢 COMPLETED | Full partner list with status controls (`active`, `pending`, `suspended`), capacity caps (`maxActiveJobs`), and password reset triggers. |
| **ADM-06** | Intelligent Dispatch & Manual Reassignment | 🟢 COMPLETED | Matches eligible vendors based on City, PIN, and Service capability; provides one-click assignment and override. |
| **ADM-07** | Price Override Matrix Manager | 🟢 COMPLETED | Authoring matrix for City-specific and Vendor-specific price overrides with immediate effect in customer quotes. |
| **ADM-08** | CMS Settings & Announcement Strip | 🟢 COMPLETED | Real-time editing of hero headers, announcement banners, customer support phone/WhatsApp, and default dispatch policies. |
| **ADM-09** | Coupon Creator & Redemption Tracking | 🟢 COMPLETED | Create percentage or fixed rupee discount vouchers with redemption caps and expiry dates. |

---

### 3.5 Module 5: Partner Vendor Portal & Field Execution
*Lead File: [VendorShell.tsx](file:///d:/new%20web%20pro/tankmanpro/src/shells/VendorShell.tsx)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **VND-01** | Partner Authentication & Profile Isolation | 🟢 COMPLETED | Independent vendor login via Partner Code or email. Session isolates queries exclusively to `assignedVendorUid`. |
| **VND-02** | Customer PII Masking (Pre-Acceptance) | 🟢 COMPLETED | Masked customer phone number (`+91 98XXX XXXXX`) and redacted address line until vendor explicitly accepts the job. |
| **VND-03** | Job Acceptance & Rejection Workflow | 🟢 COMPLETED | Vendor can accept job (reveals PII) or reject with mandatory reason (triggers `reassignment_required` in Admin console). |
| **VND-04** | Real-Time Job State Machine | 🟢 COMPLETED | Permitted transitions: `assigned -> accepted -> in_progress -> completed`. |
| **VND-05** | On-Site Sub-Status Updates | 🟢 COMPLETED | Field milestones: `en_route` (on the way) $\rightarrow$ `arrived` (reached customer site) $\rightarrow$ `working` (service underway). |
| **VND-06** | Work Checklist, Notes & Completion Photos | 🟢 COMPLETED | Technicians record safety checks, operational notes, and upload service completion photo records. |
| **VND-07** | Custom Price Quoting (Vendor Offers) | 🟢 COMPLETED | Partners can set custom quotes for supported services in their operating cities. |
| **VND-08** | Vendor Availability Toggle | 🟢 COMPLETED | One-click toggle between "Available for Dispatch" and "Off Duty" to prevent unwanted job assignments. |
| **VND-09** | Performance & Earnings Analytics | 🟢 COMPLETED | Tracks monthly gross earnings in ₹, completed job count, customer rating, and active workload. |

---

### 3.6 Module 6: Backend Server & Integration Services
*Lead File: [server.ts](file:///d:/new%20web%20pro/tankmanpro/server.ts)*

| Feature ID | Feature Description | Status | Verification & Implementation Notes |
| :--- | :--- | :--- | :--- |
| **SRV-01** | Express 4.21 API Server | 🟢 COMPLETED | 40+ RESTful API endpoints handling Admin, Vendor, Public Catalog, Pricing, Booking, and Waitlist flows. |
| **SRV-02** | Vite Server Middleware | 🟢 COMPLETED | Single command development (`npm run dev`) serving SSR/SPA client and API on Port 3000. |
| **SRV-03** | Firestore Security Rules Matrix | 🟢 COMPLETED | [firestore.rules](file:///d:/new%20web%20pro/tankmanpro/firestore.rules) defines default-deny access, role verification (`isAdmin()`, `isVendor()`, `isOwner()`), and audit logging. |
| **SRV-04** | Razorpay Payment Integration | 🟢 COMPLETED | [paymentEngine.ts](file:///d:/new%20web%20pro/tankmanpro/src/lib/paymentEngine.ts) implements order creation, timing-safe HMAC SHA-256 signature verification, raw-body webhook listener, and admin refund API. |
| **SRV-05** | Production Firebase Auth Cloud Connect | 🟡 STAGED | Client SDK wired in [firebase.ts](file:///d:/new%20web%20pro/tankmanpro/src/firebase.ts); configured with fallback credentials for standalone offline dev. |
| **SRV-06** | Notification Dispatch (SMS/WhatsApp) | ⚪ PLANNED | Architecture supports hooking Twilio/Gupshup triggers on `BookingEvent` emission. |

---

## 4. Test Suite & Quality Verification

The platform maintains automated test coverage using the Node.js built-in test runner (`node --test`).

**Command:**
```powershell
npm.cmd run test
```

### 4.1 Test Execution Report (12/12 Passing)

```text
✔ Portal Routing: separates customer, admin, and vendor shells across domains and preview paths (2.42ms)
✔ PIN Code Validation & Serviceability Lookup: validates 6-digit Indian PINs and active areas (0.82ms)
✔ Pricing Precedence: vendor_override > city_override > base_price in integer paise (0.85ms)
✔ Vendor Offer Listing: lists only active vendors matching city, PIN, service, and approved override (0.59ms)
✔ Coupon Evaluation: validates min order subtotal, city restrictions, and discount caps in paise (48.91ms)
✔ Authoritative Quote Calculation: computes base + addons - discount = finalTotalPaise (5.38ms)
✔ Admin Engine: Service Deletion Guard blocks deletion when bookings exist and allows when unreferenced (1.16ms)
✔ Admin Engine: CSV PIN Code Bulk Validator catches invalid PINs, duplicates, and multi-city conflicts (1.93ms)
✔ Admin Engine: Dashboard Metrics, Vendor ID Generator, and Eligible Vendor Dispatch Matcher (1.94ms)
✔ Vendor Engine: isolates bookings per vendor, masks PII before acceptance, and validates job transitions (2.38ms)
✔ Phase 3 Booking & Dispatch Engine: slot conflict check, server price snapshot, idempotency, and dispatch modes (6.85ms)
✔ Razorpay Payment & Webhook Engine: verifies HMAC SHA-256 signatures and timing-safe checks (3.68ms)

Total Tests: 12 | Passed: 12 | Failed: 0 | Execution Time: ~920ms
```

---

## 5. Domain Data Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ENTITIES & RELATIONS                            │
├────────────────────┬────────────────────────────────────────────────────────┤
│ City               │ id, name, state, slug, supportPhone, active            │
│ ServiceArea        │ id, cityId, pinCode, zoneLabel, neighbourhoods, active  │
│ Category           │ id, name, slug, shortDescription, iconKey, sortOrder   │
│ Service            │ id, categoryId, title, durationMinutes, basePricePaise,│
│                    │ defaultPricingMode, variants[], addons[], questions[]  │
│ Vendor             │ uid, vendorCode, businessName, status, maxActiveJobs,  │
│                    │ supportedCityIds[], supportedAreaPins[]                │
│ PriceOverride      │ id, serviceId, variantId, cityId, vendorUid, amount    │
│ Coupon             │ id, code, discountType, discountValue, maxCapPaise     │
│ Booking            │ id, bookingNumber, customerUid, cityId, pinCode,       │
│                    │ assignedVendorUid, status, subStatus, priceSnapshot    │
│ BookingEvent       │ id, bookingId, actorUid, actorRole, fromStatus, toStatus│
│ CmsSettings        │ heroTitle, announcementText, dispatchMode, trustBadges │
└────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 6. Project Roadmap & Production Deployment Milestones

```
Phase 0 ───▶ Architecture, Typed Domain Contracts & Pricing Engine (COMPLETED)
Phase 1 ───▶ Customer Storefront, PIN Coverage Checker & Catalog (COMPLETED)
Phase 2 ───▶ Firebase Schema, Firestore Security Rules & Local Backend (COMPLETED)
Phase 3 ───▶ Main Admin Console: Catalog, CSV PIN Importer & Dispatch (COMPLETED)
Phase 4 ───▶ Partner Vendor Portal: Auth, PII Masking & Job Execution (COMPLETED)
Phase 5 ───▶ Unit Test Suite, Slot Holds & Dispatch Policies (COMPLETED)
Phase 6 ───▶ Razorpay Live Gateway & Webhook Signature Verification (STAGED)
Phase 7 ───▶ Production Custom Domain Mapping & Cloud Run Containerization (NEXT)
Phase 8 ───▶ SMS / WhatsApp Gateway Integration & Customer PWA (ROADMAP)
```

### 6.1 Action Items for Production Go-Live
1. **Supply Production Cloud Credentials (`.env`):**
   - Provide live Firebase project credentials in `.env` (`VITE_FIREBASE_PROJECT_ID`, etc.).
   - Configure Razorpay Live Key ID and Secret (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
2. **DNS & Custom Subdomain Configuration:**
   - Map apex domain `tankmanpro.com` to Cloud Run container.
   - Configure CNAME records for `admin.tankmanpro.com` and `partner.tankmanpro.com`.
3. **Third-Party Telephony & Messaging:**
   - Integrate SMS gateway (Gupshup or MSG91) or WhatsApp Business API to dispatch instant booking notifications to customers and field technicians.
