import * as React from "react";
import {
  Image,
  Platform,
  Pressable as RNPressable,
  type PressableProps,
  StyleSheet,
  View,
  type ImageStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { kazakhOyuButtonStrip } from "../theme/ornamentAssets";
import { useAppTheme } from "../theme/ThemeContext";
import { BackOrnamentLead } from "./BackOrnamentLead";

export type AppPressableProps = PressableProps & {
  /** Web-only anchor destination supported by react-native-web at runtime. */
  href?: string;
  /**
   * Түйме ішінде төменгі шекке алтын ою суреті (Қазақстан нақышы).
   * Тақырып жолдары мен карточкаларда әдетте қажет емес; тек ерекше CTA үшін true.
   * @default false
   */
  oyuBackdrop?: boolean;
  /**
   * Сол жақта алтын ою + «←» (фонсыз), мәтінмен бір қатар. Толық басу — негізгі onPress.
   */
  leadingBackInRow?: boolean;
};

const OYU_STRIP_H = 26;

function oyuStripStyle(): ImageStyle {
  const base: ImageStyle = {
    width: "100%",
    height: "100%",
    opacity: Platform.OS === "android" ? 0.2 : 0.22,
  };
  if (Platform.OS === "ios" || Platform.OS === "android") {
    (base as { blendMode?: "screen" }).blendMode = "screen";
  }
  return base;
}

/**
 * React Native Pressable + жеңіл діріл (iOS/Android). Вебте әдеттегі Pressable.
 * Әр басудың басында — бір рет Light impact.
 * Әдепкі: ою жолысыз; `oyuBackdrop` қосқанда ғана қазақ ою жолы көрінеді.
 */
export const Pressable = React.forwardRef<React.ElementRef<typeof RNPressable>, AppPressableProps>(
  function Pressable(
    { onPressIn, disabled, oyuBackdrop = false, leadingBackInRow = false, style, children, ...rest },
    ref
  ) {
    const { colors } = useAppTheme();
    return (
      <RNPressable
        ref={ref}
        disabled={disabled}
        style={(state) => {
          const s = typeof style === "function" ? style(state) : style;
          return [oyuBackdrop ? styles.pressableOyuWrap : null, s];
        }}
        {...rest}
        onPressIn={(e) => {
          if (Platform.OS !== "web" && !disabled) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPressIn?.(e);
        }}
      >
        {(pressState) => (
          <>
            {oyuBackdrop ? (
              <View pointerEvents="none" style={styles.oyuStripSlot}>
                <Image
                  source={kazakhOyuButtonStrip}
                  style={oyuStripStyle()}
                  resizeMode="stretch"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              </View>
            ) : null}
            {leadingBackInRow ? (
              <View pointerEvents="none" style={styles.leadingBackSlot}>
                <BackOrnamentLead iconColor={colors.muted} iconSize={18} />
              </View>
            ) : null}
            {typeof children === "function" ? children(pressState) : children}
          </>
        )}
      </RNPressable>
    );
  }
);

const styles = StyleSheet.create({
  pressableOyuWrap: {
    overflow: "hidden",
  },
  oyuStripSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: OYU_STRIP_H,
    zIndex: 0,
    overflow: "hidden",
  },
  /** flex-row батырмаларда мәтінмен бір қатар, фонсыз */
  leadingBackSlot: {
    justifyContent: "center",
    alignSelf: "center",
    marginRight: 4,
    zIndex: 1,
  },
});
