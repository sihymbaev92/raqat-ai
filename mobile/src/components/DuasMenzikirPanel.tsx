import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { makeSeparateButtonStyles } from "../theme/separateButtonStyles";
import type { DuasMenzikirSection } from "../content/duasMenzikir";

type Labels = {
  title: string;
  totalLine: (sections: number, duas: number) => string;
  jumpHint: string;
};

type Props = {
  colors: ThemeColors;
  sections: DuasMenzikirSection[];
  sectionCounts: Record<string, number>;
  totalDuas: number;
  labels: Labels;
  onJump: (categoryTitle: string) => void;
};

export function DuasMenzikirPanel({
  colors,
  sections,
  sectionCounts,
  totalDuas,
  labels,
  onJump,
}: Props) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const btn = React.useMemo(() => makeSeparateButtonStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {labels.title}
      </Text>
      <Text style={styles.total} selectable>
        {labels.totalLine(sections.length, totalDuas)}
      </Text>
      <View style={btn.stack}>
      {sections.map((s) => {
        const n = sectionCounts[s.categoryTitle] ?? 0;
        return (
          <Pressable
            key={s.categoryTitle}
            oyuBackdrop={false}
            onPress={() => onJump(s.categoryTitle)}
            style={({ pressed }) => [btn.standalone, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}. ${s.hint}. ${n} дұға`}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowHint} numberOfLines={2}>
                {s.hint}
              </Text>
            </View>
            <Text style={styles.rowCount}>{n}</Text>
          </Pressable>
        );
      })}
      </View>
      <Text style={styles.foot}>{labels.jumpHint}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 4,
    },
    total: {
      color: colors.muted,
      fontSize: 13,
      marginBottom: 12,
    },
    rowText: { flex: 1 },
    rowLabel: { color: colors.text, fontSize: 14, fontWeight: "800" },
    rowHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
    rowCount: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      minWidth: 28,
      textAlign: "right",
    },
    foot: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 10,
      fontStyle: "italic",
    },
  });
}
