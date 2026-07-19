import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  loadHadithCorpus,
  findHadith,
  hadithTextForLocale,
  releaseHadithCorpusMemoryCache,
  type HadithCorpus,
  type SahihHadithEntry,
} from "../storage/hadithCorpus";
import { findKzTrustedHadith } from "../content/kzTrustedHadithCatalog";
import { useAppLocale } from "../i18n/runtime";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";
import { resolveHadithGradeText } from "../content/hadithGrade";
import {
  hadithBookDisplayTitle,
  hadithCollectionDisplayName,
  hadithSourceForLocale,
} from "../content/hadithDisplay";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithDetail">;

type DisplayHadith = {
  id: string;
  collectionNameKk: string;
  bookTitleKk: string;
  reference: string;
  arabic: string;
  textKk: string;
  narratorKk: string;
  grade: string;
  citation: string;
  sourceLabel: string;
  sourceNote: string;
  themeKk?: string;
  fromTrusted: boolean;
  corpusEntry?: SahihHadithEntry;
};

function buildDisplay(hadithId: string, corpus: HadithCorpus | null): DisplayHadith | null {
  const trusted = findKzTrustedHadith(hadithId);
  const corpusEntry = corpus ? findHadith(corpus, hadithId) : undefined;

  if (trusted) {
    return {
      id: trusted.id,
      collectionNameKk: trusted.collectionNameKk,
      bookTitleKk: trusted.bookTitleKk,
      reference: trusted.reference,
      arabic: trusted.arabic,
      textKk: trusted.textKk,
      narratorKk: trusted.narratorKk,
      grade: trusted.grade,
      citation: trusted.sourceCitationKk,
      sourceLabel: trusted.sourceLabelKk,
      sourceNote: trusted.sourceNoteKk,
      themeKk: trusted.themeKk,
      fromTrusted: true,
      corpusEntry,
    };
  }

  if (!corpusEntry) return null;

  return {
    id: corpusEntry.id,
    collectionNameKk: corpusEntry.collectionNameKk ?? "",
    bookTitleKk: corpusEntry.bookTitleKk ?? "",
    reference: corpusEntry.reference ?? "",
    arabic: corpusEntry.arabic ?? "",
    textKk: (corpusEntry.textKk ?? "").trim(),
    narratorKk: corpusEntry.narratorKk?.trim() ?? "",
    grade: resolveHadithGradeText(corpusEntry.grade),
    citation:
      corpusEntry.sourceCitationKk?.trim() ||
      kk.hadith.citationFallback(corpusEntry.collectionNameKk ?? "", corpusEntry.reference ?? ""),
    sourceLabel: corpusEntry.kkSourceLabel?.trim() || corpusEntry.collectionNameKk || "",
    sourceNote: corpusEntry.sourceOnly
      ? kk.hadith.sourceOnlyNoteInApp
      : kk.hadith.detailMeaningNote,
    fromTrusted: false,
    corpusEntry,
  };
}

