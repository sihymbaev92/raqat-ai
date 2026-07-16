import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { parseHajjMuftyatDisplaySegments } from "../content/hajjMuftyatDisplay";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  text: string;
  colors: ThemeColors;
};

export function HajjMuftyatPageText({ text, colors }: Props) {
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const segments = useMemo(() => parseHajjMuftyatDisplaySegments(text), [text]);
  const { tr } = useKkAutoTranslator();

  return (
    <View style={styles.wrap}>
      {segments.map((seg, idx) => {
        if (seg.kind === "dua") {
          return (
            <View key={`dua-${idx}`} style={styles.duaBlock}>
              {seg.title ? <Text style={styles.rotationTitle}>{tr(seg.title)}</Text> : null}
              <View style={styles.duaPart}>
                <Text style={styles.colLabel}>{tr(kk.features.hajjOqylyLabel)}</Text>
                {seg.oqyly ? (
                  <Text style={styles.oqylyBody} selectable>
                    {seg.oqyly}
                  </Text>
                ) : (
                  <Text style={styles.muted}>—</Text>
                )}
              </View>
              <View style={styles.duaPart}>
                <Text style={styles.colLabel}>{tr(kk.features.hajjMagynasyLabel)}</Text>
                {seg.magynasy ? (
                  <Text style={styles.kkBody} selectable>
                    {tr(seg.magynasy)}
                  </Text>
                ) : (
                  <Text style={styles.muted}>—</Text>
                )}
              </View>
            </View>
          );
        }

        if (seg.align === "ar") {
          return (
            <Text key={`ar-${idx}`} style={[styles.proseCard, styles.arBody]} selectable>
              {seg.text}
            </Text>
          );
        }

        return (
          <Text key={`kk-${idx}`} style={styles.proseCard} selectable>
            {tr(seg.text)}
          </Text>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { gap: 6 },
    proseCard: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "left",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      paddingVertical: 10,
      paddingHorizontal: 11,
      backgroundColor: colors.bg,
    },
    duaBlock: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      padding: 9,
      backgroundColor: colors.bg,
      gap: 7,
    },
    rotationTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.accent,
      textAlign: "left",
    },
    duaPart: {
      gap: 4,
    },
    colLabel: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.muted,
    },
    kkBody: {
      color: colors.scriptureMeaningKk,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "left",
    },
    oqylyBody: {
      color: colors.scriptureTranslit,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "left",
    },
    arBody: {
      color: colors.scriptureTranslit,
      fontSize: 17,
      lineHeight: 29,
      textAlign: "right",
      writingDirection: "rtl",
    },
    muted: { color: colors.muted, fontSize: 15 },
  });
}
