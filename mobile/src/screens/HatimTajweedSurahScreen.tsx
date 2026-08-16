import React, { useEffect, useMemo, useState } from "react";
import { useAppLocale } from "../i18n/runtime";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { KhatmTajweedAyahScroll } from "../components/quran/KhatmTajweedAyahScroll";
import {
  ensureQuranTajweedAssetLoaded,
  loadQuranTajweedCachedAyahs,
} from "../services/quranTajweedAsset";
import type { CachedAyah } from "../storage/quranSurahCache";
import { useQuranReaderOrientation } from "../hooks/useQuranReaderOrientation";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { surahTitleForLocale } from "../constants/surahTitleKk";

const CREAM_BAR = "#F5F2EB";
const INK = "#3E2723";

type Props = NativeStackScreenProps<MoreStackParamList, "HatimTajweedSurah">;

/**
 * Flutter `SurahDetailsScreen` — офлайн `[h[` / `<font>` тәжуид түстері.
 */
export function HatimTajweedSurahScreen({ navigation, route }: Props) {
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { surahNumber, englishName, arabicName } = route.params;
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useAppTheme();
  const { allowRotation, toggleAllowRotation } = useQuranReaderOrientation();
  const [loading, setLoading] = useState(true);
  const [ayahs, setAyahs] = useState<CachedAyah[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await ensureQuranTajweedAssetLoaded();
        const rows = await loadQuranTajweedCachedAyahs(surahNumber);
        if (alive) setAyahs(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [surahNumber]);

  const title = surahTitleForLocale(surahNumber, locale, { englishName, arabicName, tr });
  const styles = useMemo(() => makeStyles(isDark), [isDark]);
  const barInk = isDark ? "#F5F2EB" : INK;
  const mushafAyahTxt = useMemo(
    () => ({
      fontSize: 25,
      lineHeight: 47,
      color: isDark ? "#F5F2EB" : INK,
      textAlign: "right" as const,
      writingDirection: "rtl" as const,
    }),
    [isDark]
  );

  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <View style={styles.backBtn} />
        <View style={styles.titleCol}>
          <Text style={styles.appBarTitle} numberOfLines={1}>
            {title}
          </Text>
          {arabicName ? (
            <Text style={styles.appBarArabic} numberOfLines={1}>
              {arabicName}
            </Text>
          ) : null}
        </View>
        {Platform.OS !== "web" ? (
          <Pressable
            onPress={() => void toggleAllowRotation()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={kk.quran.readerAllowRotationTopA11y}
            accessibilityState={{ selected: allowRotation }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          >
            <MaterialIcons
              name={allowRotation ? "screen-rotation" : "screen-lock-portrait"}
              size={22}
              color={colors.accent}
            />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={barInk} />
        </View>
      ) : (
        <KhatmTajweedAyahScroll
          ayahs={ayahs}
          arabicScriptEdition="madinah"
          showTajweedColors
          isDark={isDark}
          mushafAyahTxt={mushafAyahTxt}
        />
      )}
    </View>
  );
}

function makeStyles(isDark: boolean) {
  const bar = isDark ? "#1a1a1a" : CREAM_BAR;
  const ink = isDark ? "#F5F2EB" : INK;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? "#111" : "#FDFBF7" },
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      paddingHorizontal: 8,
      backgroundColor: bar,
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    titleCol: { flex: 1, alignItems: "stretch", minWidth: 0, paddingHorizontal: 4 },
    appBarTitle: { fontSize: 17, fontWeight: "800", color: ink, textAlign: "center" },
    appBarArabic: {
      fontSize: 14,
      color: ink,
      opacity: 0.72,
      marginTop: 2,
      alignSelf: "stretch",
      textAlign: "right",
      writingDirection: "rtl",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
  });
}
