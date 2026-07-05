import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import {
  tajweedRenderNoticeKind,
  tajweedRenderNoticeVisible,
  type TajweedRenderContext,
} from "../../quran/quranTajweedRenderPolicy";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  /** Tajweed limitation banner (surah reader or hatim). */
  tajweed?: Omit<TajweedRenderContext, "platformOS"> & { platformOS?: string };
  /** Reciter not fully downloaded — streaming needs network. */
  audioStreaming?: boolean;
  compact?: boolean;
};

function noticeBody(
  kind: ReturnType<typeof tajweedRenderNoticeKind>,
  audioStreaming: boolean
): string | null {
  if (audioStreaming) return kk.quran.quranAudioStreamingNotice;
  switch (kind) {
    case "surah_unicode_tags":
      return kk.quran.tajweedNoticeSurahUnicode;
    case "hatim_unicode_fallback":
      return kk.quran.tajweedNoticeHatimUnicode;
    case "hatim_colr_word_fallback":
      return kk.quran.tajweedNoticeHatimColrFallback;
    default:
      return null;
  }
}

export function QuranReaderLimitNotice({
  colors,
  isDark,
  tajweed,
  audioStreaming = false,
  compact = false,
}: Props) {
  const kind = tajweed
    ? tajweedRenderNoticeKind({ ...tajweed, platformOS: tajweed.platformOS ?? Platform.OS })
    : "none";
  const showTajweed = tajweedRenderNoticeVisible(kind);
  const body = noticeBody(kind, audioStreaming && !showTajweed ? true : audioStreaming);
  const tajweedBody = showTajweed ? noticeBody(kind, false) : null;

  if (!body && !tajweedBody) return null;

  const bg = isDark ? "rgba(255,193,7,0.12)" : "rgba(180,120,0,0.08)";
  const border = isDark ? "rgba(255,193,7,0.35)" : "rgba(180,120,0,0.28)";
  const ink = isDark ? "#FFE082" : "#6B4E00";

  const lines = [tajweedBody, audioStreaming && tajweedBody ? kk.quran.quranAudioStreamingNotice : body].filter(
    Boolean
  ) as string[];

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { backgroundColor: bg, borderColor: border },
      ]}
      accessibilityRole="text"
    >
      <MaterialIcons name="info-outline" size={compact ? 16 : 18} color={ink} style={styles.icon} />
      <View style={styles.textCol}>
        {lines.map((line) => (
          <Text key={line.slice(0, 24)} style={[styles.text, compact && styles.textCompact, { color: ink }]}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  wrapCompact: {
    marginHorizontal: 0,
    marginBottom: 6,
    paddingVertical: 6,
  },
  icon: {
    marginTop: 1,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  text: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  textCompact: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});
