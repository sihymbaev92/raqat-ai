import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { OfficialSiteFullWebView } from "./OfficialSiteFullWebView";
import {
  FATUA_WEBVIEW_HOSTS,
  MUFTYAT_WEBVIEW_HOSTS,
} from "./embeddedOfficialSiteNavigation";
import {
  officialIslamicSourceHomeUrl,
  type OfficialIslamicSourceId,
} from "../config/officialIslamicSources";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type Props = {
  site: OfficialIslamicSourceId;
  label: string;
  domain: string;
  previewHeight: number;
  colors: ThemeColors;
  onExpand: () => void;
};

export function KmdbHubEmbeddedSiteRow({
  site,
  label,
  domain,
  previewHeight,
  colors,
  onExpand,
}: Props) {
  const homeUrl = officialIslamicSourceHomeUrl(site);
  const allowedHosts = site === "fatua" ? FATUA_WEBVIEW_HOSTS : MUFTYAT_WEBVIEW_HOSTS;
  const expandA11y = site === "fatua" ? kk.kmdbHub.openFatuaA11y : kk.kmdbHub.openMuftyatA11y;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={onExpand}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={expandA11y}
      >
        <View style={styles.headText}>
          <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.domain, { color: colors.accent }]}>{domain}</Text>
        </View>
        <View style={styles.headActions}>
          <Text style={[styles.expandLabel, { color: colors.muted }]}>{kk.common.open}</Text>
          <MaterialIcons name="open-in-full" size={20} color={colors.accent} />
        </View>
      </Pressable>
      <View style={[styles.webShell, { height: previewHeight, borderTopColor: colors.border }]}>
        <OfficialSiteFullWebView
          url={homeUrl}
          colors={colors}
          title={label}
          allowedHosts={allowedHosts}
          userAgentTag={site === "fatua" ? "RaqatFatua/1" : "RaqatMuftyat/1"}
          refreshOnFocus={false}
          previewHeight={previewHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 14,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  headText: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  domain: { fontSize: 11, fontWeight: "800", marginTop: 2 },
  headActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  expandLabel: { fontSize: 11, fontWeight: "700" },
  webShell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
