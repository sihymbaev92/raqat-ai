import React, { useMemo, useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { useLocaleRevision } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "./GuideAutoTranslateBanner";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../navigation/types";
import { guideThumbFitContain } from "../utils/guideLightboxFit";
import { imageAssetAspectRatio } from "../utils/imageAssetAspect";
import { RasterImage } from "../ui/RasterImage";
import { TalbiyahHeroBanner } from "./hajj/TalbiyahHeroBanner";
import { HajjTourAgenciesPanel } from "./hajj/HajjTourAgenciesPanel";
import { HAJJ_MUFTYAT_PAGES, HAJJ_MUFTYAT_SOURCE } from "../content/hajjMuftyatPages";
import { HAJJ_MUFTYAT_SECTIONS, type HajjMuftyatSection } from "../content/hajjMuftyatCatalog";
import { getHajjMuftyatPageText } from "../content/hajjMuftyatPageText";
import { HAJJ_BOOK_SECTIONS, type TextSection } from "../content/hajjBookContent";
import {
  isHajjMuftyatTextDisplayable,
  sanitizeHajjMuftyatPageText,
} from "../content/hajjMuftyatTextSanitize";
import { HajjMuftyatPageText } from "./HajjMuftyatPageText";

const PAGE_BY_NUM = new Map(HAJJ_MUFTYAT_PAGES.map((p) => [p.page, p]));
const DEFAULT_PAGE_ASPECT = 766 / 1134;
/** Кітап бет реті бойынша (PDF 3→211), «Тәлбия алдымен» емес */
function hajjSectionsInBookOrder(): HajjMuftyatSection[] {
  return [...HAJJ_MUFTYAT_SECTIONS].sort((a, b) => a.startPage - b.startPage);
}

type PageBlockProps = {
  page: number;
  colors: ThemeColors;
  contentWidth: number;
};

type CompactSectionProps = {
  section: HajjMuftyatSection;
  expanded: boolean;
  onToggle: () => void;
  colors: ThemeColors;
  children: React.ReactNode;
};

type HajjJourneyPhaseId = "prep" | "umrah" | "hajj-days" | "ziyarah" | "after";

type HajjJourneyPhaseMeta = {
  id: HajjJourneyPhaseId;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
};

type HajjJourneyPhase = HajjJourneyPhaseMeta & {
  title: string;
  subtitle: string;
};

const HAJJ_JOURNEY_PHASE_META: HajjJourneyPhaseMeta[] = [
  { id: "prep", icon: "fact-check" },
  { id: "umrah", icon: "sync-alt" },
  { id: "hajj-days", icon: "event-note" },
  { id: "ziyarah", icon: "health-and-safety" },
  { id: "after", icon: "verified" },
];

function hajjPhaseCopy(
  id: HajjJourneyPhaseId,
  features: typeof kk.features
): { title: string; subtitle: string } {
  switch (id) {
    case "prep":
      return { title: features.hajjPhasePrepTitle, subtitle: features.hajjPhasePrepSub };
    case "umrah":
      return { title: features.hajjPhaseUmrahTitle, subtitle: features.hajjPhaseUmrahSub };
    case "hajj-days":
      return { title: features.hajjPhaseDaysTitle, subtitle: features.hajjPhaseDaysSub };
    case "ziyarah":
      return { title: features.hajjPhaseZiyarahTitle, subtitle: features.hajjPhaseZiyarahSub };
    case "after":
      return { title: features.hajjPhaseAfterTitle, subtitle: features.hajjPhaseAfterSub };
  }
}

function hajjBookSectionNumber(title: string): number | null {
  const match = title.match(/^(\d+)\./);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function phaseForHajjBookSection(section: TextSection): HajjJourneyPhaseId {
  const n = hajjBookSectionNumber(section.title);
  if (n == null || n <= 8) return "prep";
  if (n <= 14) return "umrah";
  if (n <= 21) return "hajj-days";
  if (n <= 27) return "ziyarah";
  return "after";
}

export function buildHajjJourneyGroups(
  sections: readonly TextSection[] | undefined = HAJJ_BOOK_SECTIONS,
  features: typeof kk.features = kk.features
): Array<HajjJourneyPhase & { sections: TextSection[] }> {
  const safeSections = Array.isArray(sections) ? sections : [];
  return HAJJ_JOURNEY_PHASE_META.map((phase) => {
    const copy = hajjPhaseCopy(phase.id, features);
    return {
      ...phase,
      ...copy,
      sections: safeSections.filter((section) => phaseForHajjBookSection(section) === phase.id),
    };
  }).filter((phase) => phase.sections.length > 0);
}

function CompactHajjSection({ section, expanded, onToggle, colors, children }: CompactSectionProps) {
  const styles = useMemo(() => makeCompactSectionStyles(colors), [colors]);
  const { tr } = useKkAutoTranslator();
  const t = useI18n();
  const pageRange =
    section.startPage === section.endPage ? `${section.startPage}` : `${section.startPage}–${section.endPage}`;
  return (
    <View style={styles.wrap}>
      <Pressable
        oyuBackdrop={false}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${tr(section.title)} — ${expanded ? t.common.guideAccordionCollapse : t.common.guideAccordionExpand}`}
        style={({ pressed }) => [styles.head, expanded && styles.headOpen, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {tr(section.title)}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {pageRange}
          </Text>
        </View>
        <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={20} color={colors.accent} />
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function HajjMuftyatPageBlock({ page, colors, contentWidth }: PageBlockProps) {
  const styles = useMemo(() => makePageStyles(colors), [colors]);
  const pageMeta = getHajjMuftyatPageText(page);
  const pageText = pageMeta?.text ?? "";
  const displayText = sanitizeHajjMuftyatPageText(pageText);
  const showText =
    pageMeta?.readable === true && isHajjMuftyatTextDisplayable(pageText, true) && displayText.length > 0;
  const pageAsset = PAGE_BY_NUM.get(page);
  const aspect = pageAsset ? imageAssetAspectRatio(pageAsset.source) ?? DEFAULT_PAGE_ASPECT : DEFAULT_PAGE_ASPECT;
  const imageLayout = useMemo(
    () =>
      guideThumbFitContain(contentWidth, 520, aspect, { width: 766, height: 1134 }, 2, {
        allowUpscale: true,
        preferWidth: true,
      }),
    [contentWidth, aspect]
  );

  if (showText) {
    return (
      <View style={styles.textBlock}>
        <Text style={styles.pageLabel}>{kk.features.hajjPageLabel(page)}</Text>
        <HajjMuftyatPageText text={displayText} colors={colors} />
      </View>
    );
  }

  if (!pageAsset) return null;

  return (
    <View style={styles.imageBlock}>
      <Text style={styles.pageLabel}>{kk.features.hajjPageLabel(page)}</Text>
      <View style={styles.imageFrame}>
      <RasterImage
        source={pageAsset.source}
        style={{
          width: imageLayout.width,
          height: imageLayout.height,
          alignSelf: "center",
          borderRadius: 8,
        }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={kk.features.hajjOpenPageImageA11y(page)}
      />
      </View>
    </View>
  );
}

function HajjJourneyRoadmap({
  colors,
  tr,
}: {
  colors: ThemeColors;
  tr: (text: string) => string;
}) {
  const t = useI18n();
  const localeRevision = useLocaleRevision();
  const styles = useMemo(() => makeJourneyStyles(colors), [colors]);
  const groups = useMemo(
    () => buildHajjJourneyGroups(HAJJ_BOOK_SECTIONS, t.features),
    // localeRevision: `kk` is mutated in place on language change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localeRevision, t.features]
  );
  const [openPhase, setOpenPhase] = useState<HajjJourneyPhaseId | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <MaterialIcons name="route" size={20} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{t.features.hajjRoadmapTitle}</Text>
          <Text style={styles.lead}>
            {t.features.hajjRoadmapLead}
          </Text>
        </View>
      </View>

      <View style={styles.phaseList}>
        {groups.map((group) => {
          const expanded = openPhase === group.id;
          return (
            <View key={group.id} style={styles.phaseWrap}>
              <Pressable
                oyuBackdrop={false}
                onPress={() => {
                  setOpenSection(null);
                  setOpenPhase((cur) => (cur === group.id ? null : group.id));
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                  accessibilityLabel={`${group.title} — ${expanded ? t.common.guideAccordionCollapse : t.common.guideAccordionExpand}`}
                  style={({ pressed }) => [styles.phaseHead, expanded && styles.phaseHeadOpen, pressed && { opacity: 0.92 }]}
                >
                  <View style={styles.phaseIcon}>
                    <MaterialIcons name={group.icon} size={18} color={expanded ? "#FFFFFF" : colors.accent} />
                  </View>
                  <View style={styles.phaseTextCol}>
                    <Text style={[styles.phaseTitle, expanded && styles.phaseTitleOpen]} numberOfLines={1}>
                      {group.title}
                    </Text>
                    <Text style={[styles.phaseSub, expanded && styles.phaseSubOpen]} numberOfLines={1}>
                      {group.subtitle}
                    </Text>
                  </View>
                <Text style={[styles.phaseCount, expanded && styles.phaseCountOpen]}>{group.sections.length}</Text>
              </Pressable>

              {expanded ? (
                <View style={styles.sectionList}>
                  {group.sections.map((section) => {
                    const sectionOpen = openSection === section.title;
                    return (
                      <View key={section.title} style={styles.sectionCard}>
                        <Pressable
                          oyuBackdrop={false}
                          onPress={() => setOpenSection((cur) => (cur === section.title ? null : section.title))}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: sectionOpen }}
                          accessibilityLabel={`${tr(section.title)} — ${sectionOpen ? t.common.guideAccordionCollapse : t.common.guideAccordionExpand}`}
                          style={({ pressed }) => [styles.sectionHead, pressed && { opacity: 0.92 }]}
                        >
                          <View style={styles.sectionBullet} />
                          <Text style={styles.sectionTitle} numberOfLines={2}>
                            {tr(section.title)}
                          </Text>
                          <MaterialIcons
                            name={sectionOpen ? "expand-less" : "expand-more"}
                            size={20}
                            color={colors.muted}
                          />
                        </Pressable>
                        {sectionOpen ? (
                          <Text style={styles.sectionBody}>
                            {tr(section.body)}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function HajjMuftyatGuide() {
  const { colors } = useAppTheme();
  const { width: winW } = useWindowDimensions();
  const contentWidth = Math.max(280, Math.round((winW - 16) * 0.92));
  const talbiyahWidth = Platform.OS === "web" ? Math.min(contentWidth, 580) : contentWidth;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sections = useMemo(() => hajjSectionsInBookOrder(), []);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [officialBookOpen, setOfficialBookOpen] = useState(false);
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();

  const toggle = (id: string) => setOpen((cur) => ({ ...cur, [id]: !cur[id] }));
  const openKaabaLive = () => {
    navigation.navigate("MakkahLive");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.heroFrame, { width: talbiyahWidth }]}>
        <TalbiyahHeroBanner width={talbiyahWidth} />
      </View>

      <Pressable
        oyuBackdrop={false}
        style={({ pressed }) => [styles.kaabaLiveBtn, pressed && { opacity: 0.92 }]}
        onPress={openKaabaLive}
        accessibilityRole="button"
        accessibilityLabel={t.features.hajjKaabaOnlineA11y}
      >
        <View style={styles.kaabaLiveIcon}>
          <MaterialIcons name="live-tv" size={20} color="#fff" />
        </View>
        <View style={styles.kaabaLiveTextCol}>
          <Text style={styles.kaabaLiveTitle} numberOfLines={1}>{t.features.hajjKaabaOnlineTitle}</Text>
          <Text style={styles.kaabaLiveSub} numberOfLines={1}>{t.features.hajjKaabaOnlineLive}</Text>
        </View>
        <View style={styles.kaabaLiveDot} />
        <Text style={styles.kaabaLiveLiveTxt}>LIVE</Text>
      </Pressable>

      <HajjTourAgenciesPanel colors={colors} tr={tr} />

      <HajjJourneyRoadmap colors={colors} tr={tr} />

      <Text style={styles.sectionLabel}>{t.features.hajjFullDataLabel}</Text>
      <View style={styles.officialBookPanel}>
        <Pressable
          oyuBackdrop={false}
          onPress={() => setOfficialBookOpen((cur) => !cur)}
          accessibilityRole="button"
          accessibilityState={{ expanded: officialBookOpen }}
          accessibilityLabel={`${t.features.hajjOfficialBookTitle} — ${officialBookOpen ? t.common.guideAccordionCollapse : t.common.guideAccordionExpand}`}
          style={({ pressed }) => [styles.officialBookHead, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.officialBookIcon}>
            <MaterialIcons name="menu-book" size={20} color={colors.accent} />
          </View>
          <View style={styles.officialBookText}>
            <Text style={styles.officialBookTitle}>{t.features.hajjOfficialBookTitle}</Text>
            <Text style={styles.officialBookLead} numberOfLines={1}>
              {t.features.hajjFullTextLabel} · {sections.length} {t.features.hajjSectionUnit}
            </Text>
          </View>
          <MaterialIcons
            name={officialBookOpen ? "expand-less" : "expand-more"}
            size={22}
            color={colors.accent}
          />
        </Pressable>
        {officialBookOpen ? (
          <View style={styles.officialBookBody}>
            {sections.map((section) => {
              const pages: number[] = [];
              for (let p = section.startPage; p <= section.endPage; p += 1) pages.push(p);
              return (
                <CompactHajjSection
                  key={section.id}
                  section={section}
                  expanded={!!open[section.id]}
                  onToggle={() => toggle(section.id)}
                  colors={colors}
                >
                  {pages.map((page) => (
                    <HajjMuftyatPageBlock
                      key={`hajj-p-${page}`}
                      page={page}
                      colors={colors}
                      contentWidth={contentWidth}
                    />
                  ))}
                </CompactHajjSection>
              );
            })}
          </View>
        ) : null}
      </View>
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
      <View style={styles.footer}>
        <Text style={styles.compactHint}>
          {t.features.hajjTapSectionHint}
        </Text>
        <Text style={styles.compactHint}>{kk.features.hajjScanCdnHint}</Text>
        <Pressable
          oyuBackdrop={false}
          style={({ pressed }) => [styles.sourceRow, pressed && { opacity: 0.92 }]}
          onPress={() => void Linking.openURL(HAJJ_MUFTYAT_SOURCE.url)}
          accessibilityRole="link"
          accessibilityLabel={kk.features.hajjOpenMuftyatA11y}
        >
          <View style={styles.sourceIcon}>
            <MaterialIcons name="menu-book" size={18} color={colors.accent} />
          </View>
          <View style={styles.sourceTextCol}>
            <Text style={styles.sourceTitle} numberOfLines={1}>
              {HAJJ_MUFTYAT_SOURCE.title}
            </Text>
            <Text style={styles.sourceMeta} numberOfLines={1}>
              {kk.features.hajjSourceMeta(HAJJ_MUFTYAT_SOURCE.org, HAJJ_MUFTYAT_SOURCE.year)}
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={18} color={colors.accent} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 8, paddingBottom: 24 },
    heroFrame: {
      alignSelf: "center",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#0B76C8",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    sectionLabel: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginTop: 2,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    footer: { marginTop: 12, paddingTop: 2 },
    compactHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
    kaabaLiveBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: "#0B3D2E",
      borderWidth: 1,
      borderColor: "#155C43",
    },
    kaabaLiveIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    kaabaLiveTextCol: { flex: 1, minWidth: 0 },
    kaabaLiveTitle: { color: "#fff", fontSize: 15, fontWeight: "900" },
    kaabaLiveSub: { color: "rgba(255,255,255,0.78)", fontSize: 11, marginTop: 2 },
    kaabaLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
    kaabaLiveLiveTxt: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
    officialBookPanel: {
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    officialBookHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.accentSurface,
    },
    officialBookIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    officialBookText: { flex: 1, minWidth: 0 },
    officialBookTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
    officialBookLead: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },
    officialBookBody: {
      padding: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sourceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 0,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    sourceIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    sourceTextCol: { flex: 1, minWidth: 0 },
    sourceTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
    sourceMeta: { fontSize: 10, lineHeight: 14, color: colors.muted, marginTop: 1 },
  });
}

function makeCompactSectionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 7, alignSelf: "stretch" },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingVertical: 9,
      paddingHorizontal: 11,
    },
    headOpen: {
      borderColor: colors.accent,
    },
    textCol: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: "800" },
    sub: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 1 },
    body: {
      marginTop: 6,
      padding: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
  });
}

function makeJourneyStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.accentSurface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    headText: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 16, fontWeight: "900" },
    lead: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
    phaseList: { padding: 10, gap: 8 },
    phaseWrap: { gap: 6 },
    phaseHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    phaseHeadOpen: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    phaseIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    phaseTextCol: { flex: 1, minWidth: 0 },
    phaseTitle: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: "900" },
    phaseTitleOpen: { color: "#FFFFFF" },
    phaseSub: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 1 },
    phaseSubOpen: { color: "rgba(255,255,255,0.82)" },
    phaseCount: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      overflow: "hidden",
      textAlign: "center",
      lineHeight: 26,
      color: colors.accent,
      backgroundColor: colors.accentSurface,
      fontSize: 12,
      fontWeight: "900",
    },
    phaseCountOpen: {
      color: colors.accent,
      backgroundColor: "#FFFFFF",
    },
    sectionList: {
      gap: 7,
      paddingLeft: 8,
    },
    sectionCard: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      overflow: "hidden",
    },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    sectionBullet: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    sectionTitle: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800",
    },
    sectionBody: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "500",
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 2,
    },
  });
}

function makePageStyles(colors: ThemeColors) {
  return StyleSheet.create({
    textBlock: { marginBottom: 8, alignSelf: "stretch" },
    imageBlock: { marginBottom: 8, alignSelf: "stretch" },
    imageFrame: {
      width: "100%",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderRadius: 8,
      overflow: "hidden",
    },
    pageLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    body: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "justify",
    },
  });
}
