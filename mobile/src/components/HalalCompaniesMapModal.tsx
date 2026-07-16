import React, { createElement, useCallback, useEffect, useMemo, useState } from "react";
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
  prefetchHalalDamuCompanyMapMarkers,
  type HalalDamuMapMarker,
} from "../api/halalDamuWp";
import { halalMapClusterChunkMs, halalMapMarkerCap } from "../utils/halalPerformanceProfile";
import { resolveInstantHalalCompanyMapMarkers } from "../utils/halalMapBootstrap";
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
};

const MAX_MAP_MARKERS = halalMapMarkerCap();

function buildLeafletHtml(points: HalalDamuMapMarker[], openDetailLabel: string): string {
  const { chunkInterval, chunkDelay } = halalMapClusterChunkMs();
  const payload = JSON.stringify(
    points.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: p.title,
      address: p.address,
    }))
  );
  const detailJs = JSON.stringify(openDetailLabel);
  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" crossorigin=""/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" crossorigin=""/>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #map { position: absolute; left: 0; top: 0; right: 0; bottom: 0; width: 100%; height: 100%; min-height: 100vh; }
    .leaflet-popup-content { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; max-width: 260px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" crossorigin=""></script>
  <script>
    (function () {
      function send(obj) {
        try {
          var s = JSON.stringify(obj);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(s);
          } else if (window.parent && window.parent !== window) {
            window.parent.postMessage(s, "*");
          }
        } catch (_) {}
      }
      try {
        if (typeof L === "undefined" || typeof L.markerClusterGroup !== "function") {
          send({ type: "mapJsErr", msg: "leaflet_load" });
          return;
        }
        var OPEN_DETAIL = ${detailJs};
        var pts = ${payload};
        function escapeHtml(s) {
          if (s == null) return "";
          return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        }
        var map = L.map("map", { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        var group = L.markerClusterGroup({
          chunkedLoading: true,
          chunkInterval: ${chunkInterval},
          chunkDelay: ${chunkDelay},
          maxClusterRadius: 56
        });
        pts.slice(0, ${MAX_MAP_MARKERS}).forEach(function (p) {
          var m = L.marker([p.lat, p.lng]);
          var addr = p.address
            ? '<div style="opacity:.88;font-size:12px;margin-top:6px;line-height:1.35">' +
              escapeHtml(p.address) +
              "</div>"
            : "";
          var lid = "halal-pick-" + p.id;
          m.bindPopup(
            "<div><b>" +
              escapeHtml(p.title) +
              "</b>" +
              addr +
              '<p style="margin:10px 0 0"><a href="#" id="' +
              lid +
              '">' +
              escapeHtml(OPEN_DETAIL) +
              "</a></p></div>"
          );
          m.on("popupopen", function () {
            var a = document.getElementById(lid);
            if (a) {
              a.onclick = function (ev) {
                ev.preventDefault();
                send({ type: "pick", id: p.id });
                return false;
              };
            }
          });
          group.addLayer(m);
        });
        map.addLayer(group);
        try {
          if (pts.length > 0) {
            map.fitBounds(group.getBounds(), { padding: [32, 32], maxZoom: 14 });
          } else {
            map.setView([48.02, 66.92], 5);
          }
        } catch (e2) {
          map.setView([48.02, 66.92], 5);
        }
        setTimeout(function () {
          try {
            map.invalidateSize();
            if (pts.length > 0) {
              map.fitBounds(group.getBounds(), { padding: [32, 32], maxZoom: 14 });
            }
          } catch (_) {}
        }, 300);
        send({ type: "mapReady" });
      } catch (e) {
        send({ type: "mapJsErr", msg: String((e && e.message) || e || "init") });
      }
    })();
  </script>
</body>
</html>`;
}

export function HalalCompaniesMapModal({ visible, onClose, onSelectCompanyId, strings, colors }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [markers, setMarkers] = useState<HalalDamuMapMarker[]>([]);
  const [html, setHtml] = useState<string | null>(null);
  const [mapPainted, setMapPainted] = useState(false);
  const isWeb = Platform.OS === "web";
  const modalInsets = modalSafeAreaInsets(insets);

  const showMapShell = visible && phase === "ready" && !!html && markers.length > 0;
  const showBlockingLoader = visible && !showMapShell && phase !== "err";

  const applyMarkers = useCallback(
    (next: HalalDamuMapMarker[]) => {
      const capped = next.slice(0, MAX_MAP_MARKERS);
      if (!capped.length) return false;
      setMarkers(capped);
      setHtml(buildLeafletHtml(capped, strings.openDetail));
      setPhase("ready");
      setErr(null);
      setMapPainted(false);
      return true;
    },
    [strings.openDetail]
  );

  useEffect(() => {
    if (!visible) {
      setPhase("idle");
      setErr(null);
      setMapPainted(false);
      return;
    }

    prefetchHalalDamuCompanyMapMarkers();

    const instant = resolveInstantHalalCompanyMapMarkers();
    if (instant.length > 0) {
      applyMarkers(instant);
    } else {
      setPhase("loading");
      setErr(null);
    }

    let cancelled = false;
    void fetchHalalDamuCompanyMapMarkers().then(({ markers: apiMarkers, error, withCoords }) => {
      if (cancelled) return;
      if (apiMarkers.length > 0) {
        applyMarkers(apiMarkers);
        return;
      }
      if (instant.length > 0) return;
      if (error) {
        setErr(strings.error);
        setPhase("err");
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
  }, [visible, applyMarkers, strings.error]);

  const handleBridgeMessage = useCallback(
    (raw: string) => {
      try {
        const d = JSON.parse(raw) as { type?: string; id?: number; msg?: string };
        if (d?.type === "mapJsErr") {
          setErr(strings.error + (d.msg ? ` (${d.msg})` : ""));
          setPhase("err");
          return;
        }
        if (d?.type === "mapReady") {
          setMapPainted(true);
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

  /** Expo Web: RN WebView көпірі жоқ — iframe ішіндегі postMessage ана терезеге келеді. */
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
          gap: 10,
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

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
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
        ) : phase === "ready" && markers.length === 0 ? (
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
                onError={() => {
                  setErr(strings.error);
                  setPhase("err");
                }}
              />
            )}
            {!mapPainted ? (
              <View style={[StyleSheet.absoluteFillObject, styles.mapOverlay]}>
                <RaqatOrnamentSpinner size={40} />
                <Text style={styles.hint}>{strings.loading}</Text>
              </View>
            ) : null}
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
