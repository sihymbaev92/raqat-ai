import React, { useMemo } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RAQAT_AUDIO_CONTRIBUTE_TELEGRAM_URL, type AudioContributionKind } from "../../config/audioContribution";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";

type Props = {
  colors: ThemeColors;
  kind: AudioContributionKind;
};

export function SettingsAudioContributeCard({ colors, kind }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hint =
    kind === "quran_reciter" ? kk.settings.audioContributeQuranHint : kk.settings.audioContributeAzanHint;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <MaterialIcons name="outgoing-mail" size={20} color={colors.accent} />
        <Text style={styles.title}>{kk.settings.audioContributeTitle}</Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
        onPress={() => void Linking.openURL(RAQAT_AUDIO_CONTRIBUTE_TELEGRAM_URL)}
        accessibilityRole="link"
        accessibilityLabel={kk.settings.audioContributeButton}
      >
        <MaterialIcons name="send" size={18} color="#ffffff" />
        <Text style={styles.btnText}>{kk.settings.audioContributeButton}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    btn: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
    },
    btnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  });
}
