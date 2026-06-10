import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { PrayerNotifSoundId } from "../storage/prefs";
import {
  canPreviewPrayerNotifSound,
  previewPrayerNotifSound,
  stopPreviewPrayerNotifSound,
} from "../utils/previewPrayerNotifSound";
import { prayerNotifSoundLabelKk } from "../utils/prayerNotifSoundUi";

type Props = NativeStackScreenProps<RootStackParamList, "PrayerAzan">;

function normalizeSoundId(raw: unknown): PrayerNotifSoundId {
  return typeof raw === "string" && canPreviewPrayerNotifSound(raw as PrayerNotifSoundId)
    ? (raw as PrayerNotifSoundId)
    : "adhan_haramain";
}

export function PrayerAzanScreen({ route, navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const label = (route.params?.label || kk.prayer.azanScreenDefaultLabel).trim();
  const time = (route.params?.time || "").trim();
  const soundId = normalizeSoundId(route.params?.soundId);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    setStopped(false);
    void previewPrayerNotifSound(soundId);
    return () => {
      void stopPreviewPrayerNotifSound();
    };
  }, [soundId]);

  const stop = async () => {
    await stopPreviewPrayerNotifSound();
    setStopped(true);
  };

  const close = async () => {
    await stopPreviewPrayerNotifSound();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Main", { screen: "Home" });
  };

  return (
    <View testID="screen-prayer-azan" style={[styles.root, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="volume-up" size={44} color={colors.accent} />
        </View>
        <Text style={styles.kicker}>{kk.prayer.azanScreenKicker}</Text>
        <Text style={styles.title}>{label}</Text>
        {time ? <Text style={styles.time}>{time}</Text> : null}
        <Text style={styles.body}>{kk.prayer.azanScreenBody}</Text>
        <Text style={styles.sound}>{prayerNotifSoundLabelKk(soundId)}</Text>
        {stopped ? <Text style={styles.stopped}>{kk.prayer.azanScreenStopped}</Text> : null}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={stop}
          disabled={stopped}
          accessibilityRole="button"
          accessibilityLabel={kk.prayer.azanScreenStop}
          style={({ pressed }) => [styles.stopBtn, (pressed || stopped) && { opacity: stopped ? 0.52 : 0.85 }]}
        >
          <MaterialIcons name="stop-circle" size={24} color="#fff" />
          <Text style={styles.stopTxt}>{kk.prayer.azanScreenStop}</Text>
        </Pressable>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={kk.common.close}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.closeTxt}>{kk.common.close}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#05080B" : "#F7F1E6",
      paddingHorizontal: 20,
      justifyContent: "center",
    },
    glow: {
      position: "absolute",
      top: -80,
      alignSelf: "center",
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: isDark ? "rgba(197,160,89,0.18)" : "rgba(197,160,89,0.28)",
    },
    card: {
      borderRadius: 32,
      padding: 24,
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
      marginBottom: 6,
    },
    kicker: { color: colors.muted, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
    title: { color: colors.text, fontSize: 30, fontWeight: "900", textAlign: "center" },
    time: { color: colors.accent, fontSize: 44, fontWeight: "900", letterSpacing: 0.5 },
    body: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 4 },
    sound: { color: colors.text, fontSize: 13, fontWeight: "800", marginTop: 4 },
    stopped: { color: colors.error, fontSize: 13, fontWeight: "800", marginTop: 8 },
    actions: { gap: 10, marginTop: 20 },
    stopBtn: {
      height: 56,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: "#B42318",
    },
    stopTxt: { color: "#fff", fontSize: 17, fontWeight: "900" },
    closeBtn: {
      height: 50,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    closeTxt: { color: colors.text, fontSize: 15, fontWeight: "800" },
  });
}
