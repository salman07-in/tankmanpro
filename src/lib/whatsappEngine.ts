/**
 * TankmanPro — WhatsApp 1-Click Direct Dispatch & Formatting Engine
 *
 * Generates direct wa.me links with pre-filled, professional Hinglish & English templates.
 * Zero-cost, zero-API dependency, works instantly on mobile and web WhatsApp.
 */

import type { Booking, Vendor } from '../types/domain.ts';
import { formatPaiseToInr } from './pricingEngine.ts';

/**
 * Sanitizes an Indian phone number into a clean international format for wa.me URL
 * Examples:
 *   "9794200100" -> "919794200100"
 *   "+91 97942 00100" -> "919794200100"
 *   "09794200100" -> "919794200100"
 */
export function cleanIndianPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Generates a direct WhatsApp click-to-chat URL
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanIndianPhone(phone);
  const encoded = encodeURIComponent(text);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encoded}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Resolves the portal tracking URL for inclusion in WhatsApp messages
 */
function resolveTrackingUrl(bookingCode: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://tankmanpro.com');
  return `${base}/track?bookingCode=${encodeURIComponent(bookingCode)}`;
}

/**
 * Resolves partner portal URL for vendor messages
 */
function resolveVendorPortalUrl(origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://tankmanpro.com');
  return `${base}/vendor`;
}

// ============================================================================
// 1. CUSTOMER NOTIFICATION TEMPLATES (PROFESSIONAL ENGLISH)
// ============================================================================

/**
 * Template: Booking Confirmed (Send to Customer)
 */
export function buildCustomerBookingConfirmedWhatsApp(
  booking: Booking,
  origin?: string
): string {
  const trackingUrl = resolveTrackingUrl(booking.bookingCode || booking.bookingNumber, origin);
  const totalAmount = formatPaiseToInr(booking.quoteSnapshot?.finalTotalPaise || 0);
  const payMode =
    booking.paymentStatus === 'paid'
      ? 'Paid Online (Verified via Razorpay ✅)'
      : 'Pay After Service (Cash / UPI on Site)';

  return `💧 *TANKMANPRO — BOOKING CONFIRMATION* 💧

Dear *${booking.customerName}*,

Thank you for choosing TankmanPro. Your appointment for mechanized hygiene service has been confirmed.

📋 *Booking ID:* ${booking.bookingNumber}
🛠 *Service Package:* ${booking.serviceTitle} (${booking.variantName})
📅 *Scheduled Date:* ${booking.preferredDate}
⏰ *Time Slot:* ${booking.preferredSlot}
📍 *Service Address:* ${booking.addressLine}, ${booking.cityName} (${booking.pinCode})
💰 *Total Amount:* ${totalAmount}
💳 *Payment Mode:* ${payMode}

${booking.assignedVendorName ? `👨‍🔧 *Assigned Partner:* ${booking.assignedVendorName}\n` : ''}📲 *Track Live Status & Service Details:*
${trackingUrl}

Our verified crew will arrive equipped with commercial mechanized cleaning machinery and eco-safe sanitization kits.

For any assistance or rescheduling requests, please reach our helpline: +91 97942 00100
Warm regards,
*Team TankmanPro* 🛡`;
}

/**
 * Template: Technician Assigned (Send to Customer)
 */
export function buildCustomerTechnicianAssignedWhatsApp(
  booking: Booking,
  vendor: { displayName: string; phone: string; vendorCode?: string },
  origin?: string
): string {
  const trackingUrl = resolveTrackingUrl(booking.bookingCode || booking.bookingNumber, origin);

  return `👨‍🔧 *TANKMANPRO — TECHNICIAN ASSIGNED* 👨‍🔧

Dear *${booking.customerName}*,

A verified specialist crew has been assigned to your booking *#${booking.bookingNumber}*:

👤 *Lead Technician:* ${vendor.displayName} ${vendor.vendorCode ? `(${vendor.vendorCode})` : ''}
📞 *Direct Contact:* ${vendor.phone}
🛠 *Service Package:* ${booking.serviceTitle}
📅 *Scheduled Date:* ${booking.preferredDate} (${booking.preferredSlot})
📍 *Location:* ${booking.addressLine}, ${booking.cityName}

Our crew will reach your premises with high-pressure cleaning machinery and safety gear.
📲 *Live Tracker:* ${trackingUrl}

Helpline: +91 97942 00100
*TankmanPro Operations* 🛡`;
}

