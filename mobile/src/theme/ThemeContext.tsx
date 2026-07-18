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
const DEFAULT_THEME_SCHEME: ThemeSchemeId = "light";
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeScheme, setThemeSchemeState] = useState<ThemeSchemeId>(DEFAULT_THEME_SCHEME);
  const [colorPalette, setColorPaletteState] = useState<ColorPaletteId>(DEFAULT_COLOR_PALETTE);

  useEffect(() => {
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
      if (isColorPaletteId(pal)) {
        setColorPaletteState(pal);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY_PALETTE, DEFAULT_COLOR_PALETTE);
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
