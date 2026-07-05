import React from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { Text, View } from "react-native";
import type { AyahMarkerStyleId } from "../../storage/quranReaderPrefs";
import { MushafAyahSvgMarker } from "./MushafAyahSvgMarker";
import { quranSurahArabicWrapStyle, quranSurahAyahClusterStyle } from "../../quran/quranResponsiveLayout";

export type MushafAyahRowStyles = {
  mushafAyahRow: ViewStyle;
  mushafAyahRowResumeHighlight: ViewStyle;
  mushafAyahArabicCluster: ViewStyle;
  mushafAyahMarkerOuter: ViewStyle;
  mushafAyahMarkerInner: ViewStyle;
  mushafAyahMarkerTxt: TextStyle;
  mushafAyahArabicWrap: ViewStyle;
  ayahRowAudioFocus: ViewStyle;
  ayahBelowArabic: ViewStyle;
  mushafAyahBookmarkRail: ViewStyle;
  mushafAyahBookmarkDot: ViewStyle;
};

type Props = {
  markerLabel: string;
  markerStyleId: AyahMarkerStyleId;
  showResumeHighlight: boolean;
  isAudioFocus: boolean;
  bookmarkRingColor?: string;
  mushafMarkerStroke: string;
  mushafMarkerFill: string;
  mushafMarkerInk: string;
  arabicBody: React.ReactNode;
  belowArabic: React.ReactNode;
  styles: MushafAyahRowStyles;
};

/** Мұсаф режиміндегі бір аят жолы: RTL wrap, маркер + араб мәтін + бетбелгі. */
export function MushafAyahRow({
  markerLabel,
  markerStyleId,
  showResumeHighlight,
  isAudioFocus,
  bookmarkRingColor,
  mushafMarkerStroke,
  mushafMarkerFill,
  mushafMarkerInk,
  arabicBody,
  belowArabic,
  styles: s,
}: Props) {
  const markerNode =
    markerStyleId === "ring_svg" ? (
      <MushafAyahSvgMarker
        stroke={mushafMarkerStroke}
        fill={mushafMarkerFill}
        textColor={mushafMarkerInk}
        label={markerLabel}
      />
    ) : (
      <View
        style={s.mushafAyahMarkerOuter}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={s.mushafAyahMarkerInner}>
          <Text style={s.mushafAyahMarkerTxt}>{markerLabel}</Text>
        </View>
      </View>
    );

  return (
    <View
      style={[
        s.mushafAyahRow,
        isAudioFocus && s.ayahRowAudioFocus,
        showResumeHighlight && s.mushafAyahRowResumeHighlight,
      ]}
    >
      <View
        style={[quranSurahAyahClusterStyle(), s.mushafAyahArabicCluster]}
        accessible={false}
      >
        <View
          style={{ flexShrink: 0 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {markerNode}
        </View>
        <View style={[quranSurahArabicWrapStyle(), s.mushafAyahArabicWrap]}>{arabicBody}</View>
        <View style={s.mushafAyahBookmarkRail} importantForAccessibility="no-hide-descendants">
          <View
            style={[
              s.mushafAyahBookmarkDot,
              bookmarkRingColor ? { backgroundColor: bookmarkRingColor } : { opacity: 0 },
            ]}
          />
        </View>
      </View>
      <View style={s.ayahBelowArabic}>{belowArabic}</View>
    </View>
  );
}
