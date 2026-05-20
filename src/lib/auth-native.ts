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
      return await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Fall back to redirect only if the popup was blocked by the browser
      if (error.code === "auth/popup-blocked-by-user" || error.code === "auth/cancelled-popup-request") {
        return await signInWithRedirect(auth, googleProvider);
      }
      throw error;
    }
  }
}
