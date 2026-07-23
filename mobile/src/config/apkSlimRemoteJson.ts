/** Release APK stash/strip — CDN + FileSystem cache (rahatomir.com/assets/bundled). */
export const APK_SLIM_REMOTE_JSON = [
  "offline-auto-translations-core.json",
  "halal-companies-snapshot.json",
] as const;

export type ApkSlimRemoteJsonName = (typeof APK_SLIM_REMOTE_JSON)[number];
