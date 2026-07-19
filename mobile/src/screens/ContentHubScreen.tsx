import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import type { MoreStackParamList } from "../navigation/types";
import { navigateToAppSettings } from "../navigation/navigateToSettings";
import { navigateToMainTabScreen, navigateToMoreStackScreen, navigateToRootStackScreen } from "../navigation/navigateToMoreStack";
import { AppIconBadge } from "../components/AppIconBadge";
import { HUB_MENU_TILE_BOX_PX } from "../config/dashboardLauncherTileImage";
import { KazakhOrnamentTitleBanner } from "../components/KazakhOrnamentTitleBanner";
import { hubIcons } from "../theme/appIcons";
import { menuIconAssets } from "../theme/menuIconAssets";
import type { MciName } from "../theme/appIcons";

type Props = NativeStackScreenProps<MoreStackParamList, "ContentHub">;

type HubMoreNav = Exclude<
  keyof MoreStackParamList,
  | "ContentHub"
  | "QuranSurah"
  | "Settings"
  | "KazakhGreatWordsAuthor"
  | "KazakhGreatWordsEntry"
>;

type HubRootNav = "PrayerTimes" | "Qibla" | "AsmaAlHusna";
type HubMainNav = "Tasbih";

type HubTileMore = {
  kind: "more";
  key: string;
  label: string;
  screen: HubMoreNav;
  image?: ImageSourcePropType;
  icon?: MciName;
};

type HubTileRoot = {
  kind: "root";
  key: string;
  label: string;
  root: HubRootNav;
  image?: ImageSourcePropType;
  icon?: MciName;
};

type HubTileMain = {
  kind: "main";
  key: string;
  label: string;
  main: HubMainNav;
  image?: ImageSourcePropType;
  icon?: MciName;
};

type HubTile = HubTileMore | HubTileRoot | HubTileMain;

type HubSectionDef = { title: string; tiles: HubTile[] };

function hubSections(): HubSectionDef[] {
  const knowledge: HubSectionDef = {
    title: kk.navigation.contentHubSectionKnowledge,
    tiles: [
      {
        kind: "more",
        key: "hadith",
        label: kk.hadith.menuTitle,
        screen: "HadithHub",
        image: menuIconAssets.heroHadith,
      },
      {
        kind: "more",
        key: "knowledge-portal",
        label: kk.knowledgePortal.screenTitle,
        screen: "OfficialKnowledgePortal",
        image: menuIconAssets.promoKmdb,
      },
      {
        kind: "more",
        key: "tajweed",
        label: kk.dashboard.arabicLettersTile,
        screen: "TajweedGuide",
        image: menuIconAssets.tileTajweed,
      },
      {
        kind: "more",
        key: "duas",
        label: kk.navigation.duasTitle,
        screen: "Duas",
        image: menuIconAssets.tabDuas,
      },
      {
        kind: "more",
        key: "community-dua",
        label: kk.communityDua.screenTitle,
        screen: "CommunityDua",
        icon: "hands-pray",
      },
      {
        kind: "root",
        key: "asma",
        label: kk.tabs.asma,
        root: "AsmaAlHusna",
        image: menuIconAssets.tabAsma,
      },
      {
        kind: "more",
        key: "seerah",
        label: kk.seerah.title,
        screen: "Seerah",
        image: menuIconAssets.tileSeerah,
      },
    ],
  };

  const additionalTiles: HubTile[] = [
    {
      kind: "more",
      key: "tradition",
      label: kk.dashboard.traditionDinHubLabel,
      screen: "KazakhTradition",
      image: menuIconAssets.tileDinTradition,
    },
    {
      kind: "more",
      key: "hajj",
      label: kk.features.hajjTitle,
      screen: "Hajj",
      image: menuIconAssets.tileHajj,
    },
    {
      kind: "main",
      key: "tasbih",
      label: kk.tabs.tasbih,
      main: "Tasbih",
      image: menuIconAssets.tabTasbih,
    },
    {
      kind: "more",
      key: "tg",
      label: kk.navigation.telegramTitle,
      screen: "TelegramInfo",
      icon: hubIcons.tg,
    },
  ];

  return [
    knowledge,
    {
      title: kk.navigation.contentHubSectionCommunity,
      tiles: additionalTiles,
    },
  ];
}

