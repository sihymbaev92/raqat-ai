import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { loadHadithCorpus, findHadith, type HadithCorpus } from "../storage/hadithCorpus";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getRaqatContentSecret } from "../config/raqatContentSecret";
import { fetchPlatformHadith } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithDetail">;

export function HadithDetailScreen({ route, navigation }: Props) {
  const { hadithId } = route.params;
  const { colors } = useAppTheme();
  const [corpus, setCorpus] = useState<HadithCorpus | null>(null);
  const [loading, setLoading] = useState(true);
  const [arabic, setArabic] = useState("");
  const [textKk, setTextKk] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await runWhenHeavyWorkAllowed();
        const c = await loadHadithCorpus();
        if (alive) setCorpus(c);
      } catch {
        if (alive) setCorpus(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hadithId]);

  const h = corpus ? findHadith(corpus, hadithId) : undefined;
  const narratorKk = h?.narratorKk?.trim() ?? "";

  useEffect(() => {
    if (!h) return;
    setArabic(h.arabic);
    setTextKk(h.textKk?.trim() ?? "");
  }, [h]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!h) return;
      const base = getRaqatApiBase()?.trim();
      const dbId = typeof h.dbId === "number" && h.dbId > 0 ? h.dbId : null;
      if (!base || !dbId) return;
      const bearer = await getValidAccessToken();
      const secret = getRaqatContentSecret() || undefined;
      try {
        const r = await fetchPlatformHadith(base, dbId, {
          timeoutMs: 12_000,
          contentSecret: secret,
          authorizationBearer: bearer || undefined,
        });
        if (cancelled || !r.ok || !r.hadith || typeof r.hadith !== "object") return;
        const row = r.hadith as { text_ar?: string | null; text_kk?: string | null };
        if (row.text_ar?.trim()) setArabic(row.text_ar.trim());
        if (row.text_kk?.trim()) setTextKk(row.text_kk.trim());
      } catch {
        /* офлайн */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [h]);

  useLayoutEffect(() => {
    if (h) {
      navigation.setOptions({ title: `${h.collectionNameKk} · №${h.reference}` });
    }
  }, [navigation, h]);

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!h) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{kk.hadith.notFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>{h.collectionNameKk}</Text>
      <Text style={styles.book}>{h.bookTitleKk}</Text>
      <Text style={styles.ref}>
        {kk.hadith.refLabel} №{h.reference}
      </Text>

      <Text style={styles.section}>{kk.hadith.arabic}</Text>
      <Text style={styles.arabic}>{arabic || h.arabic}</Text>

      <Text style={styles.section}>{kk.hadith.translationKk}</Text>
      <Text style={textKk ? styles.body : styles.bodyMuted}>
        {textKk || kk.hadith.translationPending}
      </Text>

      <Text style={styles.section}>{kk.hadith.narrator}</Text>
      <Text style={narratorKk ? styles.body : styles.bodyMuted}>
        {narratorKk || kk.hadith.narratorPending}
      </Text>

      {corpus ? (
        <View style={styles.prov}>
          <Text style={styles.provTitle}>{kk.hadith.provenance}</Text>
          <Text style={styles.provTxt}>{corpus.provenance.origin}</Text>
          <Text style={styles.provTxt}>{corpus.provenance.evidenceKk}</Text>
          {corpus.provenance.licenseHint ? (
            <Text style={styles.provTxt}>{corpus.provenance.licenseHint}</Text>
          ) : null}
        </View>
      ) : null}
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
      padding: 24,
    },
    err: { color: colors.error, textAlign: "center" },
    meta: { color: colors.accent, fontWeight: "700", fontSize: 14 },
    book: { color: colors.muted, fontSize: 13, marginTop: 4 },
    ref: { color: colors.muted, fontSize: 12, marginBottom: 8 },
    section: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 6,
    },
    arabic: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 28,
      writingDirection: "rtl",
      textAlign: "right",
    },
    body: { color: colors.text, fontSize: 16, lineHeight: 26 },
    bodyMuted: { color: colors.muted, fontSize: 15, lineHeight: 24, fontStyle: "italic" },
    prov: {
      marginTop: 20,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    provTitle: { color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
    provTxt: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  });
}
