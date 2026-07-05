import { StyleSheet, Text, TextInput, type TextStyle } from "react-native";
import { appTextLayoutDefaults } from "./textLayoutGuard";
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

type WithDefaults = {
  defaultProps?: Record<string, unknown> & { style?: TextStyle | TextStyle[] };
};

function applyGlobalFontDefaults(): void {
  const T = Text as unknown as WithDefaults;
  const I = TextInput as unknown as WithDefaults;
  try {
    T.defaultProps = {
      ...(T.defaultProps ?? {}),
      ...appTextLayoutDefaults,
      style: mergeStyle(T.defaultProps?.style),
    };
    I.defaultProps = {
      ...(I.defaultProps ?? {}),
      ...appTextLayoutDefaults,
      style: mergeStyle(I.defaultProps?.style),
    };
  } catch {
    /* RN 0.81+ defaultProps жоқ болса — FitText / компонент дефолттары қалды */
  }
}

applyGlobalFontDefaults();
