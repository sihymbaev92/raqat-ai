import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HubScreenHero } from "../components/HubScreenHero";
import { AppIconBadge } from "../components/AppIconBadge";
import { HUB_MENU_TILE_BOX_PX } from "../config/dashboardLauncherTileImage";
import { getKmdbHubTiles } from "../config/kmdbHubTiles";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { menuIconAssets } from "../theme/menuIconAssets";
import type { MoreStackParamList } from "../navigation/types";
import { navigateToMoreStackScreen } from "../navigation/navigateToMoreStack";

type Props = NativeStackScreenProps<MoreStackParamList, "KmdbHub">;
type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type OfficialSourceCard = {
  label: string;
  domain: string;
  description: string;
  chips: string[];
  icon: IconName;
  url: string;
  accessibilityLabel: string;
};

const HUB_TILE_IMAGE_OPACITY = 0.92;

function getOfficialSourceCards(): OfficialSourceCard[] {
  return [
    {
      label: FATUA_KZ_LABEL_KK,
      domain: "fatua.kz",
      description: kk.kmdbHub.fatuaDescription,
      chips: [kk.kmdbHub.fatuaChipFatwa, kk.kmdbHub.fatuaChipQa, kk.kmdbHub.fatuaChipPersonal],
      icon: "gavel",
      url: FATUA_KK_HOME_URL,
      accessibilityLabel: kk.kmdbHub.openFatuaA11y,
    },
    {
      label: MUFTYAT_KZ_LABEL_KK,
      domain: "muftyat.kz",
      description: kk.kmdbHub.muftyatDescription,
      chips: [kk.kmdbHub.muftyatChipArticle, kk.kmdbHub.muftyatChipBook, kk.kmdbHub.muftyatChipNews],
      icon: "account-balance",
      url: MUFTYAT_KK_HOME_URL,
      accessibilityLabel: kk.kmdbHub.openMuftyatA11y,
    },
  ];
}

export function KmdbHubScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const locale = useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors, isDark]);
  const tiles = useMemo(() => getKmdbHubTiles(), [locale]);
  const officialSourceCards = useMemo(() => getOfficialSourceCards(), [locale]);
  const accentHubBg = colors.accentSurface;
  const hubRasterTileDim = isDark ? 0.11 : 0.085;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <HubScreenHero
        variant="ai"
        title={kk.kmdbHub.title}
        image={menuIconAssets.promoAi}
        colors={colors}
        isDark={isDark}
        eyebrow={kk.kmdbHub.eyebrow}
        compact
        tags={[FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK]}
      />

      <Text style={[styles.lead, { color: colors.muted }]}>{kk.kmdbHub.lead}</Text>

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.key}
            onPress={() => navigateToMoreStackScreen(tile.screen, undefined, navigation)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
          >
            <AppIconBadge
              imageSource={tile.image}
              colors={colors}
              tintBg={accentHubBg}
              size="xl"
              boxPx={HUB_MENU_TILE_BOX_PX}
              border={false}
              shape="circle"
              plain
              imageOpacity={HUB_TILE_IMAGE_OPACITY}
              imageDarken={hubRasterTileDim}
            />
            <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={2}>
              {tile.label}
            </Text>
            <Text style={[styles.tileSub, { color: colors.muted }]} numberOfLines={3}>
              {tile.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.officialSourcesPanel}>
        <Text style={[styles.sectionTitle, { color: colors.accentDark }]}>{kk.kmdbHub.officialSitesTitle}</Text>
        <Text style={[styles.officialSourcesLead, { color: colors.muted }]}>
          {kk.kmdbHub.officialSitesLead}
        </Text>
        {officialSourceCards.map((source) => (
          <Pressable
            key={source.domain}
            onPress={() => void Linking.openURL(source.url)}
            style={({ pressed }) => [
              styles.officialSourceCard,
              { borderColor: colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="link"
            accessibilityLabel={source.accessibilityLabel}
          >
            <View style={[styles.officialSourceIcon, { backgroundColor: colors.accentSurface }]}>
              <MaterialIcons name={source.icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.officialSourceText}>
              <View style={styles.officialSourceHead}>
                <Text style={[styles.officialSourceTitle, { color: colors.text }]}>{source.label}</Text>
                <Text style={[styles.officialSourceDomain, { color: colors.accent }]}>{source.domain}</Text>
              </View>
              <Text style={[styles.officialSourceDescription, { color: colors.muted }]} numberOfLines={2}>
                {source.description}
              </Text>
              <View style={styles.officialSourceChips}>
                {source.chips.map((chip) => (
                  <View key={chip} style={[styles.officialSourceChip, { backgroundColor: colors.accentSurface }]}>
                    <Text style={[styles.officialSourceChipText, { color: colors.accent }]}>{chip}</Text>
                  </View>
                ))}
              </View>
            </View>
            <MaterialIcons name="open-in-new" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <Text style={[styles.disclaimer, { color: colors.muted }]}>{kk.kmdbHub.disclaimer}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 14, paddingBottom: 36 },
    lead: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 18,
    },
    tile: {
      width: "47.5%",
      minHeight: 148,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    tileLabel: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: "900",
      textAlign: "center",
    },
    tileSub: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 15,
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    officialSourcesPanel: {
      marginTop: 2,
      marginBottom: 8,
    },
    officialSourcesLead: {
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 10,
      paddingHorizontal: 4,
      fontWeight: "600",
    },
    officialSourceCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 10,
    },
    officialSourceIcon: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    officialSourceText: {
      flex: 1,
      minWidth: 0,
    },
    officialSourceHead: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    officialSourceTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
    officialSourceDomain: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
    officialSourceDescription: { fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: "600" },
    officialSourceChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    officialSourceChip: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    officialSourceChipText: { fontSize: 10, lineHeight: 13, fontWeight: "900" },
    disclaimer: {
      marginTop: 12,
      fontSize: 11,
      lineHeight: 16,
      paddingHorizontal: 4,
    },
  });
}
