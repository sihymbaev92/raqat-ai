export const RELEASE_FOCUS_CORE_SURFACES = ["namaz", "quran-hatim", "halal"] as const;

export type ReleaseFocusCoreSurface = (typeof RELEASE_FOCUS_CORE_SURFACES)[number];

export type CoreBackendDependencyPolicy = {
  surface: ReleaseFocusCoreSurface;
  backendRequiredForFirstPaint: boolean;
  offlineFallbackRequired: boolean;
};

export const RELEASE_SIZE_BUDGETS = {
  apkWarnMb: 145,
  bundledAssetsWarnMb: 400,
  largestSingleAssetWarnMb: 35,
} as const;

export const CORE_BACKEND_DEPENDENCY_POLICY: CoreBackendDependencyPolicy[] = [
  { surface: "namaz", backendRequiredForFirstPaint: false, offlineFallbackRequired: true },
  { surface: "quran-hatim", backendRequiredForFirstPaint: false, offlineFallbackRequired: true },
  { surface: "halal", backendRequiredForFirstPaint: false, offlineFallbackRequired: true },
];