/** Мазмұн хабы: барлық растр тайлдары бірдей px қорабы. */
const HUB_TILE_IMAGE_OPACITY = 0.92;

export function ContentHubScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const locale = useAppLocale();
  const styles = makeStyles(colors, isDark);
  const accentHubBg = colors.accentSurface;
  const sections = useMemo(() => hubSections(), [locale]);
  const hubRasterTileDim = isDark ? 0.11 : 0.085;

  const onTilePress = (tile: HubTile) => {
    if (tile.kind === "root") {
      navigateToRootStackScreen(tile.root, undefined, navigation);
      return;
    }
    if (tile.kind === "main") {
      navigateToMainTabScreen(tile.main, undefined, navigation);
      return;
    }
    navigateToMoreStackScreen(tile.screen, undefined, navigation);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <KazakhOrnamentTitleBanner
        colors={colors}
        tone="prayerTeal"
        title={kk.navigation.contentHubTitle}
        subtitle={kk.navigation.contentHubSub}
      />

      <Pressable
        style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.92 }]}
        onPress={() => navigateToAppSettings(navigation)}
        accessibilityRole="button"
        accessibilityLabel={kk.settings.headerSettingsA11y}
      >
        <MaterialIcons name="tune" size={22} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.settingsRowTitle}>{kk.settings.title}</Text>
          <Text style={styles.settingsRowSub}>{kk.settings.subtitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </Pressable>

      {sections.map((sec) => (
        <View key={sec.title} style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{sec.title}</Text>
          <View style={styles.grid}>
            {sec.tiles.map((it) => (
              <Pressable
                key={it.key}
                style={({ pressed }) => [
                  styles.tile,
                  it.key === "quran" && styles.tileQuranHadith,
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() => onTilePress(it)}
              >
                <View
                  style={
                    it.key === "quran" ? styles.hubQuranHadithStack : styles.hubTileInline
                  }
                >
                  <AppIconBadge
                    name={it.icon}
                    imageSource={it.image}
                    colors={colors}
                    tintBg={accentHubBg}
                    size="xl"
                    boxPx={HUB_MENU_TILE_BOX_PX}
                    border={false}
                    shape="circle"
                    plain
                    imageOpacity={HUB_TILE_IMAGE_OPACITY}
                    imageDarken={it.image ? hubRasterTileDim : undefined}
                  />
                  <Text
                    style={[
                      styles.label,
                      it.key === "quran" && styles.hubQuranHadithLabel,
                      it.key === "halal" && styles.halalHubLabel,
                    ]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {it.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 14, paddingBottom: 36 },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      marginBottom: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    settingsRowTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    settingsRowSub: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
      marginTop: 2,
    },
    sectionWrap: { marginBottom: 8 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.accentDark,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: 10,
      marginTop: 4,
      paddingHorizontal: 4,
    },
    title: { fontSize: 24, fontWeight: "900", color: colors.text, marginBottom: 8 },
    sub: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.muted,
      marginBottom: 14,
      backgroundColor: colors.accentSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
    },
    tile: {
      width: "48.2%",
      minHeight: 148,
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: _isDark ? 0.2 : 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    tileQuranHadith: {
      justifyContent: "flex-start",
      paddingTop: 12,
    },
    hubQuranHadithStack: {
      width: "100%",
      flexDirection: "column",
      alignItems: "center",
    },
    hubQuranHadithLabel: {
      marginTop: 12,
    },
    hubTileInline: {
      width: "100%",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      gap: 10,
    },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 17,
      width: "100%",
      paddingHorizontal: 2,
      minHeight: 34,
      flexShrink: 0,
    },
    halalHubLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.18,
      lineHeight: 15,
      minHeight: 30,
    },
  });
}
