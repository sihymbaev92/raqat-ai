const fs = require("fs");
const src = fs.readFileSync("d:/opt/raqat-ai/mobile/src/screens/QuranSurahScreen.tsx", "utf8").split(/\r?\n/);
const body = src.slice(2123, 2742).join("\n");
const header = `import React from "react";
import { View, Text, Modal, Switch, ScrollView, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";
import { QURAN_READER_ARABIC_ONLY } from "../quran/quranReaderModePolicy";
import {
  QURAN_RECITER_OPTIONS,
  QURAN_RECITER_GROUP_ORDER,
  quranReciterGroupLabelKk,
} from "../config/quranReciters";
import {
  QURAN_ARABIC_FONT_PRESETS,
  type QuranArabicFontPresetId,
} from "../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";
import {
  clampMushafTextScale,
  MUSHAF_TEXT_SCALE_MAX,
  MUSHAF_TEXT_SCALE_MIN,
  MUSHAF_TEXT_SCALE_STEP,
} from "../quran/mushafTextScale";
import type { MushafDensityId } from "../config/mushafConfig";
import {
  QURAN_READER_RECITER_KEY,
  QURAN_READER_ARABIC_FONT_KEY,
  QURAN_READER_MUSHAF_TEXT_SCALE_KEY,
  setAyahMarkerStyle,
  setMushafDensity,
  setQuranReaderNavMode,
  setQuranArabicScriptEdition,
  setQuranReaderShowArabic,
  setQuranReaderShowMeaning,
  setQuranReaderShowTranslit,
  setQuranReadingTheme,
  type AyahMarkerStyleId,
  type QuranReaderNavMode,
} from "../storage/quranReaderPrefs";
import type { QuranSurahScreenStyles } from "../quran/quranSurahScreenStyles";

export type ReaderSettingsAccordionKey =
  | "content"
  | "readingTheme"
  | "reciter"
  | "arabicFont"
  | "arabicScript"
  | "nav"
  | "density"
  | "ayahMarker"
  | "pageEdition"
  | "scale"
  | "tajweed";

export type QuranSurahReaderSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  isDark: boolean;
  mushafLayout: boolean;
  windowHeight: number;
  readerSettingsAccordion: ReaderSettingsAccordionKey | null;
  toggleReaderSettingsAccordion: (key: ReaderSettingsAccordionKey) => void;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  setReaderContentLayer: (layer: "arabic" | "translit" | "meaning", value: boolean) => void;
  readingThemeId: QuranReadingThemeId;
  setReadingThemeId: (id: QuranReadingThemeId) => void;
  showReciterLocaleFallbackNote: boolean;
  reciterEdition: string;
  setReciterEdition: (edition: string) => void;
  arabicFontPreset: QuranArabicFontPresetId;
  setArabicFontPreset: (id: QuranArabicFontPresetId) => void;
  arabicScriptEdition: QuranArabicScriptEditionId;
  setArabicScriptEdition: (id: QuranArabicScriptEditionId) => void;
  arabicSourcesExpanded: boolean;
  setArabicSourcesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveReaderNavMode: QuranReaderNavMode;
  setReaderNavMode: (mode: QuranReaderNavMode) => void;
  mushafDensity: MushafDensityId;
  setMushafDensityState: (d: MushafDensityId) => void;
  ayahMarkerStyleId: AyahMarkerStyleId;
  setAyahMarkerStyleIdState: (id: AyahMarkerStyleId) => void;
  mushafTextScale: number;
  setMushafTextScale: (n: number) => void;
  showTajweedColors: boolean;
  onToggleTajweedColors: (next: boolean) => void | Promise<void>;
  tajweedLoading: boolean;
  onOpenTajweedLegend: () => void;
};

export function QuranSurahReaderSettingsSheet(props: QuranSurahReaderSettingsSheetProps) {
  const {
    visible,
    onClose,
    styles,
    colors,
    isDark,
    mushafLayout,
    windowHeight,
    readerSettingsAccordion,
    toggleReaderSettingsAccordion,
    showReaderArabic,
    showReaderTranslit,
    showReaderMeaning,
    setReaderContentLayer,
    readingThemeId,
    setReadingThemeId,
    showReciterLocaleFallbackNote,
    reciterEdition,
    setReciterEdition,
    arabicFontPreset,
    setArabicFontPreset,
    arabicScriptEdition,
    setArabicScriptEdition,
    arabicSourcesExpanded,
    setArabicSourcesExpanded,
    effectiveReaderNavMode,
    setReaderNavMode,
    mushafDensity,
    setMushafDensityState,
    ayahMarkerStyleId,
    setAyahMarkerStyleIdState,
    mushafTextScale,
    setMushafTextScale,
    showTajweedColors,
    onToggleTajweedColors,
    tajweedLoading,
    onOpenTajweedLegend,
  } = props;
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sheetMaxH = Math.min(520, (windowHeight || winH) * 0.58);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
`;
const footer = `    </Modal>
  );
}
`;
const patched = body
  .replace(/closeReaderSettings/g, "onClose")
  .replace(/setTajweedLegendOpen\(true\)/g, "onOpenTajweedLegend()")
  .replace(/Math\.min\(520, windowHeight \* 0\.58\)/g, "sheetMaxH");
const out = header + patched + footer;
fs.writeFileSync("d:/opt/raqat-ai/mobile/src/components/quran/QuranSurahReaderSettingsSheet.tsx", out);
console.log("written", out.split(/\n/).length, "lines");
