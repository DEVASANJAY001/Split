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
    // Web Google Sign In Fallback (uses popup to support local/arbitrary dev domains out of the box)
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Fallback failed:", error);
      throw error;
    }
  }
}
