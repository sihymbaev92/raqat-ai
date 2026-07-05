import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { HadithContentTypeBadge } from "./HadithContentTypeBadge";

/** Hub/list — екі контент түрін қысқа салыстыру (P0 шатасуды азайту). */
export function HadithContentGuideCard() {
  const { colors } = useAppTheme();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.headRow}>
        <MaterialIcons name="info-outline" size={18} color={colors.accent} />
        <Text style={styles.title}>{tr(kk.hadith.contentTypes.guideTitle)}</Text>
      </View>
      <Text style={styles.lead}>{tr(kk.hadith.contentTypes.guideLead)}</Text>
      <View style={styles.row}>
        <HadithContentTypeBadge type="articleExcerpt" variant="compact" />
        <Text style={styles.rowBody}>{tr(kk.hadith.contentTypes.articleExcerptGuide)}</Text>
      </View>
      <View style={styles.row}>
        <HadithContentTypeBadge type="sahihCorpus" variant="compact" />
        <Text style={styles.rowBody}>{tr(kk.hadith.contentTypes.sahihCorpusGuide)}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 14,
      gap: 8,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
    },
    lead: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    row: {
      gap: 6,
    },
    rowBody: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
