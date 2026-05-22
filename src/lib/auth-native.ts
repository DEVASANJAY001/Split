import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function loginWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    // Web: use popup flow via Firebase JS SDK
    return signInWithPopup(auth, googleProvider);
  }

  try {
    // Native Android: Use the official @capacitor-firebase/authentication plugin.
    // This uses Firebase's own native Google Sign-In SDK, which is the most
    // reliable approach for Play Store builds. skipNativeAuth means we handle
    // Firebase sign-in ourselves via the JS SDK (for WebView state sync).
    const result = await FirebaseAuthentication.signInWithGoogle();

    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In failed: no ID token returned.');
    }

    // Sign in to Firebase JS SDK using the Google credential
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);

  } catch (err: any) {
    const msg = err?.message || err?.error || JSON.stringify(err);
    throw new Error(`Google Sign-In error: ${msg}`);
  }
}
