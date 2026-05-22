import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use the default firebaseapp.com domain for auth to ensure APK/WebView compatibility
  authDomain: import.meta.env.VITE_FIREBASE_PROJECT_ID 
    ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` 
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use IndexedDB persistence for Capacitor/native WebView compatibility;
// fall back to localStorage then in-memory for environments that block IDB.
setPersistence(auth, indexedDBLocalPersistence)
  .catch(() => setPersistence(auth, browserLocalPersistence))
  .catch(() => setPersistence(auth, inMemoryPersistence))
  .catch((err) => console.error("Auth persistence error:", err));
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
