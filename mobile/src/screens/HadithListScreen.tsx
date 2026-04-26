import React, { useCallback, useEffect, useMemo, useState, memo, startTransition } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  InteractionManager,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  loadHadithCorpus,
  invalidateHadithCorpusMemoryCache,
  clearHadithCorpusStorage,
  hadithCollectionBucket,
  type HadithCorpus,
  type SahihHadithEntry,
} from "../storage/hadithCorpus";
import { seedBundledHadithIfNeeded } from "../services/bundledHadithSeed";
import {
  buildHadithLetterSections,
  sortHadithRowsByReference,
  type HadithLetterSection,
} from "../utils/hadithLetterSections";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "HadithList">;
};

type CollTab = "bukhari" | "muslim";
type HadithViewMode = "unique" | "full";

function corpusForViewMode(c: HadithCorpus, mode: HadithViewMode): HadithCorpus {
  if (mode === "full") return c;
  return {
    ...c,
    hadiths: c.hadiths.filter((h) => !h.isRepeated),
  };
}

/** ~14k жолды кіші бөліктермен + setImmediate UI-ға тыныс; сұрыптау жүктемеден кейін. */
function partitionBukhariMuslimAsync(corpus: HadithCorpus): Promise<{
  bukhari: SahihHadithEntry[];
  muslim: SahihHadithEntry[];
}> {
  return new Promise((resolve) => {
    const bukhari: SahihHadithEntry[] = [];
    const muslim: SahihHadithEntry[] = [];
    const all = corpus.hadiths;
    let i = 0;
    const CHUNK = 700;

    const finish = () => {
      void (async () => {
        await runWhenHeavyWorkAllowed();
        resolve({
          bukhari: sortHadithRowsByReference(bukhari),
          muslim: sortHadithRowsByReference(muslim),
        });
      })();
    };

    const step = () => {
      const end = Math.min(i + CHUNK, all.length);
      for (; i < end; i++) {
        const h = all[i];
        const col = h.collection;
        if (col === "bukhari") bukhari.push(h);
        else if (col === "muslim") muslim.push(h);
        else {
          const b = hadithCollectionBucket(h);
          if (b === "bukhari") bukhari.push(h);
          else if (b === "muslim") muslim.push(h);
        }
      }
      if (i < all.length) {
        setImmediate(step);
        return;
      }
      if (bukhari.length === 0 && muslim.length === 0) {
        for (const h of all) {
          const id = (h.id ?? "").toLowerCase();
          if (id.includes("muslim")) muslim.push(h);
          else bukhari.push(h);
        }
      }
      finish();
    };
    setImmediate(step);
  });
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    pad: { padding: 16, paddingBottom: 40 },
    center: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    muted: { color: colors.muted, marginTop: 12 },
    err: { color: colors.error, textAlign: "center" },
    header: { marginBottom: 16 },
    h1: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 8 },
    introCard: {
      marginBottom: 14,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    introToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    introToggleTxt: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.2,
      flex: 1,
    },
    introBody: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 10,
    },
    meaning: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 10,
    },
    intro: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    stats: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 10,
      lineHeight: 18,
    },
    importBlurb: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 6,
    },
    modeRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
    modeChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    modeChipOn: {
      borderColor: colors.accent,
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.14)" : "rgba(22, 163, 74, 0.1)",
    },
    modeChipTxt: { color: colors.muted, fontSize: 12, fontWeight: "700" },
    modeChipTxtOn: { color: colors.accent },
    modeHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
    letterIndexHint: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 6,
    },
    tabs: { flexDirection: "row", gap: 8, marginTop: 14 },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    tabOn: { borderColor: colors.accent },
    tabTxt: { color: colors.muted, fontWeight: "800", fontSize: 13 },
    tabTxtOn: { color: colors.accent },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coll: { color: colors.accent, fontSize: 12, fontWeight: "700" },
    ref: { color: colors.muted, fontSize: 12, marginTop: 4 },
    preview: { color: colors.scriptureMeaningKk, fontSize: 14, marginTop: 8, lineHeight: 20 },
    previewAr: {
      fontSize: 12,
      lineHeight: 18,
      writingDirection: "rtl",
      textAlign: "right",
      color: colors.scriptureArabic,
    },
    sectionHeader: {
      backgroundColor: colors.bg,
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginTop: 4,
      marginBottom: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.accent,
      letterSpacing: 0.3,
    },
  });
}

