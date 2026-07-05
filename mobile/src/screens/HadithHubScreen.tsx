import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import { HADITH_TRUSTED_SOURCES } from "../content/hadithTrustedSources";
import { menuIconAssets } from "../theme/menuIconAssets";
import { RasterImage } from "@/ui/RasterImage";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithHub">;

export function HadithHubScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [sourcesOpen, setSourcesOpen] = useState(true);

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 32 + Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.heroRow}>
        <RasterImage source={menuIconAssets.heroHadith} style={styles.heroImg} resizeMode="contain" />
        <View style={styles.heroText}>
          <Text style={styles.h1}>{tr(kk.hadith.hub.screenTitle)}</Text>
          <Text style={styles.lead}>{tr(kk.hadith.hub.leadUnified)}</Text>
        </View>
      </View>
      <Text style={styles.sectionHint}>{tr(kk.hadith.hub.boundaryNotice)}</Text>

      <Pressable
        onPress={() => navigation.navigate("HadithList")}
        style={({ pressed }) => [styles.sahihCta, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={tr(kk.hadith.openHadithList)}
      >
        <MaterialIcons name="menu-book" size={22} color={colors.accent} />
        <View style={styles.sahihCtaText}>
          <Text style={styles.sahihCtaTitle}>{tr(kk.hadith.hub.sahihTab)}</Text>
          <Text style={styles.sahihCtaSub}>{tr(kk.hadith.hub.sahihTabHint)}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => setSourcesOpen((v) => !v)}
        style={({ pressed }) => [styles.sourcesToggle, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: sourcesOpen }}
        accessibilityLabel={tr(kk.hadith.hub.sourcesToggleA11y)}
      >
        <Text style={styles.sourcesToggleTxt}>{tr(kk.hadith.hub.sourcesTitle)}</Text>
        <MaterialIcons
          name={sourcesOpen ? "expand-less" : "expand-more"}
          size={24}
          color={colors.muted}
        />
      </Pressable>
      {sourcesOpen ? (
        <>
          <Text style={styles.sectionHint}>{tr(kk.hadith.hub.sourcesHint)}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHead]}>
              <Text style={[styles.cell, styles.cellSource, styles.headTxt]}>{tr(kk.hadith.hub.colSource)}</Text>
              <Text style={[styles.cell, styles.cellRel, styles.headTxt]}>{tr(kk.hadith.hub.colReliability)}</Text>
              <Text style={[styles.cell, styles.cellUse, styles.headTxt]}>{tr(kk.hadith.hub.colUsage)}</Text>
            </View>
            {HADITH_TRUSTED_SOURCES.map((src) => (
              <Pressable
                key={src.id}
                onPress={() => openUrl(src.homeUrl)}
                style={({ pressed }) => [styles.tableRow, styles.tableBodyRow, pressed && { opacity: 0.9 }]}
                accessibilityRole="link"
                accessibilityLabel={tr(kk.hadith.hub.openSourceA11y(src.nameKk))}
              >
                <View style={[styles.cell, styles.cellSource, styles.sourceCell]}>
                  <Text style={styles.sourceName}>{src.nameKk}</Text>
                  <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
                </View>
                <Text style={[styles.cell, styles.cellRel, styles.bodyTxt]}>
                  {tr(kk.hadith.hub[src.reliabilityKey])}
                </Text>
                <Text style={[styles.cell, styles.cellUse, styles.bodyTxt]}>{tr(kk.hadith.hub[src.usageKey])}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 16, paddingBottom: 32 },
    heroRow: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "center" },
    heroImg: { width: 56, height: 56 },
    heroText: { flex: 1, minWidth: 0 },
    h1: { fontSize: 22, fontWeight: "800", color: text, marginBottom: 6 },
    lead: { fontSize: 14, lineHeight: 21, color: muted },
    sectionHint: { fontSize: 12, color: muted, marginBottom: 10, lineHeight: 17 },
    sahihCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 18,
    },
    sahihCtaText: { flex: 1, minWidth: 0 },
    sahihCtaTitle: { fontSize: 15, fontWeight: "800", color: text, marginBottom: 4 },
    sahihCtaSub: { fontSize: 12, lineHeight: 17, color: muted },
    sourcesToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      marginBottom: 4,
    },
    sourcesToggleTxt: { fontSize: 15, fontWeight: "800", color: text },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    tableRow: { flexDirection: "row", alignItems: "flex-start" },
    tableHead: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.accentSurface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tableBodyRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    cell: { paddingVertical: 10, paddingHorizontal: 8 },
    cellSource: { flex: 1.1, minWidth: 0 },
    cellRel: { flex: 0.85, minWidth: 0 },
    cellUse: { flex: 1.4, minWidth: 0 },
    headTxt: { fontSize: 11, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
    bodyTxt: { fontSize: 12, lineHeight: 17, color: colors.text },
    sourceCell: { flexDirection: "row", alignItems: "center", gap: 4 },
    sourceName: { fontSize: 13, fontWeight: "800", color: colors.accent, flexShrink: 1 },
  });
}
