const version = "1.0.1";
const buildNumber = "7";

export default {
  expo: {
    name: "Episync",
    slug: "episync",
    version: version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "episync",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.episync.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      buildNumber: buildNumber
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.episync.app",
      versionCode: parseInt(buildNumber)
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-image-picker",
      "expo-web-browser"
    ],
    extra: {
      eas: {
        projectId: "7d7d0dce-0db9-4c04-9cb5-a014c33c3923"
      }
    }
  }
}; 