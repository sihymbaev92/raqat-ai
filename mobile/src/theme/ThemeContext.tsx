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
import { darkColors, lightColors, type ThemeColors } from "./colors";

const STORAGE_KEY = "raqat_theme_mode";

export type ThemeMode = "dark" | "light" | "system";

type Ctx = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark" | null | undefined>(
    () => Appearance.getColorScheme()
  );

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === "dark" || raw === "light" || raw === "system") {
        setModeState(raw);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return systemScheme === "dark";
  }, [mode, systemScheme]);
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, mode, isDark, setMode }),
    [colors, mode, isDark, setMode]
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
