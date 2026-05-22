import { Capacitor, CapacitorHttp } from "@capacitor/core";

const getApiUrl = (path: string) => {
  const baseUrl = Capacitor.isNativePlatform()
    ? 'https://splitbeta.vercel.app'
    : '';
  return `${baseUrl}${path}`;
};

const OTP_SESSION_KEY = (email: string) =>
  `split_otp_${email.toLowerCase().replace(/\./g, '_')}`;

/**
 * Generate a 6-digit OTP, store it in sessionStorage, and send it via email.
 * Uses sessionStorage so it works for unauthenticated users (no Firebase RTDB rules issue).
 */
export const sendOTPEmail = async (
  email: string,
  name: string,
  type: 'signup' | 'reset' = 'signup'
) => {
  // 1. Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Persist OTP + expiry in sessionStorage (survives page re-renders, cleared on tab close)
  sessionStorage.setItem(
    OTP_SESSION_KEY(email),
    JSON.stringify({ code: otp, expiresAt: Date.now() + 10 * 60 * 1000 })
  );

  // 3. Ask the backend ONLY to send the email (no Firebase Admin needed server-side)
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/send-otp'),
        headers: { 'Content-Type': 'application/json' },
        data: { email, name, otp, type },
      });
      if (response.status < 200 || response.status >= 300) {
        const err = typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : String(response.data);
        throw new Error(`[HTTP ${response.status}] ${err}`);
      }
      return response.data;
    } else {
      const response = await fetch(getApiUrl('/api/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, otp, type }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let msg = raw;
        try { msg = JSON.parse(raw)?.error || raw; } catch {}
        throw new Error(`[HTTP ${response.status}] ${msg}`);
      }
      return await response.json();
    }
  } catch (error: any) {
    // If email sending fails, clean up sessionStorage so user can retry
    sessionStorage.removeItem(OTP_SESSION_KEY(email));
    throw error;
  }
};

/**
 * Verify an OTP entered by the user against what was stored in sessionStorage.
 * Returns true on success; throws a descriptive Error on failure.
 */
export const verifyOTP = (email: string, otp: string): boolean => {
  const raw = sessionStorage.getItem(OTP_SESSION_KEY(email));
  if (!raw) throw new Error('Verification code not found. Please resend.');

  const data: { code: string; expiresAt: number } = JSON.parse(raw);
  if (Date.now() > data.expiresAt) {
    sessionStorage.removeItem(OTP_SESSION_KEY(email));
    throw new Error('OTP has expired. Please resend.');
  }
  if (data.code !== otp) throw new Error('OTP is wrong');

  // Clear after successful verification
  sessionStorage.removeItem(OTP_SESSION_KEY(email));
  return true;
};

/**
 * Reset a user's password via the Vercel backend (uses Firebase Admin on server).
 */
export const resetPassword = async (email: string, newPassword: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/reset-password'),
        headers: { 'Content-Type': 'application/json' },
        data: { email, newPassword },
      });
      if (response.status < 200 || response.status >= 300) {
        const err = typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : String(response.data);
        throw new Error(`[HTTP ${response.status}] ${err}`);
      }
      return response.data;
    } else {
      const response = await fetch(getApiUrl('/api/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      if (!response.ok) {
        const raw = await response.text();
        let msg = raw;
        try { msg = JSON.parse(raw)?.error || raw; } catch {}
        throw new Error(`[HTTP ${response.status}] ${msg}`);
      }
      return await response.json();
    }
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    throw error;
  }
};
