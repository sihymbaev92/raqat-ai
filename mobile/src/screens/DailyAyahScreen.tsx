import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { getDailyAyahRef, getDailyGlobalAyahOneBased } from "../data/quranAyahCounts";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentSecret } from "../config/raqatContentSecret";
import { fetchPlatformQuranAyah } from "../services/platformApiClient";
import { loadSurahAyahsCache, type CachedAyah } from "../storage/quranSurahCache";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";

type Props = NativeStackScreenProps<MoreStackParamList, "DailyAyah">;

type AlquranAyahJson = {
  code?: number;
  data?: { text?: string; surah?: { englishName?: string; name?: string } };
};

type ApiAyahRow = {
  text_ar?: string | null;
  text_kk?: string | null;
  text_ru?: string | null;
  text_en?: string | null;
  translit?: string | null;
};

async function fetchAyahTextAlquran(globalOneBased: number): Promise<{
  text: string;
  englishName: string;
  arabicName: string;
}> {
  const r = await fetch(`https://api.alquran.cloud/v1/ayah/${globalOneBased}`);
  const j = (await r.json()) as AlquranAyahJson;
  const text = j?.data?.text;
  if (j?.code !== 200 || typeof text !== "string" || !text.trim()) {
    throw new Error(kk.dailyAyah.error);
  }
  const en = j.data?.surah?.englishName ?? "";
  const ar = j.data?.surah?.name ?? "";
  return { text: text.trim(), englishName: en, arabicName: ar };
}

function mergeArabicAndTranslation(
  cachedAyah: CachedAyah | undefined,
  apiRow: ApiAyahRow | undefined
): {
  arabic: string;
  translation: string | null;
  translationIsKk: boolean;
} {
  const arApi = (apiRow?.text_ar ?? "").trim();
  const arCache = (cachedAyah?.text ?? "").trim();
  const arabic = arApi || arCache;

  const kkApi = (apiRow?.text_kk ?? "").trim();
  const kkCache = (cachedAyah?.textKk ?? "").trim();
  const kk = kkApi || kkCache;

  if (kk) {
    return { arabic, translation: kk, translationIsKk: true };
  }

  const ruz = (apiRow?.text_ru ?? "").trim();
  const enz = (apiRow?.text_en ?? "").trim();
  const fallback = ruz || enz || null;
  return {
    arabic,
    translation: fallback,
    translationIsKk: false,
  };
}

export function DailyAyahScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [arabic, setArabic] = useState("");
  const [translationLine, setTranslationLine] = useState<string | null>(null);
  const [translationIsKk, setTranslationIsKk] = useState(true);
  const [ref, setRef] = useState(() => getDailyAyahRef());
  const [globalN, setGlobalN] = useState(() => getDailyGlobalAyahOneBased());
  const [metaEn, setMetaEn] = useState("");
  const [metaAr, setMetaAr] = useState("");

  const load = useCallback(async () => {
    const g = getDailyGlobalAyahOneBased();
    const { surah, ayah } = getDailyAyahRef();
    setRef({ surah, ayah });
    setGlobalN(g);

    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const secret = getRaqatContentSecret();

    let cachedPayload = await loadSurahAyahsCache(surah);
    let cachedAyah = cachedPayload?.ayahs?.find((a) => a.numberInSurah === ayah);
    /** Араб мәтіні кеште жоқ болса ғана ауыр сидинг — әйтпесе күнделікті аят қатып тұрады */
    if (!(cachedAyah?.text ?? "").trim()) {
      try {
        await seedBundledQuranCachesIfNeeded();
      } catch {
        /* сидинг опциялы */
      }
      cachedPayload = await loadSurahAyahsCache(surah);
      cachedAyah = cachedPayload?.ayahs?.find((a) => a.numberInSurah === ayah);
    }

    let apiRow: ApiAyahRow | undefined;
    if (base) {
      try {
        const r = await fetchPlatformQuranAyah(base, surah, ayah, {
          contentSecret: secret || undefined,
        });
        if (r.ok && r.ayah && typeof r.ayah === "object") {
          apiRow = r.ayah as ApiAyahRow;
        }
      } catch {
        /* API жоқ — кеш пен alquran қалпы */
      }
    }

    const merged = mergeArabicAndTranslation(cachedAyah, apiRow);

    if (merged.arabic) {
      setArabic(merged.arabic);
      setTranslationLine(merged.translation);
      setTranslationIsKk(merged.translationIsKk);
      setMetaEn(`Surah ${surah}`);
      setMetaAr("");
      setErr(null);
      return;
    }

    if (apiOnly) {
      setErr(kk.quran.apiOnlyRequired);
      setArabic("");
      setTranslationLine(null);
      setTranslationIsKk(true);
      return;
    }

    try {
      const fb = await fetchAyahTextAlquran(g);
      setArabic(fb.text);
      setTranslationLine(null);
      setTranslationIsKk(true);
      setMetaEn(fb.englishName);
      setMetaAr(fb.arabicName);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : kk.dailyAyah.error);
      setArabic("");
      setTranslationLine(null);
      setTranslationIsKk(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openSurah = () => {
    navigation.navigate("QuranSurah", {
      surahNumber: ref.surah,
      englishName: metaEn || `Сүре ${ref.surah}`,
      arabicName: metaAr || "",
    });
  };

  const styles = makeStyles(colors);

  if (loading && !arabic) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>{kk.dailyAyah.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.h1}>{kk.dailyAyah.title}</Text>
      <Text style={styles.ref}>
        {kk.dailyAyah.refLabel(ref.surah, ref.ayah)} · #{globalN}
      </Text>
      <Text style={styles.sourceHint}>{kk.dailyAyah.sourceHint}</Text>
      {err ? <Text style={styles.err}>{err}</Text> : null}

      {arabic ? (
        <>
          <Text style={styles.arabic}>{arabic}</Text>
          {translationLine ? (
            <>
              {!translationIsKk ? (
                <Text style={styles.fallbackNote}>{kk.dailyAyah.fallbackTranslationNote}</Text>
              ) : null}
              <Text style={styles.translation}>{translationLine}</Text>
            </>
          ) : (
            <Text style={styles.noKk}>{kk.dailyAyah.noKkHint}</Text>
          )}
        </>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
        onPress={openSurah}
      >
        <Text style={styles.btnTxt}>{kk.dailyAyah.openSurah}</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg,
    },
    muted: { color: colors.muted, marginTop: 12 },
    h1: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
    ref: { color: colors.muted, fontSize: 13, marginBottom: 6 },
    sourceHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 12 },
    err: { color: colors.error, marginBottom: 12 },
    arabic: {
      fontSize: 22,
      lineHeight: 40,
      color: colors.text,
      textAlign: "right",
      writingDirection: "rtl",
      marginBottom: 12,
    },
    fallbackNote: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.muted,
      fontStyle: "italic",
      marginBottom: 6,
    },
    translation: { fontSize: 15, lineHeight: 24, color: colors.text, marginBottom: 12 },
    noKk: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
      marginBottom: 16,
    },
    btn: {
      marginTop: 8,
      backgroundColor: colors.card,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    btnTxt: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  });
}
