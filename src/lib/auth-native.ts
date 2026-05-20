import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup, 
  signInWithRedirect 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function loginWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Native Google Sign In
      const user = await GoogleAuth.signIn();
      if (!user?.authentication?.idToken) {
        throw new Error("Google Sign-In failed: No ID Token returned from native SDK.");
      }
      const credential = GoogleAuthProvider.credential(user.authentication.idToken);
      return await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Native Google Auth error:', error);
      throw error;
    }
  } else {
    // Web Google Sign In (already implemented adaptive strategy)
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth/popup-timeout")), 15000)
      );
      return await Promise.race([
        signInWithPopup(auth, googleProvider),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.warn("Google Sign-In Popup failed or timed out:", error);
      // Fall back to redirect only if the popup was blocked by the browser, cancelled, or timed out
      if (
        error.code === "auth/popup-blocked-by-user" || 
        error.code === "auth/cancelled-popup-request" ||
        error.message === "auth/popup-timeout"
      ) {
        return await signInWithRedirect(auth, googleProvider);
      }
      throw error;
    }
  }
}
