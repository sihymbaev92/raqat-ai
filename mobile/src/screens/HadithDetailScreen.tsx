import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { loadHadithCorpus, findHadith, hadithTextForLocale, type HadithCorpus } from "../storage/hadithCorpus";
import { useAppLocale } from "../i18n/runtime";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";
import { resolveHadithGradeText } from "../content/hadithGrade";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithDetail">;

export function HadithDetailScreen({ route, navigation }: Props) {
  const { hadithId } = route.params;
  const { colors } = useAppTheme();
  const appLocale = useAppLocale();
  const [corpus, setCorpus] = useState<HadithCorpus | null>(null);
  const [loading, setLoading] = useState(true);

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
  const gradeText = resolveHadithGradeText(h?.grade);
  const sourceOnly = Boolean(h?.sourceOnly ?? (corpus?.version ?? 0) >= 4);
  const citation = h?.sourceCitationKk?.trim() || (h ? `${h.collectionNameKk}, хадис № ${h.reference}` : "");
  const sourceLabel = h?.kkSourceLabel?.trim() || h?.kkSourceSite?.trim() || "";
  const sourceUrl = h?.kkSourceUrl?.trim() || "";

  useLayoutEffect(() => {
    if (h) {
      const coll = h.collectionNameKk ?? kk.hadith.title;
      const ref = h.reference ?? "";
      navigation.setOptions({ title: `${coll} · №${ref}` });
    }
  }, [navigation, h]);

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
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

  const openSource = () => {
    if (!sourceUrl) return;
    void Linking.openURL(sourceUrl).catch(() => {
      /* елемеу */
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>{h.collectionNameKk ?? ""}</Text>
      {h.bookTitleKk?.trim() ? <Text style={styles.book}>{h.bookTitleKk}</Text> : null}
      <Text style={styles.ref}>
        {kk.hadith.refLabel} №{h.reference}
      </Text>
      <Text style={styles.section}>{kk.hadith.reliabilityTitle}</Text>
      <View style={styles.badgesRow}>
        <Text style={styles.badge}>{kk.hadith.sourceBadge(h.collectionNameKk || "—")}</Text>
        <Text style={styles.badge}>{kk.hadith.gradeBadge(gradeText)}</Text>
      </View>

      <Text style={styles.section}>{kk.hadith.arabic}</Text>
      <Text style={styles.arabic}>{h.arabic}</Text>

      {(() => {
        if (appLocale !== "en" && appLocale !== "ru" && appLocale !== "tr") return null;
        const localeText = hadithTextForLocale(h, appLocale);
        if (!localeText) return null;
        const label =
          appLocale === "ru" ? "Перевод" : appLocale === "tr" ? "Çeviri" : "Translation";
        return (
          <>
            <Text style={styles.section}>{label}</Text>
            <Text style={styles.body} selectable>{localeText}</Text>
          </>
        );
      })()}

      <Text style={styles.section}>{kk.hadith.kkSourceTitle}</Text>
      <Text style={styles.body}>{citation}</Text>
      {sourceOnly ? (
        <Text style={styles.meaningNote}>{kk.hadith.sourceOnlyNote}</Text>
      ) : null}
      {sourceUrl ? (
        <Pressable
          onPress={openSource}
          oyuBackdrop={false}
          accessibilityRole="link"
          accessibilityLabel={kk.hadith.kkSourceOpenA11y(sourceLabel || kk.hadith.kkSourceTitle)}
          style={({ pressed }) => [styles.sourceBtn, pressed && styles.sourceBtnPressed]}
        >
          <Text style={styles.sourceBtnTxt}>
            {sourceLabel ? `${kk.hadith.kkSourceTitle}: ${sourceLabel}` : kk.hadith.kkSourceTitle}
          </Text>
        </Pressable>
      ) : null}

      {narratorKk ? (
        <>
          <Text style={styles.section}>{kk.hadith.narrator}</Text>
          <Text style={styles.body}>{narratorKk}</Text>
        </>
      ) : null}

      {corpus?.provenance ? (
        <View style={styles.prov}>
          <Text style={styles.provTitle}>{kk.hadith.provenance}</Text>
          {corpus.provenance.evidenceKk ? (
            <Text style={styles.provTxt}>{corpus.provenance.evidenceKk}</Text>
          ) : null}
          {corpus.provenance.licenseHint ? (
            <Text style={styles.provTxt}>{corpus.provenance.licenseHint}</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  const arabic = "#111827";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 20, paddingBottom: 40 },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: pageBg,
      padding: 24,
    },
    err: { color: colors.error, textAlign: "center" },
    meta: { color: muted, fontWeight: "700", fontSize: 14 },
    book: { color: muted, fontSize: 13, marginTop: 4 },
    ref: { color: muted, fontSize: 12, marginBottom: 8 },
    badgesRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
    badge: {
      color: muted,
      fontSize: 11,
      fontWeight: "700",
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    section: {
      color: muted,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 6,
    },
    arabic: {
      color: arabic,
      fontSize: 16,
      lineHeight: 28,
      writingDirection: "rtl",
      textAlign: "right",
    },
    meaningNote: {
      color: muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
      fontStyle: "italic",
    },
    body: { color: text, fontSize: 16, lineHeight: 26 },
    sourceBtn: {
      marginTop: 10,
      alignSelf: "flex-start",
      paddingHorizontal: 0,
      paddingVertical: 4,
      borderRadius: 0,
      backgroundColor: "transparent",
    },
    sourceBtnPressed: { opacity: 0.88 },
    sourceBtnTxt: { color: muted, fontWeight: "700", fontSize: 14 },
    prov: {
      marginTop: 20,
      padding: 0,
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
    },
    provTitle: { color: muted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
    provTxt: { color: muted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  });
}
