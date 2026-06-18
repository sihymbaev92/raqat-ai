import React, { useMemo } from "react";
import { ImageBackground, Platform, StyleSheet, Text, View } from "react-native";
import { useAppLocale } from "../../i18n/runtime";
import { getTalbiyahHeroCopy } from "../../content/talbiyahHeroContent";
import { kk } from "../../i18n/kk";
import { TALBIYAH_HERO_BG } from "../../config/hajjTalbiyahHero";
import { talbiyahArabicTextStyle } from "../../theme/talbiyahArabicTextStyle";

type Props = {
  width: number;
};

function textScale(width: number): number {
  if (width < 350) return 0.86;
  if (width < 430) return 0.94;
  if (Platform.OS === "web") return 1.04;
  return 1;
}

function TitlePill({ children, compact }: { children: React.ReactNode; compact: boolean }) {
  return (
    <View style={[styles.titlePill, compact ? styles.titlePillCompact : null]}>
      <Text style={[compact ? styles.titleTextCompact : styles.titleText]} numberOfLines={1} adjustsFontSizeToFit>
        {children}
      </Text>
    </View>
  );
}

function CreamPanel({
  children,
  compact,
  arabic,
}: {
  children: React.ReactNode;
  compact: boolean;
  arabic?: boolean;
}) {
  return (
    <View style={[styles.panel, compact ? styles.panelCompact : null, arabic ? styles.arabicPanel : null]}>
      {children}
    </View>
  );
}

export function TalbiyahHeroBanner({ width }: Props) {
  const locale = useAppLocale();
  const copy = useMemo(() => getTalbiyahHeroCopy(locale), [locale]);
  const compact = width < 390;
  const scale = textScale(width);

  return (
    <ImageBackground
      source={TALBIYAH_HERO_BG}
      style={[styles.frame, { width }]}
      imageStyle={styles.bgImage}
      resizeMode="cover"
      accessibilityRole="image"
      accessibilityLabel={kk.features.hajjTalbiyahPosterA11y}
    >
      <View pointerEvents="none" style={styles.scrim} />
      <View style={[styles.content, compact ? styles.contentCompact : null]}>
        <TitlePill compact={compact}>{copy.title}</TitlePill>
        <CreamPanel compact={compact} arabic>
          <Text
            style={[
              talbiyahArabicTextStyle(compact),
              styles.arabicText,
              {
                fontSize: Math.round((compact ? 22 : 30) * scale),
                lineHeight: Math.round((compact ? 34 : 45) * scale),
              },
            ]}
            selectable
          >
            {copy.arabic}
          </Text>
        </CreamPanel>

        <TitlePill compact={compact}>{copy.oqylyLabel}</TitlePill>
        <CreamPanel compact={compact}>
          <Text
            style={[
              compact ? styles.translitTextCompact : styles.translitText,
              {
                fontSize: Math.round((compact ? 13 : 15) * scale),
                lineHeight: Math.round((compact ? 17 : 20) * scale),
              },
            ]}
            selectable
          >
            {copy.oqyly}
          </Text>
        </CreamPanel>

        <TitlePill compact={compact}>{copy.magynasyLabel}</TitlePill>
        <CreamPanel compact={compact}>
          <Text
            style={[
              compact ? styles.meaningTextCompact : styles.meaningText,
              {
                fontSize: Math.round((compact ? 11 : 13) * scale),
                lineHeight: Math.round((compact ? 15 : 18) * scale),
              },
            ]}
            selectable
          >
            {copy.magynasy}
          </Text>
        </CreamPanel>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0D4C4C",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.42)",
  },
  bgImage: {
    borderRadius: 18,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 22, 18, 0.38)",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 8,
  },
  contentCompact: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 7,
  },
  titlePill: {
    alignSelf: "center",
    minWidth: "48%",
    maxWidth: "74%",
    minHeight: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#075235",
    borderWidth: 1,
    borderColor: "rgba(245, 212, 137, 0.7)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  titlePillCompact: {
    minHeight: 28,
    paddingHorizontal: 14,
  },
  titleText: {
    color: "#FFF3C4",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: 0.35,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleTextCompact: {
    color: "#FFF3C4",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#D8B276",
    backgroundColor: "rgba(255, 247, 226, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  panelCompact: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  arabicPanel: {
    paddingVertical: 16,
  },
  arabicText: {
    color: "#1C1711",
    textAlign: "center",
    writingDirection: "rtl",
  },
  translitText: {
    color: "#2F2415",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  translitTextCompact: {
    color: "#2F2415",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  meaningText: {
    color: "#3A2A18",
    fontSize: 13.7,
    lineHeight: 17.4,
    fontWeight: "900",
    textAlign: "center",
  },
  meaningTextCompact: {
    color: "#3A2A18",
    fontSize: 11.2,
    lineHeight: 13.8,
    fontWeight: "900",
    textAlign: "center",
  },
});
