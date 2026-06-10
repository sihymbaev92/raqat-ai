import React, { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";

type Props = {
  isDark: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Ішкі бет қабаты (мысалы flex:1) */
  innerStyle?: StyleProp<ViewStyle>;
  /** Quran.com: беттің сол/оң жиектері */
  readingThemeId?: QuranReadingThemeId | null;
  ornate?: boolean;
};

/** Мұсаф беті — Quran.com оқу темасы (Original: ақ бет, к вертикаль жиек). */
export function IlluminatedManuscriptFrame({
  isDark,
  children,
  style,
  innerStyle,
  readingThemeId,
  ornate: _ornate = false,
}: Props) {
  void isDark;
  const theme = resolveQuranReadingTheme(readingThemeId);
  const border = theme.pageBorderVertical
    ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.pageBorderColor }
    : null;

  return (
    <View
      style={[
        {
          backgroundColor: theme.pageFace,
          overflow: "hidden",
        },
        border,
        style,
      ]}
    >
      <View style={[{ flex: 1, minHeight: 0 }, innerStyle]}>{children}</View>
    </View>
  );
}
