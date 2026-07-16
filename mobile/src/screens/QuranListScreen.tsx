import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppLocale, getCurrentLocale } from "../i18n/runtime";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import {
  loadQuranListCache,
  saveQuranListCache,
  parseSurahsFromApiJson,
  parseSurahsFromPlatformIndex,
  offlineBundledSurahList,
  type CachedSurah,
} from "../storage/quranListCache";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { fetchQuranSurahs } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import {
  ensureBundledSurahListLoaded,
  getBundledSurahList,
} from "../services/bundledQuranReader";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { QURAN_JUZ_STARTS, juzForSurahAyah, type QuranJuzStart } from "../data/quranJuzBoundaries";
import {
  mushafStartPageForSurah,
  surahListMetaSubtitle,
  surahListNumberedTitle,
} from "../data/surahListMeta";
import {
  QuranSurahListJuzHeader,
  QuranSurahListRow,
} from "../components/quran/QuranSurahListRow";
import type { ThemeColors } from "../theme/colors";
import { QuranContinueReadingCard } from "../components/quran/QuranContinueReadingCard";
import { HatimAyahWordSearchSheet } from "../components/quran/HatimAyahWordSearchSheet";
import { HatimSurahSearchSheet } from "../components/quran/HatimSurahSearchSheet";
import { useQuranContinueReading } from "../quran/useQuranContinueReading";
import { navigateToHatim } from "../navigation/navigateToMoreStack";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import { beginLatestRequest } from "../utils/latestRequestGuard";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { prefetchQuranAyahSearch } from "../quran/searchQuranAyahs";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "QuranList">;
};

type QuranListRow =
  | { kind: "surah"; surah: CachedSurah }
  | { kind: "juz"; meta: QuranJuzStart }
  | { kind: "juzHeader"; juz: number };

function quranSurahListPalette(colors: ThemeColors, isDark: boolean) {
  return {
    screenBg: isDark ? colors.bg : "#F2F2F7",
  };
}

const SURAH_API = "https://api.alquran.cloud/v1/surah";

