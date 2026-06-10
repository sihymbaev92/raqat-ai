import * as React from "react";
import { Pressable } from "@/ui/Pressable";
import { BackOrnamentLead } from "@/ui/BackOrnamentLead";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";
import { useHardwareBackPress } from "./useHardwareBackPress";

/**
 * Экрандық Android «артқа»: history болса ғана артқа қайтады.
 * History жоқ кезде Home-ға лақтырмаймыз — оны global bridge/жүйе өңдейді.
 */
export function useTabHomeBackHeader(navigation: NavigationProp<ParamListBase>, colors: ThemeColors) {
  void colors;
  const goBackOnly = React.useCallback((): boolean => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    return false;
  }, [navigation]);

  useHardwareBackPress(goBackOnly, true);
}

type TabHomeBackButtonProps = {
  navigation: NavigationProp<ParamListBase>;
  colors: ThemeColors;
};

/** Тақырып жиегі өшірілгенде — экран ішіндегі нақты back түймесі. */
export function TabHomeBackButton({ navigation, colors }: TabHomeBackButtonProps) {
  const goBackOnly = React.useCallback((): void => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  if (!navigation.canGoBack()) return null;

  return (
    <Pressable
      oyuBackdrop={false}
      onPress={goBackOnly}
      style={({ pressed }) => ({
        paddingRight: 8,
        paddingVertical: 8,
        opacity: pressed ? 0.72 : 1,
      })}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={kk.common.back}
    >
      <BackOrnamentLead iconColor={colors.text} iconSize={24} />
    </Pressable>
  );
}
