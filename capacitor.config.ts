import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.addistransit.app',
  appName: 'AddisTransit',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: false
  }
};

export default config;


