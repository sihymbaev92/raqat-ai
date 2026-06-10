import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import type { HomeTabCompositeNavigation } from "../../navigation/types";
import type { ThemeColors } from "../../theme/colors";
import { surahDisplayTitle } from "../../constants/surahTitleKk";
import { getDailyAyahCard, getDailySpiritQuote } from "../../utils/dailyRetentionContent";
import { getDailyAiPrompt } from "../../content/dailyAiPrompts";
import { navigateToQuranMushafBook, navigateToMoreStackScreen } from "../../navigation/navigateToMoreStack";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  navigation: HomeTabCompositeNavigation;
};

export function DashboardDailyHub({ colors, isDark, navigation }: Props) {
  const { tr } = useKkAutoTranslator();
  const d = kk.dashboard;
  const ayah = useMemo(() => getDailyAyahCard(), []);
  const aiPrompt = useMemo(() => getDailyAiPrompt(), []);
  const quote = useMemo(() => getDailySpiritQuote(), []);

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const surahTitle = surahDisplayTitle(ayah.surah, "");

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{tr(d.dailyHubTitle)}</Text>

      <Pressable
        style={({ pressed }) => [styles.card, styles.cardAi, pressed && { opacity: 0.92 }]}
        onPress={() =>
          navigateToMoreStackScreen(
            "ImamAI",
            { initialPrompt: aiPrompt, autoSend: true },
            navigation
          )
        }
        accessibilityRole="button"
        accessibilityLabel={d.dailyAiA11y}
      >
        <MaterialIcons name="psychology" size={22} color={colors.accent} />
        <View style={styles.cardBody}>
          <Text style={styles.cardLabel}>{tr(d.dailyAiLabel)}</Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            {aiPrompt}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        onPress={() =>
          navigateToQuranMushafBook({ focusSurah: ayah.surah, focusAyah: ayah.ayah }, navigation)
        }
        accessibilityRole="button"
        accessibilityLabel={d.dailyAyahA11y(surahTitle, ayah.ayah)}
      >
        <MaterialIcons name="auto-stories" size={22} color={colors.accent} />
        <View style={styles.cardBody}>
          <Text style={styles.cardLabel}>{tr(d.dailyAyahLabel)}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {surahTitle} · {ayah.ayah}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>

      {quote ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          onPress={() => navigateToMoreStackScreen("KazakhGreatWords", undefined, navigation)}
          accessibilityRole="button"
          accessibilityLabel={d.dailyQuoteA11y}
        >
          <MaterialIcons name="format-quote" size={22} color={colors.accent} />
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{tr(d.dailyQuoteLabel)}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {quote.text}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {quote.attribution}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 20,
      marginBottom: 14,
      gap: 8,
    },
    heading: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 2,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    cardAi: {
      borderColor: colors.accent,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardLabel: { fontSize: 11, fontWeight: "700", color: colors.accent, textTransform: "uppercase" },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
    cardSub: { fontSize: 13, lineHeight: 18, color: colors.text, marginTop: 2 },
    cardMeta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  });
}
