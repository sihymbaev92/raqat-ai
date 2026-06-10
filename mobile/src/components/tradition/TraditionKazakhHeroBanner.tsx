import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import { kazakhOyuKoshkarBand, traditionTopOrnament } from "../../theme/ornamentAssets";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { BRAND_FONT_FACE } from "../../fonts/brandFont";

type Props = {
  palette: TraditionKazakhPalette;
  title?: string;
  subtitle?: string;
  tagline?: string;
};

/** Қою қоңыр hero + алтын ою — «Дін мен дәстүр» экранының үсті. */
export function TraditionKazakhHeroBanner({ palette, title, subtitle, tagline }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <RasterImage
          source={traditionTopOrnament}
          style={styles.ornament}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <RasterImage
          source={kazakhOyuKoshkarBand}
          style={styles.band}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 12,
    },
    header: {
      borderRadius: 18,
      backgroundColor: p.headerBg,
      paddingTop: 10,
      paddingHorizontal: 14,
      paddingBottom: 10,
      alignItems: "center",
      overflow: "hidden",
    },
    ornament: {
      width: "100%",
      maxWidth: 200,
      height: 36,
      marginBottom: 6,
    },
    title: {
      fontSize: 24,
      fontWeight: "900",
      color: p.headerText,
      textAlign: "center",
      fontFamily: BRAND_FONT_FACE.semibold,
      letterSpacing: 0.3,
    },
    tagline: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      color: p.headerSubtext,
      textAlign: "center",
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      color: p.headerSubtext,
      textAlign: "center",
    },
    band: {
      width: "100%",
      height: 26,
      marginTop: 8,
      opacity: 1,
    },
  });
}
