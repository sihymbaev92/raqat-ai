import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, TextInput } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale, type AppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import { HADITH_TRUSTED_SOURCES } from "../content/hadithTrustedSources";
import {
  extractedHadithSourceLabel,
  getExtractedHadithMuftyatBundle,
  type ExtractedHadithMuftyatItem,
} from "../content/extractedHadithMuftyat";
import { menuIconAssets } from "../theme/menuIconAssets";
import { RasterImage } from "@/ui/RasterImage";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithHub">;

const DEFAULT_HADITH_LIMIT = 10;
const FILTERED_HADITH_LIMIT = 60;
const HADITH_CATEGORIES = [
  { id: "all", label: "Таңдаулы", keywords: [] },
  { id: "namaz", label: "Намаз", keywords: ["намаз", "әмин", "имам", "мешіт", "дәрет", "азан"] },
  { id: "oraza", label: "Ораза", keywords: ["ораза", "рамазан", "ауыз", "ифтар", "сәресі"] },
  { id: "neke", label: "Неке", keywords: ["неке", "отбасы", "әйел", "ер", "талақ"] },
  { id: "sauda", label: "Сауда", keywords: ["сауда", "мал", "ақша", "қарыз", "пайда", "авторлық"] },
  { id: "adep", label: "Әдеп", keywords: ["әдеп", "мінез", "жақсылық", "аманат", "көрші"] },
  { id: "aqida", label: "Ақида", keywords: ["иман", "тәкфир", "күпір", "серік", "ақида"] },
  { id: "quran", label: "Құран", keywords: ["құран", "аят", "сүре", "тәпсір"] },
] as const;

type HadithCategoryId = (typeof HADITH_CATEGORIES)[number]["id"];

const HADITH_CATEGORY_LABELS: Record<HadithCategoryId, Partial<Record<AppLocale, string>> & { kk: string }> = {
  all: { kk: "Таңдаулы", ru: "Избранное", en: "Featured", ky: "Тандалган", uz: "Tanlangan", tr: "Seçili", ar: "مختارة" },
  namaz: { kk: "Намаз", ru: "Намаз", en: "Prayer", ky: "Намаз", uz: "Namoz", tr: "Namaz", ar: "الصلاة" },
  oraza: { kk: "Ораза", ru: "Пост", en: "Fasting", ky: "Орозо", uz: "Ro'za", tr: "Oruç", ar: "الصوم" },
  neke: { kk: "Неке", ru: "Брак", en: "Marriage", ky: "Нике", uz: "Nikoh", tr: "Nikah", ar: "النكاح" },
  sauda: { kk: "Сауда", ru: "Торговля", en: "Trade", ky: "Соода", uz: "Savdo", tr: "Ticaret", ar: "التجارة" },
  adep: { kk: "Әдеп", ru: "Нравы", en: "Manners", ky: "Адеп", uz: "Odob", tr: "Edep", ar: "الآداب" },
  aqida: { kk: "Ақида", ru: "Акыда", en: "Aqidah", ky: "Акида", uz: "Aqida", tr: "Akaid", ar: "العقيدة" },
  quran: { kk: "Құран", ru: "Коран", en: "Quran", ky: "Куран", uz: "Qur'on", tr: "Kur'an", ar: "القرآن" },
};

function hadithCategoryLabel(id: HadithCategoryId, locale: AppLocale): string {
  return HADITH_CATEGORY_LABELS[id]?.[locale] ?? HADITH_CATEGORY_LABELS[id]?.kk ?? id;
}

function hadithBlob(item: ExtractedHadithMuftyatItem): string {
  return `${item.title}\n${item.text}\n${item.narrator}\n${item.collectionHint}\n${item.sourceTitle ?? ""}`.toLowerCase();
}

