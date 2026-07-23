/**
 * Expo dynamic config.
 *
 * This project keeps Android native files checked in, so Android release values are sourced from
 * `android/`. Native Expo fields are only emitted for EAS/prebuild flows that actually consume
 * them. Runtime/web `extra` stays available for Metro and Constants.expoConfig.
 */
const INCLUDE_NATIVE_EXPO_CONFIG =
  process.env.EAS_BUILD === "true" || process.env.RAQAT_INCLUDE_NATIVE_EXPO_CONFIG === "1";

function isReleaseExpoBuild() {
  return (
    process.env.RAQAT_EXPO_RELEASE_BUILD === "1" ||
    process.env.NODE_ENV === "production" ||
    process.env.EAS_BUILD === "true"
  );
}

/** iOS ATS: LAN / emulator HTTP — тек dev/debug; production HTTPS-only. */
const IOS_DEV_INSECURE_DOMAINS = {
  "10.0.2.2": { NSExceptionAllowsInsecureHTTPLoads: true },
  localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
  "127.0.0.1": { NSExceptionAllowsInsecureHTTPLoads: true },
  "192.168.0.148": { NSExceptionAllowsInsecureHTTPLoads: true },
  "10.191.110.203": { NSExceptionAllowsInsecureHTTPLoads: true },
  "192.168.1.100": { NSExceptionAllowsInsecureHTTPLoads: true },
  "5.75.162.140": { NSExceptionAllowsInsecureHTTPLoads: true },
};

const IOS_PROD_NS_EXCEPTION_DOMAINS = {
  "api.rahatomir.com": { NSIncludesSubdomains: true },
  "rahatomir.com": { NSIncludesSubdomains: true },
  /** Қағба HD HLS (http://m.live.net.sa:1935/…). */
  "live.net.sa": {
    NSIncludesSubdomains: true,
    NSExceptionAllowsInsecureHTTPLoads: true,
  },
};

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
};

const NATIVE_EXPO_CONFIG = {
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  assetBundlePatterns: ["assets/**/*"],
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Құбыла бағыты мен намаз уақытын дәл есептеу үшін орналасу қажет.",
        locationWhenInUsePermission:
          "Құбыла бағыты мен намаз уақытын дәл есептеу үшін орналасу қажет.",
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
    "expo-background-task",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#c5a059",
        // Android release uses android/app generated res/raw via copyPrayerAzanRawResources.
        // Keeping the same MP3 list here duplicates each azan file in the APK.
        mode: "production",
      },
    ],
    "expo-web-browser",
    "expo-secure-store",
    "expo-apple-authentication",
    "@bacons/apple-targets",
    "./plugins/withIosPrayerWidgetBridge",
    // CarPlay scene/entitlements not wired for device IPA yet — re-enable with withIosCarPlay when ready.
  ],
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: "kz.raqat.app",
    appleTeamId: process.env.RAQAT_IOS_APPLE_TEAM_ID || undefined,
    entitlements: {
      "com.apple.security.application-groups": ["group.kz.raqat.app"],
    },
    buildNumber: process.env.RAQAT_IOS_BUILD_NUMBER || "12",
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["raqat", "imamai", "kz.raqat.app"],
        },
      ],
      UIBackgroundModes: ["audio", "fetch", "processing", "remote-notification"],
      NSAppTransportSecurity: {
        NSExceptionDomains: isReleaseExpoBuild()
          ? IOS_PROD_NS_EXCEPTION_DOMAINS
          : { ...IOS_PROD_NS_EXCEPTION_DOMAINS, ...IOS_DEV_INSECURE_DOMAINS },
      },
      NSLocationWhenInUseUsageDescription:
        "Құбыла бағыты мен намаз уақытын дәл есептеу үшін орналасу қажет.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Құбыла бағыты мен намаз уақытын дәл есептеу үшін орналасу қажет.",
      NSPhotoLibraryUsageDescription: "Суреттер өнім жапсырмасын халал тексеру үшін қажет.",
      NSCameraUsageDescription:
        "Камера құбыла бағыты (алдыңғы көрініс), штрихкод және халал тексеру үшін қолданылады.",
      NSMicrophoneUsageDescription:
        "Микрофон халал тексеру немесе дыбыс жазу мүмкіндігі үшін қажет болғанда қолданылады.",
      NSFaceIDUsageDescription: "Face ID арқылы қолданбаға қауіпсіз кіру үшін.",
      NSMotionUsageDescription: "Құбыла компасы үшін құрылғы қозғалысы қолданылады.",
      NSAlarmKitUsageDescription:
        "Намаз уақытында құлып экранында толық азан оятқышын көрсету үшін.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    softwareKeyboardLayoutMode: "resize",
    versionCode: 12,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
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
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
    ],
  },
  /** Primary deep link; `imamai://` remains in AndroidManifest + linking prefixes for legacy. */
  scheme: "raqat",
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
    version: "1.1.2",
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

  /** Контент: клиент бандлына құпия енгізілмейді — JWT (кіру) арқылы. */
  delete extra.raqatContentSecret;
  /** Release: Metro EXPO_PUBLIC_* инлайн жасамасын. */
  const isReleaseConfig =
    process.env.NODE_ENV === "production" ||
    process.env.EAS_BUILD_PROFILE === "production" ||
    process.env.RAQAT_STRIP_CLIENT_SECRETS === "1";
  if (isReleaseConfig) {
    delete process.env.EXPO_PUBLIC_RAQAT_CONTENT_SECRET;
  }
  if (donationEnv) extra.raqatDonationUrl = donationEnv;

  const halalDamuEnv = (process.env.EXPO_PUBLIC_HALAL_DAMU_URL || "").trim();
  if (halalDamuEnv) {
    extra.halalDamuUrl = halalDamuEnv;
  }

  const raqatWebEnv = (process.env.EXPO_PUBLIC_RAQAT_WEB_URL || "").trim();
  if (raqatWebEnv) {
    extra.raqatWebUrl = raqatWebEnv.replace(/\/+$/, "");
  }

  const googleWeb = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "").trim();
  const googleIos = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "").trim();
  const googleAndroid = (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "").trim();
  if (googleWeb) extra.googleWebClientId = googleWeb;
  if (googleIos) extra.googleIosClientId = googleIos;
  if (googleAndroid) extra.googleAndroidClientId = googleAndroid;

  expo.extra = extra;
  return { expo };
};
