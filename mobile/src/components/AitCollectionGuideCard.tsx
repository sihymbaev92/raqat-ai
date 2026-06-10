import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "../theme/colors";

type Labels = {
  title: string;
  lead: string;
  step1: string;
  step2: string;
  step3: string;
  note: string;
};

type Props = {
  colors: ThemeColors;
  labels: Labels;
};

export function AitCollectionGuideCard({ colors, labels }: Props) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const steps = [labels.step1, labels.step2, labels.step3];

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {labels.title}
      </Text>
      <Text style={styles.lead} selectable>
        {labels.lead}
      </Text>
      {steps.map((line, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumTxt}>{i + 1}</Text>
          </View>
          <Text style={styles.stepTxt} selectable>
            {line}
          </Text>
        </View>
      ))}
      <Text style={styles.note} selectable>
        {labels.note}
      </Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 8,
    },
    lead: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 12,
    },
    stepRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
      alignItems: "flex-start",
    },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumTxt: { color: "#fff", fontSize: 13, fontWeight: "900" },
    stepTxt: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
    },
    note: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      fontStyle: "italic",
    },
  });
}
