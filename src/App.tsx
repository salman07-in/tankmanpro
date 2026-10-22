/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { resolvePortalFromLocation } from './lib/portalRouting.ts';
import { CustomerShell } from './shells/CustomerShell.tsx';
import { AdminShell } from './shells/AdminShell.tsx';
import { VendorShell } from './shells/VendorShell.tsx';

export default function App() {
  const [locationState, setLocationState] = useState(() => ({
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (href: string) => {
    window.history.pushState({}, '', href);
    setLocationState({
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchParams = new URLSearchParams(locationState.search);
  const resolution = resolvePortalFromLocation(
    locationState.hostname,
    locationState.pathname,
    searchParams
  );

  if (resolution.portal === 'admin') {
    return (
      <AdminShell
        internalPath={resolution.internalPath}
        isCustomDomainHost={resolution.isCustomDomainHost}
        onNavigate={navigate}
      />
    );
  }

  if (resolution.portal === 'vendor') {
    return (
      <VendorShell
        internalPath={resolution.internalPath}
        isCustomDomainHost={resolution.isCustomDomainHost}
        onNavigate={navigate}
      />
    );
  }

  return (
    <CustomerShell
      internalPath={resolution.internalPath}
      redirectUrl={resolution.redirectUrl}
      onNavigate={navigate}
    />
  );
}
