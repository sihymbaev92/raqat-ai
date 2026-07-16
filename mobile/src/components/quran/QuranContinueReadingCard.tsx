import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import type { ThemeColors } from "../../theme/colors";
import { useAppLocale } from "../../i18n/runtime";

type Props = {
  colors: ThemeColors;
  surahTitle: string;
  ayah: number;
  streakDays?: number;
  onPress: () => void;
  style?: object;
};

export function QuranContinueReadingCard({
  colors,
  surahTitle,
  ayah,
  streakDays = 0,
  onPress,
  style,
}: Props) {
  useAppLocale();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, style, pressed && { opacity: 0.9 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={kk.quran.continueReadingA11y(surahTitle, ayah)}
    >
      <View style={[styles.icon, { backgroundColor: colors.bg }]}>
        <MaterialIcons name="menu-book" size={22} color={colors.accent} />
      </View>
      <View style={styles.txtCol}>
        <Text style={styles.title}>{tr(kk.quran.continueReadingTitle)}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {tr(kk.quran.continueReadingSubtitle(surahTitle, ayah))}
        </Text>
        {streakDays > 0 ? (
          <Text style={styles.streak}>{tr(kk.quran.readingStreakDays(streakDays))}</Text>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.accent} />
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    txtCol: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 15, fontWeight: "800" },
    sub: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 },
    streak: { color: colors.accent, fontSize: 11, fontWeight: "700", marginTop: 4 },
  });
}
