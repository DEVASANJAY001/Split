import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Register our custom in-app Credential Manager plugin.
// This matches the @CapacitorPlugin(name = "GoogleSignIn") in GoogleSignInPlugin.java.
const GoogleSignIn = registerPlugin<{ signIn(): Promise<{ idToken: string }> }>('GoogleSignIn');

export async function loginWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    // Web: use Firebase's popup flow (unchanged)
    return signInWithPopup(auth, googleProvider);
  }

  // Native Android: use our custom Credential Manager plugin.
  // Flow: Credential Manager bottom-sheet → user picks Google account
  //     → Google returns idToken → Firebase signInWithCredential
  const { idToken } = await GoogleSignIn.signIn();

  if (!idToken) {
    throw new Error('Google Sign-In failed: no ID token returned from Credential Manager.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}
