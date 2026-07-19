import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { useI18n } from "../../i18n/useI18n";
import type { ThemeColors } from "../../theme/colors";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import { toggleBookmarkSurah } from "../../storage/quranBookmarks";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../../theme/quranComReadingTheme";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { MushafContinuousArabicBlock, type MushafContinuousArabicHandle } from "./MushafContinuousArabicBlock";
import { MushafPagerPageScroll, type MushafPagerPageStyles } from "./MushafPagerPageScroll";
import { MushafBookFooter } from "./MushafBookFooter";
import { IlluminatedManuscriptFrame } from "../IlluminatedManuscriptFrame";
import { MushafSurahHeader } from "./MushafSurahHeader";
import { getQuranTranslitOverride } from "../../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import { useQuranTranslitScript } from "../../quran/quranTranslitScript";
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
  showTajweedForDisplay: boolean;
  tajweedNoticeText?: string | null;
  arabicScriptEdition: QuranArabicScriptEditionId;
  bookmarked: boolean;
  setBookmarked: (v: boolean) => void;
  readerAllowRotation: boolean;
  setReaderAllowRotation: (v: boolean) => void;
  handleReaderBack: () => boolean;
  retryLoadSurah: () => void;
  setJuzPickerVisible: (v: boolean) => void;
  setReaderSettingsOpen: (v: boolean) => void;
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
  onMushafPagerScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
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
  onMushafScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  mushafScrollContentHeightRef: React.MutableRefObject<number>;
  mushafScrollContentRef: React.RefObject<View | null>;
  mushafContinuousRef: React.RefObject<MushafContinuousArabicHandle | null>;
  mushafArabicContentWidth: number;
  onMushafAyahTopMeasured: (ayahInSurah: number, topInContent: number) => void;
  fallbackMushafScrollYForAyah: (ayahInSurah: number) => number | undefined;
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
    showTajweedForDisplay,
    tajweedNoticeText,
    arabicScriptEdition,
    bookmarked,
    setBookmarked,
    readerAllowRotation,
    setReaderAllowRotation,
    handleReaderBack,
    retryLoadSurah,
    setJuzPickerVisible,
    setReaderSettingsOpen,
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
  const t = useI18n();
  const translitScript = useQuranTranslitScript();
  const insets = useSafeAreaInsets();

  if (loading && !ayahs.length) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
        <Text style={styles.muted}>{t.quran.ayahLoading}</Text>
      </View>
    );
  }

  if (err && !ayahs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
        <View style={styles.errorActions}>
          <Pressable
            onPress={retryLoadSurah}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
            style={({ pressed }) => [styles.errorPrimaryBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.errorPrimaryBtnText}>{t.common.retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const showMushafPerAyahStack = showReaderTranslit || showReaderMeaning;

  return (
    <>
      <View style={[styles.topBar, mushafLayout && styles.mushafTopBar, { paddingTop: 2, paddingRight: 0 }]}>
        <View style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]} />
        <View style={[styles.topBarMid, mushafLayout && styles.mushafTopBarMid]}>
          {mushafLayout ? (
            <View style={styles.mushafTopHeaderRow}>
              <View style={styles.mushafTopLeft}>
                <Text style={styles.mushafTopJuzLeft} numberOfLines={1}>
                  {t.quran.readerHeaderJuzHizb(readerJuzFromAnchor, mushafFooterHizb)}
                </Text>
              </View>
              <View style={styles.mushafTopRight}>
                <Text style={styles.mushafTopSurahLatinRight} numberOfLines={1}>
                  {titleKk}
                </Text>
                <Text style={styles.mushafTopSurahArRight} numberOfLines={1}>
                  {surahArabicTitleLine?.replace(/^سُورَةُ\s/u, "").trim() || surahArabicTitleLine}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.topBarSurahLatin} numberOfLines={1}>
                {t.quran.readerHeaderTitle(titleKk)}
              </Text>
              <View style={styles.topBarJuzCluster}>
                <Text style={styles.topBarJuzPart} numberOfLines={1}>
                  {t.quran.readerJuzPart(readerJuzFromAnchor)}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.topBarJuzPickerBtn, pressed && { opacity: 0.88 }]}
                  onPress={() => setJuzPickerVisible(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t.quran.juzPickerListBtnA11y}
                >
                  <MaterialIcons name="view-list" size={20} color={colors.accent} />
                </Pressable>
              </View>
            </>
          )}
        </View>
        <View style={[styles.topBarRight, { paddingRight: Math.max(insets.right, 4) }]}>
          {mushafLayout ? (
            <Pressable
              style={[styles.topBarBtn, styles.mushafTopBarBtn]}
              onPress={async () => {
                const next = await toggleBookmarkSurah(surahNumber);
                setBookmarked(next);
              }}
              accessibilityRole="button"
              accessibilityLabel={bookmarked ? t.quran.bookmarkRemove : t.quran.bookmarkAdd}
            >
              <MaterialIcons
                name={bookmarked ? "bookmark" : "bookmark-border"}
                size={22}
                color={mushafChromeIconColor}
              />
            </Pressable>
          ) : null}
          {!mushafLayout ? (
            Platform.OS !== "web" ? (
              <Pressable
                style={styles.topBarBtn}
                onPress={async () => {
                  const v = !readerAllowRotation;
                  setReaderAllowRotation(v);
                  await setQuranReaderAllowRotation(v);
                  await new Promise<void>((resolve) => {
                    runAfterInteractions(() => resolve());
                  });
                  try {
                    if (v) {
                      await ScreenOrientation.unlockAsync();
                    } else {
                      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                      if (Platform.OS === "android") {
                        await new Promise<void>((r) => setTimeout(r, 40));
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                      }
                    }
                  } catch {
                    /* ignore */
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={t.quran.readerAllowRotationTopA11y}
                accessibilityState={{ selected: readerAllowRotation }}
              >
                <MaterialIcons
                  name={readerAllowRotation ? "screen-rotation" : "screen-lock-portrait"}
                  size={22}
                  color={colors.accent}
                />
              </Pressable>
            ) : (
              <Pressable
                style={styles.topBarBtn}
                onPress={async () => {
                  const next = await toggleBookmarkSurah(surahNumber);
                  setBookmarked(next);
                }}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? t.quran.bookmarkRemove : t.quran.bookmarkAdd}
              >
                <Text style={styles.topBarStar}>{bookmarked ? "★" : "☆"}</Text>
              </Pressable>
            )
          ) : null}
          <Pressable
            style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
            onPress={() => setReaderSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t.quran.readerSettingsA11y}
          >
            <MaterialIcons
              name="more-horiz"
              size={22}
              color={mushafChromeIconColor}
            />
          </Pressable>
        </View>
      </View>
      {tajweedNoticeText ? (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(13,148,136,0.18)" : "rgba(13,148,136,0.1)",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? "rgba(13,148,136,0.35)" : "rgba(13,148,136,0.28)",
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>{tajweedNoticeText}</Text>
        </View>
      ) : null}
      {mushafLayout && mushafAyahAudioActive ? (
        <Pressable
          style={({ pressed }) => [
            styles.mushafAyahAudioLoadingBar,
            pressed && playingAyahInSurah != null && loadingAyahAudio == null && { opacity: 0.9 },
          ]}
          onPress={() => {
            if (playingAyahInSurah != null && loadingAyahAudio == null) {
              void playAyahSudais(playingAyahInSurah);
            }
          }}
          disabled={loadingAyahAudio != null}
          accessibilityRole="button"
          accessibilityLabel={
            loadingAyahAudio != null
              ? t.quran.mushafAyahAudioLoadingLine(loadingAyahAudio)
              : ayahAudioIsPlaying
                ? t.quran.ayahPauseSudaisA11y(playingAyahInSurah ?? 0)
                : t.quran.ayahResumeSudaisA11y(playingAyahInSurah ?? 0)
          }
        >
          {loadingAyahAudio != null ? (
            <>
              <RaqatOrnamentSpinner size={22} />
              <Text style={styles.mushafAyahAudioLoadingTxt} numberOfLines={1}>
                {t.quran.mushafAyahAudioLoadingLine(loadingAyahAudio)}
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons
                name={ayahAudioIsPlaying ? "pause" : "play-arrow"}
                size={22}
                color={colors.accent}
              />
              <Text style={styles.mushafAyahAudioLoadingTxt} numberOfLines={1}>
                {ayahAudioIsPlaying
                  ? t.quran.mushafAyahAudioPlayingLine(playingAyahInSurah ?? 0)
                  : t.quran.mushafAyahAudioPausedLine(playingAyahInSurah ?? 0)}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
      {mushafPageMode ? (
        <View style={styles.mushafPagerHost}>
          <GestureHandlerFlatList
            ref={horizontalListRef}
            data={mushafPages}
            keyExtractor={(p) => p.key}
            {...mushafBookPagerListProps}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
            updateCellsBatchingPeriod={80}
            removeClippedSubviews={Platform.OS === "android"}
            getItemLayout={(_, index) => ({
              length: mushafPageWidth,
              offset: mushafPageWidth * index,
              index,
            })}
            onViewableItemsChanged={onHorizontalViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollBeginDrag={onMushafPagerScrollBeginDrag}
            onMomentumScrollEnd={onMushafPagerScrollEnd}
            onScrollEndDrag={Platform.OS === "web" ? onMushafPagerScrollEnd : undefined}
            extraData={mushafPagerExtraData}
            onScrollToIndexFailed={(info) => {
              const off = Math.max(0, info.index * mushafPageWidth);
              setTimeout(() => {
                horizontalListRef.current?.scrollToOffset({ offset: off, animated: true });
              }, 350);
            }}
            scrollEventThrottle={16}
            style={[
              styles.mushafBookFlatList,
              { width: mushafPageWidth, alignSelf: "center" },
            ]}
            renderItem={({ item: page }) => (
              <View style={[styles.mushafPagerPageShell, { width: mushafPageWidth }]}>
                <IlluminatedManuscriptFrame
                  isDark={isDark}
                  readingThemeId={readingThemeId}
                  style={{ flex: 1, width: mushafPageWidth }}
                  innerStyle={{ flex: 1, minHeight: 0 }}
                >
                  <MushafPagerPageScroll
                  page={page}
                  pagerWidth={mushafPageWidth}
                  paddingBottom={12 + insets.bottom}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  accentColor={colors.accent}
                  colors={colors}
                  mushafLayout={mushafLayout}
                  bookPageLayout
                  surahNumber={surahNumber}
                  surahArabicTitleLine={surahArabicTitleLine}
                  showMushafBismillahBanner={showMushafBismillahBanner}
                  styles={styles as unknown as MushafPagerPageStyles}
                  showReaderArabic={showReaderArabic}
                  showReaderTranslit={showReaderTranslit}
                  showReaderMeaning={showReaderMeaning}
                  showTajweedColors={showTajweedForDisplay}
                  arabicScriptEdition={arabicScriptEdition}
                  readingThemeId={readingThemeId}
                  isDark={isDark}
                  playingAyahInSurah={playingAyahInSurah}
                  ayahAudioIsPlaying={ayahAudioIsPlaying}
                  loadingAyahAudio={loadingAyahAudio}
                  resumeHighlightAyah={mushafHighlightAyah ?? null}
                  ayahMarkers={ayahMarkers}
                  toEasternArabicIndic={toEasternArabicIndic}
                  accessibilityLabelForAyah={mushafAyahAccessibilityLabel}
                  onPressArabic={(ayahInSurah) => void playAyahSudais(ayahInSurah)}
                  onLongPressAyah={(it) => setAyahMenuItem(it)}
                  onVerticalReadingAnchor={onMushafPagerVerticalReadingAnchor}
                  readingTargetAyah={typeof scrollTargetAyah === "number" ? scrollTargetAyah : null}
                />
                </IlluminatedManuscriptFrame>
              </View>
            )}
          />
          {mushafLayout && ayahs.length ? (
            <MushafBookFooter
              page={mushafPageMode ? visibleMushafPrintPage : mushafFooterPage}
              pageA11y={t.quran.mushafFooterPageA11y}
              colors={colors}
              isDark={isDark}
              bookMushaf
              hizb={mushafFooterHizb}
              readingThemeId={readingThemeId}
            />
          ) : null}
        </View>
      ) : mushafScrollMode ? (
        <ScrollView
          ref={mushafScrollRef}
          onScroll={onMushafScroll}
          scrollEventThrottle={120}
          onContentSizeChange={(_w, h) => {
            mushafScrollContentHeightRef.current = h;
          }}
          style={styles.mushafBookFlatList}
          contentContainerStyle={StyleSheet.flatten([
            styles.pad,
            styles.mushafListPad,
            { paddingBottom: 20 + insets.bottom },
          ])}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <IlluminatedManuscriptFrame isDark={isDark} readingThemeId={readingThemeId} innerStyle={{ alignSelf: "stretch" }}>
            <View ref={mushafScrollContentRef} collapsable={false}>
            <MushafSurahHeader
              colors={colors}
              mushafLayout={mushafLayout}
              bookPageLayout={mushafLayout}
              surahArabicTitleLine={surahArabicTitleLine}
              showMushafBismillahBanner={showMushafBismillahBanner}
              styles={{
                mushafSurahTitleBlock: styles.mushafSurahTitleBlock,
                mushafSurahTitlePaper: styles.mushafSurahTitlePaper,
                mushafSurahTitleAr: styles.mushafSurahTitleAr,
                mushafAyahTxt: styles.mushafAyahTxt,
                bismillahBanner: styles.bismillahBanner,
                mushafBismillahBanner: styles.mushafBismillahBanner,
                bismillahBannerTxt: styles.bismillahBannerTxt,
                mushafBismillahBannerTxt: styles.mushafBismillahBannerTxt,
              }}
            />
            {showMushafPerAyahStack ? (
              ayahs.map((item) => {
                const ayahN = item.numberInSurah;
                const arabicPlain = displayCachedAyahArabic(item, arabicScriptEdition);
                const showArBlock =
                  showReaderArabic &&
                  (showTajweedForDisplay && (item.textTajweed ?? "").includes("[") ? true : Boolean(arabicPlain));
                const kkLine = ayahMeaningLine(item);
                const kirilRead =
                  getQuranTranslitOverride(surahNumber, ayahN) ??
                  resolveQuranTranslitForDisplay(item.translit, arabicPlain, translitScript);
                const isLoad = loadingAyahAudio === ayahN;
                const hasLoaded = playingAyahInSurah === ayahN;
                return (
                  <View
                    key={`mushaf-stack-${surahNumber}:${ayahN}`}
                    style={styles.mushafSecondaryAyahBlock}
                    collapsable={false}
                    onLayout={(e) => onMushafAyahTopMeasured(ayahN, e.nativeEvent.layout.y)}
                  >
                    <Text style={styles.mushafSecondaryAyahRibbon}>{toEasternArabicIndic(ayahN)}</Text>
                    {showArBlock ? (
                      <Pressable
                        oyuBackdrop={false}
                        onPress={() => void playAyahSudais(ayahN)}
                        onLongPress={() => setAyahMenuItem(item)}
                        disabled={isLoad}
                        accessibilityRole="button"
                        accessibilityState={{ busy: isLoad }}
                        accessibilityLabel={mushafAyahAccessibilityLabel(ayahN)}
                        style={({ pressed }) => [pressed && { opacity: 0.82 }]}
                      >
                        <AyahArabicKaraokeText
                          plainText={arabicPlain}
                          taggedText={showTajweedForDisplay ? item.textTajweed : undefined}
                          showTajweedColors={showTajweedForDisplay}
                          isDark={isDark}
                          baseStyle={styles.mushafAyahTxt}
                          audioFocus={hasLoaded}
                          audioLoading={isLoad}
                        />
                      </Pressable>
                    ) : null}
                    {showReaderTranslit && kirilRead ? (
                      <>
                        <Text style={styles.mushafAyahSectionCaption}>{t.quran.translitCaption}</Text>
                        <Text style={styles.mushafAyahKiril}>{kirilRead}</Text>
                      </>
                    ) : null}
                    {showReaderMeaning && kkLine ? (
                      <>
                        <Text style={styles.mushafAyahSectionCaption}>{t.quran.meaningKk}</Text>
                        <Text style={styles.mushafAyahKk}>{kkLine}</Text>
                      </>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <MushafContinuousArabicBlock
                ref={mushafContinuousRef}
                ayahs={ayahs}
                surahNumber={surahNumber}
                arabicScriptEdition={arabicScriptEdition}
                showReaderArabic={showReaderArabic}
                showTajweedColors={showTajweedForDisplay}
                isDark={isDark}
                playingAyahInSurah={playingAyahInSurah}
                ayahAudioIsPlaying={ayahAudioIsPlaying}
                loadingAyahAudio={loadingAyahAudio}
                resumeHighlightAyah={mushafHighlightAyah ?? null}
                ayahMarkers={ayahMarkers}
                mushafAyahTxt={styles.mushafAyahTxt}
                contentWidth={mushafArabicContentWidth}
                toEasternArabicIndic={toEasternArabicIndic}
                scrollViewRef={mushafScrollRef}
                scrollContentRef={mushafScrollContentRef}
                onAyahTopMeasured={onMushafAyahTopMeasured}
                fallbackScrollYForAyah={fallbackMushafScrollYForAyah}
                accessibilityLabelForAyah={mushafAyahAccessibilityLabel}
                onPressArabic={(ayahInSurah) => void playAyahSudais(ayahInSurah)}
                onLongPressAyah={(it) => setAyahMenuItem(it)}
              />
            )}
            {mushafLayout && ayahs.length ? (
              <MushafBookFooter
                page={mushafFooterPage}
                pageA11y={t.quran.mushafFooterPageA11y}
                colors={colors}
                isDark={isDark}
                bookMushaf
                hizb={mushafFooterHizb}
                readingThemeId={readingThemeId}
              />
            ) : null}
            </View>
          </IlluminatedManuscriptFrame>
        </ScrollView>
      ) : (
        <FlashList
        ref={listRef}
        data={ayahs}
        getItemType={() => flashListRowType}
        drawDistance={480}
        keyExtractor={(a) => String(a.numberInSurah)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={flashListPlaybackExtra}
        ListHeaderComponent={
          <MushafSurahHeader
            colors={colors}
            mushafLayout={mushafLayout}
            bookPageLayout={mushafLayout}
            surahArabicTitleLine={surahArabicTitleLine}
            showMushafBismillahBanner={showMushafBismillahBanner}
            styles={{
              mushafSurahTitleBlock: styles.mushafSurahTitleBlock,
              mushafSurahTitlePaper: styles.mushafSurahTitlePaper,
              mushafSurahTitleAr: styles.mushafSurahTitleAr,
              mushafAyahTxt: styles.mushafAyahTxt,
              bismillahBanner: styles.bismillahBanner,
              mushafBismillahBanner: styles.mushafBismillahBanner,
              bismillahBannerTxt: styles.bismillahBannerTxt,
              mushafBismillahBannerTxt: styles.mushafBismillahBannerTxt,
            }}
          />
        }
        ListFooterComponent={
          mushafLayout && ayahs.length ? (
            <MushafBookFooter
              page={mushafFooterPage}
              pageA11y={t.quran.mushafFooterPageA11y}
              colors={colors}
              isDark={isDark}
              bookMushaf
              hizb={mushafFooterHizb}
              readingThemeId={readingThemeId}
            />
          ) : null
        }
        contentContainerStyle={StyleSheet.flatten([styles.pad, { paddingBottom: 40 + insets.bottom }])}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator
        renderItem={renderAyahListRow}
      />
      )}
    </>
  );
}
