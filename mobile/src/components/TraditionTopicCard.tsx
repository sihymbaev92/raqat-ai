import React, { useState } from "react";
import { LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import { traditionTopicTeaser } from "../content/traditionTopicTeaser";
import {
  KAZAKH_TRADITION_EID_KURBAN_BLOCK_TITLE,
  KAZAKH_TRADITION_ORAZA_AIT_BLOCK_TITLE,
} from "../content/kazakhTraditionAnchors";
import { KurbanAitTraditionGuide } from "./KurbanAitTraditionGuide";
import { OrazaAitTraditionGuide } from "./OrazaAitTraditionGuide";
import { TraditionAccordion } from "./TraditionAccordion";

export type TraditionTopicBlock = {
  title: string;
  categories: string[];
  summary: string;
  origin: string;
  religionLink: string;
  limits: string;
  practice: string[];
  heroImage?: ImageSourcePropType;
  heroImageFullBleed?: boolean;
  vignettes?: string[];
  closing?: string;
};

type TraditionGuideStrings = {
  expandShow: string;
  expandHide: string;
  deepOriginTitle: string;
  deepReligionTitle: string;
  deepLimitsTitle: string;
  deepPracticeTitle: string;
  deepVignettesTitle: string;
  deepClosingTitle: string;
  favoriteAdd: string;
  favoriteRemove: string;
  pocketSummary: string;
  kurbanInfographicA11y: string;
  kurbanAit: {
    topicSubtitle: string;
    bannerSubtitle: string;
    sectionsTitle: string;
    phrasesTitle: string;
    phrasesHint: string;
    dayPlanTitle: string;
    deepOriginTitle: string;
    deepReligionTitle: string;
    deepLimitsTitle: string;
    deepPracticeTitle: string;
    deepVignettesTitle: string;
    deepClosingTitle: string;
    disclaimer: string;
    officialSnippetsTitle: string;
    officialSnippetsBody: string;
    officialSnippetsLoading: string;
    officialSnippetsEmpty: string;
    officialSnippetsNotConfigured: string;
    officialSnippetsNetwork: string;
    officialSnippetsError: string;
    officialSnippetsCacheNote: string;
    officialSnippetsDisclaimer: string;
    officialSourceOk: (n: number) => string;
    officialSourceNotConfigured: string;
    officialSourceNetwork: string;
    officialSourceEmpty: string;
    officialSourceError: string;
  };
  orazaAit: {
    bannerSubtitle: string;
    sectionsTitle: string;
    phrasesTitle: string;
    phrasesHint: string;
    dayPlanTitle: string;
    deepOriginTitle: string;
    deepReligionTitle: string;
    deepLimitsTitle: string;
    deepPracticeTitle: string;
    deepVignettesTitle: string;
    deepClosingTitle: string;
    disclaimer: string;
    officialSnippetsTitle: string;
    officialSnippetsBody: string;
    officialSnippetsLoading: string;
    officialSnippetsEmpty: string;
    officialSnippetsNotConfigured: string;
    officialSnippetsNetwork: string;
    officialSnippetsError: string;
    officialSnippetsCacheNote: string;
    officialSnippetsDisclaimer: string;
    officialSourceOk: (n: number) => string;
    officialSourceNotConfigured: string;
    officialSourceNetwork: string;
    officialSourceEmpty: string;
    officialSourceError: string;
  };
};

type Props = {
  colors: ThemeColors;
  palette?: TraditionKazakhPalette;
  block: TraditionTopicBlock;
  expanded: boolean;
  onToggle: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  categoryLabel: (cat: string) => string;
  tg: TraditionGuideStrings;
  onLayout?: (y: number) => void;
};

function animate() {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function TraditionTopicCard({
  colors,
  palette,
  block,
  expanded,
  onToggle,
  isFavorite,
  onToggleFavorite,
  categoryLabel,
  tg,
  onLayout,
}: Props) {
  const styles = React.useMemo(() => makeStyles(colors, palette), [colors, palette]);
  const isKurban = block.title === KAZAKH_TRADITION_EID_KURBAN_BLOCK_TITLE;
  const isOraza = block.title === KAZAKH_TRADITION_ORAZA_AIT_BLOCK_TITLE;
  const [subOpen, setSubOpen] = useState<Record<string, boolean>>({
    summary: true,
    origin: false,
    religion: false,
    limits: false,
    practice: false,
    vignettes: false,
    closing: false,
  });

  const toggleSub = (key: string) => {
    animate();
    setSubOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View
      style={[styles.card, expanded && styles.cardOpen]}
      onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}
    >
      <Pressable
        oyuBackdrop={false}
        style={({ pressed }) => [styles.headRow, pressed && { opacity: 0.92 }]}
        onPress={() => {
          animate();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={block.title}
      >
        <View style={styles.headMain}>
          <Text style={styles.title} numberOfLines={expanded ? 4 : 2}>
            {block.title}
          </Text>
          {!expanded ? (
            <Text style={styles.teaser} numberOfLines={2} selectable>
              {traditionTopicTeaser(block.summary)}
            </Text>
          ) : null}
          <View style={styles.tagRow}>
            {block.categories.map((c) => (
              <Text key={`${block.title}-${c}`} style={styles.tagBadge}>
                {categoryLabel(c)}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.headActions}>
          <Pressable
            oyuBackdrop={false}
            style={({ pressed }) => [styles.favoriteBtn, pressed && { opacity: 0.88 }]}
            onPress={onToggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${block.title}: ${isFavorite ? tg.favoriteRemove : tg.favoriteAdd}`}
          >
            <Text style={styles.favoriteBtnTxt}>{isFavorite ? "★" : "☆"}</Text>
          </Pressable>
          <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {isKurban ? (
            <KurbanAitTraditionGuide
              colors={colors}
              block={block}
              tg={tg.kurbanAit}
              showInfographic={false}
              showSectionsInfographic
              infographicA11y={tg.kurbanInfographicA11y}
            />
          ) : isOraza ? (
            <OrazaAitTraditionGuide colors={colors} block={block} tg={tg.orazaAit} />
          ) : (
            <>
              <TraditionAccordion
                colors={colors}
                palette={palette}
                title={tg.pocketSummary}
                subtitle={traditionTopicTeaser(block.summary, 72)}
                expanded={!!subOpen.summary}
                onToggle={() => toggleSub("summary")}
                variant="pocket"
              >
                <Text style={styles.bodyTxt} selectable>
                  {block.summary}
                </Text>
              </TraditionAccordion>

              <TraditionAccordion
                colors={colors}
                palette={palette}
                title={tg.deepOriginTitle}
                expanded={!!subOpen.origin}
                onToggle={() => toggleSub("origin")}
                variant="pocket"
              >
                <Text style={styles.bodyTxt} selectable>
                  {block.origin}
                </Text>
              </TraditionAccordion>

              <TraditionAccordion
                colors={colors}
                palette={palette}
                title={tg.deepReligionTitle}
                expanded={!!subOpen.religion}
                onToggle={() => toggleSub("religion")}
                variant="pocket"
              >
                <Text style={styles.bodyTxt} selectable>
                  {block.religionLink}
                </Text>
              </TraditionAccordion>

              <TraditionAccordion
                colors={colors}
                palette={palette}
                title={tg.deepLimitsTitle}
                expanded={!!subOpen.limits}
                onToggle={() => toggleSub("limits")}
                variant="pocket"
              >
                <Text style={styles.bodyTxt} selectable>
                  {block.limits}
                </Text>
              </TraditionAccordion>

              <TraditionAccordion
                colors={colors}
                palette={palette}
                title={tg.deepPracticeTitle}
                expanded={!!subOpen.practice}
                onToggle={() => toggleSub("practice")}
                variant="pocket"
              >
                {block.practice.map((line) => (
                  <Text key={line.slice(0, 36)} style={styles.bullet} selectable>
                    • {line}
                  </Text>
                ))}
              </TraditionAccordion>

              {block.vignettes && block.vignettes.length > 0 ? (
                <TraditionAccordion
                  colors={colors}
                  title={tg.deepVignettesTitle}
                  expanded={!!subOpen.vignettes}
                  onToggle={() => toggleSub("vignettes")}
                  variant="pocket"
                >
                  {block.vignettes.map((para, vi) => (
                    <Text key={`v-${vi}`} style={styles.vignette} selectable>
                      {para}
                    </Text>
                  ))}
                </TraditionAccordion>
              ) : null}

              {block.closing ? (
                <TraditionAccordion
                  colors={colors}
                  title={tg.deepClosingTitle}
                  expanded={!!subOpen.closing}
                  onToggle={() => toggleSub("closing")}
                  variant="pocket"
                >
                  <Text style={styles.closingTxt} selectable>
                    {block.closing}
                  </Text>
                </TraditionAccordion>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, palette?: TraditionKazakhPalette) {
  const accent = palette?.gold ?? colors.accent;
  const cardBg = palette?.cardBg ?? colors.card;
  const border = palette?.border ?? colors.border;
  const text = palette?.text ?? colors.text;
  const muted = palette?.muted ?? colors.muted;
  const accentSurface = palette?.goldSurface ?? colors.accentSurface;
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 16,
      backgroundColor: cardBg,
      marginBottom: 10,
      overflow: "hidden",
    },
    cardOpen: {
      borderColor: accent,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      padding: 12,
    },
    headMain: { flex: 1, minWidth: 0 },
    headActions: { alignItems: "center", gap: 6 },
    title: {
      color: text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 4,
    },
    teaser: {
      color: muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 6,
    },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tagBadge: {
      color: palette?.goldMuted ?? colors.accent,
      fontSize: 10,
      fontWeight: "800",
      backgroundColor: accentSurface,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    favoriteBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: accentSurface,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    favoriteBtnTxt: { color: accent, fontSize: 16, fontWeight: "900" },
    chevron: {
      color: accent,
      fontSize: 13,
      fontWeight: "900",
    },
    body: { paddingHorizontal: 10, paddingBottom: 10 },
    bodyTxt: { color: text, fontSize: 13, lineHeight: 21 },
    bullet: { color: muted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    vignette: {
      color: text,
      fontSize: 13,
      lineHeight: 21,
      marginBottom: 10,
      paddingLeft: 8,
      borderLeftWidth: 3,
      borderLeftColor: accent,
    },
    closingTxt: {
      color: text,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "600",
    },
  });
}
