import React from "react";
import { View, Text, Image, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import type { ThemeColors } from "../../theme/colors";
import { QURAN_BASMALA_READER_AR } from "../../constants/quranUthmani";

/** Сүре атауы рамкасы — мұсаф ою кадры (750×137, мөлдір фон). */
const SURAH_HEADER_FRAME = require("../../../assets/quran/surah-header-frame.png");
const SURAH_HEADER_BLUE = "#1D6FB8";
const HATIM_SURAH_FRAME_WIDTH = "86%";
const HATIM_SURAH_FRAME_MAX_WIDTH = 340;
const HATIM_SURAH_FRAME_HEIGHT = 44;
const HATIM_SURAH_TITLE_FONT_SIZE = 20;
const HATIM_SURAH_TITLE_LINE_HEIGHT = 29;
const HATIM_SURAH_TITLE_FONT_WEIGHT = "600";
const HATIM_SURAH_TITLE_AREA_WIDTH = "72%";
const HATIM_SURAH_TITLE_AREA_HEIGHT = "78%";

export type MushafSurahHeaderStyles = {
  mushafSurahTitleBlock: ViewStyle;
  mushafSurahTitlePaper: ViewStyle;
  mushafSurahTitleAr: TextStyle;
  mushafAyahTxt: TextStyle;
  bismillahBanner: ViewStyle;
  mushafBismillahBanner: ViewStyle;
  bismillahBannerTxt: TextStyle;
  mushafBismillahBannerTxt: TextStyle;
};

type Props = {
  colors: ThemeColors;
  mushafLayout: boolean;
  /** Хатым/604: ықшам рамка (бет бір экранға сыйсын). */
  bookPageLayout?: boolean;
  /** Quran.com: үлкен оюлы рамка + Scheherazade атау. */
  qcomBookLayout?: boolean;
  /** QCF4 15-жол торының ішінде тұратын ықшам рамка. */
  qcf4LineSlotLayout?: boolean;
  surahArabicTitleLine: string | null;
  showMushafBismillahBanner: boolean;
  styles: MushafSurahHeaderStyles;
  titleColor?: TextStyle["color"];
};

/** Мұсаф сүре басындағы орнамент + араб атау. */
export function MushafSurahHeader({
  mushafLayout,
  bookPageLayout = false,
  qcomBookLayout = false,
  qcf4LineSlotLayout = false,
  surahArabicTitleLine,
  showMushafBismillahBanner,
  styles: s,
  titleColor,
}: Props) {
  const showInlineSurahTitle = mushafLayout && surahArabicTitleLine;
  const bookOrnate = bookPageLayout || qcomBookLayout;
  const ayahTextStyle = StyleSheet.flatten(s.mushafAyahTxt) ?? {};
  const ayahTitleStyle = {
    color: ayahTextStyle.color,
    fontFamily: ayahTextStyle.fontFamily,
  };
  return (
    <View style={qcf4LineSlotLayout ? ornate.rootQcf4Line : qcomBookLayout ? ornate.rootQcom : undefined}>
      {showInlineSurahTitle ? (
        <View
          style={[
            s.mushafSurahTitleBlock,
            bookOrnate && ornate.titleBlockBook,
            qcomBookLayout && ornate.titleBlockQcom,
            qcf4LineSlotLayout && ornate.titleBlockQcf4Line,
          ]}
        >
          <View
            style={[
              ornate.frameWrap,
              bookPageLayout && !qcomBookLayout && ornate.frameWrapBook,
              qcomBookLayout && ornate.frameWrapQcom,
              qcf4LineSlotLayout && ornate.frameWrapQcf4Line,
            ]}
          >
            <Image
              source={SURAH_HEADER_FRAME}
              style={[ornate.frameImg, ornate.frameImgBlue]}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />
            {qcomBookLayout ? (
              <View style={ornate.titleCartoucheQcom} pointerEvents="none">
                <Text
                  style={[
                    s.mushafSurahTitleAr,
                    ornate.titleText,
                    ornate.titleTextQcom,
                    ayahTitleStyle,
                    qcf4LineSlotLayout && ornate.titleTextQcf4Line,
                    titleColor ? { color: titleColor } : null,
                  ]}
                  accessibilityRole="header"
                  numberOfLines={1}
                  adjustsFontSizeToFit={false}
                  minimumFontScale={1}
                  allowFontScaling={false}
                >
                  {surahArabicTitleLine}
                </Text>
              </View>
            ) : (
              <View style={ornate.titleOverlay} pointerEvents="none">
                <View
                  style={[
                    ornate.titleMask,
                    bookPageLayout ? ornate.titleMaskBook : null,
                  ]}
                >
                  <Text
                    style={[
                      s.mushafSurahTitleAr,
                      ornate.titleText,
                      bookPageLayout && ornate.titleTextBook,
                      ayahTitleStyle,
                      titleColor ? { color: titleColor } : null,
                    ]}
                    accessibilityRole="header"
                    numberOfLines={1}
                    adjustsFontSizeToFit={false}
                    minimumFontScale={1}
                    allowFontScaling={false}
                  >
                    {surahArabicTitleLine}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : null}
      {showMushafBismillahBanner ? (
        <View
          style={[
            s.bismillahBanner,
            s.mushafBismillahBanner,
            bookOrnate && ornate.bismillahBannerBook,
            qcomBookLayout && ornate.bismillahBannerQcom,
            qcf4LineSlotLayout && ornate.bismillahBannerQcf4Line,
          ]}
          accessibilityLabel={QURAN_BASMALA_READER_AR}
        >
          <Text
            style={[
              s.bismillahBannerTxt,
              s.mushafBismillahBannerTxt,
              bookOrnate && ornate.bismillahTextBook,
              titleColor ? { color: titleColor } : null,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            allowFontScaling={false}
          >
            {QURAN_BASMALA_READER_AR}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const ornate = StyleSheet.create({
  frameWrap: {
    width: HATIM_SURAH_FRAME_WIDTH,
    maxWidth: HATIM_SURAH_FRAME_MAX_WIDTH,
    height: HATIM_SURAH_FRAME_HEIGHT,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  frameImg: {
    width: "100%",
    height: "100%",
  },
  frameImgBlue: {
    tintColor: SURAH_HEADER_BLUE,
    opacity: 0.96,
  },
  rootQcf4Line: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  rootQcom: {
    width: "100%",
    alignSelf: "stretch",
  },
  titleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Картуштың бос ортасы — динамикалық сүре аты сонда тұрады (рамка жазуы өшірілген). */
  titleMask: {
    width: HATIM_SURAH_TITLE_AREA_WIDTH,
    height: HATIM_SURAH_TITLE_AREA_HEIGHT,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    overflow: "hidden",
  },
  /** 750×137 рамка: орталық медальон аймағы. */
  titleCartoucheQcom: {
    position: "absolute",
    left: "14%",
    right: "14%",
    top: "11%",
    bottom: "11%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 0,
    zIndex: 2,
  },
  titleMaskBook: {
    width: HATIM_SURAH_TITLE_AREA_WIDTH,
    height: HATIM_SURAH_TITLE_AREA_HEIGHT,
  },
  titleText: {
    color: SURAH_HEADER_BLUE,
    fontSize: HATIM_SURAH_TITLE_FONT_SIZE,
    lineHeight: HATIM_SURAH_TITLE_LINE_HEIGHT,
    fontWeight: HATIM_SURAH_TITLE_FONT_WEIGHT,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: true,
  },
  titleBlockBook: {
    marginBottom: 4,
  },
  titleBlockQcom: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: -2,
    marginBottom: 4,
  },
  titleBlockQcf4Line: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 0,
    marginBottom: 2,
  },
  frameWrapBook: {
    width: HATIM_SURAH_FRAME_WIDTH,
    maxWidth: HATIM_SURAH_FRAME_MAX_WIDTH,
    height: HATIM_SURAH_FRAME_HEIGHT,
  },
  frameWrapQcom: {
    width: HATIM_SURAH_FRAME_WIDTH,
    maxWidth: HATIM_SURAH_FRAME_MAX_WIDTH,
    height: HATIM_SURAH_FRAME_HEIGHT,
  },
  frameWrapQcf4Line: {
    width: HATIM_SURAH_FRAME_WIDTH,
    maxWidth: HATIM_SURAH_FRAME_MAX_WIDTH,
    height: HATIM_SURAH_FRAME_HEIGHT,
  },
  titleTextBook: {
    fontSize: HATIM_SURAH_TITLE_FONT_SIZE,
    lineHeight: HATIM_SURAH_TITLE_LINE_HEIGHT,
    fontWeight: HATIM_SURAH_TITLE_FONT_WEIGHT,
    includeFontPadding: true,
  },
  titleTextQcom: {
    width: "100%",
    fontSize: HATIM_SURAH_TITLE_FONT_SIZE,
    lineHeight: HATIM_SURAH_TITLE_LINE_HEIGHT,
    fontWeight: HATIM_SURAH_TITLE_FONT_WEIGHT,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: true,
  },
  titleTextQcf4Line: {
    fontSize: HATIM_SURAH_TITLE_FONT_SIZE,
    lineHeight: HATIM_SURAH_TITLE_LINE_HEIGHT,
    fontWeight: HATIM_SURAH_TITLE_FONT_WEIGHT,
    includeFontPadding: true,
  },
  bismillahBannerBook: {
    paddingVertical: 2,
    marginBottom: 2,
  },
  bismillahBannerQcom: {
    paddingVertical: 2,
    marginBottom: 2,
  },
  bismillahBannerQcf4Line: {
    paddingVertical: 0,
    marginBottom: 0,
  },
  bismillahTextBook: {
    fontSize: 18,
    lineHeight: 26,
  },
});
