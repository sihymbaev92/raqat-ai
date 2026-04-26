import React from "react";
import { View, Text, StyleSheet, Platform, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme/ThemeContext";
import { useVoiceAssistant } from "./voiceAssistantCore";

/**
 * Ағаштың үсті: ескерту қауырсыны (төменгі FAB жоқ).
 */
export function VoiceAssistantGlobalChrome() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { phase, hint } = useVoiceAssistant();
  if (Platform.OS === "web") return null;
  if (!hint && phase !== "listening") return null;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + 4, right: 8 },
      ]}
    >
      {hint ? (
        <View
          style={[
            styles.hintBubble,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.hintTxt, { color: colors.text }]}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 200,
    maxWidth: 240,
  } satisfies ViewStyle,
  hintBubble: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintTxt: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
