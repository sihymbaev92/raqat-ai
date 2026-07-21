import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions, type TextStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useAppLocale } from "../i18n/runtime";
import { TAJWEED_ALPHABET_ROWS, type TajweedGridCell } from "../content/tajweedAlphabet";
import { tajweedLetterDisplayName } from "../content/tajweedLetterNamesLocale";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import {
  isTajweedLetterSpeaking,
  speakTajweedLetter,
  stopMuftyatSpeech,
  warmTajweedLetterSpeech,
} from "../utils/tajweedMuftyatSpeech";

const LIST_H_PAD = 14;
const WRAP_H_PAD = 12;
const COLS = 7;
const CELL_GAP = 6;
const MIN_CELL = 42;
/** Жуан (тәхфим) — оқулықтағы қызыл белгі */
const HEAVY_LETTER = "#DC2626";
const HEAVY_SURFACE = "rgba(220, 38, 38, 0.12)";
const HEAVY_BORDER = "rgba(220, 38, 38, 0.55)";

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
  const kk = useI18n();
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [speakingAr, setSpeakingAr] = useState<string | null>(null);
  const [selected, setSelected] = useState<TajweedGridCell | null>(null);
  const [speechFailed, setSpeechFailed] = useState(false);

  const letterName = useCallback(
    (nameKk: string) => tajweedLetterDisplayName(nameKk, locale, tr),
    [locale, tr]
  );

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

  const playLetter = useCallback(async (cell: TajweedGridCell) => {
    setSelected(cell);
    if (isTajweedLetterSpeaking(cell.ar)) {
      stopMuftyatSpeech();
      setSpeakingAr(null);
      return;
    }
    setSpeechFailed(false);
    setSpeakingAr(cell.ar);
    try {
      const ok = await speakTajweedLetter(cell.ar, undefined, cell.nameKk);
      if (!ok) setSpeechFailed(true);
    } finally {
      setSpeakingAr((cur) => (cur === cell.ar ? null : cur));
    }
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{kk.tajweedGuide.alphabetTapHint}</Text>
      <View style={styles.legendRow} accessibilityRole="summary">
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendSwatchHeavy]} />
          <Text style={styles.legendLabel}>{kk.tajweedGuide.alphabetLegendHeavy}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendSwatchLight]} />
          <Text style={styles.legendLabel}>{kk.tajweedGuide.alphabetLegendLight}</Text>
        </View>
      </View>
      {speechFailed ? (
        <Text style={styles.speechErr}>{kk.tajweedGuide.alphabetSpeechError}</Text>
      ) : null}
      {TAJWEED_ALPHABET_ROWS.map((row, ri) => (
        <View key={`taj-row-${ri}`} style={[styles.gridRow, { gap: CELL_GAP }]}>
          {row.map((cell) => {
            const active = speakingAr === cell.ar;
            const picked = selected?.ar === cell.ar;
            const letterColor = cell.heavy ? HEAVY_LETTER : colors.text;
            return (
              <Pressable
                key={cell.ar}
                style={({ pressed }) => [
                  styles.cell,
                  { width: cellSize, minHeight: Math.round(cellSize * 1.2) },
                  cell.heavy && styles.cellHeavy,
                  pressed && styles.cellPressed,
                  (active || picked) && styles.cellActive,
                  (active || picked) && cell.heavy && styles.cellActiveHeavy,
                ]}
                onPress={() => void playLetter(cell)}
                accessibilityRole="button"
                accessibilityLabel={kk.tajweedGuide.listenLetterA11y(letterName(cell.nameKk), cell.ar)}
              >
                <Text
                  style={[
                    styles.cellAr,
                    tajweedArabicTextStyle(),
                    {
                      fontSize: arFontSize,
                      lineHeight: Math.round(arFontSize * 1.15),
                      color: letterColor,
                    },
                  ]}
                >
                  {cell.ar}
                </Text>
                <Text
                  style={[
                    styles.cellName,
                    { fontSize: nameFontSize, color: cell.heavy ? HEAVY_LETTER : colors.muted },
                  ]}
                  numberOfLines={1}
                >
                  {letterName(cell.nameKk)}
                </Text>
                <MaterialCommunityIcons
                  name={active ? "stop-circle-outline" : "volume-high"}
                  size={Math.max(14, Math.round(cellSize * 0.28))}
                  color={active ? (cell.heavy ? HEAVY_LETTER : colors.accent) : colors.muted}
                  style={styles.cellIcon}
                />
              </Pressable>
            );
          })}
        </View>
      ))}

      {selected ? (
        <View style={styles.detailCard} accessibilityLiveRegion="polite">
          <Text
            style={[
              styles.detailAr,
              tajweedArabicTextStyle(),
              { color: selected.heavy ? HEAVY_LETTER : colors.text },
            ]}
          >
            {selected.ar}
          </Text>
          <View style={styles.detailBody}>
            <Text style={styles.detailName}>{letterName(selected.nameKk)}</Text>
            <Text style={[styles.detailSpeech, tajweedArabicTextStyle()]}>{selected.speechAr}</Text>
            <Text style={styles.detailExampleLabel}>{kk.tajweedGuide.alphabetExampleLabel}</Text>
            <Text style={[styles.detailExample, tajweedArabicTextStyle()]}>{selected.example}</Text>
            <Text style={[styles.detailTone, selected.heavy && styles.detailToneHeavy]}>
              {selected.heavy ? kk.tajweedGuide.alphabetToneHeavy : kk.tajweedGuide.alphabetToneLight}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.detailPlaceholder}>{kk.tajweedGuide.alphabetSelectHint}</Text>
      )}
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
    hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 14,
      marginBottom: 10,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 3,
      borderWidth: StyleSheet.hairlineWidth,
    },
    legendSwatchHeavy: {
      backgroundColor: HEAVY_LETTER,
      borderColor: HEAVY_LETTER,
    },
    legendSwatchLight: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    legendLabel: { color: colors.text, fontSize: 13, fontWeight: "700" },
    speechErr: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    gridRow: {
      flexDirection: "row-reverse",
      justifyContent: "center",
      marginBottom: CELL_GAP,
    },
    cell: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingVertical: 6,
      paddingHorizontal: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cellHeavy: {
      borderColor: HEAVY_BORDER,
      backgroundColor: HEAVY_SURFACE,
    },
    cellPressed: { opacity: 0.88 },
    cellActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    cellActiveHeavy: {
      borderColor: HEAVY_LETTER,
      backgroundColor: "rgba(220, 38, 38, 0.2)",
    },
    cellAr: {
      color: colors.text,
      fontWeight: "700",
      marginBottom: 2,
      textAlign: "center",
    },
    cellName: {
      color: colors.muted,
      fontWeight: "600",
      textAlign: "center",
      maxWidth: "100%",
    },
    cellIcon: { marginTop: 1 },
    detailCard: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.bg,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    detailAr: {
      color: colors.text,
      fontSize: 42,
      lineHeight: 52,
      fontWeight: "700",
      minWidth: 52,
      textAlign: "center",
    },
    detailBody: { flex: 1, gap: 2 },
    detailName: { color: colors.text, fontSize: 17, fontWeight: "800" },
    detailSpeech: {
      color: colors.accent,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "700",
      textAlign: "left",
      writingDirection: "rtl",
    },
    detailExampleLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 6,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    detailExample: {
      color: colors.text,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "700",
      textAlign: "left",
      writingDirection: "rtl",
    },
    detailTone: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: "700" },
    detailToneHeavy: { color: HEAVY_LETTER },
    detailPlaceholder: {
      marginTop: 10,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
    },
  });
}
