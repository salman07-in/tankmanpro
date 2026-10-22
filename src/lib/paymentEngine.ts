/**
 * TankmanPro — Authoritative Razorpay Payment & Webhook Verification Engine
 * All amounts are strictly processed in integer paise (INR: 100 paise = ₹1).
 */

import crypto from 'node:crypto';

export interface RazorpayOrderRequest {
  bookingId: string;
  bookingCode?: string;
  amountPaise: number;
  currency?: 'INR';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceTitle?: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: 'INR';
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpaySignatureVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}

export interface RazorpayWebhookVerificationInput {
  rawBody: string | Buffer;
  signature: string;
  webhookSecret: string;
}

/**
 * Computes standard Razorpay HMAC SHA-256 signature for client payment verification.
 * Spec: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
export function computeRazorpaySignature(
  orderId: string,
  paymentId: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Validates Razorpay client checkout signature with timing-safe comparison.
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: RazorpaySignatureVerificationInput): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  try {
    const expectedSignature = computeRazorpaySignature(orderId, paymentId, secret);
    if (expectedSignature.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Validates incoming Razorpay Webhook signature against raw request body using HMAC SHA-256.
 * Header: X-Razorpay-Signature
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecret,
}: RazorpayWebhookVerificationInput): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }
  try {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (expected.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Generates an isolated deterministic test/mock order for development environments
 * when live credentials are not yet injected.
 */
export function generateSimulatedRazorpayOrder(
  input: RazorpayOrderRequest
): RazorpayOrderResponse {
  const simulatedId = `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: simulatedId,
    entity: 'order',
    amount: Math.round(input.amountPaise),
    amount_paid: 0,
    amount_due: Math.round(input.amountPaise),
    currency: 'INR',
    receipt: (input.bookingCode || input.bookingId || 'rcpt_preview').slice(0, 40),
    status: 'created',
    attempts: 0,
    notes: {
      bookingId: input.bookingId,
      customerPhone: input.customerPhone || '',
      serviceTitle: input.serviceTitle || 'TankmanPro Home Service',
      environment: 'development_simulation',
    },
    created_at: Math.floor(Date.now() / 1000),
  };
}
