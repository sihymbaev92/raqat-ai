import React, { useMemo } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import { KURBAN_AIT_IMAGE_ASPECT } from "../content/kurbanAitBlockContent";
import type { ThemeColors } from "../theme/colors";

type Props = {
  colors: ThemeColors;
  source: ImageSourcePropType;
  infographicA11y: string;
  /** Экран padding-ін жою — сурет толық енмен */
  fullBleed?: boolean;
};

export function KurbanAitInfographicHero({ colors, source, infographicA11y, fullBleed }: Props) {
  const styles = useMemo(() => makeStyles(colors, fullBleed), [colors, fullBleed]);

  return (
    <View style={styles.frame}>
      <View style={styles.imageWrap}>
        <RasterImage
          source={source}
          style={styles.image}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={infographicA11y}
        />
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, fullBleed?: boolean) {
  return StyleSheet.create({
    frame: {
      borderRadius: fullBleed ? 0 : 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
      padding: fullBleed ? 8 : 10,
      marginBottom: 12,
      marginHorizontal: fullBleed ? -14 : 0,
      overflow: "visible",
    },
    imageWrap: {
      direction: "ltr",
      alignSelf: "stretch",
      aspectRatio: KURBAN_AIT_IMAGE_ASPECT,
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: fullBleed ? 0 : 10,
      backgroundColor: colors.card,
    },
  });
}
