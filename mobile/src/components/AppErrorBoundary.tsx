import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { kk } from "../i18n/kk";
import { reportClientError } from "../services/clientErrorReporter";

type Props = { children: ReactNode };
type State = { err: Error | null };

const WEB_ERROR_RELOAD_KEY = "raqat_web_error_reload_once_v2";

function isLikelyStaleWebBundleError(e: Error): boolean {
  const text = `${e.name}: ${e.message}`;
  return (
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("Failed to fetch dynamically imported module") ||
    text.includes("Importing a module script failed") ||
    text.includes("Requiring unknown module") ||
    text.includes("quranSurahListColors") ||
    text.includes("scriptureArabicTextStyle") ||
    text.includes("toEasternArabicIndic") ||
    text.includes("mushafPageForSurahAyah") ||
    text.includes("is not a function")
  );
}

function reloadWebOnceForStaleBundle(e: Error): void {
  if (Platform.OS !== "web" || typeof window === "undefined" || !isLikelyStaleWebBundleError(e)) return;
  try {
    if (window.sessionStorage?.getItem(WEB_ERROR_RELOAD_KEY) === "1") return;
    window.sessionStorage?.setItem(WEB_ERROR_RELOAD_KEY, "1");
  } catch {
    /* sessionStorage may be disabled. */
  }
  const path = window.location.pathname || "/";
  const sep = path.includes("?") ? "&" : "?";
  window.location.replace(`${path}${sep}rv=${Date.now()}`);
}

/**
 * Суық іске қосуда рендер қатесін (ақ экран) ұстап, қайта кіру сынағы.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(e: Error): State {
    return { err: e };
  }

  componentDidCatch(e: Error, info: ErrorInfo): void {
    console.error("AppErrorBoundary", e, info.componentStack);
    void reportClientError({ kind: "render", error: e, componentStack: info.componentStack });
    reloadWebOnceForStaleBundle(e);
  }

  render(): ReactNode {
    if (this.state.err) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>{kk.common.appErrorTitle}</Text>
          <Text style={styles.hint}>
            {kk.common.appErrorHint}
          </Text>
          <ScrollView style={styles.pre}>
            <Text style={styles.msg} selectable>
              {this.state.err.name}: {this.state.err.message}
            </Text>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
            onPress={() => this.setState({ err: null })}
            accessibilityRole="button"
            accessibilityLabel={kk.common.retry}
          >
            <Text style={styles.btnTxt}>{kk.common.retry}</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#05080B",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#F2F4F5", marginBottom: 8 },
  hint: { fontSize: 12, color: "#7A8B94", marginBottom: 12 },
  pre: { maxHeight: 200, marginBottom: 20 },
  msg: { color: "#f29393", fontSize: 12 },
  btn: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(38, 166, 154, 0.3)",
  },
  btnTxt: { color: "#E0F2F1", fontWeight: "700" },
});
