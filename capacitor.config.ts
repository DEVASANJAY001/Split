import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.davnsindusrties.split',
  appName: 'Split',
  webDir: 'dist',
  // No plugin-specific config needed — Google Sign-In is now handled
  // by our custom GoogleSignInPlugin.java using Android Credential Manager.
};

export default config;
