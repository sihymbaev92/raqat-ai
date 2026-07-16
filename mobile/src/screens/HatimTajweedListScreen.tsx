import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { useAppLocale } from "../i18n/runtime";
import {
  ensureQuranTajweedAssetLoaded,
  getQuranTajweedSurahs,
  type QuranTajweedSurah,
} from "../services/quranTajweedAsset";

const CREAM_BG = "#FDFBF7";
const CREAM_BAR = "#F5F2EB";
const INK = "#3E2723";
const MUTED = "#8D6E63";

type Props = NativeStackScreenProps<MoreStackParamList, "HatimTajweedList">;

/**
 * Flutter `QuranSurahListScreen` — 114 сүре, `assets/quran_tajweed.json` офлайн.
 */
export function HatimTajweedListScreen({ navigation }: Props) {
  useAppLocale();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surahs, setSurahs] = useState<QuranTajweedSurah[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await ensureQuranTajweedAssetLoaded();
        if (!alive) return;
        setSurahs(getQuranTajweedSurahs());
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "JSON load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openSurah = useCallback(
    (surah: QuranTajweedSurah) => {
      navigation.navigate("HatimTajweedSurah", {
        surahNumber: surah.number,
        englishName: surah.englishName,
        arabicName: surah.name,
      });
    },
    [navigation]
  );

  const styles = useMemo(() => makeStyles(isDark), [isDark]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={kk.common.back}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={INK} />
        </Pressable>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          Хатым (114 Сүре)
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={INK} size="large" />
          <Text style={styles.hint}>Құран жүктелуде…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={surahs}
          keyExtractor={(item) => `tajweed-surah-${item.number}`}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openSurah(item)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.englishName ?? item.number}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{item.number}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.englishName ?? ""}</Text>
                <Text style={styles.cardSub}>
                  {item.englishNameTranslation ?? ""} • {(item.ayahs ?? []).length} аят
                </Text>
              </View>
              <Text style={styles.cardArabic}>{item.name ?? ""}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(isDark: boolean) {
  const bg = isDark ? "#111" : CREAM_BG;
  const bar = isDark ? "#1a1a1a" : CREAM_BAR;
  const card = isDark ? "#1c1c1e" : "#fff";
  const ink = isDark ? "#F5F2EB" : INK;
  const muted = isDark ? "rgba(245,242,235,0.65)" : MUTED;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      paddingHorizontal: 8,
      backgroundColor: bar,
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    appBarTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: ink },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
    hint: { color: muted, fontSize: 14 },
    error: { color: "#c62828", textAlign: "center", lineHeight: 22 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      elevation: 1,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: bar,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTxt: { color: ink, fontWeight: "800" },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { color: ink, fontWeight: "800", fontSize: 15 },
    cardSub: { color: muted, fontSize: 12, marginTop: 2 },
    cardArabic: { color: muted, fontSize: 18, fontWeight: "500", maxWidth: 120 },
  });
}
