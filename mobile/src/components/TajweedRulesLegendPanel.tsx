import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { TAJWEED_RULES_CATALOG } from "../content/tajweedRulesCatalog";

type Props = {
  /** Қысқа режим — ScrollView жоқ, бірақ барлық 17 ереже көрінеді. */
  compact?: boolean;
};

export function TajweedRulesLegendPanel({ compact = false }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rules = TAJWEED_RULES_CATALOG;

  const body = (
    <>
      <Text style={styles.intro}>{kk.quran.tajweedLegendIntro}</Text>
      {rules.map((meta) => (
        <View key={meta.rule} style={styles.line}>
          <View
            style={[styles.dot, { backgroundColor: isDark ? meta.colorDark : meta.colorLight }]}
          />
          <View style={styles.txtCol}>
            <Text style={styles.ruleTitle}>
              {meta.labelKk} <Text style={styles.tag}>{meta.tagOpen}</Text>
            </Text>
            <Text style={styles.detail}>{meta.detailKk}</Text>
          </View>
        </View>
      ))}
      {compact ? (
        <Text style={styles.compactFoot}>{kk.tajweedGuide.quranColorsHint}</Text>
      ) : (
        <Text style={styles.foot}>{kk.quran.tajweedSourceNote}</Text>
      )}
    </>
  );

  if (compact) {
    return <View style={styles.wrap}>{body}</View>;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 10 },
    scroll: { maxHeight: 320 },
    scrollContent: { gap: 10, paddingBottom: 4 },
    intro: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 2 },
    line: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    txtCol: { flex: 1, minWidth: 0 },
    ruleTitle: { color: colors.text, fontWeight: "800", fontSize: 14, lineHeight: 20 },
    tag: { color: colors.muted, fontWeight: "600", fontSize: 12 },
    detail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
    foot: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
    compactFoot: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  });
}
