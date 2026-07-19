import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  type LayoutChangeEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { useAppLocale } from "../i18n/runtime";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import { navigateToQuranMushafBook } from "../navigation/navigateToMoreStack";
import { mushafPageForSurahAyah } from "../quran/mushafPageForSurahAyah";
import { surahTitleForLocale } from "../constants/surahTitleKk";
import { juzForSurahAyah } from "../data/quranJuzBoundaries";
import { AYAH_COUNTS_PER_SURAH } from "../data/quranAyahCounts";
import {
  mushafStartPageForSurah,
  surahListMetaSubtitle,
} from "../data/surahListMeta";
import {
  HATIM_SURAH_ROW_H,
  buildHatimListLayouts,
  hatimListIndexForSurah,
  hatimScrollOffsetForIndex,
} from "../hatim/hatimListScroll";
import {
  QuranSurahListCheckbox,
  QuranSurahListJuzHeader,
  QuranSurahListRow,
} from "../components/quran/QuranSurahListRow";
import { QuranNavWheelSheet } from "../components/quran/QuranNavWheelSheet";
import { HatimSurahSearchSheet } from "../components/quran/HatimSurahSearchSheet";
import {
  clampQuranNavCoords,
  coordsFromSurah,
  initialAyahForNavCoords,
  type QuranNavCoords,
} from "../quran/quranNavPickerCoords";
import {
  hatimProgressFraction,
  loadHatimProgress,
  loadHatimResume,
  syncHatimWithServerBidirectional,
  toggleHatimSurah,
  type HatimResume,
} from "../storage/hatimProgress";
import { preloadHatimOfflineAssets, persistHatimBookLockedPrefs } from "../quran/hatimBookPolicy";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Hatim">;
};

type Row = { number: number; name: string; ayahCount: number };

type HatimListRow =
  | { kind: "juzHeader"; juz: number }
  | { kind: "surah"; row: Row };

function quranSurahListPalette(colors: ThemeColors, isDark: boolean) {
  return {
    screenBg: isDark ? colors.bg : "#F2F2F7",
  };
}

