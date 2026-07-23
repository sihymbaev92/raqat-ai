import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import {
  TAJWEED_LEGEND_SECTIONS,
  TAJWEED_RULES_CATALOG,
  type TajweedRuleMeta,
} from "../content/tajweedRulesCatalog";

type Props = {
  /** Қысқа режим — ScrollView жоқ, бірақ барлық 17 ереже көрінеді. */
  compact?: boolean;
  /** Топтар бойынша топтау (бастапқы «Тәжуид» беті сияқты). */
  grouped?: boolean;
  /** Compact режимде түсті сүрелер тізіміне өту. */
  onOpenColoredList?: () => void;
};

function RuleLine({
  meta,
  isDark,
  styles,
  tr,
}: {
  meta: TajweedRuleMeta;
  isDark: boolean;
  styles: ReturnType<typeof makeStyles>;
  tr: (text: string) => string;
}) {
  return (
    <View style={styles.line}>
      <View
        style={[styles.dot, { backgroundColor: isDark ? meta.colorDark : meta.colorLight }]}
      />
      <View style={styles.txtCol}>
        <Text style={styles.ruleTitle}>
          {tr(meta.labelKk)} <Text style={styles.tag}>{meta.tagOpen}</Text>
        </Text>
        <Text style={styles.detail}>{tr(meta.detailKk)}</Text>
      </View>
    </View>
  );
}

export function TajweedRulesLegendPanel({
  compact = false,
  grouped = true,
  onOpenColoredList,
}: Props) {
  useAppLocale();
  const { tr } = useKkAutoTranslator();
  const t = useI18n();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const metaByRule = useMemo(
    () => new Map(TAJWEED_RULES_CATALOG.map((meta) => [meta.rule, meta])),
    []
  );

  const ruleList =
    grouped && !compact ? (
      TAJWEED_LEGEND_SECTIONS.map((section) => (
        <View key={section.titleKk} style={styles.section}>
          <Text style={styles.sectionTitle}>{tr(section.titleKk)}</Text>
          {section.rules.map((rule) => {
            const meta = metaByRule.get(rule);
            return meta ? (
              <RuleLine key={meta.rule} meta={meta} isDark={isDark} styles={styles} tr={tr} />
            ) : null;
          })}
        </View>
      ))
    ) : (
      TAJWEED_RULES_CATALOG.map((meta) => (
        <RuleLine key={meta.rule} meta={meta} isDark={isDark} styles={styles} tr={tr} />
      ))
    );

  const body = (
    <>
      <Text style={styles.intro}>{kk.quran.tajweedLegendIntro}</Text>
      {ruleList}
      <Text style={styles.helperNote}>{kk.quran.tajweedHelperLegendNote}</Text>
      {compact ? (
        <>
          <Text style={styles.compactFoot}>{kk.tajweedGuide.quranColorsHint}</Text>
          {onOpenColoredList ? (
            <Pressable
              onPress={onOpenColoredList}
              style={({ pressed }) => [styles.coloredListBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={t.tajweedGuide.openColoredListA11y}
            >
              <Text style={styles.coloredListBtnText}>{t.tajweedGuide.openColoredListCta}</Text>
            </Pressable>
          ) : null}
        </>
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
    section: { gap: 8 },
    sectionTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    line: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    txtCol: { flex: 1, minWidth: 0 },
    ruleTitle: { color: colors.text, fontWeight: "800", fontSize: 14, lineHeight: 20 },
    tag: { color: colors.muted, fontWeight: "600", fontSize: 12 },
    detail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
    helperNote: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 2 },
    foot: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
    compactFoot: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
    coloredListBtn: {
      alignSelf: "flex-start",
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.accentSurface,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    coloredListBtnText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
    },
  });
}
