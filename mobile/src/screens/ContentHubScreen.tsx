import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type ImageSourcePropType } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { AppIconBadge } from "../components/AppIconBadge";
import { hubIcons } from "../theme/appIcons";
import { menuIconAssets } from "../theme/menuIconAssets";
import type { MciName } from "../theme/appIcons";

type Props = NativeStackScreenProps<MoreStackParamList, "ContentHub">;

type HubNav = Exclude<
  keyof MoreStackParamList,
  "ContentHub" | "QuranSurah" | "HadithDetail" | "Settings"
>;

type HubItem = {
  key: string;
  label: string;
  screen: HubNav;
  image?: ImageSourcePropType;
  icon?: MciName;
};

/** Фото иконкалар + экожүйе/Telegram үшін вектор қалған */
const HUB_ITEMS: HubItem[] = [
  { key: "quran", image: menuIconAssets.heroQuran, label: kk.dashboard.quranShort, screen: "QuranList" },
  { key: "hadith", image: menuIconAssets.heroHadith, label: kk.hadith.menuTitle, screen: "HadithList" },
  { key: "namaz", image: menuIconAssets.tileNamaz, label: kk.namazGuide.shortTitle, screen: "NamazGuide" },
  { key: "tajweed", image: menuIconAssets.tileTajweed, label: kk.dashboard.arabicLettersTile, screen: "TajweedGuide" },
  { key: "halal", image: menuIconAssets.tileHalal, label: kk.features.halalTitle, screen: "Halal" },
  { key: "ai", image: menuIconAssets.promoAi, label: kk.features.raqatAiTitle, screen: "RaqatAI" },
  { key: "hajj", image: menuIconAssets.tileHajj, label: kk.features.hajjTitle, screen: "Hajj" },
  { key: "hatim", image: menuIconAssets.heroQuran, label: kk.features.hatimTitle, screen: "Hatim" },
  { key: "seerah", image: menuIconAssets.tileSeerah, label: kk.seerah.title, screen: "Seerah" },
  { key: "eco", icon: hubIcons.eco, label: kk.ecosystem.cardTitle, screen: "Ecosystem" },
  { key: "tg", icon: hubIcons.tg, label: kk.navigation.telegramTitle, screen: "TelegramInfo" },
];

export function ContentHubScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const accentHubBg = colors.accentSurface;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{kk.navigation.contentHubTitle}</Text>
      <Text style={styles.sub}>{kk.navigation.contentHubSub}</Text>
      <View style={styles.grid}>
        {HUB_ITEMS.map((it) => (
          <Pressable
            key={it.key}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate(it.screen)}
          >
            <AppIconBadge
              name={it.icon}
              imageSource={it.image}
              colors={colors}
              tintBg={accentHubBg}
              size="xl"
              border={false}
              shape="circle"
              plain
            />
            <Text style={styles.label} numberOfLines={2}>
              {it.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 8 },
    sub: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 18 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    tile: {
      width: "48.2%",
      minHeight: 124,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 16,
    },
  });
}