export function HatimScreen({ navigation }: Props) {
  const t = useI18n();
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listPalette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(
    () => makeStyles(colors, isDark, listPalette.screenBg),
    [colors, isDark, listPalette.screenBg]
  );
  const [read, setRead] = useState<Set<number>>(new Set());
  const [resume, setResume] = useState<HatimResume | null>(null);
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const surahListRef = useRef<FlatList<HatimListRow>>(null);
  const listHeaderHeightRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void persistHatimBookLockedPrefs();
      void preloadHatimOfflineAssets();
    }, [])
  );

  const reload = useCallback(async (shouldApply: () => boolean = () => true) => {
    const [s, r] = await Promise.all([loadHatimProgress(), loadHatimResume()]);
    if (!shouldApply()) return;
    setRead(s);
    setResume(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        await reload(() => alive);
        try {
          await syncHatimWithServerBidirectional();
        } catch {
          /* офлайн / API — жергілікті прогресс көрсетіледі */
        }
        await reload(() => alive);
      })();
      return () => {
        alive = false;
      };
    }, [reload]),
  );

  const data: Row[] = useMemo(
    () =>
      Array.from({ length: 114 }, (_, i) => {
        const number = i + 1;
        const name = surahTitleForLocale(number, locale, { tr });
        const ayahCount = AYAH_COUNTS_PER_SURAH[number - 1] ?? 0;
        return {
          number,
          name,
          ayahCount,
        };
      }),
    [locale, tr],
  );

  const listRows = useMemo<HatimListRow[]>(() => {
    const rows: HatimListRow[] = [];
    let lastJuz = 0;
    for (const row of data) {
      const juz = juzForSurahAyah(row.number, 1);
      if (juz !== lastJuz) {
        rows.push({ kind: "juzHeader", juz });
        lastJuz = juz;
      }
      rows.push({ kind: "surah", row });
    }
    return rows;
  }, [data]);

  const listLayouts = useMemo(
    () => buildHatimListLayouts(listRows),
    [listRows]
  );

  const scrollToListIndex = useCallback(
    (index: number) => {
      if (index < 0) return;
      const offset = hatimScrollOffsetForIndex(
        listLayouts,
        index,
        listHeaderHeightRef.current
      );
      const run = () => {
        surahListRef.current?.scrollToOffset({ offset, animated: true });
      };
      run();
      if (Platform.OS === "web") {
        requestAnimationFrame(run);
        setTimeout(run, 120);
      } else {
        requestAnimationFrame(run);
      }
    },
    [listLayouts]
  );

  const { read: readCount, total, pct } = hatimProgressFraction(read);
  const readSig = useMemo(() => [...read].sort((a, b) => a - b).join(","), [read]);

  const navPickerInitial = useMemo((): QuranNavCoords => {
    if (resume) return coordsFromSurah(resume.surah);
    for (let n = 1; n <= 114; n += 1) {
      if (!read.has(n)) return coordsFromSurah(n);
    }
    return coordsFromSurah(1);
  }, [resume, read]);

  const scrollHatimToSurah = useCallback(
    (surahNumber: number) => {
      const index = hatimListIndexForSurah(listLayouts, surahNumber, listRows);
      scrollToListIndex(index);
    },
    [listLayouts, listRows, scrollToListIndex]
  );

  const onListHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    listHeaderHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  const openNavSheet = useCallback(() => setNavSheetOpen(true), []);
  const closeNavSheet = useCallback(() => setNavSheetOpen(false), []);
  const openSearchSheet = useCallback(() => setSearchSheetOpen(true), []);
  const closeSearchSheet = useCallback(() => setSearchSheetOpen(false), []);

  const onSearchPickSurah = useCallback(
    (surahNumber: number) => {
      scrollHatimToSurah(surahNumber);
    },
    [scrollHatimToSurah]
  );

  const openMushafBook = useCallback(
    (opts?: { initialPage?: number; focusSurah?: number; focusAyah?: number }) => {
      void preloadHatimOfflineAssets();
      navigateToQuranMushafBook(
        {
          ...(opts?.initialPage != null ? { initialPage: opts.initialPage } : {}),
          ...(opts?.focusSurah != null ? { focusSurah: opts.focusSurah } : {}),
          ...(opts?.focusAyah != null ? { focusAyah: opts.focusAyah } : {}),
          continuousMushaf: true,
        },
        navigation
      );
    },
    [navigation]
  );

  const openMushafAtSurah = useCallback(
    (surahNumber: number, opts?: { initialAyah?: number }) => {
      if (opts?.initialAyah != null) {
        openMushafBook({
          focusSurah: surahNumber,
          focusAyah: opts.initialAyah,
          initialPage: mushafPageForSurahAyah(surahNumber, opts.initialAyah),
        });
        return;
      }
      openMushafBook({
        focusSurah: surahNumber,
        focusAyah: 1,
        initialPage: mushafStartPageForSurah(surahNumber),
      });
    },
    [openMushafBook]
  );

  const onNavApply = useCallback(
    (coords: QuranNavCoords) => {
      closeNavSheet();
      scrollHatimToSurah(coords.surah);
      openMushafBook({
        initialPage: coords.page,
        focusSurah: coords.surah,
        focusAyah: initialAyahForNavCoords(coords),
      });
    },
    [closeNavSheet, scrollHatimToSurah, openMushafBook]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitleAlign: "center",
    });
    return () => {
      navigation.setOptions({
        headerTitleAlign: undefined,
        headerShadowVisible: undefined,
      });
    };
  }, [navigation]);

  const goResume = () => {
    if (!resume) return;
    openMushafAtSurah(resume.surah, { initialAyah: resume.ayah });
  };

  const onToggle = async (n: number) => {
    const next = await toggleHatimSurah(n);
    setRead(next);
  };

  const listBottomPad = 24 + insets.bottom;

  return (
    <View style={styles.screen}>
      <HatimSurahSearchSheet
        visible={searchSheetOpen}
        colors={colors}
        isDark={isDark}
        rows={data}
        onClose={closeSearchSheet}
        onPick={onSearchPickSurah}
      />
      <QuranNavWheelSheet
        visible={navSheetOpen}
        colors={colors}
        isDark={isDark}
        columns="juz-page"
        initial={navPickerInitial}
        autoApplyOnChange={Platform.OS === "web"}
        onClose={closeNavSheet}
        onApply={onNavApply}
      />
      <View
        style={[
          styles.listWrap,
          { paddingBottom: Math.max(6, Math.round(insets.bottom * 0.45)) },
        ]}
      >
        <FlatList
          ref={surahListRef}
          style={styles.listFlex}
          data={listRows}
          keyExtractor={(it) =>
            it.kind === "juzHeader" ? `jh-${it.juz}` : `s-${it.row.number}`
          }
          extraData={readSig}
          getItemLayout={(_, index) => {
            const row = listLayouts[index];
            if (!row) {
              return { length: HATIM_SURAH_ROW_H, offset: 0, index };
            }
            return { length: row.length, offset: row.offset, index };
          }}
          onScrollToIndexFailed={({ index }) => {
            scrollToListIndex(index);
          }}
          contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
          ListHeaderComponent={
            <View style={styles.headerBlock} onLayout={onListHeaderLayout}>
              <View style={styles.hatimProgressRow}>
                <Pressable
                  onPress={goResume}
                  disabled={!resume}
                  style={({ pressed }) => [
                    styles.progressCard,
                    styles.progressCardFlex,
                    resume ? styles.progressCardActive : null,
                    pressed && resume && { opacity: 0.94 },
                  ]}
                  accessibilityRole={resume ? "button" : "none"}
                  accessibilityLabel={
                    resume ? t.hatim.continueReading : undefined
                  }
                >
                  <Text style={styles.progressTitle}>
                    {t.hatim.progressTitle}
                  </Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.round(pct * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressSub}>
                    {t.hatim.progressCount
                      .replace("{read}", String(readCount))
                      .replace("{total}", String(total))}
                  </Text>
                  {resume ? (
                    <>
                      <Text style={styles.resumeLine}>
                        {t.hatim.resumeLine
                          .replace(
                            "{surahTitle}",
                            surahTitleForLocale(resume.surah, locale, { tr })
                          )
                          .replace("{ayah}", String(resume.ayah))}
                      </Text>
                      <Text style={styles.continueCta}>
                        {t.hatim.continueReading} ›
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.tapHint}>{t.hatim.tapAyahHint}</Text>
                  )}
                </Pressable>
                <View style={styles.hatimQuickActionsCol}>
                  <Pressable
                    onPress={() => navigation.navigate("HatimTajweedList")}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t.hatim.tajweedOfflineQuickActionA11y}
                    style={({ pressed }) => [
                      styles.hatimQuickAction,
                      styles.hatimQuickActionTajweed,
                      pressed && styles.hatimQuickActionPressed,
                    ]}
                  >
                    <View style={styles.hatimTajweedIconBadge}>
                      <MaterialIcons name="palette" size={16} color="#0D9488" />
                    </View>
                    <Text style={[styles.hatimQuickActionText, styles.hatimQuickActionTajweedText]}>
                      {t.hatim.tajweedOfflineQuickAction}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={openNavSheet}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t.hatim.juzHeaderBtnA11y}
                    style={({ pressed }) => [
                      styles.hatimQuickAction,
                      styles.hatimQuickActionPrimary,
                      pressed && styles.hatimQuickActionPressed,
                    ]}
                  >
                    <View style={styles.hatimJuzIconBadge}>
                      <MaterialIcons name="auto-stories" size={17} color={colors.accent} />
                    </View>
                    <Text style={styles.hatimQuickActionText}>{t.hatim.juzQuickAction}</Text>
                  </Pressable>
                  <Pressable
                    onPress={openSearchSheet}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t.hatim.searchBtnA11y}
                    style={({ pressed }) => [
                      styles.hatimQuickAction,
                      pressed && styles.hatimQuickActionPressed,
                    ]}
                  >
                    <MaterialIcons name="search" size={19} color={colors.accent} />
                    <Text style={styles.hatimQuickActionText}>{t.hatim.searchQuickAction}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === "juzHeader") {
              return (
                <QuranSurahListJuzHeader
                  juz={item.juz}
                  label={t.quran.juzSectionHeader(item.juz)}
                  colors={colors}
                  isDark={isDark}
                  compact
                />
              );
            }
            const row = item.row;
            const done = read.has(row.number);
            const inProgress =
              !done && resume != null && resume.surah === row.number;
            const title = surahTitleForLocale(row.number, locale, { tr });
            return (
              <QuranSurahListRow
                surahNumber={row.number}
                numberedTitle={`${row.number}. ${title}`}
                metaSubtitle={surahListMetaSubtitle(row.number, row.ayahCount)}
                mushafPage={mushafStartPageForSurah(row.number)}
                inProgress={inProgress}
                onPress={() =>
                  openMushafAtSurah(
                    row.number,
                    inProgress && resume ? { initialAyah: resume.ayah } : undefined
                  )
                }
                accessibilityLabel={t.hatim.openSurahRowA11y(title, {
                  surahNumber: row.number,
                  ayahCount: row.ayahCount,
                })}
                colors={colors}
                isDark={isDark}
                leading={
                  <QuranSurahListCheckbox
                    checked={done}
                    onToggle={() => void onToggle(row.number)}
                    accessibilityLabel={t.hatim.markReadA11y.replace("{title}", title)}
                    colors={colors}
                    isDark={isDark}
                  />
                }
              />
            );
          }}
          initialNumToRender={14}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews={false}
        />
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean, screenBg: string) {
  const ink = colors.text;
  const inkMuted = colors.muted;
  const inkStrong = colors.text;
  const surface = colors.card;
  const surfaceBorder = colors.border;
  const checkBg = isDark ? colors.card : colors.bg;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: screenBg,
    },
    listWrap: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 2,
    },
    listFlex: { flex: 1 },
    pad: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 8 },
    headerBlock: { marginBottom: 0 },
    progressCard: {
      backgroundColor: surface,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: surfaceBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 0,
    },
    progressCardFlex: {
      flex: 1,
      minWidth: 0,
    },
    progressCardActive: {
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    progressTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: inkStrong,
      marginBottom: 7,
    },
    barBg: {
      height: 6,
      borderRadius: 4,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.border,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    progressSub: {
      marginTop: 6,
      fontSize: 12,
      lineHeight: 16,
      color: inkMuted,
    },
    resumeLine: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 16,
      color: ink,
      fontWeight: "600",
    },
    continueCta: {
      marginTop: 5,
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
    },
    tapHint: { marginTop: 8, fontSize: 11, lineHeight: 15, color: inkMuted },
    hatimProgressRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
      marginBottom: 8,
    },
    hatimQuickActionsCol: {
      flexDirection: "column",
      justifyContent: "center",
      gap: 8,
      flexShrink: 0,
    },
    hatimQuickAction: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.82)",
      minWidth: 108,
    },
    hatimQuickActionPrimary: {
      borderColor: colors.accent,
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(5, 150, 105, 0.08)",
    },
    hatimQuickActionTajweed: {
      borderColor: "#0D9488",
      backgroundColor: isDark ? "rgba(13, 148, 136, 0.16)" : "rgba(13, 148, 136, 0.1)",
    },
    hatimQuickActionTajweedText: {
      color: "#0D9488",
    },
    hatimJuzIconBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.16)" : "rgba(5, 150, 105, 0.11)",
    },
    hatimTajweedIconBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(13, 148, 136, 0.2)" : "rgba(13, 148, 136, 0.14)",
    },
    hatimQuickActionPressed: {
      opacity: 0.84,
      transform: [{ scale: 0.98 }],
    },
    hatimQuickActionText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
    },
  });
}
