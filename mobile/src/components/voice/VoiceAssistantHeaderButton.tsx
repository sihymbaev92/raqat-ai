import React from "react";
import { Pressable, Platform, ActivityIndicator } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeContext";
import { kk } from "../../i18n/kk";
import { useVoiceAssistant } from "./voiceAssistantCore";

/**
 * Басты экран app bar-ы: микрофон (оң жақта — баптаулардың сол жағы).
 */
export function VoiceAssistantHeaderButton() {
  const { colors } = useAppTheme();
  if (Platform.OS === "web") return null;
  const { phase, toggleListen } = useVoiceAssistant();
  return (
    <Pressable
      onPress={() => void toggleListen()}
      hitSlop={10}
      pressRetentionOffset={16}
      android_ripple={{ color: `${colors.accent}33`, borderless: false }}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accentSurfaceStrong,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed && { opacity: 0.9 },
        phase === "listening" && { borderWidth: 2, borderColor: colors.accent },
      ]}
      accessibilityRole="button"
      accessibilityLabel={kk.voiceAssistant.fabA11y}
      accessibilityState={{ busy: phase === "listening" || phase === "busy" }}
    >
      {phase === "busy" ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <MaterialIcons
          name="mic"
          size={22}
          color={phase === "listening" ? colors.accent : colors.text}
        />
      )}
    </Pressable>
  );
}
