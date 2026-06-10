/**
 * RAHAT OMIR UI қаріпі (OFL, @expo-google-fonts).
 * Nunito — жұмсақ, дөңгелек, оқуға ыңғайлы; кириллица/латиница.
 */
import * as Font from "expo-font";
import {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

let loadPromise: Promise<void> | null = null;

export const BRAND_FONT_FACE = {
  medium: "Nunito_500Medium",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extrabold: "Nunito_800ExtraBold",
} as const;

export function loadBrandFont(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Font.loadAsync({
      Nunito_500Medium,
      Nunito_600SemiBold,
      Nunito_700Bold,
      Nunito_800ExtraBold,
    });
  }
  return loadPromise;
}
