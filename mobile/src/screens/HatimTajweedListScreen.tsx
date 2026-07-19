import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { useI18n } from "../i18n/useI18n";
import type { MoreStackParamList } from "../navigation/types";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { surahTitleForLocale } from "../constants/surahTitleKk";
import {
  ensureQuranTajweedAssetLoaded,
  getQuranTajweedSurahs,
  type QuranTajweedSurah,
} from "../services/quranTajweedAsset";
import { TAJWEED_RULES_CATALOG } from "../content/tajweedRulesCatalog";

const CREAM_BG = "#FDFBF7";
const CREAM_BAR = "#F5F2EB";
const INK = "#3E2723";
const MUTED = "#8D6E63";
const TEAL = "#0D9488";

type Props = NativeStackScreenProps<MoreStackParamList, "HatimTajweedList">;

/**
 * Flutter `QuranSurahListScreen` — 114 сүре, офлайн тәжуид seed (`quran-tajweed-offline.json`).
 */
export function HatimTajweedListScreen({ navigation }: Props) {
  const locale = useAppLocale();
  const t = useI18n();
  const { tr } = useKkAutoTranslator();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surahs, setSurahs] = useState<QuranTajweedSurah[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await ensureQuranTajweedAssetLoaded();
        if (!alive) return;
        setSurahs(getQuranTajweedSurahs());
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t.common.error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t.common.error]);

  const openSurah = useCallback(
    (surah: QuranTajweedSurah) => {
      const localized = surahTitleForLocale(surah.number, locale, {
        tr,
        englishName: surah.englishName,
        arabicName: surah.name,
      });
      navigation.navigate("HatimTajweedSurah", {
        surahNumber: surah.number,
        englishName: localized || surah.englishName,
        arabicName: surah.name,
      });
    },
    [locale, navigation, tr]
  );

  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => setLegendOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t.hatim.tajweedColorsExplainA11y}
          style={({ pressed }) => [styles.explainBtn, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.explainIconBadge}>
            <MaterialIcons name="palette" size={18} color={TEAL} />
          </View>
          <Text style={styles.explainBtnTxt} numberOfLines={2}>
            {t.hatim.tajweedColorsExplainBtn}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={TEAL} />
        </Pressable>
      </View>

      <Modal
        visible={legendOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLegendOpen(false)}
      >
        <View style={styles.legendBackdrop}>
          <Pressable style={styles.legendDismiss} onPress={() => setLegendOpen(false)} />
          <View style={[styles.legendCard, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <Text style={styles.legendTitle}>{t.quran.tajweedLegendTitle}</Text>
            <Text style={styles.legendIntro}>{t.quran.tajweedLegendIntro}</Text>
            <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
              {TAJWEED_RULES_CATALOG.map((meta) => (
                <View key={meta.rule} style={styles.legendLine}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: isDark ? meta.colorDark : meta.colorLight },
                    ]}
                  />
                  <View style={styles.legendTxtCol}>
                    <Text style={styles.legendRuleTitle}>
                      {tr(meta.labelKk)}{" "}
                      <Text style={styles.legendTag}>{meta.tagOpen}</Text>
                    </Text>
                    <Text style={styles.legendTxtMultiline}>{tr(meta.detailKk)}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.legendFoot}>{t.quran.tajweedSourceNote}</Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.legendGuideBtn, pressed && { opacity: 0.9 }]}
              onPress={() => {
                setLegendOpen(false);
                navigation.navigate("TajweedGuide");
              }}
              accessibilityRole="button"
              accessibilityLabel={t.quran.tajweedOpenGuideA11y}
            >
              <MaterialIcons name="menu-book" size={22} color={TEAL} />
              <Text style={styles.legendGuideTxt}>{t.quran.tajweedOpenGuide}</Text>
              <MaterialIcons name="chevron-right" size={22} color={MUTED} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.legendCloseBtn, pressed && { opacity: 0.88 }]}
              onPress={() => setLegendOpen(false)}
            >
              <Text style={styles.legendCloseTxt}>{t.quran.tajweedLegendClose}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={INK} size="large" />
          <Text style={styles.hint}>{t.common.loading}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={surahs}
          keyExtractor={(item) => `tajweed-surah-${item.number}`}
          extraData={locale}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => {
            const title = surahTitleForLocale(item.number, locale, {
              tr,
              englishName: item.englishName,
              arabicName: item.name,
            });
            const ayahCount = (item.ayahs ?? []).length;
            const subtitle = `${ayahCount} ${tr(t.quran.ayahs)}`;
            const displayTitle =
              locale === "ar" ? item.name ?? "" : title || item.englishName || String(item.number);
            return (
              <Pressable
                onPress={() => openSurah(item)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
                accessibilityRole="button"
                accessibilityLabel={`${displayTitle}, ${subtitle}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{item.number}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {displayTitle}
                  </Text>
                  <Text style={styles.cardSub}>{subtitle}</Text>
                </View>
                {locale !== "ar" ? (
                  <Text style={styles.cardArabic} numberOfLines={1}>
                    {item.name ?? ""}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(isDark: boolean) {
  const bg = isDark ? "#111" : CREAM_BG;
  const bar = isDark ? "#1a1a1a" : CREAM_BAR;
  const card = isDark ? "#1c1c1e" : "#fff";
  const ink = isDark ? "#F5F2EB" : INK;
  const muted = isDark ? "rgba(245,242,235,0.65)" : MUTED;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },
    headerBar: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: bar,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(62,39,35,0.1)",
    },
    explainBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: TEAL,
      backgroundColor: isDark ? "rgba(13, 148, 136, 0.18)" : "rgba(13, 148, 136, 0.1)",
    },
    explainIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(13, 148, 136, 0.28)" : "rgba(13, 148, 136, 0.16)",
    },
    explainBtnTxt: {
      flex: 1,
      color: TEAL,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
    },
    legendBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    legendDismiss: { ...StyleSheet.absoluteFillObject },
    legendCard: {
      maxHeight: "88%",
      backgroundColor: card,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    legendTitle: { color: ink, fontSize: 18, fontWeight: "900" },
    legendIntro: { color: muted, fontSize: 13, lineHeight: 18 },
    legendScroll: { maxHeight: 420 },
    legendLine: { flexDirection: "row", gap: 10, paddingVertical: 8 },
    legendDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
    legendTxtCol: { flex: 1, minWidth: 0 },
    legendRuleTitle: { color: ink, fontWeight: "800", fontSize: 14 },
    legendTag: { color: muted, fontWeight: "600", fontSize: 12 },
    legendTxtMultiline: { color: muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
    legendFoot: { color: muted, fontSize: 11, lineHeight: 15, marginTop: 8, marginBottom: 4 },
    legendGuideBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    legendGuideTxt: { flex: 1, color: TEAL, fontWeight: "800", fontSize: 14 },
    legendCloseBtn: {
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(62,39,35,0.06)",
    },
    legendCloseTxt: { color: ink, fontWeight: "800", fontSize: 15 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    hint: { color: muted, fontSize: 14 },
    error: { color: "#c62828", textAlign: "center", lineHeight: 22 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      elevation: 1,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: bar,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTxt: { color: ink, fontWeight: "800" },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { color: ink, fontWeight: "800", fontSize: 15 },
    cardSub: { color: muted, fontSize: 12, marginTop: 2 },
    cardArabic: { color: muted, fontSize: 18, fontWeight: "500", maxWidth: 120, textAlign: "right" },
  });
}
