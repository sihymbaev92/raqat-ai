import React, { Suspense } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

type LazyImport = () => Promise<{ default: React.ComponentType<any> }>;

const WEB_LAZY_RELOAD_KEY = "raqat_web_lazy_reload_once_v1";

export function isLikelyStaleWebBundleError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");
  return (
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("Failed to fetch dynamically imported module") ||
    text.includes("Importing a module script failed") ||
    text.includes("Requiring unknown module") ||
    text.includes("quranSurahListColors") ||
    text.includes("scriptureArabicTextStyle")
  );
}

function reloadWebOnceForStaleBundle(error: unknown): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !isLikelyStaleWebBundleError(error)) {
    return false;
  }
  try {
    if (window.sessionStorage?.getItem(WEB_LAZY_RELOAD_KEY) === "1") return false;
    window.sessionStorage?.setItem(WEB_LAZY_RELOAD_KEY, "1");
  } catch {
    /* sessionStorage may be disabled; reloading once is still safe. */
  }
  window.location.replace("/");
  return true;
}

function withWebLazyRecovery(loader: LazyImport): LazyImport {
  return () =>
    loader()
      .then((mod) => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          try {
            window.sessionStorage?.removeItem(WEB_LAZY_RELOAD_KEY);
          } catch {
            /* ignore */
          }
        }
        return mod;
      })
      .catch((error) => {
        if (reloadWebOnceForStaleBundle(error)) {
          return new Promise<{ default: React.ComponentType<any> }>(() => {});
        }
        throw error;
      });
}

export function lazyScreen(loader: LazyImport): React.ComponentType<any> {
  const LazyComponent = React.lazy(withWebLazyRecovery(loader));

  return function LazyScreen(props: any) {
    return (
      <Suspense
        fallback={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" />
          </View>
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
