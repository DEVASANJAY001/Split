import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.davnsindusrties.split',
  appName: 'Split',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      // skipNativeAuth: false means the plugin uses Firebase native SDK.
      // We still call signInWithCredential on the JS side to sync WebView state.
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
