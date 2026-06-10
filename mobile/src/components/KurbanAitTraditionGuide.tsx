import React from "react";
import { StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { KurbanAitInfographicHero } from "./KurbanAitInfographicHero";
import { KazakhOrnamentTitleBanner } from "./KazakhOrnamentTitleBanner";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "./GuideAutoTranslateBanner";
import type { ThemeColors } from "../theme/colors";
import { KURBAN_AIT_GUIDE_INFOGRAPHIC } from "../content/kurbanAitBlockContent";
import {
  KURBAN_AIT_DAY_PLAN,
  KURBAN_AIT_GUIDE_EPIGRAPH,
  KURBAN_AIT_GUIDE_SECTIONS,
  KURBAN_AIT_KAZAKH_PHRASES,
} from "../content/kurbanAitGuideContent";

type BlockSlice = {
  title: string;
  origin: string;
  religionLink: string;
  limits: string;
  practice: string[];
  heroImage?: ImageSourcePropType;
  vignettes?: string[];
  closing?: string;
};

type KurbanAitStrings = {
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
};

type Props = {
  colors: ThemeColors;
  block: BlockSlice;
  tg: KurbanAitStrings;
  /** Жеке экранда сурет жоғарыда — қайталамау */
  showInfographic?: boolean;
  /** «Мереке жоспары» инфографикасы (жеке экранда жоғарыда болса — false) */
  showSectionsInfographic?: boolean;
  infographicA11y?: string;
  /** Тақырып баннері экран деңгейінде болса — қайталамау */
  hideTitleBanner?: boolean;
  /** Басты беттен тақырыпқа скролл — бөлімнің Y координаты (ата-ана View ішінде) */
  onSectionLayout?: (sectionId: string, y: number) => void;
};

export function KurbanAitTraditionGuide({
  colors,
  block,
  tg,
  showInfographic = true,
  showSectionsInfographic = true,
  infographicA11y,
  hideTitleBanner = false,
  onSectionLayout,
}: Props) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();

  const titleBanner = !hideTitleBanner ? (
    <KazakhOrnamentTitleBanner
      colors={colors}
      title={tr(block.title)}
      subtitle={tr(tg.topicSubtitle)}
      tone="traditionDeep"
    />
  ) : null;

  return (
    <View style={styles.root}>
      {titleBanner}
      {showInfographic && block.heroImage && infographicA11y ? (
        <KurbanAitInfographicHero
          colors={colors}
          source={block.heroImage}
          infographicA11y={infographicA11y}
        />
      ) : null}

      <Text style={styles.epigraph} selectable>
        {tr(KURBAN_AIT_GUIDE_EPIGRAPH)}
      </Text>

      <Text style={styles.sectionHeading} accessibilityRole="header">
        {tr(tg.sectionsTitle)}
      </Text>
      {showSectionsInfographic && infographicA11y ? (
        <KurbanAitInfographicHero
          colors={colors}
          source={KURBAN_AIT_GUIDE_INFOGRAPHIC}
          infographicA11y={infographicA11y}
        />
      ) : null}
      {KURBAN_AIT_GUIDE_SECTIONS.map((sec) => (
        <View
          key={sec.id}
          style={styles.sectionCard}
          onLayout={(e) => onSectionLayout?.(sec.id, e.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {tr(sec.title)}
          </Text>
          {sec.lead ? <Text style={styles.sectionLead} selectable>{tr(sec.lead)}</Text> : null}
          {sec.bullets.map((line) => (
            <View key={`${sec.id}-${line.slice(0, 24)}`} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>❖</Text>
              <Text style={styles.bulletTxt} selectable>
                {tr(line)}
              </Text>
            </View>
          ))}
        </View>
      ))}

      <View
        style={styles.phrasesCard}
        onLayout={(e) => onSectionLayout?.("phrases", e.nativeEvent.layout.y)}
      >
        <Text style={styles.phrasesTitle} accessibilityRole="header">
          {tr(tg.phrasesTitle)}
        </Text>
        <Text style={styles.phrasesHint} selectable>
          {tr(tg.phrasesHint)}
        </Text>
        {KURBAN_AIT_KAZAKH_PHRASES.map((p) => (
          <View key={p.phrase} style={styles.phraseRow}>
            <Text style={styles.phraseText} selectable>
              «{p.phrase}»
            </Text>
            <Text style={styles.phraseMeaning} selectable>
              {tr(p.meaning)}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={styles.dayPlanCard}
        onLayout={(e) => onSectionLayout?.("dayplan", e.nativeEvent.layout.y)}
      >
        <Text style={styles.dayPlanTitle} accessibilityRole="header">
          {tr(tg.dayPlanTitle)}
        </Text>
        {KURBAN_AIT_DAY_PLAN.map((day) => (
          <View key={day.label} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{tr(day.label)}</Text>
            {day.items.map((item) => (
              <Text key={`${day.label}-${item.slice(0, 20)}`} style={styles.dayItem} selectable>
                • {tr(item)}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.deepBox}>
        <Text style={styles.deepTitle} accessibilityRole="header">
          {tr(tg.deepOriginTitle)}
        </Text>
        <Text style={styles.deepTxt} selectable>
          {tr(block.origin)}
        </Text>

        {block.vignettes && block.vignettes.length > 0 ? (
          <>
            <Text style={styles.deepTitle} accessibilityRole="header">
              {tr(tg.deepVignettesTitle)}
            </Text>
            {block.vignettes.map((para, vi) => (
              <Text key={`v-${vi}`} style={styles.vignette} selectable>
                {tr(para)}
              </Text>
            ))}
          </>
        ) : null}

        <Text style={styles.deepTitle} accessibilityRole="header">
          {tr(tg.deepReligionTitle)}
        </Text>
        <Text style={styles.deepTxt} selectable>
          {tr(block.religionLink)}
        </Text>

        <Text style={styles.deepTitle} accessibilityRole="header">
          {tr(tg.deepLimitsTitle)}
        </Text>
        <Text style={styles.deepTxt} selectable>
          {tr(block.limits)}
        </Text>

        <Text style={styles.deepTitle} accessibilityRole="header">
          {tr(tg.deepPracticeTitle)}
        </Text>
        {block.practice.map((line) => (
          <Text key={line.slice(0, 40)} style={styles.practiceLine} selectable>
            • {tr(line)}
          </Text>
        ))}

        {block.closing ? (
          <>
            <Text style={styles.deepTitle} accessibilityRole="header">
              {tr(tg.deepClosingTitle)}
            </Text>
            <Text style={styles.closingTxt} selectable>
              {tr(block.closing)}
            </Text>
          </>
        ) : null}
      </View>

      <Text style={styles.disclaimer} selectable>
        {tr(tg.disclaimer)}
      </Text>
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { marginTop: 4 },
    epigraph: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
      fontWeight: "600",
      fontStyle: "italic",
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    sectionHeading: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 10,
    },
    sectionCard: {
      backgroundColor: colors.accentSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    sectionLead: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 8,
      fontWeight: "600",
    },
    bulletRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
    bulletMark: { color: colors.accent, fontSize: 12, lineHeight: 20, width: 14 },
    bulletTxt: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
    phrasesCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    phrasesTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 4,
    },
    phrasesHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 10,
    },
    phraseRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
      marginTop: 4,
    },
    phraseText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 4,
    },
    phraseMeaning: { color: colors.muted, fontSize: 13, lineHeight: 20 },
    dayPlanCard: {
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    dayPlanTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 10,
    },
    dayBlock: { marginBottom: 10 },
    dayLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 4,
    },
    dayItem: { color: colors.text, fontSize: 13, lineHeight: 20, marginBottom: 3 },
    deepBox: {
      backgroundColor: colors.accentSurface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 8,
    },
    deepTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 6,
      marginBottom: 6,
    },
    deepTxt: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    vignette: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 22,
      marginBottom: 12,
      paddingLeft: 10,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    practiceLine: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    closingTxt: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "600",
      marginBottom: 6,
    },
    disclaimer: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      fontStyle: "italic",
      marginTop: 4,
    },
  });
}
