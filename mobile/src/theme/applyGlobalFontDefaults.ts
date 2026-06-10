import { StyleSheet, Text, TextInput, type TextStyle } from "react-native";
import { typography, uiFontStyle } from "./typography";

/**
 * Барлық экрандар: Nunito, біркелкі базалық өлшем, оқуға ыңғайлы қалыңдық.
 * Әр компонент өз `fontSize`/`fontWeight`/`fontFamily` берсе, ол әдепкіні басып шығады.
 */
const DEFAULT_BODY_STYLE: TextStyle = {
  ...uiFontStyle("medium"),
  ...typography.base,
};

function mergeStyle(prev: TextStyle | TextStyle[] | undefined | null): TextStyle | TextStyle[] {
  if (prev == null) return DEFAULT_BODY_STYLE;
  if (Array.isArray(prev)) return [DEFAULT_BODY_STYLE, ...prev];
  return StyleSheet.flatten([DEFAULT_BODY_STYLE, prev]);
}

function applyGlobalFontDefaults(): void {
  type WithDefaults = {
    defaultProps?: { style?: TextStyle | TextStyle[] };
  };
  const T = Text as unknown as WithDefaults;
  const I = TextInput as unknown as WithDefaults;
  /** RN 0.81+: defaultProps жоқ болса — өткізу (native құлауды болдырмау). */
  if (!("defaultProps" in Text) && T.defaultProps === undefined) {
    return;
  }
  try {
    T.defaultProps = { ...T.defaultProps, style: mergeStyle(T.defaultProps?.style) };
    I.defaultProps = { ...I.defaultProps, style: mergeStyle(I.defaultProps?.style) };
  } catch {
    /* ignore */
  }
}

applyGlobalFontDefaults();
