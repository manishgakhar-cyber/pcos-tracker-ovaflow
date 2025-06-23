
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.137002353afc49bbb16c8d28219d2e37',
  appName: 'peri-bloom-wellbeing',
  webDir: 'dist',
  server: {
    url: "https://13700235-3afc-49bb-b16c-8d28219d2e37.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ec4899",
      showSpinner: false
    }
  }
};

export default config;
