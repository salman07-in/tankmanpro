/**
 * TankmanPro — Route-Based & Optional Hostname Portal Resolution + PIN Validation
 *
 * Default Single-App Route Structure (No custom domains required):
 * - Customer Website:  /
 * - Service Listings:  /services (and /services/:slug)
 * - Booking Flow:      /booking (and /checkout alias)
 * - Admin Login Page:  /admin/login (isolated from public navigation)
 * - Vendor Login Page: /vendor/login (isolated from public navigation)
 *
 * Optional Custom Domain Support (only active if custom hostnames are explicitly provided):
 * - If custom hostnames are configured later, supports hostname-based separation.
 */

import type { City, PinLookupResult, PortalKind, ServiceArea } from '../types/domain.ts';

export interface PortalHostConfig {
  customerHostnames?: string[];
  adminHostnames?: string[];
  vendorHostnames?: string[];
}

export interface PortalResolution {
  portal: PortalKind;
  isCustomDomainHost: boolean;
  /**
   * Portal-internal route path (e.g., '/', '/services', '/booking', '/login').
   */
  internalPath: string;
  /**
   * Optional redirect target if custom domain separation is configured and a user
   * visits /admin/* or /vendor/* on the customer production domain.
   */
  redirectUrl?: string;
}

/**
 * Resolves which isolated app shell (`customer`, `admin`, or `vendor`) should render
 * based on pathname (and optional custom domain configuration when provided).
 */
export function resolvePortalFromLocation(
  hostname: string,
  pathname: string,
  searchParams?: URLSearchParams,
  hostConfig?: PortalHostConfig
): PortalResolution {
  const cleanHost = (hostname || '').trim().toLowerCase();
  const cleanPath = pathname && pathname.startsWith('/') ? pathname : `/${pathname || ''}`;

  const adminHosts = new Set(
    (hostConfig?.adminHostnames || []).map((h) => h.trim().toLowerCase()).filter(Boolean)
  );
  const vendorHosts = new Set(
    (hostConfig?.vendorHostnames || []).map((h) => h.trim().toLowerCase()).filter(Boolean)
  );
  const customerHosts = new Set(
    (hostConfig?.customerHostnames || []).map((h) => h.trim().toLowerCase()).filter(Boolean)
  );

  const hostOverride = searchParams?.get('portal_host')?.trim().toLowerCase();
  const effectiveHost =
    !customerHosts.has(cleanHost) &&
    !adminHosts.has(cleanHost) &&
    !vendorHosts.has(cleanHost) &&
    hostOverride
      ? hostOverride
      : cleanHost;

  // 1. Optional Dedicated Admin Subdomain (only when configured)
  if (adminHosts.size > 0 && adminHosts.has(effectiveHost)) {
    const internalPath = cleanPath.startsWith('/admin/')
      ? cleanPath.slice('/admin'.length)
      : cleanPath === '/admin' || cleanPath === '/'
        ? '/login'
        : cleanPath;
    return {
      portal: 'admin',
      isCustomDomainHost: true,
      internalPath,
    };
  }

  // 2. Optional Dedicated Vendor Subdomain (only when configured)
  if (vendorHosts.size > 0 && vendorHosts.has(effectiveHost)) {
    const internalPath = cleanPath.startsWith('/vendor/')
      ? cleanPath.slice('/vendor'.length)
      : cleanPath === '/vendor' || cleanPath === '/'
        ? '/login'
        : cleanPath;
    return {
      portal: 'vendor',
      isCustomDomainHost: true,
      internalPath,
    };
  }

  // 3. Optional Dedicated Customer Domain (only when configured)
  if (customerHosts.size > 0 && customerHosts.has(effectiveHost)) {
    if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
      const targetSubpath =
        cleanPath === '/admin' ? '/login' : cleanPath.slice('/admin'.length) || '/login';
      const primaryAdminHost = Array.from(adminHosts)[0];
      return {
        portal: 'customer',
        isCustomDomainHost: true,
        internalPath: '/404',
        redirectUrl: primaryAdminHost ? `https://${primaryAdminHost}${targetSubpath}` : undefined,
      };
    }
    if (cleanPath === '/vendor' || cleanPath.startsWith('/vendor/')) {
      const targetSubpath =
        cleanPath === '/vendor' ? '/login' : cleanPath.slice('/vendor'.length) || '/login';
      const primaryVendorHost = Array.from(vendorHosts)[0];
      return {
        portal: 'customer',
        isCustomDomainHost: true,
        internalPath: '/404',
        redirectUrl: primaryVendorHost ? `https://${primaryVendorHost}${targetSubpath}` : undefined,
      };
    }

    return {
      portal: 'customer',
      isCustomDomainHost: true,
      internalPath: cleanPath,
    };
  }

  // 4. Default Single-App Route-Based Mode (/, /services, /booking, /admin/login, /vendor/login)
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    const internalPath =
      cleanPath === '/admin' ? '/login' : cleanPath.slice('/admin'.length) || '/login';
    return {
      portal: 'admin',
      isCustomDomainHost: false,
      internalPath,
    };
  }

  if (cleanPath === '/vendor' || cleanPath.startsWith('/vendor/')) {
    const internalPath =
      cleanPath === '/vendor' ? '/login' : cleanPath.slice('/vendor'.length) || '/login';
    return {
      portal: 'vendor',
      isCustomDomainHost: false,
      internalPath,
    };
  }

  return {
    portal: 'customer',
    isCustomDomainHost: false,
    internalPath: cleanPath,
  };
}

