const fs = require("fs");

const screenPath = "d:/opt/raqat-ai/mobile/src/screens/QuranSurahScreen.tsx";
const outPath = "d:/opt/raqat-ai/mobile/src/components/quran/QuranSurahReaderBody.tsx";

const lines = fs.readFileSync(screenPath, "utf8").split(/\r?\n/);
const bodyLines = lines.slice(1199, 1707);
let body = bodyLines.join("\n");

body = body
  .replace(/^  if \(loading && !ayahs\.length\) \{[\s\S]*?^  \}\n\n/m, "")
  .replace(/^  if \(err && !ayahs\.length\) \{[\s\S]*?^  \}\n\n/m, "")
  .replace(/^  const showMushafPerAyahStack = showReaderTranslit \|\| showReaderMeaning;\n\n/m, "")
  .replace(/^  const readerBody = \(\n    <>\n/m, "")
  .replace(/\n    <\/>\n  \);\n?$/m, "");

const header = `import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import { toggleBookmarkSurah } from "../../storage/quranBookmarks";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../../theme/quranComReadingTheme";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { MushafContinuousArabicBlock, type MushafContinuousArabicHandle } from "./MushafContinuousArabicBlock";
import { MushafPagerPageScroll, type MushafPagerPageStyles } from "./MushafPagerPageScroll";
import { MushafBookFooter } from "./MushafBookFooter";
import { TajweedReaderQuickPill } from "./TajweedReaderQuickPill";
import { IlluminatedManuscriptFrame } from "../IlluminatedManuscriptFrame";
import { MushafSurahHeader } from "./MushafSurahHeader";
import { getQuranTranslitOverride } from "../../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import { toEasternArabicIndic } from "../../utils/easternArabicIndic";
import { runAfterInteractions } from "../../utils/uiDefer";
import { mushafBookPagerListProps } from "../../quran/mushafBookPager";
import { setQuranReaderAllowRotation } from "../../storage/quranReaderPrefs";
import type { AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";
import type { ListRenderItem } from "@shopify/flash-list";

type MushafPagerPage = {
  key: string;
  ayahs: CachedAyah[];
  includeHeader: boolean;
  mushafPageNumber: number;
};

export type QuranSurahReaderBodyProps = {
  loading: boolean;
  err: string | null;
  ayahs: CachedAyah[];
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  isDark: boolean;
  mushafLayout: boolean;
  surahNumber: number;
  titleKk: string;
  surahArabicTitleLine: string;
  readerJuzFromAnchor: number;
  mushafFooterHizb: number;
  mushafFooterPage: number;
  visibleMushafPrintPage: number;
  mushafChromeIconColor: string;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  showTajweedColors: boolean;
  showTajweedForDisplay: boolean;
  tajweedLoading: boolean;
  arabicScriptEdition: QuranArabicScriptEditionId;
  bookmarked: boolean;
  setBookmarked: (v: boolean) => void;
  readerAllowRotation: boolean;
  setReaderAllowRotation: (v: boolean) => void;
  onToggleTajweedColors: (next: boolean) => void | Promise<void>;
  handleReaderBack: () => boolean;
  retryLoadSurah: () => void;
  setJuzPickerVisible: (v: boolean) => void;
  setReaderSettingsOpen: (v: boolean) => void;
  setTajweedLegendOpen: (v: boolean) => void;
  mushafAyahAudioActive: boolean;
  playingAyahInSurah: number | null;
  loadingAyahAudio: number | null;
  ayahAudioIsPlaying: boolean;
  playAyahSudais: (ayahInSurah: number) => void | Promise<void>;
  mushafPageMode: boolean;
  mushafScrollMode: boolean;
  horizontalListRef: React.RefObject<React.ComponentRef<typeof GestureHandlerFlatList<MushafPagerPage>> | null>;
  mushafPages: MushafPagerPage[];
  mushafPageWidth: number;
  onHorizontalViewableItemsChanged: (info: {
    viewableItems: Array<{ isViewable?: boolean; index?: number | null }>;
  }) => void;
  viewabilityConfig: { itemVisiblePercentThreshold: number };
  onMushafPagerScrollBeginDrag: () => void;
  onMushafPagerScrollEnd: (e: { nativeEvent: { contentOffset: { x: number } } }) => void;
  mushafPagerExtraData: unknown;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  showMushafBismillahBanner: boolean;
  readingThemeId: QuranReadingThemeId;
  mushafHighlightAyah: number | null | undefined;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  setAyahMenuItem: (item: CachedAyah | null) => void;
  onMushafPagerVerticalReadingAnchor: (ayahInSurah: number) => void;
  scrollTargetAyah: number | null | undefined;
  mushafScrollRef: React.RefObject<ScrollView | null>;
  onMushafScroll: (e: { nativeEvent: { contentOffset: { y: number } } }) => void;
  mushafScrollContentHeightRef: React.MutableRefObject<number>;
  mushafScrollContentRef: React.RefObject<View | null>;
  mushafContinuousRef: React.RefObject<MushafContinuousArabicHandle | null>;
  mushafArabicContentWidth: number;
  onMushafAyahTopMeasured: (ayahInSurah: number, topInContent: number) => void;
  fallbackMushafScrollYForAyah: (ayahInSurah: number) => number;
  mushafAyahAccessibilityLabel: (ayahInSurah: number) => string;
  ayahMeaningLine: (item: CachedAyah) => string;
  listRef: React.RefObject<FlashListRef<CachedAyah> | null>;
  flashListRowType: string;
  onViewableItemsChanged: (info: {
    viewableItems: Array<{ isViewable?: boolean; item?: CachedAyah }>;
  }) => void;
  flashListPlaybackExtra: unknown;
  renderAyahListRow: ListRenderItem<CachedAyah>;
};

export function QuranSurahReaderBody(props: QuranSurahReaderBodyProps) {
  const {
    loading,
    err,
    ayahs,
    styles,
    colors,
    isDark,
    mushafLayout,
    surahNumber,
    titleKk,
    surahArabicTitleLine,
    readerJuzFromAnchor,
    mushafFooterHizb,
    mushafFooterPage,
    visibleMushafPrintPage,
    mushafChromeIconColor,
    showReaderArabic,
    showReaderTranslit,
    showReaderMeaning,
    showTajweedColors,
    showTajweedForDisplay,
    tajweedLoading,
    arabicScriptEdition,
    bookmarked,
    setBookmarked,
    readerAllowRotation,
    setReaderAllowRotation,
    onToggleTajweedColors,
    handleReaderBack,
    retryLoadSurah,
    setJuzPickerVisible,
    setReaderSettingsOpen,
    setTajweedLegendOpen,
    mushafAyahAudioActive,
    playingAyahInSurah,
    loadingAyahAudio,
    ayahAudioIsPlaying,
    playAyahSudais,
    mushafPageMode,
    mushafScrollMode,
    horizontalListRef,
    mushafPages,
    mushafPageWidth,
    onHorizontalViewableItemsChanged,
    viewabilityConfig,
    onMushafPagerScrollBeginDrag,
    onMushafPagerScrollEnd,
    mushafPagerExtraData,
    refreshing,
    onRefresh,
    showMushafBismillahBanner,
    readingThemeId,
    mushafHighlightAyah,
    ayahMarkers,
    setAyahMenuItem,
    onMushafPagerVerticalReadingAnchor,
    scrollTargetAyah,
    mushafScrollRef,
    onMushafScroll,
    mushafScrollContentHeightRef,
    mushafScrollContentRef,
    mushafContinuousRef,
    mushafArabicContentWidth,
    onMushafAyahTopMeasured,
    fallbackMushafScrollYForAyah,
    mushafAyahAccessibilityLabel,
    ayahMeaningLine,
    listRef,
    flashListRowType,
    onViewableItemsChanged,
    flashListPlaybackExtra,
    renderAyahListRow,
  } = props;
  const insets = useSafeAreaInsets();

  if (loading && !ayahs.length) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
        <Text style={styles.muted}>{kk.quran.ayahLoading}</Text>
      </View>
    );
  }

  if (err && !ayahs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
        <View style={styles.errorActions}>
          <Pressable
            onPress={handleReaderBack}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
            style={({ pressed }) => [styles.errorSecondaryBtn, pressed && { opacity: 0.86 }]}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.text} />
            <Text style={styles.errorSecondaryBtnText}>{kk.common.back}</Text>
          </Pressable>
          <Pressable
            onPress={retryLoadSurah}
            accessibilityRole="button"
            accessibilityLabel={kk.common.retry}
            style={({ pressed }) => [styles.errorPrimaryBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.errorPrimaryBtnText}>{kk.common.retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const showMushafPerAyahStack = showReaderTranslit || showReaderMeaning;

  return (
    <>
`;

const footer = `
    </>
  );
}
`;

fs.writeFileSync(outPath, header + body + footer);
console.log("written", fs.readFileSync(outPath, "utf8").split(/\r?\n/).length, "lines");
