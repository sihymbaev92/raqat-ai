import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";

type Nav = {
  navigate: (screen: "ScrapedHadithMuftyatList" | "HadithList") => void;
};

type Props = {
  navigation: Nav;
  /** Қазіргі экран */
  active: "kmdmb" | "sahih";
};

/** KK үзінді ↔ Сахих корпус арасында жылдам ауысу. */
export function HadithCrossLinkBar({ navigation, active }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goKmdmb = () => {
    if (active !== "kmdmb") navigation.navigate("ScrapedHadithMuftyatList");
  };
  const goSahih = () => {
    if (active !== "sahih") navigation.navigate("HadithList");
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={goKmdmb}
        style={[styles.chip, active === "kmdmb" && styles.chipOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: active === "kmdmb" }}
        accessibilityLabel={kk.hadith.hub.kmdmbTabA11y}
      >
        <MaterialIcons
          name="article"
          size={16}
          color={active === "kmdmb" ? colors.accent : colors.muted}
        />
        <Text style={[styles.chipTxt, active === "kmdmb" && styles.chipTxtOn]}>
          {kk.hadith.hub.kmdmbTab}
        </Text>
      </Pressable>
      <Pressable
        onPress={goSahih}
        style={[styles.chip, active === "sahih" && styles.chipOn]}
        accessibilityRole="button"
        accessibilityState={{ selected: active === "sahih" }}
        accessibilityLabel={kk.hadith.hub.sahihTabA11y}
      >
        <MaterialIcons
          name="menu-book"
          size={16}
          color={active === "sahih" ? colors.accent : colors.muted}
        />
        <Text style={[styles.chipTxt, active === "sahih" && styles.chipTxtOn]}>
          {kk.hadith.hub.sahihTab}
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 8,
      paddingTop: 10,
      paddingBottom: 4,
    },
    chip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipOn: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    chipTxt: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textAlign: "center",
    },
    chipTxtOn: {
      color: colors.accent,
    },
  });
}
