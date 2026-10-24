/**
 * TankmanPro — Initial Operational Seed Records
 *
 * Clean operational state with no test bookings, so manual bookings can be tested cleanly.
 */

import type {
  Booking,
  BookingEvent,
  CmsSettings,
  PortalNotification,
  Vendor,
} from '../types/domain.ts';
import {
  DEMO_VENDORS,
} from './demoCatalog.ts';

export const SEEDED_VENDORS: Vendor[] = DEMO_VENDORS.map((v, idx) => ({
  ...v,
  vendorCode: `TMP-VND-${1001 + idx}`,
  isAvailable: true,
  activeAssignedJobs: 0,
  commissionPercent: 18,
  password: 'TankmanPartner@2026',
  kycNotes: 'Verified Aadhaar, PAN, Police Clearance & Mechanised Tool Kit Inspection.',
  createdAtIso: '2026-09-15T09:00:00.000Z',
  updatedAtIso: '2026-10-19T14:30:00.000Z',
}));

export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_BOOKING_EVENTS: BookingEvent[] = [];
export const INITIAL_NOTIFICATIONS: PortalNotification[] = [];

const todayStr = new Date().toISOString().slice(0, 10);

export const INITIAL_CMS_SETTINGS: CmsSettings = {
  id: 'global',
  heroTitle: 'Home services at your doorstep',
  heroSubtitle:
    'Mechanised 6-stage water tank cleaning, intense bathroom & kitchen hygiene, foam-jet AC servicing, and clinical skin care by verified professionals.',
  announcementText:
    'Live in Kanpur (208001, 208002), Shahjahanpur (242001) & New Delhi (110001) · Use code CLEAN10 for 10% off!',
  supportPhone: '+91 96481 75639',
  supportEmail: 'support@tankmanpro.com',
  whatsappNumber: '+91 96481 75639',
  instagramUrl: 'https://www.instagram.com/tankmanpro.in/',
  dispatchMode: 'manual',
  trustBadges: [
    '6-Stage UV & High-Pressure Jet Protocol',
    'Background-Verified & Trained Crew',
    '100% Transparent Paise-Exact Tariff Card',
  ],
  faqs: [
    {
      question: 'How does TankmanPro verify serviceability for my location?',
      answer:
        'Enter your 6-digit Indian PIN code on the homepage. We verify active technician coverage and show exact city-resolved rates before you book.',
    },
    {
      question: 'What is included in the 6-Stage Mechanised Water Tank Cleaning?',
      answer:
        'Dewatering, sludge vacuum extraction, high-pressure rotary jet washing of walls/ceiling, anti-bacterial spray, UV radiator treatment, and inlet/float valve check.',
    },
    {
      question: 'Can I reschedule or cancel my booking?',
      answer:
        'Yes, bookings can be rescheduled or cancelled free of charge before technician dispatch.',
    },
  ],
  updatedAtIso: `${todayStr}T04:00:00.000Z`,
};