/**
 * Formats an internal portal path into an href that works in single-app route mode
 * (/admin/login, /vendor/login) and optional custom domain mode.
 */
export function buildPortalHref(
  portal: PortalKind,
  internalPath: string,
  isCustomDomainHost: boolean
): string {
  const normalized = internalPath.startsWith('/') ? internalPath : `/${internalPath}`;
  if (portal === 'customer') {
    return normalized;
  }
  if (isCustomDomainHost) {
    return normalized;
  }
  const prefix = portal === 'admin' ? '/admin' : '/vendor';
  return normalized === '/' ? `${prefix}/login` : `${prefix}${normalized}`;
}

/**
 * Validates a 6-digit Indian PIN code (first digit 1-9, followed by 5 digits).
 */
export function isValidIndianPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test((pin || '').trim());
}

/**
 * Resolves a 6-digit PIN code against active ServiceArea and City records.
 * Never infers coverage from unverified text; only active mapped areas return serviceable: true.
 */
export function lookupPinCoverage(
  rawPin: string,
  cities: City[],
  serviceAreas: ServiceArea[]
): PinLookupResult {
  const pinCode = (rawPin || '').trim();

  if (!isValidIndianPin(pinCode)) {
    return {
      validFormat: false,
      serviceable: false,
      pinCode,
      message: 'Please enter a valid 6-digit Indian PIN code (for example, 110001 or 242001).',
    };
  }

  const matchedArea = serviceAreas.find(
    (area) => area.pinCode === pinCode && area.active
  );

  if (!matchedArea) {
    return {
      validFormat: true,
      serviceable: false,
      pinCode,
      message: `PIN ${pinCode} is not covered yet. Join the area waitlist and we will notify you when verified technicians launch in your neighbourhood.`,
    };
  }

  const matchedCity = cities.find(
    (city) => city.id === matchedArea.cityId && city.active
  );

  if (!matchedCity) {
    return {
      validFormat: true,
      serviceable: false,
      pinCode,
      message: `Service operations in PIN ${pinCode} are currently paused by Admin.`,
    };
  }

  return {
    validFormat: true,
    serviceable: true,
    pinCode,
    city: matchedCity,
    serviceArea: matchedArea,
    message: `Available in ${matchedArea.zoneLabel}, ${matchedCity.name} (${pinCode}).`,
  };
}
