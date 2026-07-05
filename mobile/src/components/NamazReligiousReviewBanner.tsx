import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { NAMAZ_RELIGIOUS_REVIEW } from "../content/namazReligiousMeta";

type Props = {
  colors: ThemeColors;
};

export function NamazReligiousReviewBanner({ colors }: Props) {
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pending = !NAMAZ_RELIGIOUS_REVIEW.approvedForPublicRelease;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.headRow}>
        <MaterialIcons name="verified-user" size={20} color={colors.accent} />
        <Text style={styles.title}>{tr(kk.namazGuide.reviewBannerTitle)}</Text>
      </View>
      <View style={[styles.statusPill, pending ? styles.statusPending : styles.statusApproved]}>
        <Text style={styles.statusTxt}>
          {pending
            ? tr(kk.namazGuide.reviewBannerScholarPending)
            : tr(kk.namazGuide.reviewBannerScholarApproved)}
        </Text>
      </View>
      <Text style={styles.body}>{tr(kk.namazGuide.reviewBannerDisclaimer)}</Text>
      <Text style={styles.madhhab}>
        {tr(kk.namazGuide.reviewBannerMadhhab(NAMAZ_RELIGIOUS_REVIEW.madhhab, NAMAZ_RELIGIOUS_REVIEW.aqida))}
      </Text>
      {NAMAZ_RELIGIOUS_REVIEW.sources.map((src) => (
        <Text key={src.id} style={styles.sourceLine}>
          • {tr(src.labelKk)}
        </Text>
      ))}
      {pending ? (
        <Text style={styles.footnote}>{tr(kk.namazGuide.reviewBannerEngineeringNote)}</Text>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
      gap: 8,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      flex: 1,
    },
    statusPill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
    },
    statusPending: {
      backgroundColor: `${colors.warning ?? colors.accent}18`,
      borderColor: `${colors.warning ?? colors.accent}55`,
    },
    statusApproved: {
      backgroundColor: `${colors.success ?? colors.accent}18`,
      borderColor: `${colors.success ?? colors.accent}55`,
    },
    statusTxt: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
    },
    body: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    madhhab: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
    },
    sourceLine: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    footnote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      fontStyle: "italic",
      marginTop: 4,
    },
  });
}