export function QuranListScreen({ navigation }: Props) {
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { tr } = useKkAutoTranslator();
  const [list, setList] = useState<CachedSurah[]>(() => offlineBundledSurahList());
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"surah" | "juz">("surah");
  const [surahSearchOpen, setSurahSearchOpen] = useState(false);
  const [wordSearchOpen, setWordSearchOpen] = useState(false);
  const { continueRead, streakDays } = useQuranContinueReading();
  const remoteRequestSeqRef = useRef(0);
  const refreshSeqRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void loadQuranBookFonts().catch(() => {});
      void prefetchQuranAyahSearch(getCurrentLocale());
    }, [])
  );

  const fetchRemote = useCallback(async (): Promise<boolean> => {
    const { isCurrentRequest } = beginLatestRequest(remoteRequestSeqRef);
    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
    if (!isCurrentRequest()) return false;
    if (base) {
      try {
        const data = await fetchQuranSurahs(base, {
          contentSecret: getRaqatContentReadSecret(),
          authorizationBearer: bearer,
        });
        if (!isCurrentRequest()) return false;
        const arr = parseSurahsFromPlatformIndex(data);
        if (arr?.length) {
          setList(arr);
          setErr(null);
          await saveQuranListCache(arr);
          return true;
        }
      } catch (e) {
        if (apiOnly) throw e;
      }
    } else if (apiOnly) {
      throw new Error(kk.quran.apiOnlyRequired);
    }
    if (apiOnly) throw new Error(kk.quran.apiOnlyRequired);
    const r = await fetchWithTimeout(SURAH_API, { timeoutMs: 14_000 });
    const j = await r.json();
    if (!isCurrentRequest()) return false;
    const arr = parseSurahsFromApiJson(j);
    if (!arr?.length) return false;
    setList(arr);
    setErr(null);
    await saveQuranListCache(arr);
    return true;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      let hadCached = false;

      try {
        await ensureBundledSurahListLoaded();
        const bundled = getBundledSurahList();
        if (alive && bundled?.length) {
          hadCached = true;
          setList(bundled);
          setErr(null);
        }
      } catch {
        /* APK asset жоқ — sync stub қалды */
      }

      const cached = await loadQuranListCache();
      if (alive && cached?.list?.length) {
        hadCached = true;
        setList(cached.list);
      }

      /**
       * Кеш толық болса сидингті фонда (UI қатырмай); бос болса — офлайн үшін күту керек.
       * seedBundledQuranCachesIfNeeded ішінде InteractionManager + mutex бар.
       */
      const applySeed = async () => {
        try {
          await seedBundledQuranCachesIfNeeded();
        } catch {
          /* бандл жоқ немесе сақтау сәтсіз */
        }
        if (!alive) return;
        const afterSeed = await loadQuranListCache();
        if (afterSeed?.list?.length) {
          hadCached = true;
          setList(afterSeed.list);
          setErr(null);
        }
      };

      if (hadCached) {
        void applySeed();
      } else {
        await applySeed();
      }
      if (!alive) return;

      try {
        await fetchRemote();
      } catch (e) {
        if (alive && !hadCached && !list.length) {
          const again = await loadQuranListCache();
          if (again?.list?.length) {
            setList(again.list);
            setErr(null);
          } else {
            setErr(e instanceof Error ? e.message : kk.quran.listError);
          }
        }
      }
    })();
    return () => {
      alive = false;
      remoteRequestSeqRef.current += 1;
      refreshSeqRef.current += 1;
    };
  }, [fetchRemote]);

  const onRefresh = useCallback(async () => {
    const refreshSeq = refreshSeqRef.current + 1;
    refreshSeqRef.current = refreshSeq;
    setRefreshing(true);
    try {
      await fetchRemote();
    } catch {
      /* кеш тізімі қалсын */
    } finally {
      if (refreshSeqRef.current === refreshSeq) setRefreshing(false);
    }
  }, [fetchRemote]);

  const listRows = useMemo<QuranListRow[]>(() => {
    if (mode === "juz") return QURAN_JUZ_STARTS.map((meta) => ({ kind: "juz", meta }));
    const rows: QuranListRow[] = [];
    let lastJuz = 0;
    for (const surah of list) {
      const juz = juzForSurahAyah(surah.number, 1);
      if (juz !== lastJuz) {
        rows.push({ kind: "juzHeader", juz });
        lastJuz = juz;
      }
      rows.push({ kind: "surah", surah });
    }
    return rows;
  }, [mode, list]);

  const listPalette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  const styles = makeStyles(colors, listPalette.screenBg);
  const listBottomPad = 40 + Math.max(insets.bottom, 8);
  const openQuranReaderAt = useCallback(
    (surah: number, ayah = 1) => {
      navigation.navigate("QuranSurah", {
        surahNumber: surah,
        initialAyah: ayah,
        mushafLayout: true,
      });
    },
    [navigation]
  );

  const onAyahWordSearchPick = useCallback(
    (surah: number, ayah: number) => {
      openQuranReaderAt(surah, ayah);
    },
    [openQuranReaderAt]
  );

  const surahSearchRows = useMemo(
    () =>
      list.map((s) => ({
        number: s.number,
        name: surahDisplayTitle(s.number, s.englishName),
        ayahCount: s.numberOfAyahs ?? 0,
      })),
    [list]
  );

  const onSurahSearchPick = useCallback(
    (surahNumber: number) => {
      openQuranReaderAt(surahNumber);
    },
    [openQuranReaderAt]
  );

  if (err && !list.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
        <Text style={styles.muted}>{kk.common.error}</Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
      style={styles.root}
      data={listRows}
      keyExtractor={(item) =>
        item.kind === "surah"
          ? `s-${item.surah.number}`
          : item.kind === "juzHeader"
            ? `jh-${item.juz}`
            : `j-${item.meta.juz}`
      }
      contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <View style={styles.modeWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.modeBtn,
                mode === "surah" && styles.modeBtnActive,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setMode("surah")}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "surah" }}
              accessibilityLabel={kk.quran.listModeSurahA11y}
            >
              <Text style={[styles.modeTxt, mode === "surah" && styles.modeTxtActive]}>
                {tr(kk.quran.modeSurah)}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modeBtn,
                mode === "juz" && styles.modeBtnActive,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setMode("juz")}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "juz" }}
              accessibilityLabel={kk.quran.listModeJuzA11y}
            >
              <Text style={[styles.modeTxt, mode === "juz" && styles.modeTxtActive]}>
                {tr(kk.quran.modeJuz)}
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.hatimRow, pressed && { opacity: 0.9 }]}
            onPress={() => navigateToHatim(navigation)}
            accessibilityRole="button"
            accessibilityLabel={kk.features.hatimTitle}
          >
            <View style={[styles.hatimIcon, { backgroundColor: colors.bg }]}>
              <Text style={styles.hatimEmoji}>📗</Text>
            </View>
            <View style={styles.hatimTxtCol}>
              <Text style={styles.hatimTitle}>{tr(kk.features.hatimTitle)}</Text>
              <Text style={styles.hatimSub}>{tr(kk.quran.hatimInQuranHint)}</Text>
            </View>
            <Text style={styles.hatimChev}>›</Text>
          </Pressable>
          {continueRead ? (
            <QuranContinueReadingCard
              colors={colors}
              surahTitle={surahDisplayTitle(
                continueRead.surah,
                list.find((x) => x.number === continueRead.surah)?.englishName ?? ""
              )}
              ayah={continueRead.ayah}
              streakDays={streakDays}
              onPress={() => openQuranReaderAt(continueRead.surah, continueRead.ayah)}
              style={styles.continueRowMargin}
            />
          ) : null}
          <View style={styles.searchActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.wordSearchBtn,
                styles.searchActionBtnSurah,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setSurahSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={tr(kk.hatim.searchBtnA11y)}
            >
              <MaterialIcons name="search" size={18} color={colors.accent} />
              <Text style={styles.wordSearchBtnTextSurah} numberOfLines={1}>
                {tr(kk.hatim.searchQuickAction)}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.wordSearchBtn,
                styles.searchActionBtnTopic,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setWordSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={tr(kk.quran.topicAyahsQuickActionA11y)}
            >
              <MaterialIcons name="menu-book" size={18} color={colors.accent} />
              <Text style={styles.wordSearchBtnText} numberOfLines={2}>
                {tr(kk.quran.topicAyahsQuickAction)}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        if (item.kind === "juzHeader") {
          return (
            <QuranSurahListJuzHeader
              juz={item.juz}
              label={tr(kk.quran.juzSectionHeader(item.juz))}
              colors={colors}
              isDark={isDark}
            />
          );
        }
        if (item.kind === "surah") {
          const s = item.surah;
          const kkTitle = surahDisplayTitle(s.number, s.englishName);
          const ayahCount = s.numberOfAyahs ?? 0;
          return (
            <QuranSurahListRow
              surahNumber={s.number}
              numberedTitle={tr(surahListNumberedTitle(s.number, s.englishName))}
              metaSubtitle={tr(surahListMetaSubtitle(s.number, ayahCount))}
              mushafPage={mushafStartPageForSurah(s.number)}
              onPress={() => openQuranReaderAt(s.number)}
              accessibilityLabel={kk.hatim.openSurahRowA11y(kkTitle)}
              colors={colors}
              isDark={isDark}
            />
          );
        }
        const j = item.meta;
        const surahTitle = surahDisplayTitle(j.startSurah, "");
        return (
          <QuranSurahListRow
            surahNumber={j.startSurah}
            numberedTitle={tr(kk.quran.juzTitle(j.juz))}
            metaSubtitle={tr(kk.quran.juzStartsAtLine(surahTitle, j.startAyah))}
            mushafPage={mushafStartPageForSurah(j.startSurah)}
            onPress={() => openQuranReaderAt(j.startSurah, j.startAyah)}
            accessibilityLabel={`${kk.quran.juzTitle(j.juz)}. ${kk.quran.juzStartsAtLine(surahTitle, j.startAyah)}`}
            colors={colors}
            isDark={isDark}
          />
        );
      }}
    />
    <HatimSurahSearchSheet
      visible={surahSearchOpen}
      colors={colors}
      isDark={isDark}
      rows={surahSearchRows}
      onClose={() => setSurahSearchOpen(false)}
      onPick={onSurahSearchPick}
    />
    <HatimAyahWordSearchSheet
      visible={wordSearchOpen}
      colors={colors}
      isDark={isDark}
      onClose={() => setWordSearchOpen(false)}
      onOpenAyah={onAyahWordSearchPick}
    />
    </>
  );
}

