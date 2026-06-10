import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Variant = "prayerScreen" | "dashboard";

type Props = {
  variant?: Variant;
};

/** Қағба hero үстіндегі жеңіл «түтін» / жарық градиенті (touch өтпейді). */
export function PrayerHeroSteamOverlay({ variant = "prayerScreen" }: Props) {
  const bottomOpacity = variant === "prayerScreen" ? 0.55 : 0.4;
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]}
        style={styles.topMist}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={[`rgba(8,12,18,${bottomOpacity})`, "rgba(8,12,18,0)"]}
        style={styles.bottomMist}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topMist: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "38%",
  },
  bottomMist: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
  },
});
