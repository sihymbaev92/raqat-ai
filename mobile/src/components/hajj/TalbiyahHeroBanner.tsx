import React, { useMemo } from "react";
import { ImageBackground, Platform, StyleSheet, Text, View } from "react-native";
import { useAppLocale } from "../../i18n/runtime";
import { getTalbiyahHeroCopy } from "../../content/talbiyahHeroContent";
import { kk } from "../../i18n/kk";
import { TALBIYAH_HERO_ASPECT, TALBIYAH_HERO_BG } from "../../config/hajjTalbiyahHero";

type Props = {
  width: number;
};

function TextChip({
  children,
  align = "start",
  compact,
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.textChip,
        compact && styles.textChipCompact,
        align === "end" && styles.textChipEnd,
        align === "center" && styles.textChipCenter,
      ]}
    >
      {children}
    </View>
  );
}

function bannerHeight(width: number): number {
  const aspectH = width / TALBIYAH_HERO_ASPECT;
  return Math.max(230, Math.min(320, aspectH * 1.12));
}

export function TalbiyahHeroBanner({ width }: Props) {
  const locale = useAppLocale();
  const copy = useMemo(() => getTalbiyahHeroCopy(locale), [locale]);
  const compact = width < 520;
  const height = bannerHeight(width);

  const titleStyle = compact ? styles.titleCompact : styles.title;
  const labelStyle = compact ? styles.colLabelCompact : styles.colLabel;
  const oqylyStyle = compact ? styles.oqylyBodyCompact : styles.oqylyBody;
  const arabicStyle = compact ? styles.arabicCompact : styles.arabic;
  const meaningStyle = compact ? styles.meaningBodyCompact : styles.meaningBody;

  return (
    <ImageBackground
      source={TALBIYAH_HERO_BG}
      style={[styles.frame, { width, height }]}
      imageStyle={styles.bgImage}
      resizeMode="cover"
      accessibilityRole="image"
      accessibilityLabel={kk.features.hajjTalbiyahPosterA11y}
    >
      <View style={styles.lightOverlay} pointerEvents="none" />
      <View style={styles.content}>
        <View style={styles.topCenter} pointerEvents="box-none">
          <TextChip align="center" compact={compact}>
            <Text style={titleStyle} accessibilityRole="header">
              {copy.title}
            </Text>
          </TextChip>
          {copy.arabic ? (
            <TextChip align="center" compact={compact}>
              <Text style={arabicStyle} selectable>
                {copy.arabic}
              </Text>
            </TextChip>
          ) : null}
        </View>

        <View style={styles.centerColumn}>
          <TextChip align="center" compact={compact}>
            <Text style={labelStyle}>{copy.oqylyLabel}</Text>
            <Text style={oqylyStyle} selectable>
              {copy.oqyly}
            </Text>
          </TextChip>
          <TextChip align="center" compact={compact}>
            <Text style={labelStyle}>{copy.magynasyLabel}</Text>
            <Text style={meaningStyle} selectable>
              {copy.magynasy}
            </Text>
          </TextChip>
        </View>
      </View>
    </ImageBackground>
  );
}

const textShadow = Platform.select({
  ios: {
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  android: {
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  default: {},
});

const styles = StyleSheet.create({
  frame: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#090806",
  },
  bgImage: {
    borderRadius: 16,
  },
  lightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,244,220,0.22)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
  },
  centerColumn: {
    maxWidth: "92%",
    alignItems: "center",
    alignSelf: "center",
    gap: 2,
  },
  topCenter: {
    alignSelf: "stretch",
    alignItems: "center",
    width: "100%",
    gap: 2,
    marginTop: -3,
    marginBottom: 3,
  },
  textChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.44)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    maxWidth: "100%",
  },
  textChipCompact: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  textChipEnd: {
    alignSelf: "flex-end",
  },
  textChipCenter: {
    alignSelf: "center",
    maxWidth: "96%",
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.24,
    lineHeight: 17,
    textAlign: "center",
    textTransform: "uppercase",
    ...textShadow,
  },
  titleCompact: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.18,
    lineHeight: 15,
    textAlign: "center",
    textTransform: "uppercase",
    ...textShadow,
  },
  colLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    ...textShadow,
  },
  colLabelCompact: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 2,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    ...textShadow,
  },
  oqylyBody: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    ...textShadow,
  },
  oqylyBodyCompact: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    textAlign: "center",
    ...textShadow,
  },
  arabic: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    writingDirection: "rtl",
    fontWeight: "600",
    ...textShadow,
  },
  arabicCompact: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    writingDirection: "rtl",
    fontWeight: "600",
    ...textShadow,
  },
  meaningBody: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    ...textShadow,
  },
  meaningBodyCompact: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    textAlign: "center",
    ...textShadow,
  },
});
