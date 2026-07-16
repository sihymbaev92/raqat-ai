import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { RAQAT_AI_EXAMPLE_QUESTIONS } from "../config/raqatAiExampleQuestions";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  colors: ThemeColors;
  disabled?: boolean;
  onSelect: (question: string) => void;
};

export function RaqatAiExampleChips({ colors, disabled, onSelect }: Props) {
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{kk.aiChat.exampleQuestionsTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {RAQAT_AI_EXAMPLE_QUESTIONS.map((q) => (
          <Pressable
            key={q}
            disabled={disabled}
            onPress={() => onSelect(q)}
            style={({ pressed }) => [
              styles.chip,
              disabled && styles.chipDisabled,
              pressed && !disabled && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={kk.aiChat.exampleQuestionA11y(q)}
          >
            <Text style={styles.chipTxt} numberOfLines={2}>
              {q}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 6,
      gap: 6,
    },
    title: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
      letterSpacing: 0.2,
    },
    row: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 4,
    },
    chip: {
      maxWidth: 280,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.accentSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipDisabled: {
      opacity: 0.55,
    },
    chipTxt: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      color: colors.text,
    },
  });
}
