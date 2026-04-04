import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finanzapro.app",
  appName: "FinanzaPro",
  webDir: "dist",
  plugins: {
    GoogleAuth: {
      scopes: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/drive.appdata",
      ],
      serverClientId:
        "394833255589-7lr5og0ksr7p5fob7a2ad56dn10iks90.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 600,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSplashResourceName: "splash",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#3b82f6",
      sound: "beep.wav",
    },
  },
};

export default config;
