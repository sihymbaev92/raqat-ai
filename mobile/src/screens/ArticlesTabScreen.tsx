import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { navigateToMoreStackScreen } from "../navigation/navigateToMoreStack";
import type { MoreStackParamList } from "../navigation/types";
import type { MciName } from "../theme/appIcons";

type ArticleLink = {
  key: string;
  label: string;
  subtitle: string;
  screen: keyof MoreStackParamList;
  icon: MciName;
};

const LINKS: ArticleLink[] = [
  {
    key: "hadith",
    label: kk.hadith.menuTitle,
    subtitle: kk.hadith.hub.sahihTabHint,
    screen: "HadithHub",
    icon: "menu-book",
  },
  {
    key: "ai",
    label: kk.features.raqatAiTitle,
    subtitle: kk.imamAiLead,
    screen: "ImamAI",
    icon: "psychology",
  },
  {
    key: "tradition",
    label: kk.features.traditionTitle,
    subtitle: kk.navigation.contentHubSectionTradition,
    screen: "KazakhTradition",
    icon: "auto-stories",
  },
  {
    key: "seerah",
    label: kk.seerah.title,
    subtitle: kk.navigation.contentHubSectionKnowledge,
    screen: "Seerah",
    icon: "history-edu",
  },
];

export function ArticlesTabScreen() {
  const { colors } = useAppTheme();
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{kk.navigation.tabArticles}</Text>
      <Text style={styles.lead}>{kk.navigation.contentHubLead}</Text>
      <View style={styles.list}>
        {LINKS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigateToMoreStackScreen(item.screen)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons name={item.icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 6 },
    lead: { fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: 16 },
    list: { gap: 10 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentMuted,
    },
    cardText: { flex: 1, minWidth: 0 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    cardSub: { fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 2 },
  });
}
