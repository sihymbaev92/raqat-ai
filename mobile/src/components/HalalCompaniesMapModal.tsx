import React, { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview/lib/WebViewTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";
import {
  fetchHalalDamuCompanyMapMarkers,
  peekHalalDamuCompanyMapMarkersCache,
  prefetchHalalDamuCompanyMapMarkers,
  type HalalDamuMapMarker,
} from "../api/halalDamuWp";
import { ensureHalalCompaniesSnapshotLoaded } from "../services/halalCompaniesSnapshot";
import { resolveInstantHalalCompanyMapMarkers } from "../utils/halalMapBootstrap";
import { buildHalalLeafletMapHtml } from "../utils/halalMapLeafletHtml";
import { filterHalalMapMarkersWithinRadius } from "../utils/halalMapMarkers";
import {
  halalMapMarkerKey,
  peekHalalMapSession,
  storeHalalMapSession,
} from "../utils/halalMapSessionCache";
import {
  SECURE_ANDROID_WEBVIEW_PROPS,
  SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST,
} from "./webviewAndroidSecurity";

export type HalalCompaniesMapModalStrings = {
  title: string;
  loading: string;
  empty: string;
  error: string;
  close: string;
  openDetail: string;
  footerNote: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectCompanyId: (id: number) => void;
  strings: HalalCompaniesMapModalStrings;
  colors: ThemeColors;
  userLat?: number | null;
  userLon?: number | null;
  radiusKm?: number;
};

export function HalalCompaniesMapModal({
  visible,
  onClose,
  onSelectCompanyId,
  strings,
  colors,
  userLat = null,
  userLon = null,
  radiusKm = 5,
}: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [markers, setMarkers] = useState<HalalDamuMapMarker[]>([]);
  const [html, setHtml] = useState<string | null>(null);
  const [mapWarm, setMapWarm] = useState(false);
  const [mapPainted, setMapPainted] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const mapDisplayedRef = useRef(false);
  const lastAppliedKeyRef = useRef<string | null>(null);
  const isWeb = Platform.OS === "web";
  const modalInsets = modalSafeAreaInsets(insets);

  const hasUser =
    userLat != null && userLon != null && Number.isFinite(userLat) && Number.isFinite(userLon);
  const userPt = hasUser ? { lat: userLat!, lon: userLon! } : null;

  const showMapShell = visible && phase === "ready" && !!html && (markers.length > 0 || hasUser);
  const showBlockingLoader = visible && !mapPainted && phase !== "err";
  const showMapSpinner = showMapShell && !mapPainted && !isWeb;

  const pickMarkersForView = useCallback(
    (raw: HalalDamuMapMarker[]) => {
      if (!hasUser) return raw;
      const nearby = filterHalalMapMarkersWithinRadius(raw, userLat!, userLon!, radiusKm);
      return nearby.length > 0 ? nearby : raw;
    },
    [hasUser, userLat, userLon, radiusKm]
  );

  const applyMarkers = useCallback(
    (next: HalalDamuMapMarker[], opts?: { force?: boolean }) => {
      const view = pickMarkersForView(next);
      if (!view.length && !hasUser) return false;

      const user = userPt;
      const markerKey = halalMapMarkerKey(view, user);
      if (mapDisplayedRef.current && opts?.force !== true && lastAppliedKeyRef.current === markerKey) {
        return true;
      }

      const snap = peekHalalMapSession(markerKey);
      const builtHtml = snap?.html ?? buildHalalLeafletMapHtml(view, strings.openDetail, user);

      setMarkers(view);
      setHtml(builtHtml);
      setPhase("ready");
      setErr(null);
      setMapWarm(true);
      setMapPainted(Boolean(snap?.html));
      mapDisplayedRef.current = true;
      lastAppliedKeyRef.current = markerKey;
      storeHalalMapSession({ html: builtHtml, markers: view, markerKey });
      return true;
    },
    [strings.openDetail, hasUser, userPt, pickMarkersForView]
  );

  const hydrateFromSession = useCallback((): boolean => {
    const pool = resolveInstantHalalCompanyMapMarkers();
    if (!pool.length && !markers.length) return false;
    const view = pickMarkersForView(pool.length ? pool : markers);
    const key = halalMapMarkerKey(view, userPt);
    const snap = peekHalalMapSession(key);
    if (!snap?.html) return false;
    setMarkers(snap.markers);
    setHtml(snap.html);
    setPhase("ready");
    setErr(null);
    setMapWarm(true);
    setMapPainted(true);
    mapDisplayedRef.current = true;
    lastAppliedKeyRef.current = key;
    return true;
  }, [markers, userPt, pickMarkersForView]);

  useEffect(() => {
    if (!visible) return;
    setHasOpenedOnce(true);
    if (phase === "ready" && html && mapDisplayedRef.current) {
      setMapPainted(true);
      return;
    }

    prefetchHalalDamuCompanyMapMarkers();

    if (hydrateFromSession()) return;

    let cancelled = false;
    const instant = resolveInstantHalalCompanyMapMarkers();
    if (instant.length > 0) {
      applyMarkers(instant);
    } else {
      setPhase("loading");
      setErr(null);
      void ensureHalalCompaniesSnapshotLoaded().then(() => {
        if (cancelled) return;
        const hydrated = resolveInstantHalalCompanyMapMarkers();
        if (hydrated.length > 0) applyMarkers(hydrated);
      });
    }

    void fetchHalalDamuCompanyMapMarkers().then(({ error, withCoords }) => {
      if (cancelled) return;
      if (mapDisplayedRef.current) return;
      if (peekHalalDamuCompanyMapMarkersCache()?.length) {
        applyMarkers(peekHalalDamuCompanyMapMarkersCache()!);
        return;
      }
      if (resolveInstantHalalCompanyMapMarkers().length > 0) return;
      if (error) {
        setErr(strings.error);
        setPhase("err");
        mapDisplayedRef.current = false;
        return;
      }
      if (withCoords === 0) {
        setMarkers([]);
        setHtml(null);
        setPhase("ready");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible, applyMarkers, hydrateFromSession, strings.error, phase, html]);

  useEffect(() => {
    if (!visible || !hasUser || !mapDisplayedRef.current) return;
    const api = peekHalalDamuCompanyMapMarkersCache();
    const pool = api?.length ? api : resolveInstantHalalCompanyMapMarkers();
    if (!pool.length) return;
    const view = pickMarkersForView(pool);
    const key = halalMapMarkerKey(view, userPt);
    if (lastAppliedKeyRef.current === key) return;
    applyMarkers(pool, { force: true });
  }, [visible, hasUser, userLat, userLon, radiusKm, applyMarkers, pickMarkersForView, userPt]);

  const handleBridgeMessage = useCallback(
    (raw: string) => {
      try {
        const d = JSON.parse(raw) as { type?: string; id?: number; msg?: string };
        if (d?.type === "mapReady") {
          setMapPainted(true);
          return;
        }
        if (d?.type === "mapJsErr") {
          setErr(strings.error + (d.msg ? ` (${d.msg})` : ""));
          setPhase("err");
          mapDisplayedRef.current = false;
          setMapPainted(false);
          return;
        }
        if (d?.type === "pick" && typeof d.id === "number") {
          onSelectCompanyId(d.id);
          onClose();
        }
      } catch {
        /* жоқ */
      }
    },
    [onClose, onSelectCompanyId, strings.error]
  );

  const onMsg = useCallback(
    (e: WebViewMessageEvent) => {
      handleBridgeMessage(String(e.nativeEvent.data));
    },
    [handleBridgeMessage]
  );

  useEffect(() => {
    if (!isWeb || !visible || phase !== "ready" || !html) return undefined;
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return undefined;
    const onWin = (ev: MessageEvent) => {
      const raw = ev.data;
      if (typeof raw !== "string") return;
      const t = raw.trim();
      if (!t.startsWith("{")) return;
      handleBridgeMessage(t);
    };
    window.addEventListener("message", onWin);
    return () => window.removeEventListener("message", onWin);
  }, [isWeb, visible, phase, html, handleBridgeMessage]);

  const headerPad = Platform.OS === "ios" ? Math.max(modalInsets.top, 10) : modalInsets.top + 8;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg, paddingBottom: modalInsets.bottom },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 8,
          paddingBottom: 10,
          paddingTop: headerPad,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        h: { fontSize: 17, fontWeight: "800", color: colors.text, flex: 1, paddingLeft: 8 },
        closeBtn: { padding: 10 },
        center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
        hint: { marginTop: 12, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" },
        map: { flex: 1 },
        mapOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        },
        foot: {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        footTxt: { fontSize: 11, lineHeight: 16, color: colors.muted },
      }),
    [colors.bg, colors.border, colors.card, colors.muted, colors.text, headerPad, modalInsets.bottom]
  );

  if (!visible && !mapWarm && !hasOpenedOnce) return null;

  return (
    <Modal
      visible={visible}
      animationType={hasOpenedOnce ? "none" : "fade"}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.h} numberOfLines={2}>
            {strings.title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={strings.close}>
            <MaterialIcons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        {showBlockingLoader ? (
          <View style={styles.center}>
            <RaqatOrnamentSpinner size={48} />
            <Text style={styles.hint}>{strings.loading}</Text>
          </View>
        ) : phase === "err" ? (
          <View style={styles.center}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.hint, { color: colors.error }]}>{err}</Text>
          </View>
        ) : phase === "ready" && markers.length === 0 && !hasUser ? (
          <View style={styles.center}>
            <MaterialIcons name="map" size={44} color={colors.muted} />
            <Text style={styles.hint}>{strings.empty}</Text>
          </View>
        ) : showMapShell && html ? (
          <View style={styles.map}>
            {isWeb ? (
              createElement("iframe", {
                title: strings.title,
                srcDoc: html,
                sandbox: "allow-scripts allow-same-origin",
                style: { flex: 1, width: "100%", height: "100%", border: "none" },
              })
            ) : (
              <>
                <WebView
                  style={styles.map}
                  originWhitelist={[...SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST]}
                  source={{ html, baseUrl: "https://unpkg.com/" }}
                  onMessage={onMsg}
                  javaScriptEnabled
                  domStorageEnabled
                  {...SECURE_ANDROID_WEBVIEW_PROPS}
                  allowsBackForwardNavigationGestures={false}
                  setBuiltInZoomControls
                  nestedScrollEnabled
                  cacheEnabled
                  androidLayerType="hardware"
                  onError={() => {
                    setErr(strings.error);
                    setPhase("err");
                    mapDisplayedRef.current = false;
                    setMapPainted(false);
                  }}
                />
                {showMapSpinner ? (
                  <View style={styles.mapOverlay} pointerEvents="none">
                    <RaqatOrnamentSpinner size={40} />
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <View style={styles.center} />
        )}

        <View style={styles.foot}>
          <Text style={styles.footTxt}>{strings.footerNote}</Text>
        </View>
      </View>
    </Modal>
  );
}
