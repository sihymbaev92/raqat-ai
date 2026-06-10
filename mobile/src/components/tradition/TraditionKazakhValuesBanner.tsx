import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { raqatLoadingSpinnerOrnament } from "../../theme/ornamentAssets";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";

type Props = {
  palette: TraditionKazakhPalette;
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
};

/** «Ұлттық құндылықтар» стиліндегі промо-баннер. */
export function TraditionKazakhValuesBanner({ palette, title, body, ctaLabel, onPress }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.wrap}>
      <RasterImage
        source={raqatLoadingSpinnerOrnament}
        style={styles.ornament}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body} selectable>
        {body}
      </Text>
      {ctaLabel && onPress ? (
        <Pressable
          oyuBackdrop={false}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaTxt}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor: p.bannerBg,
      borderWidth: 1,
      borderColor: "rgba(212, 184, 74, 0.28)",
      alignItems: "center",
    },
    ornament: {
      width: 44,
      height: 44,
      marginBottom: 8,
      opacity: 0.95,
    },
    title: {
      fontSize: 17,
      fontWeight: "900",
      color: p.bannerText,
      textAlign: "center",
      marginBottom: 8,
    },
    body: {
      fontSize: 13,
      lineHeight: 20,
      color: "rgba(232, 213, 168, 0.92)",
      textAlign: "center",
    },
    cta: {
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: p.gold,
    },
    ctaTxt: {
      fontSize: 13,
      fontWeight: "900",
      color: p.buttonGoldText,
    },
  });
}
