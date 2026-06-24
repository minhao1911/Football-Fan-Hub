import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fanzone.app",
  appName: "FanZone",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: ["*.clerk.com", "*.clerk.accounts.dev"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: false,
      backgroundColor: "#030712",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#16a34a",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#111827",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: "FanZoneApp/1.0 Android",
    loggingBehavior: "production",
    useLegacyBridge: false,
  },
  ios: {
    contentInset: "automatic",
    appendUserAgent: "FanZoneApp/1.0 iOS",
    backgroundColor: "#030712",
    preferredContentMode: "mobile",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
