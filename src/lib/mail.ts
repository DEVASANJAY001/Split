import { Capacitor, CapacitorHttp } from "@capacitor/core";

const getApiUrl = (path: string) => {
  // On native platforms, absolute URLs to the production backend are required
  const baseUrl = Capacitor.isNativePlatform() 
    ? 'https://splitbeta.vercel.app' 
    : '';
  return `${baseUrl}${path}`;
};

export const sendOTPEmail = async (email: string, name: string, type: 'signup' | 'reset' = 'signup') => {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/send-otp'),
        headers: {
          'Content-Type': 'application/json',
        },
        data: { email, name, type },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.error || 'Failed to send verification email');
      }

      return response.data;
    } else {
      const response = await fetch(getApiUrl('/api/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      return await response.json();
    }
  } catch (error: any) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export const resetPassword = async (email: string, newPassword: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: getApiUrl('/api/reset-password'),
        headers: {
          'Content-Type': 'application/json',
        },
        data: { email, newPassword },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data?.error || 'Failed to reset password');
      }

      return response.data;
    } else {
      const response = await fetch(getApiUrl('/api/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      return await response.json();
    }
  } catch (error: any) {
    console.error("Failed to reset password:", error);
    throw error;
  }
};
