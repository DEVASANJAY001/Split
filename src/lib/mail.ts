import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { ref, set } from "firebase/database";
import { rtdb } from "./firebase";

const getApiUrl = (path: string) => {
  // On native platforms, absolute URLs to the production backend are required
  const baseUrl = Capacitor.isNativePlatform()
    ? 'https://splitbeta.vercel.app'
    : '';
  return `${baseUrl}${path}`;
};

/** Generate a 6-digit OTP, store it in Firebase RTDB, and send via email */
export const sendOTPEmail = async (email: string, name: string, type: 'signup' | 'reset' = 'signup') => {
  // 1. Generate OTP client-side
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Store OTP in Firebase RTDB (client-side, no backend needed)
  const emailKey = email.replace(/\./g, '_');
  await set(ref(rtdb, `otp_codes/${emailKey}`), {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // 3. Call backend ONLY to send the email (pass otp in body)
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/send-otp'),
        headers: { 'Content-Type': 'application/json' },
        data: { email, name, otp, type },
      });

      if (response.status < 200 || response.status >= 300) {
        const serverError = typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : String(response.data);
        throw new Error(`[HTTP ${response.status}] ${serverError}`);
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
    console.error("Failed to send email:", error);
    throw error;
  }
};

/** Reset password by calling backend (only needs email + newPassword) */
export const resetPassword = async (email: string, newPassword: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/reset-password'),
        headers: { 'Content-Type': 'application/json' },
        data: { email, newPassword },
      });

      if (response.status < 200 || response.status >= 300) {
        const serverError = typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : String(response.data);
        throw new Error(`[HTTP ${response.status}] ${serverError}`);
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
    console.error("Failed to reset password:", error);
    throw error;
  }
};