export function HadithDetailScreen({ route, navigation }: Props) {
  const { hadithId } = route.params;
  const { colors } = useAppTheme();
  const appLocale = useAppLocale();
  const [corpus, setCorpus] = useState<HadithCorpus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    /** kk ғана trusted каталогтан бірден көрсетуге болады; басқа тілдерге corpus қажет. */
    const trustedNow = findKzTrustedHadith(hadithId);
    if (trustedNow && (appLocale === "kk" || appLocale === "ar")) {
      setLoading(false);
    }
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
      releaseHadithCorpusMemoryCache();
    };
  }, [hadithId, appLocale]);

  const display = useMemo(() => buildDisplay(hadithId, corpus), [corpus, hadithId]);
  const collectionLabel = display
    ? hadithCollectionDisplayName(
        display.corpusEntry ?? {
          id: display.id,
          collection: display.id.startsWith("muslim") ? "muslim" : "bukhari",
          collectionNameKk: display.collectionNameKk,
        },
        appLocale
      )
    : "";
  const bookTitle = display
    ? hadithBookDisplayTitle(
        display.corpusEntry ?? {
          bookTitleKk: display.bookTitleKk,
        },
        appLocale
      )
    : "";
  const sourceBlock = hadithSourceForLocale(display?.corpusEntry, appLocale);

  useLayoutEffect(() => {
    if (!display) return;
    navigation.setOptions({
      title:
        appLocale === "kk" && display.themeKk
          ? display.themeKk
          : `${collectionLabel} · №${display.reference}`,
    });
  }, [navigation, display, appLocale, collectionLabel]);

  const styles = makeStyles(colors);

  if (loading && !display) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
      </View>
    );
  }

  /** Trusted каталог бірден display береді — басқа тілде corpus келгенше «мәтін жоқ» деп шығармау. */
  if (
    loading &&
    display &&
    appLocale !== "kk" &&
    appLocale !== "ar" &&
    !display.corpusEntry
  ) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
      </View>
    );
  }

  if (!display) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{kk.hadith.notFound}</Text>
      </View>
    );
  }

  const localeMeaning =
    display.corpusEntry != null
      ? hadithTextForLocale(display.corpusEntry, appLocale)
      : appLocale === "kk"
        ? display.textKk.trim()
        : "";

  /** Таңдалған тілде мәтін жоқ — басқа тілдің аудармасын көрсетпейміз. */
  if (!localeMeaning && appLocale !== "ar") {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{kk.hadith.hub.emptyLocalePending}</Text>
      </View>
    );
  }

  const meaningSectionTitle =
    appLocale === "kk"
      ? kk.hadith.translationKk
      : appLocale === "ru"
        ? kk.hadith.translationRu
        : appLocale === "en"
          ? kk.hadith.translationEn
          : appLocale === "tr"
            ? kk.hadith.translationTr
            : appLocale === "ky"
              ? kk.hadith.translationKy
              : appLocale === "uz"
                ? kk.hadith.translationUz
                : kk.hadith.arabic;

  const editionHint =
    display.corpusEntry && appLocale !== "kk" && appLocale !== "ar"
      ? kk.hadith.trustedEditionHint(appLocale)
      : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>{collectionLabel}</Text>
      {appLocale === "kk" && display.themeKk ? (
        <Text style={styles.theme}>{display.themeKk}</Text>
      ) : null}
      {bookTitle ? <Text style={styles.book}>{bookTitle}</Text> : null}
      <Text style={styles.ref}>
        {kk.hadith.refLabel} №{display.reference}
      </Text>

      <Text style={styles.section}>{kk.hadith.reliabilityTitle}</Text>
      <View style={styles.badgesRow}>
        <Text style={styles.badge}>{kk.hadith.sourceBadge(collectionLabel || "—")}</Text>
        <Text style={styles.badge}>{kk.hadith.gradeBadge(display.grade)}</Text>
      </View>

      {appLocale !== "ar" ? (
        <>
          <Text style={styles.section}>{kk.hadith.arabic}</Text>
          <Text style={styles.arabic} selectable>
            {display.arabic}
          </Text>
        </>
      ) : null}

      <Text style={styles.section}>{meaningSectionTitle}</Text>
      <Text style={appLocale === "ar" ? styles.arabic : styles.body} selectable>
        {appLocale === "ar" ? display.arabic : localeMeaning}
      </Text>
      {appLocale === "kk" ? (
        <Text style={styles.meaningNote}>{kk.hadith.detailMeaningNote}</Text>
      ) : editionHint ? (
        <Text style={styles.meaningNote}>{editionHint}</Text>
      ) : null}

      <View style={styles.sourceCard}>
        <Text style={styles.section}>{kk.hadith.kkSourceTitle}</Text>
        <Text style={styles.sourceLabel}>{sourceBlock.label}</Text>
        <Text style={styles.body}>{sourceBlock.citation}</Text>
        <Text style={styles.inAppOnly}>{kk.hadith.inAppSourceOnly}</Text>
      </View>

      {appLocale === "kk" && display.narratorKk ? (
        <>
          <Text style={styles.section}>{kk.hadith.narrator}</Text>
          <Text style={styles.body}>{display.narratorKk}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 16, paddingBottom: 36 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: pageBg, padding: 24 },
    err: { color: colors.error, textAlign: "center", fontWeight: "700" },
    meta: { color: colors.accent, fontSize: 13, fontWeight: "800", marginBottom: 4 },
    theme: { color: text, fontSize: 22, fontWeight: "900", marginBottom: 6 },
    book: { color: muted, fontSize: 13, fontWeight: "600", marginBottom: 4 },
    ref: { color: muted, fontSize: 13, fontWeight: "700", marginBottom: 12 },
    section: { color: text, fontSize: 14, fontWeight: "900", marginTop: 14, marginBottom: 8 },
    badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    badge: {
      backgroundColor: colors.accentSurface,
      color: text,
      fontSize: 12,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
    },
    arabic: {
      color: text,
      fontSize: 22,
      lineHeight: 36,
      textAlign: "right",
      writingDirection: "rtl",
      fontWeight: "600",
    },
    body: { color: text, fontSize: 15, lineHeight: 24, fontWeight: "600" },
    meaningNote: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: "600" },
    sourceCard: {
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sourceLabel: { color: colors.accent, fontSize: 14, fontWeight: "900", marginBottom: 6 },
    sourceNote: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: "600" },
    inAppOnly: {
      color: text,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