type HadithStyles = ReturnType<typeof makeStyles>;

const HadithListHeader = memo(function HadithListHeader({
  corpus,
  bukhariN,
  muslimN,
  tab,
  onTab,
  viewMode,
  onViewMode,
  styles,
}: {
  corpus: HadithCorpus;
  bukhariN: number;
  muslimN: number;
  tab: CollTab;
  onTab: (t: CollTab) => void;
  viewMode: HadithViewMode;
  onViewMode: (m: HadithViewMode) => void;
  styles: HadithStyles;
}) {
  const { colors: themeColors } = useAppTheme();
  const [introOpen, setIntroOpen] = useState(true);
  return (
    <View style={styles.header}>
      <Text style={styles.h1}>{kk.hadith.title}</Text>
      <View style={styles.introCard}>
        <Pressable
          onPress={() => setIntroOpen((v) => !v)}
          style={({ pressed }) => [styles.introToggle, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityState={{ expanded: introOpen }}
          accessibilityLabel={kk.hadith.introTitle}
        >
          <Text style={styles.introToggleTxt}>{kk.hadith.introTitle}</Text>
          <MaterialCommunityIcons
            name={introOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color={themeColors.accent}
          />
        </Pressable>
        {introOpen ? <Text style={styles.introBody}>{kk.hadith.introBody}</Text> : null}
      </View>
      <Text style={styles.meaning}>{kk.hadith.titleMeaning}</Text>
      <Text style={styles.intro}>{corpus.provenance?.evidenceKk ?? ""}</Text>
      <Text style={styles.stats}>{kk.hadith.corpusStats(bukhariN, muslimN)}</Text>
      <Text style={styles.importBlurb}>{kk.hadith.importBlurb}</Text>
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => onViewMode("unique")}
          style={[styles.modeChip, viewMode === "unique" && styles.modeChipOn]}
        >
          <Text style={[styles.modeChipTxt, viewMode === "unique" && styles.modeChipTxtOn]}>
            {kk.hadith.modeUnique}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onViewMode("full")}
          style={[styles.modeChip, viewMode === "full" && styles.modeChipOn]}
        >
          <Text style={[styles.modeChipTxt, viewMode === "full" && styles.modeChipTxtOn]}>
            {kk.hadith.modeFull}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.modeHint}>
        {viewMode === "unique" ? kk.hadith.modeUniqueHint : kk.hadith.modeFullHint}
      </Text>
      <Text style={styles.letterIndexHint}>{kk.hadith.letterIndexHint}</Text>
      <View style={styles.tabs}>
        <Pressable onPress={() => onTab("bukhari")} style={[styles.tab, tab === "bukhari" && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === "bukhari" && styles.tabTxtOn]}>{kk.hadith.tabBukhari}</Text>
        </Pressable>
        <Pressable onPress={() => onTab("muslim")} style={[styles.tab, tab === "muslim" && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === "muslim" && styles.tabTxtOn]}>{kk.hadith.tabMuslim}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const HadithRow = memo(function HadithRow({
  item,
  styles,
  onOpen,
}: {
  item: SahihHadithEntry;
  styles: HadithStyles;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => onOpen(item.id)}
    >
      <Text style={styles.coll}>{item.collectionNameKk}</Text>
      <Text style={styles.ref}>
        №{item.reference}
        {item.bookTitleKk?.trim() ? ` · ${item.bookTitleKk}` : ""}
      </Text>
      <Text
        style={item.textKk?.trim() ? styles.preview : [styles.preview, styles.previewAr]}
        numberOfLines={3}
      >
        {item.textKk?.trim() ? item.textKk : item.arabic}
      </Text>
    </Pressable>
  );
});

export function HadithListScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const [corpus, setCorpus] = useState<HadithCorpus | null>(null);
  /** Бөлу аяқталғанша тізім дерегі null болуы мүмкін (синхрон useMemo орнына). */
  const [lists, setLists] = useState<{
    bukhari: SahihHadithEntry[];
    muslim: SahihHadithEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<CollTab>("bukhari");
  const [viewMode, setViewMode] = useState<HadithViewMode>("unique");

  /**
   * Алдымен диск/жадтан оқимыз — қайталама пайдаланушыға сидингті күтпей ашамыз.
   * Корпус бар болса сидингті UI блоктамай фонда шақырамыз (seed ішінде қайта тексеру бар).
   */
  const ensureCorpus = useCallback(async (mode: "normal" | "reload" = "normal") => {
    await runWhenHeavyWorkAllowed();
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
    if (mode === "reload") {
      invalidateHadithCorpusMemoryCache();
      await seedBundledHadithIfNeeded();
      return loadHadithCorpus();
    }
    let c = await loadHadithCorpus();
    if (c?.hadiths?.length) {
      void seedBundledHadithIfNeeded();
      return c;
    }
    await seedBundledHadithIfNeeded();
    c = await loadHadithCorpus({ force: true });
    /** Бұрынғы сақтау Android CursorWindow шегінен асып бүлінген болса — тазалап қайта сидинг */
    if (!c?.hadiths?.length) {
      await clearHadithCorpusStorage();
      await seedBundledHadithIfNeeded();
      c = await loadHadithCorpus({ force: true });
    }
    return c;
  }, []);

  const reload = useCallback(async () => {
    const c = await ensureCorpus("reload");
    startTransition(() => {
      setCorpus(c);
    });
  }, [ensureCorpus]);

  /** Корпус жүктелу (бөлу viewMode бойынша бөлек эффектте). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await ensureCorpus();
        if (cancelled) return;
        startTransition(() => {
          setCorpus(c);
          setLoading(false);
        });
      } catch {
        if (!cancelled) {
          setCorpus(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureCorpus]);

  /** Корпус + режим: Бұхари/Муслимге бөлу. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!corpus?.hadiths?.length) {
        startTransition(() => setLists({ bukhari: [], muslim: [] }));
        return;
      }
      const slice = corpusForViewMode(corpus, viewMode);
      if (!slice.hadiths.length) {
        startTransition(() => setLists({ bukhari: [], muslim: [] }));
        return;
      }
      await new Promise<void>((r) => InteractionManager.runAfterInteractions(() => r()));
      const part = await partitionBukhariMuslimAsync(slice);
      if (cancelled) return;
      startTransition(() => setLists(part));
    })();
    return () => {
      cancelled = true;
    };
  }, [corpus, viewMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const bukhariData = lists?.bukhari ?? [];
  const muslimData = lists?.muslim ?? [];
  const data = tab === "bukhari" ? bukhariData : muslimData;
  const styles = makeStyles(colors, isDark);

  const letterSections = useMemo((): HadithLetterSection[] => {
    try {
      return buildHadithLetterSections(data);
    } catch {
      return [];
    }
  }, [data]);

  const listHeader = useMemo(
    () =>
      corpus ? (
        <HadithListHeader
          corpus={corpus}
          bukhariN={bukhariData.length}
          muslimN={muslimData.length}
          tab={tab}
          onTab={setTab}
          viewMode={viewMode}
          onViewMode={setViewMode}
          styles={styles}
        />
      ) : null,
    [corpus, bukhariData.length, muslimData.length, tab, viewMode, styles]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>{kk.hadith.loading}</Text>
      </View>
    );
  }

  if (!corpus?.hadiths?.length) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.center, { flexGrow: 1 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.err}>{kk.hadith.empty}</Text>
      </ScrollView>
    );
  }

  const listEmpty =
    corpus && data.length === 0 && (bukhariData.length > 0 || muslimData.length > 0) ? (
      <Text style={[styles.err, { marginTop: 8, marginBottom: 24 }]}>{kk.hadith.tabEmptyHint}</Text>
    ) : null;

  return (
    <SectionList
      style={styles.root}
      sections={letterSections}
      keyExtractor={(h) => h.id || `ref-${h.reference}`}
      /** Android: removeClippedSubviews SectionList-пен құлауға әкелуі мүмкін */
      removeClippedSubviews={Platform.OS === "ios"}
      initialNumToRender={12}
      maxToRenderPerBatch={16}
      windowSize={9}
      stickySectionHeadersEnabled
      contentContainerStyle={styles.pad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }: { item: SahihHadithEntry }) => (
        <HadithRow item={item} styles={styles} onOpen={(id) => navigation.navigate("HadithDetail", { hadithId: id })} />
      )}
    />
  );
}
