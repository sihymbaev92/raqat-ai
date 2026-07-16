import React, { useMemo, useState } from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { WebView } from "react-native-webview";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../../theme/colors";
import type { MushafBookPageSlice, MushafAyahRef } from "../../quran/mushafBookTypes";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";
import type { AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import type { CachedAyah } from "../../storage/quranSurahCache";
import type { MushafAyahMapFile } from "../../quran/mushafAyahMap";
import {
  fallbackMushafAyahHotspots,
  getMushafAyahMapHotspots,
} from "../../quran/mushafAyahMap";
import { mushafPageAspectRatio } from "../../config/mushafPagesBase";
import {
  MUSHAF_BOOK_PAGE_EDGE_INSET,
  computeQcomHatimPageBox,
} from "../../quran/mushafBookPageLayout";
import { HATIM_PAGE_HORIZONTAL_SAFE_INSET } from "../../quran/quranResponsiveLayout";
import { mushafRasterActiveImageUri } from "../../quran/mushafRasterActiveImage";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import { mushafHotspotActive } from "./mushafBookPageHotspots";
import { MushafBookPageSecondaryAyahs } from "./MushafBookPageSecondaryAyahs";
import {
  SECURE_MUSHAF_SVG_ORIGIN_WHITELIST,
} from "../webviewAndroidSecurity";

export type MushafBookPageRasterProps = {
  page: MushafBookPageSlice;
  pagerWidth: number;
  viewportHeight?: number;
  paddingBottom: number;
  readingThemeId?: QuranReadingThemeId;
  colors: ThemeColors;
  styles: MushafBookPageStyles;
  imageUri: string | null;
  /** SVG on native — WebView; webp/png/svg on web — RasterImage. */
  format: "webp" | "svg" | "png";
  ayahMap: MushafAyahMapFile | null;
  showReaderMeaning: boolean;
  showReaderTranslit: boolean;
  playingRef: MushafAyahRef | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: MushafAyahRef | null;
  resumeHighlight: MushafAyahRef | null;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  isActive?: boolean;
  onPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onLongPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onToggleAudio: (ref: MushafAyahRef, item: CachedAyah) => void;
  onLoadFailed?: () => void;
};

function findAyahItem(page: MushafBookPageSlice, surah: number, ayah: number): CachedAyah | null {
  const row = page.ayahs.find((a) => a.surahNumber === surah && a.numberInSurah === ayah);
  return row ?? null;
}

/** Hafs 604 raster/SVG — бір баспа беті экранға толық (contain, скролл жоқ). */
export function MushafBookPageRaster({
  page,
  pagerWidth,
  viewportHeight,
  paddingBottom,
  readingThemeId,
  colors,
  styles: st,
  imageUri,
  format,
  ayahMap,
  showReaderMeaning,
  showReaderTranslit,
  playingRef,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  resumeHighlight,
  isActive = true,
  onPressAyah,
  onLongPressAyah,
  onToggleAudio,
  onLoadFailed,
}: MushafBookPageRasterProps) {
  const [imageErr, setImageErr] = useState(false);
  const markFailed = () => {
    setImageErr(true);
    onLoadFailed?.();
  };
  const theme = resolveQuranReadingTheme(readingThemeId);
  const fullPage = theme.minimalPageChrome;
  const fitOneScreen = fullPage && viewportHeight != null && viewportHeight > 0;
  const landscapeFill =
    fitOneScreen && viewportHeight != null && viewportHeight > 0 && pagerWidth > viewportHeight;

  const qcomHatimBox = useMemo(() => {
    if (!fitOneScreen) return null;
    return computeQcomHatimPageBox(pagerWidth, viewportHeight, paddingBottom, {
      horizontalSafeInset: HATIM_PAGE_HORIZONTAL_SAFE_INSET,
    });
  }, [fitOneScreen, pagerWidth, viewportHeight, paddingBottom]);

  const { pageWidth, pageHeight } = useMemo(() => {
    if (fitOneScreen && qcomHatimBox) {
      if (landscapeFill) {
        return {
          pageWidth: Math.max(
            qcomHatimBox.pageWidth,
            Math.max(1, pagerWidth - HATIM_PAGE_HORIZONTAL_SAFE_INSET * 2)
          ),
          pageHeight: qcomHatimBox.pageHeight,
        };
      }
      return { pageWidth: qcomHatimBox.pageWidth, pageHeight: qcomHatimBox.pageHeight };
    }
    return {
      pageWidth: pagerWidth,
      pageHeight: pagerWidth / mushafPageAspectRatio(),
    };
  }, [fitOneScreen, landscapeFill, pagerWidth, qcomHatimBox]);

  const allowVerticalScroll = qcomHatimBox?.allowVerticalScroll ?? false;

  const hotspots = useMemo(() => {
    const mapped = getMushafAyahMapHotspots(ayahMap, page.mushafPageNumber);
    return mapped ?? fallbackMushafAyahHotspots(page);
  }, [ayahMap, page]);

  const useWebViewForSvg = format === "svg" && Platform.OS !== "web";
  const showSecondary = !fullPage && (showReaderMeaning || showReaderTranslit);

  const activeImageUri = mushafRasterActiveImageUri(isActive, imageUri, imageErr);
  const pageImage = !isActive ? (
    <View style={{ width: pageWidth, height: pageHeight }} />
  ) : activeImageUri && !imageErr ? (
    <View style={{ width: pageWidth, height: pageHeight, position: "relative", alignSelf: "center" }}>
      {useWebViewForSvg ? (
        <WebView
          source={{ uri: activeImageUri }}
          style={{ width: pageWidth, height: pageHeight, backgroundColor: "transparent" }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          originWhitelist={[...SECURE_MUSHAF_SVG_ORIGIN_WHITELIST]}
          allowFileAccess={activeImageUri.startsWith("file:")}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          geolocationEnabled={false}
          setSupportMultipleWindows={false}
          mixedContentMode="never"
          onError={markFailed}
        />
      ) : (
        <RasterImage
          source={{ uri: activeImageUri }}
          style={{ width: pageWidth, height: pageHeight }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          onError={markFailed}
        />
      )}
      {hotspots.map((spot) => {
        const item = findAyahItem(page, spot.surah, spot.ayah);
        if (!item) return null;
        const active = mushafHotspotActive(
          spot,
          playingRef,
          loadingAyahAudio,
          resumeHighlight,
          ayahAudioIsPlaying
        );
        return (
          <Pressable
            key={`${page.key}-${spot.surah}-${spot.ayah}`}
            oyuBackdrop={false}
            accessibilityRole="button"
            accessibilityLabel={`${spot.surah}:${spot.ayah}`}
            onPress={() => onPressAyah({ surah: spot.surah, ayah: spot.ayah }, item)}
            onLongPress={() => onLongPressAyah({ surah: spot.surah, ayah: spot.ayah }, item)}
            style={{
              position: "absolute",
              left: spot.x * pageWidth,
              top: spot.y * pageHeight,
              width: spot.w * pageWidth,
              height: spot.h * pageHeight,
              backgroundColor: active ? "rgba(232, 200, 106, 0.22)" : "transparent",
              borderRadius: 4,
            }}
          />
        );
      })}
    </View>
  ) : (
    <View
      style={{
        width: pageWidth,
        height: pageHeight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <RaqatOrnamentSpinner size={40} />
      {activeImageUri && imageErr ? (
        <Text style={[st.muted, { marginTop: 8 }]}>{colors.muted}</Text>
      ) : null}
    </View>
  );

  if (fitOneScreen) {
    return (
      <View
        style={[
          st.mushafPageInner,
          {
            flex: 1,
            minHeight: 0,
            backgroundColor: theme.pageFace,
          },
        ]}
      >
        <ScrollView
          style={{ flex: 1, width: "100%", alignSelf: "stretch" }}
          scrollEnabled={allowVerticalScroll}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: landscapeFill ? "stretch" : "center",
            justifyContent: "flex-start",
            paddingTop: MUSHAF_BOOK_PAGE_EDGE_INSET,
            paddingBottom,
          }}
          showsVerticalScrollIndicator={allowVerticalScroll}
        >
          <View
            style={{
              width: landscapeFill ? "100%" : pageWidth,
              maxWidth: landscapeFill ? "100%" : pageWidth,
              alignSelf: landscapeFill ? "stretch" : "center",
              minHeight: allowVerticalScroll ? pageHeight : undefined,
            }}
          >
            {pageImage}
          </View>
          {showSecondary ? (
            <MushafBookPageSecondaryAyahs
              ayahs={page.ayahs}
              styles={st}
              showReaderMeaning={showReaderMeaning}
              showReaderTranslit={showReaderTranslit}
              playingRef={playingRef}
              ayahAudioIsPlaying={ayahAudioIsPlaying}
              loadingAyahAudio={loadingAyahAudio}
              accentColor={colors.accent}
              onToggleAudio={onToggleAudio}
            />
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ width: pagerWidth, flex: 1 }}>
      <View style={[st.mushafListPad, { paddingBottom, alignItems: "center" }]}>{pageImage}</View>
      <MushafBookPageSecondaryAyahs
        ayahs={page.ayahs}
        styles={st}
        showReaderMeaning={showReaderMeaning}
        showReaderTranslit={showReaderTranslit}
        playingRef={playingRef}
        ayahAudioIsPlaying={ayahAudioIsPlaying}
        loadingAyahAudio={loadingAyahAudio}
        accentColor={colors.accent}
        onToggleAudio={onToggleAudio}
      />
    </View>
  );
}
