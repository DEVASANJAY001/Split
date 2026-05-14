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
      if (error.code !== "auth/popup-blocked-by-user") {
        return await signInWithRedirect(auth, googleProvider);
      }
      throw error;
    }
  }
}