function makeStyles(colors: ThemeColors, screenBg: string) {
  const uiBg = screenBg;
  const uiCard = colors.card;
  const uiBorder = colors.border;
  const uiText = colors.text;
  const uiMuted = colors.muted;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: uiBg },
    pad: { paddingHorizontal: 12, paddingBottom: 40 },
    listHeader: { paddingHorizontal: 2, marginBottom: 6 },
    modeWrap: {
      flexDirection: "row",
      backgroundColor: uiCard,
      borderRadius: 14,
      padding: 4,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: uiBorder,
    },
    modeBtn: {
      flex: 1,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    modeBtnActive: {
      backgroundColor: colors.accentSurface,
    },
    modeTxt: {
      color: uiMuted,
      fontSize: 16,
      fontWeight: "700",
    },
    modeTxtActive: {
      color: uiText,
    },
    continueRowMargin: { marginBottom: 10 },
    hatimRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: uiCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: uiBorder,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      gap: 10,
    },
    hatimIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: uiBorder,
    },
    hatimEmoji: { fontSize: 20 },
    hatimTxtCol: { flex: 1, minWidth: 0 },
    hatimTitle: { color: uiText, fontSize: 16, fontWeight: "700" },
    hatimSub: { color: uiMuted, fontSize: 12, marginTop: 2 },
    hatimChev: { color: uiMuted, fontSize: 22, fontWeight: "200" },
    searchActionsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 8,
      marginBottom: 10,
    },
    searchActionBtnSurah: {
      flexGrow: 0,
      flexShrink: 0,
      marginBottom: 0,
      minHeight: 44,
      maxWidth: "38%",
      paddingHorizontal: 8,
    },
    searchActionBtnTopic: {
      flex: 1,
      marginBottom: 0,
      minHeight: 44,
      paddingHorizontal: 12,
      justifyContent: "flex-start",
    },
    wordSearchBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: uiCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    wordSearchBtnTextSurah: {
      flexShrink: 1,
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800",
      textAlign: "center",
    },
    wordSearchBtnText: {
      flex: 1,
      flexShrink: 1,
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800",
      textAlign: "left",
    },
    center: {
      flex: 1,
      backgroundColor: uiBg,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    err: { color: colors.error, textAlign: "center", marginBottom: 8 },
    muted: { color: uiMuted },
  });
}