/**
 * Template: Job Completed & 7-Day Guarantee (Send to Customer)
 */
export function buildCustomerJobCompletedWhatsApp(
  booking: Booking,
  origin?: string
): string {
  const trackingUrl = resolveTrackingUrl(booking.bookingCode || booking.bookingNumber, origin);

  return `✅ *TANKMANPRO — SERVICE COMPLETED* ✅

Dear *${booking.customerName}*,

Your *${booking.serviceTitle}* service has been successfully completed!

📋 *Booking ID:* ${booking.bookingNumber}
🛡 *Quality Warranty:* 7-Day TankmanPro Service Guarantee Active
🧾 *Digital Invoice & Record:* ${trackingUrl}

Your feedback helps us maintain our quality standards. Please take a moment to rate our service on the link above.

Thank you for choosing TankmanPro — India's Mechanized Hygiene Specialists. 💧`;
}

// ============================================================================
// 2. VENDOR / TECHNICIAN DISPATCH TEMPLATES
// ============================================================================

/**
 * Template: New Job Dispatch Alert (Send from Admin to Vendor)
 */
export function buildVendorDispatchWhatsApp(
  booking: Booking,
  vendor: { displayName: string; vendorCode?: string },
  origin?: string
): string {
  const portalUrl = resolveVendorPortalUrl(origin);
  const totalAmount = formatPaiseToInr(booking.quoteSnapshot?.finalTotalPaise || 0);

  return `🚨 *TANKMANPRO PARTNER — NEW JOB DISPATCH* 🚨

Namaste *${vendor.displayName}* ${vendor.vendorCode ? `(${vendor.vendorCode})` : ''},
Aapke Partner account par naya job assign kiya gaya hai:

📋 *Booking Number:* ${booking.bookingNumber}
🛠 *Service:* ${booking.serviceTitle} (${booking.variantName})
📍 *Area PIN:* PIN ${booking.pinCode} · ${booking.cityName}
📅 *Date & Slot:* ${booking.preferredDate} (${booking.preferredSlot})
👤 *Customer:* ${booking.customerName} (${booking.customerPhone})
🏠 *Address:* ${booking.addressLine}
💰 *Order Value:* ${totalAmount} (${booking.paymentStatus === 'paid' ? 'PREPAID' : 'COLLECT COD'})

Kripya Partner Portal me login karke booking turant ACCEPT karein:
${portalUrl}

Operations Desk: +91 97942 00100`;
}

/**
 * Template: Technician En-Route Alert (Send from Vendor to Customer)
 */
export function buildVendorToCustomerEnRouteWhatsApp(
  booking: Booking,
  vendor: { displayName: string; phone: string }
): string {
  return `🚗 *TANKMANPRO — TECHNICIAN EN ROUTE* 🚗

Dear *${booking.customerName}*,

This is *${vendor.displayName}*, your lead technician from TankmanPro. I am currently en route to your service location for booking *#${booking.bookingNumber}*.

🛠 *Service Package:* ${booking.serviceTitle}
⏰ *Scheduled Slot:* ${booking.preferredSlot}
📞 *Direct Mobile:* ${vendor.phone}

Please ensure water and standard power point access are available at the site. See you shortly!

Best regards,
*TankmanPro Field Operations*`;
}

/**
 * Template: Technician Arrived at Customer Location
 */
export function buildVendorToCustomerArrivedWhatsApp(
  booking: Booking,
  vendor: { displayName: string; phone: string }
): string {
  return `📍 *TANKMANPRO — TECHNICIAN ARRIVED* 📍

Dear *${booking.customerName}*,

I have arrived at your service location (*${vendor.displayName}* · ${vendor.phone}) for booking *#${booking.bookingNumber}*.

Kindly open the door or contact me directly so we can begin the mechanized setup.

Thank you!`;
}
