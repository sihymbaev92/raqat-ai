import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import bundled from "../../assets/bundled/genealogy-p0.json";
import { TraditionAccordion } from "../components/TraditionAccordion";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  fetchGenealogyChildren,
  fetchGenealogyClan,
  fetchGenealogyPersonsByClan,
  type GenealogyClanDetail,
  type GenealogyClanItem,
  type GenealogyPerson,
} from "../services/genealogyApi";
import {
  genealogyBreadcrumbLabel,
  genealogyEraLabel,
  genealogyHasChildren,
  genealogyLevelLabel,
  genealogyLifeYears,
  genealogyPersonsForClan,
  genealogySearchNodes,
  genealogySearchPersons,
  genealogySourceLabel,
  type GenealogyPersonHit,
} from "../services/genealogyLabels";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type BundledNode = GenealogyClanDetail & { slug: string };

const bundledNodes = (bundled as { nodes?: BundledNode[] }).nodes ?? [];
const bundledPersons = (bundled as { persons?: GenealogyPersonHit[] }).persons ?? [];

type SearchRow =
  | { kind: "clan"; slug: string; name_kk: string; path: string; node: BundledNode }
  | { kind: "person"; slug: string; name_kk: string; path: string; clan_slug: string };

function animateList() {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function childrenFromBundled(parentSlug: string | null): GenealogyClanItem[] {
  if (!parentSlug) {
    return bundledNodes.filter((n) => n.level === 1).map(stripNode);
  }
  return bundledNodes
    .filter((n) => {
      const crumbs = n.breadcrumbs ?? [];
      return crumbs.length >= 2 && crumbs[crumbs.length - 2] === parentSlug;
    })
    .map(stripNode);
}

function stripNode(n: BundledNode): GenealogyClanItem {
  return {
    slug: n.slug,
    name_kk: n.name_kk,
    name_kk_alt: n.name_kk_alt,
    name_lat: n.name_lat,
    level: n.level,
    sort_order: n.sort_order ?? 0,
  };
}

function detailFromBundled(slug: string): GenealogyClanDetail | null {
  return bundledNodes.find((n) => n.slug === slug) ?? null;
}

export function GenealogyClansScreen() {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList, "GenealogyClans">>();
  const [stack, setStack] = useState<string[]>([]);
  const [items, setItems] = useState<GenealogyClanItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, GenealogyClanDetail>>({});
  const [personsCache, setPersonsCache] = useState<Record<string, GenealogyPerson[]>>({});
  const [personsLoading, setPersonsLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const parentSlug = stack.length > 0 ? stack[stack.length - 1] : null;
  const searchActive = query.trim().length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchGenealogyChildren(parentSlug ?? undefined);
      setItems(rows);
    } catch {
      const offline = childrenFromBundled(parentSlug);
      setItems(offline);
      if (offline.length === 0) setError(kk.features.genealogyLoadError);
    } finally {
      setLoading(false);
    }
  }, [parentSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (slug: string) => {
    const cached = detailCache[slug] ?? detailFromBundled(slug);
    if (cached) {
      setDetailCache((prev) => (prev[slug] ? prev : { ...prev, [slug]: cached }));
    }
    setDetailLoading(slug);
    try {
      const remote = await fetchGenealogyClan(slug);
      if (remote) {
        setDetailCache((prev) => ({ ...prev, [slug]: remote }));
      }
    } catch {
      const offline = detailFromBundled(slug);
      if (offline) {
        setDetailCache((prev) => ({ ...prev, [slug]: offline }));
      }
    } finally {
      setDetailLoading(null);
    }
  }, [detailCache]);

  const loadPersons = useCallback(async (clanSlug: string) => {
    const offline = genealogyPersonsForClan(clanSlug, bundledPersons);
    if (offline.length > 0) {
      setPersonsCache((prev) => (prev[clanSlug] ? prev : { ...prev, [clanSlug]: offline as GenealogyPerson[] }));
    }
    setPersonsLoading(clanSlug);
    try {
      const remote = await fetchGenealogyPersonsByClan(clanSlug);
      if (remote.length > 0) setPersonsCache((prev) => ({ ...prev, [clanSlug]: remote }));
    } catch {
      if (offline.length > 0) {
        setPersonsCache((prev) => ({ ...prev, [clanSlug]: offline as GenealogyPerson[] }));
      }
    } finally {
      setPersonsLoading(null);
    }
  }, []);

  const onToggleExpand = (slug: string, isOpen: boolean) => {
    animateList();
    if (isOpen) {
      setExpanded(null);
      return;
    }
    setExpanded(slug);
    if (!detailCache[slug] && !detailFromBundled(slug)) {
      void loadDetail(slug);
    } else if (!detailCache[slug]) {
      const offline = detailFromBundled(slug);
      if (offline) setDetailCache((prev) => ({ ...prev, [slug]: offline }));
      void loadDetail(slug);
    }
    if (!personsCache[slug]) {
      void loadPersons(slug);
    }
  };

  const breadcrumbs = useMemo(() => {
    if (stack.length === 0) return [{ slug: null as string | null, label: kk.features.genealogyTitle }];
    return [
      { slug: null as string | null, label: kk.features.genealogyTitle },
      ...stack.map((s) => ({
        slug: s,
        label: genealogyBreadcrumbLabel(s, bundledNodes),
      })),
    ];
  }, [stack]);

  const searchHits = useMemo((): SearchRow[] => {
    const clans = genealogySearchNodes(query, bundledNodes).map((item) => {
      const crumbs = item.breadcrumbs ?? [];
      const path =
        crumbs.length > 1
          ? crumbs.slice(0, -1).map((s) => genealogyBreadcrumbLabel(s, bundledNodes)).join(" › ")
          : genealogyLevelLabel(item.level);
      return { kind: "clan" as const, slug: item.slug, name_kk: item.name_kk, path, node: item as BundledNode };
    });
    const persons = genealogySearchPersons(query, bundledPersons, bundledNodes).map((p) => ({
      kind: "person" as const,
      slug: p.slug,
      name_kk: p.name_kk,
      path: `${p.clan_label} · ${genealogyEraLabel(p.era)}`,
      clan_slug: p.clan_slug,
    }));
    return [...persons, ...clans];
  }, [query]);

  const onOpenChild = (slug: string) => {
    animateList();
    setExpanded(null);
    setQuery("");
    setStack((prev) => [...prev, slug]);
  };

  const onNavigateToPerson = (clanSlug: string) => {
    animateList();
    setQuery("");
    const node = bundledNodes.find((n) => n.slug === clanSlug);
    if (node?.breadcrumbs && node.breadcrumbs.length > 1) {
      setStack(node.breadcrumbs.slice(0, -1));
    } else if (node?.breadcrumbs?.length === 1) {
      setStack([]);
    } else {
      setStack([]);
    }
    setExpanded(clanSlug);
    if (!personsCache[clanSlug]) void loadPersons(clanSlug);
    if (!detailCache[clanSlug]) void loadDetail(clanSlug);
  };

  const onNavigateToNode = (node: BundledNode) => {
    animateList();
    setExpanded(null);
    setQuery("");
    const crumbs = node.breadcrumbs ?? [];
    setStack(crumbs.slice(0, -1));
  };

  const onBreadcrumb = (index: number) => {
    animateList();
    setExpanded(null);
    setQuery("");
    if (index === 0) {
      setStack([]);
      return;
    }
    setStack((prev) => prev.slice(0, index));
  };

  const styles = useMemo(() => makeStyles(colors, palette), [colors, palette]);

  const renderDetailBody = (slug: string, level: number) => {
    const detail = detailCache[slug] ?? detailFromBundled(slug);
    const isLoadingDetail = detailLoading === slug && !detail;
    if (isLoadingDetail) {
      return <ActivityIndicator size="small" color={palette.gold} style={{ marginVertical: 8 }} />;
    }
    const hasChildren = genealogyHasChildren(slug, bundledNodes);
    const persons = personsCache[slug] ?? (genealogyPersonsForClan(slug, bundledPersons) as GenealogyPerson[]);
    const loadingPersons = personsLoading === slug && persons.length === 0;
    return (
      <>
        {detail?.description_kk ? (
          <Text style={styles.description}>{detail.description_kk}</Text>
        ) : null}
        {detail?.name_kk_alt ? (
          <Text style={styles.altName}>{detail.name_kk_alt}</Text>
        ) : null}
        {loadingPersons ? (
          <ActivityIndicator size="small" color={palette.gold} style={{ marginVertical: 6 }} />
        ) : persons.length > 0 ? (
          <View style={styles.personsBox}>
            <Text style={styles.sourcesTitle}>{kk.features.genealogyPersonsTitle}</Text>
            {persons.map((p) => {
              const years = genealogyLifeYears(p);
              return (
                <View key={p.slug} style={styles.personRow}>
                  <Text style={styles.personName}>{p.name_kk}</Text>
                  <Text style={styles.personMeta}>
                    {[p.role_kk, years, genealogyEraLabel(p.era)].filter(Boolean).join(" · ")}
                  </Text>
                  {p.bio_kk ? <Text style={styles.personBio}>{p.bio_kk}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}
        {detail?.sources && detail.sources.length > 0 ? (
          <View style={styles.sourcesBox}>
            <Text style={styles.sourcesTitle}>{kk.features.genealogySourcesTitle}</Text>
            {detail.sources.map((s) => (
              <Text key={s.source_key} style={styles.sourceLine}>
                • {genealogySourceLabel(s.source_key)}
                {s.page_or_section ? ` (${s.page_or_section})` : ""}
              </Text>
            ))}
          </View>
        ) : null}
        {hasChildren ? (
          <Pressable oyuBackdrop={false} style={styles.openBtn} onPress={() => onOpenChild(slug)}>
            <Text style={styles.openBtnText}>{kk.features.genealogyOpenBranch}</Text>
            <MaterialIcons name="chevron-right" size={20} color={palette.gold} />
          </Pressable>
        ) : (
          <Text style={styles.leafHint}>{kk.features.genealogyLeafLevel}</Text>
        )}
        {!detail?.description_kk && !detail?.sources?.length && level >= 4 ? (
          <Text style={styles.leafHint}>{genealogyLevelLabel(level)}</Text>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.search}
        placeholder={kk.features.genealogySearchPlaceholder}
        placeholderTextColor={palette.muted}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel={kk.features.genealogySearchPlaceholder}
        clearButtonMode="while-editing"
      />

      <Pressable
        oyuBackdrop={false}
        style={styles.myTreeBtn}
        onPress={() => nav.navigate("FamilyTree")}
        accessibilityRole="button"
        accessibilityLabel={kk.features.familyTreeOpenCta}
      >
        <MaterialIcons name="account-tree" size={22} color={palette.gold} />
        <View style={styles.myTreeTextWrap}>
          <Text style={styles.myTreeTitle}>{kk.features.familyTreeOpenCta}</Text>
          <Text style={styles.myTreeSub}>{kk.features.familyTreeOpenSub}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={palette.gold} />
      </Pressable>

      {!searchActive ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.crumbBar}
          contentContainerStyle={styles.crumbContent}
        >
          {breadcrumbs.map((c, i) => (
            <React.Fragment key={`${c.slug ?? "root"}-${i}`}>
              {i > 0 ? <Text style={styles.crumbSep}>›</Text> : null}
              <Pressable oyuBackdrop={false} onPress={() => onBreadcrumb(i)}>
                <Text style={[styles.crumb, i === breadcrumbs.length - 1 && styles.crumbActive]}>
                  {c.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </ScrollView>
      ) : null}

      {searchActive ? (
        <FlatList
          data={searchHits}
          keyExtractor={(item) => `${item.kind}-${item.slug}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>{kk.features.genealogySearchEmpty}</Text>}
          renderItem={({ item }) => (
            <Pressable
              oyuBackdrop={false}
              style={styles.searchHit}
              onPress={() =>
                item.kind === "person"
                  ? onNavigateToPerson(item.clan_slug)
                  : onNavigateToNode(item.node)
              }
            >
              <Text style={styles.searchHitName}>
                {item.name_kk}
                {item.kind === "person" ? " · 👤" : ""}
              </Text>
              <Text style={styles.searchHitPath}>{item.path}</Text>
            </Pressable>
          )}
        />
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={palette.gold} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isOpen = expanded === item.slug;
            return (
              <View style={styles.rowWrap}>
                <TraditionAccordion
                  colors={colors}
                  palette={palette}
                  variant="section"
                  title={item.name_kk}
                  subtitle={genealogyLevelLabel(item.level)}
                  expanded={isOpen}
                  onToggle={() => onToggleExpand(item.slug, isOpen)}
                >
                  {renderDetailBody(item.slug, item.level)}
                </TraditionAccordion>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>{kk.features.genealogySearchEmpty}</Text>}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], palette: ReturnType<typeof getTraditionKazakhPalette>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.screenBg },
    search: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      color: palette.text,
      fontSize: 16,
    },
    myTreeBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      gap: 10,
    },
    myTreeTextWrap: { flex: 1 },
    myTreeTitle: { color: palette.text, fontSize: 15, fontWeight: "700" },
    myTreeSub: { color: palette.muted, fontSize: 12, marginTop: 2 },
    crumbBar: { maxHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
    crumbContent: { paddingHorizontal: 16, alignItems: "center", gap: 4 },
    crumb: { color: palette.muted, fontSize: 14 },
    crumbActive: { color: palette.gold, fontWeight: "600" },
    crumbSep: { color: palette.muted, marginHorizontal: 4 },
    listContent: { padding: 16, paddingBottom: 32, gap: 12 },
    rowWrap: { marginBottom: 8 },
    description: { color: palette.text, fontSize: 14, lineHeight: 20, marginBottom: 10 },
    altName: { color: palette.muted, fontSize: 14, marginBottom: 8 },
    personRow: { marginBottom: 10 },
    personName: { color: palette.text, fontSize: 15, fontWeight: "600" },
    personMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
    personBio: { color: palette.text, fontSize: 13, lineHeight: 18, marginTop: 4 },
    personsBox: { marginBottom: 10, paddingTop: 4 },
    sourcesBox: { marginBottom: 10, paddingTop: 4 },
    sourcesTitle: { color: palette.muted, fontSize: 12, fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
    sourceLine: { color: palette.text, fontSize: 13, lineHeight: 18, marginBottom: 2 },
    openBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    openBtnText: { color: palette.gold, fontSize: 16, fontWeight: "600" },
    leafHint: { color: palette.muted, fontSize: 13 },
    searchHit: {
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    searchHitName: { color: palette.text, fontSize: 16, fontWeight: "600" },
    searchHitPath: { color: palette.muted, fontSize: 13, marginTop: 2 },
    empty: { textAlign: "center", color: palette.muted, marginTop: 24 },
    error: { textAlign: "center", color: colors.error, marginTop: 24, paddingHorizontal: 16 },
  });
}
