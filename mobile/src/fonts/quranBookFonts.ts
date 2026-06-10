/**
 * Құран «кітап» қаріптері (OFL, @expo-google-fonts).
 * `npm install` кейін Metro жинайды; жүктелмегенге дейін пресет әдепкі қаріпке түседі.
 */
import * as Font from "expo-font";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Lateef_400Regular } from "@expo-google-fonts/lateef";
import { ScheherazadeNew_400Regular } from "@expo-google-fonts/scheherazade-new";

let loadPromise: Promise<void> | null = null;

/** Expo Google Fonts тіркеген атаулар — `fontFamily` ретінде дәл осылай. */
export const QURAN_BOOK_FONT_FACE = {
  amiri: "Amiri_400Regular",
  lateef: "Lateef_400Regular",
  scheherazade: "ScheherazadeNew_400Regular",
} as const;

export function loadQuranBookFonts(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Font.loadAsync({
      Amiri_400Regular,
      Lateef_400Regular,
      ScheherazadeNew_400Regular,
    });
  }
  return loadPromise;
}
