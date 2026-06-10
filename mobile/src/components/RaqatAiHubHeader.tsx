import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";
import { menuIconAssets } from "../theme/menuIconAssets";
import { HubScreenHero } from "./HubScreenHero";
import { IMAM_AI_TAGLINE_KK } from "../i18n/kk";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
};

/** RAQAT AI экранының жоғарғы бөлімі — тек hero (логотип, тақырып, тегтер). */
export function RaqatAiHubHeader({ colors, isDark }: Props) {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <View style={styles.wrap}>
      <HubScreenHero
        variant="ai"
        title={kk.features.raqatAiTitle}
        image={menuIconAssets.promoAi}
        colors={colors}
        isDark={isDark}
        eyebrow={IMAM_AI_TAGLINE_KK}
        eyebrowUppercase={false}
        compact
      />
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    wrap: {
      paddingBottom: 4,
    },
  });
}