export function HadithHubScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const hadithLocale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const bundle = useMemo(() => getExtractedHadithMuftyatBundle(), []);
  const hadithItems = bundle.items;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HadithCategoryId>("all");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const filteredHadithItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const category = HADITH_CATEGORIES.find((item) => item.id === activeCategory);
    return hadithItems.filter((item) => {
      const blob = hadithBlob(item);
      const categoryOk =
        !category || category.id === "all" || category.keywords.some((keyword) => blob.includes(keyword));
      const queryOk = !q || blob.includes(q);
      return categoryOk && queryOk;
    });
  }, [activeCategory, hadithItems, query]);

  const visibleLimit =
    query.trim().length > 0 || activeCategory !== "all" ? FILTERED_HADITH_LIMIT : DEFAULT_HADITH_LIMIT;
  const visibleHadithItems = filteredHadithItems.slice(0, visibleLimit);
  const hiddenCount = Math.max(0, filteredHadithItems.length - visibleHadithItems.length);

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroRow}>
        <RasterImage source={menuIconAssets.heroHadith} style={styles.heroImg} resizeMode="contain" />
        <View style={styles.heroText}>
          <Text style={styles.h1}>{tr(kk.hadith.hub.screenTitle)}</Text>
          <Text style={styles.lead}>{tr(kk.hadith.hub.leadUnified)}</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={tr("Хадис іздеу...")}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable oyuBackdrop={false} onPress={() => setQuery("")} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContent}
        style={styles.categoryScroller}
      >
        {HADITH_CATEGORIES.map((category) => {
          const active = category.id === activeCategory;
          return (
            <Pressable
              key={category.id}
              oyuBackdrop={false}
              onPress={() => setActiveCategory(category.id)}
              style={({ pressed }) => [
                styles.categoryChip,
                active && styles.categoryChipActive,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {hadithCategoryLabel(category.id, hadithLocale)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>
          {activeCategory === "all" && !query.trim() ? tr("Таңдаулы хадистер") : tr("Нәтижелер")}
        </Text>
        <Text style={styles.listCount}>
          {filteredHadithItems.length} {tr("хадис")}
        </Text>
      </View>

      <View style={styles.inlineHadithList}>
        {visibleHadithItems.map((item, index) => {
          const buttonTitle = item.title;
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("ScrapedHadithMuftyatDetail", { id: item.id })}
              style={({ pressed }) => [styles.inlineHadithRow, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={buttonTitle}
            >
              <View style={styles.inlineHadithTop}>
                <Text style={styles.inlineHadithBadge}>{extractedHadithSourceLabel(item.sourceSite)}</Text>
                <Text style={styles.inlineHadithNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.inlineHadithTitle}>{buttonTitle}</Text>
              {item.collectionHint ? <Text style={styles.inlineHadithMeta}>{item.collectionHint}</Text> : null}
              <View style={styles.inlineHadithAction}>
                <Text style={styles.inlineHadithActionText}>{tr("Хадисті ашу")}</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </Pressable>
          );
        })}
        {!visibleHadithItems.length ? <Text style={styles.emptyText}>{tr("Бұл тақырыпта хадис табылмады")}</Text> : null}
        {hiddenCount > 0 ? (
          <Text style={styles.hiddenNotice}>
            {tr("Тағы")} {hiddenCount} {tr("хадис бар. Нақтырақ табу үшін іздеу немесе категория қолданыңыз.")}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => setSourcesOpen((v) => !v)}
        style={({ pressed }) => [styles.sourcesToggle, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: sourcesOpen }}
        accessibilityLabel={tr(kk.hadith.hub.sourcesToggleA11y)}
      >
        <Text style={styles.sourcesToggleTxt}>{tr(kk.hadith.hub.sourcesTitle)}</Text>
        <MaterialIcons
          name={sourcesOpen ? "expand-less" : "expand-more"}
          size={24}
          color={colors.muted}
        />
      </Pressable>
      {sourcesOpen ? (
        <>
          <Text style={styles.sectionHint}>{tr(kk.hadith.hub.sourcesHint)}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHead]}>
              <Text style={[styles.cell, styles.cellSource, styles.headTxt]}>{tr(kk.hadith.hub.colSource)}</Text>
              <Text style={[styles.cell, styles.cellRel, styles.headTxt]}>{tr(kk.hadith.hub.colReliability)}</Text>
              <Text style={[styles.cell, styles.cellUse, styles.headTxt]}>{tr(kk.hadith.hub.colUsage)}</Text>
            </View>
            {HADITH_TRUSTED_SOURCES.map((src) => (
              <Pressable
                key={src.id}
                onPress={() => openUrl(src.homeUrl)}
                style={({ pressed }) => [styles.tableRow, styles.tableBodyRow, pressed && { opacity: 0.9 }]}
                accessibilityRole="link"
                accessibilityLabel={tr(kk.hadith.hub.openSourceA11y(src.nameKk))}
              >
                <View style={[styles.cell, styles.cellSource, styles.sourceCell]}>
                  <Text style={styles.sourceName}>{src.nameKk}</Text>
                  <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
                </View>
                <Text style={[styles.cell, styles.cellRel, styles.bodyTxt]}>
                  {tr(kk.hadith.hub[src.reliabilityKey])}
                </Text>
                <Text style={[styles.cell, styles.cellUse, styles.bodyTxt]}>{tr(kk.hadith.hub[src.usageKey])}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  void isDark;
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 16, paddingBottom: 32 },
    heroRow: { flexDirection: "row", gap: 12, marginBottom: 16, alignItems: "center" },
    heroImg: { width: 56, height: 56 },
    heroText: { flex: 1, minWidth: 0 },
    h1: { fontSize: 22, fontWeight: "800", color: text, marginBottom: 6 },
    lead: { fontSize: 14, lineHeight: 21, color: muted },
    sectionHint: { fontSize: 12, color: muted, marginBottom: 10, lineHeight: 17 },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: 0,
      backgroundColor: pageBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    searchInput: { flex: 1, minWidth: 0, color: text, fontSize: 14, paddingVertical: 0 },
    categoryScroller: { marginHorizontal: -16, marginBottom: 12 },
    categoryContent: { paddingHorizontal: 16, gap: 8 },
    categoryChip: {
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: 999,
      backgroundColor: pageBg,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    categoryChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    categoryChipText: { color: text, fontSize: 13, fontWeight: "800" },
    categoryChipTextActive: { color: "#FFFFFF" },
    listHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    listTitle: { color: text, fontSize: 16, fontWeight: "900" },
    listCount: { color: muted, fontSize: 12, fontWeight: "800" },
    inlineHadithList: {
      gap: 10,
      marginBottom: 18,
    },
    inlineHadithRow: {
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: 0,
      backgroundColor: pageBg,
      padding: 0,
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    inlineHadithTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 7,
    },
    inlineHadithBadge: {
      fontSize: 10,
      fontWeight: "900",
      color: muted,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 0,
      overflow: "hidden",
    },
    inlineHadithNumber: { fontSize: 11, fontWeight: "800", color: muted },
    inlineHadithTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800", color: text, marginBottom: 5 },
    inlineHadithMeta: { fontSize: 12, lineHeight: 17, color: muted, marginBottom: 2 },
    inlineHadithAction: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 10,
      borderRadius: 0,
      backgroundColor: "transparent",
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    inlineHadithActionText: { color: muted, fontSize: 12, fontWeight: "900" },
    emptyText: { color: muted, textAlign: "center", marginVertical: 16 },
    hiddenNotice: {
      color: muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingHorizontal: 12,
      marginTop: 4,
    },
    sourcesToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      marginBottom: 4,
    },
    sourcesToggleTxt: { fontSize: 15, fontWeight: "800", color: text },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    tableRow: { flexDirection: "row", alignItems: "flex-start" },
    tableHead: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.accentSurface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tableBodyRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    cell: { paddingVertical: 10, paddingHorizontal: 8 },
    cellSource: { flex: 1.1, minWidth: 0 },
    cellRel: { flex: 0.85, minWidth: 0 },
    cellUse: { flex: 1.4, minWidth: 0 },
    headTxt: { fontSize: 11, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
    bodyTxt: { fontSize: 12, lineHeight: 17, color: colors.text },
    sourceCell: { flexDirection: "row", alignItems: "center", gap: 4 },
    sourceName: { fontSize: 13, fontWeight: "800", color: colors.accent, flexShrink: 1 },
  });
}
