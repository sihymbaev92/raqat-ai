import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { isRaqatAiKbOnlyClient } from "../config/raqatAiKbOnly";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";
import { fetchPlatformAiKbStatus, type PlatformAiKbStatus } from "../services/platformApiClient";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";

const INTRO_EXPANDED_KEY = "raqat_ai_kb_intro_expanded_v1";

type Props = {
  colors: ThemeColors;
  apiBase: string | null;
  /** hydrateRaqatApiBaseOverride кейін refresh */
  refreshKey?: number;
};

function formatKbStatusLine(status: PlatformAiKbStatus | null, loading: boolean): string {
  if (loading) return kk.aiChat.kbChecking;
  if (!status) return kk.aiChat.kbDisabledNoApi;
  if (status.endpointMissing) return kk.aiChat.kbApiOld;
  if (status.enabled === false) return kk.aiChat.kbServerOff;
  const fatua = status.by_site?.fatua ?? 0;
  const muftyat = status.by_site?.muftyat ?? 0;
  const chunks = status.chunks ?? 0;
  return kk.aiChat.kbIndexed(fatua, muftyat, chunks);
}

export function RaqatKbStatusBar({ colors, apiBase, refreshKey = 0 }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const kbOnlyClient = isRaqatAiKbOnlyClient();
  const [status, setStatus] = useState<PlatformAiKbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(INTRO_EXPANDED_KEY);
        if (!alive) return;
        if (raw === "1") setExpanded(true);
      } catch {
        /* default: жабық */
      } finally {
        if (alive) setPrefsReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(INTRO_EXPANDED_KEY, next ? "1" : "0").catch(() => {});
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!apiBase) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const bearer = ((await getValidAccessToken()) ?? "").trim();
      const res = await fetchPlatformAiKbStatus(apiBase, {
        authorizationBearer: bearer || undefined,
        aiSecret: getRaqatContentReadSecret(),
        timeoutMs: 10_000,
      });
      setStatus(res);
    } catch {
      setStatus({ ok: false, enabled: false });
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const statusLine = formatKbStatusLine(status, loading);
  const serverKbOnly = status?.kb_only === true;
  const showKbOnlyBadge = kbOnlyClient || serverKbOnly;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [styles.headerRow, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={kk.aiChat.introPanelToggleA11y(expanded)}
      >
        <View style={styles.headerMain}>
          {showKbOnlyBadge ? (
            <View style={styles.badgeRow}>
              <MaterialIcons name="verified-user" size={14} color={colors.accent} />
              <Text style={styles.badgeTxt}>{kk.aiChat.kbOnlyModeBadge}</Text>
            </View>
          ) : (
            <Text style={styles.headerTitle}>{kk.aiChat.introPanelTitle}</Text>
          )}
          {!expanded && prefsReady ? (
            <Text style={styles.headerSummary} numberOfLines={1}>
              {statusLine}
            </Text>
          ) : null}
        </View>
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={22}
          color={colors.muted}
        />
      </Pressable>
      {prefsReady && expanded ? (
        <View style={styles.body}>
          <Text style={styles.note}>{kk.aiChat.kbPipelineNote}</Text>
          <View style={styles.statusRow}>
            {loading ? <RaqatOrnamentSpinner size={16} /> : null}
            <Text style={styles.statusTxt} numberOfLines={3}>
              {statusLine}
            </Text>
            <Pressable
              onPress={() => void load()}
              disabled={loading || !apiBase}
              style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.aiChat.kbRefreshA11y}
            >
              <MaterialIcons name="refresh" size={18} color={colors.accent} />
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>{kk.aiChat.disclaimer}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    headerMain: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    headerSummary: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.muted,
    },
    body: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    badgeRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    badgeTxt: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.3,
      textTransform: "uppercase",
      color: colors.accent,
    },
    note: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.text,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusTxt: {
      flex: 1,
      fontSize: 11,
      lineHeight: 15,
      color: colors.muted,
    },
    refreshBtn: {
      padding: 4,
    },
    disclaimer: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.muted,
    },
  });
}
