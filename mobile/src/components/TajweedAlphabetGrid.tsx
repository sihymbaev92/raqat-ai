import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions, type TextStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { TAJWEED_ALPHABET_ROWS } from "../content/tajweedAlphabet";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import { isTajweedLetterSpeaking, speakTajweedLetter, stopMuftyatSpeech, warmTajweedLetterSpeech } from "../utils/tajweedMuftyatSpeech";
import { useAppLocale } from "../i18n/runtime";

const LIST_H_PAD = 14;
const WRAP_H_PAD = 12;
const COLS = 7;
const CELL_GAP = 6;
const MIN_CELL = 42;
/** Жуан (тәхфим) әріптер — тема error түсі әлсіз; бірдей қанық қызыл. */
const TAJWEED_HEAVY_RED = "#DC2626";

function tajweedArabicTextStyle(): Pick<TextStyle, "fontFamily" | "writingDirection" | "textAlign"> {
  const face = QURAN_BOOK_FONT_FACE.amiri;
  return {
    writingDirection: "rtl",
    textAlign: "right",
    ...(Platform.OS === "web"
      ? { fontFamily: `"${face}", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif` }
      : { fontFamily: face }),
  };
}

export function TajweedAlphabetGrid() {
  useAppLocale();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [speakingAr, setSpeakingAr] = useState<string | null>(null);
  const [speechFailed, setSpeechFailed] = useState(false);

  const cellSize = useMemo(() => {
    const gridInner = width - LIST_H_PAD * 2 - WRAP_H_PAD * 2;
    return Math.max(MIN_CELL, Math.floor((gridInner - CELL_GAP * (COLS - 1)) / COLS));
  }, [width]);
  const arFontSize = Math.max(20, Math.round(cellSize * 0.48));
  const nameFontSize = Math.max(8, Math.min(10, Math.round(cellSize * 0.19)));

  useEffect(() => {
    warmTajweedLetterSpeech();
    return () => stopMuftyatSpeech();
  }, []);

  const playLetter = useCallback(async (ar: string, nameKk: string) => {
    if (isTajweedLetterSpeaking(ar)) {
      stopMuftyatSpeech();
      setSpeakingAr(null);
      return;
    }
    setSpeechFailed(false);
    setSpeakingAr(ar);
    try {
      const ok = await speakTajweedLetter(ar, undefined, nameKk);
      if (!ok) setSpeechFailed(true);
    } finally {
      setSpeakingAr((cur) => (cur === ar ? null : cur));
    }
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{kk.tajweedGuide.alphabetTapHint}</Text>
      {speechFailed ? (
        <Text style={styles.speechErr}>{kk.tajweedGuide.alphabetSpeechError}</Text>
      ) : null}
      <View style={styles.legendRow}>
        <Text style={styles.legendHeavy}>{kk.tajweedGuide.alphabetLegendHeavy}</Text>
        <Text style={styles.legendLight}>{kk.tajweedGuide.alphabetLegendLight}</Text>
      </View>
      {TAJWEED_ALPHABET_ROWS.map((row, ri) => (
        <View key={`taj-row-${ri}`} style={[styles.gridRow, { gap: CELL_GAP }]}>
          {row.map((cell) => {
            const active = speakingAr === cell.ar;
            return (
              <Pressable
                key={cell.ar}
                style={({ pressed }) => [
                  styles.cell,
                  { width: cellSize, minHeight: Math.round(cellSize * 1.2) },
                  cell.heavy ? styles.cellHeavy : styles.cellLight,
                  pressed && styles.cellPressed,
                  active && styles.cellActive,
                ]}
                onPress={() => void playLetter(cell.ar, cell.nameKk)}
                accessibilityRole="button"
                accessibilityLabel={kk.tajweedGuide.listenLetterA11y(cell.nameKk, cell.ar)}
              >
                <Text
                  style={[
                    styles.cellAr,
                    tajweedArabicTextStyle(),
                    { fontSize: arFontSize, lineHeight: Math.round(arFontSize * 1.15) },
                    cell.heavy ? styles.cellArHeavy : styles.cellArLight,
                  ]}
                >
                  {cell.ar}
                </Text>
                <Text style={[styles.cellName, { fontSize: nameFontSize }]} numberOfLines={1}>
                  {cell.nameKk}
                </Text>
                <MaterialCommunityIcons
                  name={active ? "stop-circle-outline" : "volume-high"}
                  size={Math.max(14, Math.round(cellSize * 0.28))}
                  color={active ? colors.accent : colors.muted}
                  style={styles.cellIcon}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 14,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: WRAP_H_PAD,
      alignSelf: "stretch",
    },
    hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
    speechErr: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    legendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    legendHeavy: { color: TAJWEED_HEAVY_RED, fontSize: 11, fontWeight: "800" },
    legendLight: { color: colors.text, fontSize: 12, fontWeight: "700" },
    gridRow: {
      flexDirection: "row-reverse",
      justifyContent: "center",
      marginBottom: CELL_GAP,
    },
    cell: {
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 6,
      paddingHorizontal: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cellHeavy: {
      borderColor: TAJWEED_HEAVY_RED,
      backgroundColor: colors.bg,
    },
    cellLight: {
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    cellPressed: { opacity: 0.88 },
    cellActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    cellAr: {
      fontWeight: "700",
      marginBottom: 2,
      textAlign: "center",
    },
    cellArHeavy: { color: TAJWEED_HEAVY_RED, fontWeight: "800" },
    cellArLight: { color: colors.text },
    cellName: {
      color: colors.muted,
      fontWeight: "600",
      textAlign: "center",
      maxWidth: "100%",
    },
    cellIcon: { marginTop: 1 },
  });
}
