import React from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";
import {
  APP_TEXT_MAX_FONT_SIZE_MULTIPLIER,
  fitSingleLineTextProps,
} from "../theme/textLayoutGuard";

export type FitTextProps = TextProps & {
  /** Бір жол — iOS-та adjustsFontSizeToFit қосылады. */
  singleLine?: boolean;
};

/**
 * Экранға сыймайтын мәтін: flexShrink + maxFontSizeMultiplier + (iOS) auto-shrink.
 * Xiaomi/MIUI үлкен жүйелік шрифтте қабаттасуды азайтады.
 */
export function FitText({
  singleLine = false,
  style,
  maxFontSizeMultiplier = APP_TEXT_MAX_FONT_SIZE_MULTIPLIER,
  ...props
}: FitTextProps) {
  const fit = singleLine ? fitSingleLineTextProps(props) : null;
  const mergedStyle: StyleProp<TextStyle> = [{ flexShrink: 1 }, style];

  return (
    <Text
      {...props}
      {...(fit ?? {})}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={mergedStyle}
    />
  );
}
