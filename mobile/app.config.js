/**
 * Expo dynamic config.
 *
 * This project keeps Android native files checked in, so Android release values are sourced from
 * `android/`. Native Expo fields are only emitted for EAS/prebuild flows that actually consume
 * them. Runtime/web `extra` stays available for Metro and Constants.expoConfig.
 */
const INCLUDE_NATIVE_EXPO_CONFIG =
  process.env.EAS_BUILD === "true" || process.env.RAQAT_INCLUDE_NATIVE_EXPO_CONFIG === "1";

const BASE_EXTRA = {
  imamAiApiBase: "https://api.rahatomir.com",
  raqatApiBase: "https://api.rahatomir.com",
  raqatDonationUrl: "https://t.me/my_islamic_ai_bot",
  raqatSupportAccount: "",
  googleWebClientId: "",
  googleIosClientId: "",
  googleAndroidClientId: "",
  eas: {
    projectId: "94f161ec-5ac3-4bbb-8d6a-7694ecdb20ef",
  },
  halalDamuUrl: "https://halaldamu.kz/",
  raqatWebUrl: "https://rahatomir.com",
  raqatAiKbOnly: true,
};

const NATIVE_EXPO_CONFIG = {
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#2a5d67",
  },
  assetBundlePatterns: ["**/*"],
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Location is used for Qibla direction and accurate prayer times.",
        locationWhenInUsePermission: "Location is used for Qibla direction and accurate prayer times.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Суреттер өнім жапсырмасын халал тексеру үшін қажет.",
        cameraPermission: "Қолжазба немесе құрам суретін халал тексеру үшін камера қажет.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Штрихкод пен жапсырма суретін халал тексеру үшін камера қажет.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          usesCleartextTraffic: false,
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
    "expo-asset",
    "expo-background-fetch",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#c5a059",
        sounds: [
          "./assets/sounds/prayer_azan_user_01.mp3",
          "./assets/sounds/prayer_azan_user_02.mp3",
          "./assets/sounds/prayer_azan_user_03.mp3",
          "./assets/sounds/prayer_azan_user_04.mp3",
          "./assets/sounds/prayer_azan_user_05.mp3",
        ],
        mode: "production",
      },
    ],
    "expo-web-browser",
    "expo-apple-authentication",
  ],
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: "kz.raqat.app",
    infoPlist: {
      CFBundleSpokenName: "Rahat Omir",
      LSApplicationQueriesSchemes: ["shortcuts"],
      NSAppTransportSecurity: {
        NSExceptionDomains: {
          "5.75.162.140": { NSExceptionAllowsInsecureHTTPLoads: true },
          "api.rahatomir.com": { NSIncludesSubdomains: true },
          "rahatomir.com": { NSIncludesSubdomains: true },
          "192.168.0.148": { NSExceptionAllowsInsecureHTTPLoads: true },
          "10.191.110.203": { NSExceptionAllowsInsecureHTTPLoads: true },
          "192.168.1.100": { NSExceptionAllowsInsecureHTTPLoads: true },
          "10.0.2.2": { NSExceptionAllowsInsecureHTTPLoads: true },
          localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
          "127.0.0.1": { NSExceptionAllowsInsecureHTTPLoads: true },
        },
      },
      NSLocationWhenInUseUsageDescription: "Your location is used for Qibla and prayer times.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "Your location is used for Qibla and prayer times.",
      NSPhotoLibraryUsageDescription: "Photos are used to analyze product labels for halal checking.",
      NSCameraUsageDescription:
        "Камера құбыла бағыты (алдыңғы көрініс), штрихкод және халал тексеру үшін қолданылады.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    softwareKeyboardLayoutMode: "resize",
    versionCode: 9,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#00000000",
    },
    package: "kz.raqat.app",
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "POST_NOTIFICATIONS",
      "SCHEDULE_EXACT_ALARM",
      "USE_FULL_SCREEN_INTENT",
      "RECEIVE_BOOT_COMPLETED",
      "WAKE_LOCK",
    ],
  },
  scheme: "imamai",
};

function trimBase(s) {
  if (!s || typeof s !== "string") return "";
  return s.trim().replace(/\/+$/, "");
}

function isLocalhostUrl(s) {
  const t = (s || "").toLowerCase();
  return t.includes("127.0.0.1") || t.includes("localhost");
}

module.exports = ({ config }) => {
  const expo = {
    ...config,
    name: "RAHAT OMIR",
    slug: "raqat-mobile",
    version: "1.0.9",
    owner: "raqat-omir",
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      ...(config?.extra || {}),
      ...BASE_EXTRA,
    },
  };

  if (INCLUDE_NATIVE_EXPO_CONFIG) {
    Object.assign(expo, NATIVE_EXPO_CONFIG);
  }

  const extra = { ...(expo.extra || {}) };

  const apiEnv = trimBase(
    process.env.EXPO_PUBLIC_IMAM_AI_API_BASE || process.env.EXPO_PUBLIC_RAQAT_API_BASE || ""
  );
  const donationEnv = (process.env.EXPO_PUBLIC_RAQAT_DONATION_URL || "").trim();

  if (apiEnv) {
    extra.imamAiApiBase = apiEnv;
    /** Мұра: оқылған дерек кодта енді imam-бірінші, бірақ ескі ключті де толтырамыз. */
    extra.raqatApiBase = apiEnv;
  } else {
    /** Локальды рақым: екі жолдан біріне localhost болғанда екіншісін тазалаңыз */
    const imRaw = trimBase(String(extra.imamAiApiBase ?? ""));
    const rqRaw = trimBase(String(extra.raqatApiBase ?? ""));
    if (isLocalhostUrl(imRaw)) delete extra.imamAiApiBase;
    if (isLocalhostUrl(rqRaw)) delete extra.raqatApiBase;
  }

  /** AI/контент: клиент бандлына құпия енгізілмейді — JWT (кіру) арқылы. */
  delete extra.raqatAiSecret;
  delete extra.raqatContentSecret;
  if (donationEnv) extra.raqatDonationUrl = donationEnv;

  const halalDamuEnv = (process.env.EXPO_PUBLIC_HALAL_DAMU_URL || "").trim();
  if (halalDamuEnv) {
    extra.halalDamuUrl = halalDamuEnv;
  }

  const raqatWebEnv = (process.env.EXPO_PUBLIC_RAQAT_WEB_URL || "").trim();
  if (raqatWebEnv) {
    extra.raqatWebUrl = raqatWebEnv.replace(/\/+$/, "");
  }

  expo.extra = extra;
  return { expo };
};
