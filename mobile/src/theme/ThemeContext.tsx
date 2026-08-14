import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { type ThemeColors } from "./colors";
import {
  isColorPaletteId,
  resolveThemeColors,
  type ColorPaletteId,
} from "./themePalettes";
import {
  isThemeSchemeId,
  migrateLegacyThemeMode,
  isThemeSchemeDark,
  type ThemeSchemeId,
} from "./themeSchemes";

const STORAGE_KEY_LEGACY = "raqat_theme_mode";
const STORAGE_KEY_SCHEME = "raqat_theme_scheme";
const STORAGE_KEY_PALETTE = "raqat_color_palette";
/** Бұрынғы gold әдепкін күлгінге қайтару — бір рет. */
const STORAGE_KEY_PALETTE_VIOLET_DEFAULT = "raqat_palette_default_violet_v1";
const DEFAULT_THEME_SCHEME: ThemeSchemeId = "light";
/** Күлгін — әдепкі акцент. */
const DEFAULT_COLOR_PALETTE: ColorPaletteId = "violet";

type Ctx = {
  colors: ThemeColors;
  themeScheme: ThemeSchemeId;
  colorPalette: ColorPaletteId;
  isDark: boolean;
  setThemeScheme: (s: ThemeSchemeId) => void;
  setColorPalette: (p: ColorPaletteId) => void;
};

export const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({
  children,
  initialThemeScheme,
  initialColorPalette,
}: {
  children: React.ReactNode;
  initialThemeScheme?: ThemeSchemeId;
  initialColorPalette?: ColorPaletteId;
}) {
  const [themeScheme, setThemeSchemeState] = useState<ThemeSchemeId>(
    initialThemeScheme ?? DEFAULT_THEME_SCHEME
  );
  const [colorPalette, setColorPaletteState] = useState<ColorPaletteId>(
    initialColorPalette ?? DEFAULT_COLOR_PALETTE
  );
  const bootHydratedRef = React.useRef(initialThemeScheme != null || initialColorPalette != null);

  useEffect(() => {
    if (bootHydratedRef.current) return;
    (async () => {
      const schemeRaw = await AsyncStorage.getItem(STORAGE_KEY_SCHEME);
      if (isThemeSchemeId(schemeRaw)) {
        setThemeSchemeState(schemeRaw);
      } else {
        const legacy = await AsyncStorage.getItem(STORAGE_KEY_LEGACY);
        const systemDark = Appearance.getColorScheme() === "dark";
        const nextScheme = migrateLegacyThemeMode(legacy, systemDark);
        setThemeSchemeState(nextScheme);
        await AsyncStorage.setItem(STORAGE_KEY_SCHEME, nextScheme);
      }
      const pal = await AsyncStorage.getItem(STORAGE_KEY_PALETTE);
      const restoredViolet = await AsyncStorage.getItem(STORAGE_KEY_PALETTE_VIOLET_DEFAULT);
      // Бұрынғы әдепкі gold-ты күлгінге қайтару (пайдаланушы кейін алтынды өзі таңдай алады).
      if (restoredViolet !== "1" && (pal === "gold" || !isColorPaletteId(pal))) {
        setColorPaletteState("violet");
        await AsyncStorage.setItem(STORAGE_KEY_PALETTE, "violet");
        await AsyncStorage.setItem(STORAGE_KEY_PALETTE_VIOLET_DEFAULT, "1");
      } else if (isColorPaletteId(pal)) {
        setColorPaletteState(pal);
        if (restoredViolet !== "1") {
          await AsyncStorage.setItem(STORAGE_KEY_PALETTE_VIOLET_DEFAULT, "1");
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEY_PALETTE, DEFAULT_COLOR_PALETTE);
        await AsyncStorage.setItem(STORAGE_KEY_PALETTE_VIOLET_DEFAULT, "1");
      }
    })();
  }, []);

  const setThemeScheme = useCallback((s: ThemeSchemeId) => {
    setThemeSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY_SCHEME, s).catch(() => {});
  }, []);

  const setColorPalette = useCallback((p: ColorPaletteId) => {
    setColorPaletteState(p);
    AsyncStorage.setItem(STORAGE_KEY_PALETTE, p).catch(() => {});
  }, []);

  const isDark = useMemo(() => isThemeSchemeDark(themeScheme), [themeScheme]);
  const colors = useMemo(
    () => resolveThemeColors(themeScheme, colorPalette),
    [themeScheme, colorPalette]
  );

  const value = useMemo(
    () => ({ colors, themeScheme, colorPalette, isDark, setThemeScheme, setColorPalette }),
    [colors, themeScheme, colorPalette, isDark, setThemeScheme, setColorPalette]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Boot: тақырыпты бірінші кадрға дейін оқу (қосымша re-render азайту). */
export async function readBootThemePrefs(): Promise<{
  themeScheme: ThemeSchemeId;
  colorPalette: ColorPaletteId;
}> {
  const schemeRaw = await AsyncStorage.getItem(STORAGE_KEY_SCHEME);
  let themeScheme: ThemeSchemeId = DEFAULT_THEME_SCHEME;
  if (isThemeSchemeId(schemeRaw)) {
    themeScheme = schemeRaw;
  } else {
    const legacy = await AsyncStorage.getItem(STORAGE_KEY_LEGACY);
    const systemDark = Appearance.getColorScheme() === "dark";
    themeScheme = migrateLegacyThemeMode(legacy, systemDark);
  }

  const pal = await AsyncStorage.getItem(STORAGE_KEY_PALETTE);
  const restoredViolet = await AsyncStorage.getItem(STORAGE_KEY_PALETTE_VIOLET_DEFAULT);
  let colorPalette: ColorPaletteId = DEFAULT_COLOR_PALETTE;
  if (restoredViolet !== "1" && (pal === "gold" || !isColorPaletteId(pal))) {
    colorPalette = "violet";
  } else if (isColorPaletteId(pal)) {
    colorPalette = pal;
  }

  return { themeScheme, colorPalette };
}
