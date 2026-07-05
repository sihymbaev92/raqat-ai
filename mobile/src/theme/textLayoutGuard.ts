import { PixelRatio, Platform, type TextProps } from "react-native";

/** MIUI / Android display size — UI мәтінінің қабаттасуын болдырмау. */
export const APP_TEXT_MAX_FONT_SIZE_MULTIPLIER = 1.12;

/** Тік сызықты мәтін кішірейіп сияқты (iOS adjustsFontSizeToFit). */
export const APP_TEXT_MIN_FONT_SCALE = 0.82;

export function resolveSystemFontScale(): number {
  try {
    const scale = PixelRatio.getFontScale?.();
    return typeof scale === "number" && Number.isFinite(scale) && scale > 0 ? scale : 1;
  } catch {
    return 1;
  }
}

export function isLargeSystemFontScale(scale = resolveSystemFontScale()): boolean {
  return scale > 1.08;
}

/** Барлық `<Text>` / `<TextInput>` үшін қауіпсіз әдепкіler. */
export const appTextLayoutDefaults: Pick<
  TextProps,
  "allowFontScaling" | "maxFontSizeMultiplier"
> = {
  allowFontScaling: true,
  maxFontSizeMultiplier: APP_TEXT_MAX_FONT_SIZE_MULTIPLIER,
};

/** Бір жолдық UI: кесілмей/қабаттаспай сияқты. */
export function fitSingleLineTextProps(
  overrides: Partial<TextProps> = {}
): Pick<
  TextProps,
  | "numberOfLines"
  | "maxFontSizeMultiplier"
  | "adjustsFontSizeToFit"
  | "minimumFontScale"
  | "allowFontScaling"
> {
  const lines = overrides.numberOfLines ?? 1;
  return {
    allowFontScaling: overrides.allowFontScaling ?? true,
    maxFontSizeMultiplier:
      overrides.maxFontSizeMultiplier ?? APP_TEXT_MAX_FONT_SIZE_MULTIPLIER,
    numberOfLines: lines,
    adjustsFontSizeToFit:
      overrides.adjustsFontSizeToFit ?? (Platform.OS === "ios" && lines === 1),
    minimumFontScale: overrides.minimumFontScale ?? APP_TEXT_MIN_FONT_SCALE,
  };
}

/** Кішкентай badge/strip — жүйелік масштабта өспейді. */
export const fixedSizeTextProps: Pick<TextProps, "allowFontScaling" | "maxFontSizeMultiplier"> = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};
