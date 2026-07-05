import * as React from "react";
import { StyleSheet } from "react-native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
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

/** Таб экрандарындағы артқа батырмасы — тек navigation history барда көрінеді. */
export function TabHomeBackButton({ navigation, colors }: TabHomeBackButtonProps) {
  if (!navigation.canGoBack()) return null;
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={() => {
        if (navigation.canGoBack()) navigation.goBack();
      }}
      accessibilityRole="button"
      accessibilityLabel="Артқа"
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.78 }]}
    >
      <MaterialIcons name="arrow-back" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});
