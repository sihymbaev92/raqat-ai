import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import bundled from "../../assets/bundled/genealogy-p0.json";
import {
  GenealogyPersonModal,
  genealogyClanPathLabel,
} from "../components/genealogy/GenealogyPersonModal";
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
import { genealogyBundledStats } from "../services/genealogyBundledStats";
import { GenealogyNotableCarousel } from "../components/genealogy/GenealogyNotableCarousel";

type BundledNode = GenealogyClanDetail & { slug: string };

const bundledNodes = (bundled as { nodes?: BundledNode[] }).nodes ?? [];
const bundledPersons = (bundled as { persons?: GenealogyPersonHit[] }).persons ?? [];

type SearchRow =
  | { kind: "clan"; slug: string; name_kk: string; path: string; node: BundledNode }
  | { kind: "person"; slug: string; name_kk: string; path: string; clan_slug: string };

const GENEALOGY_TIMELINE = [
  {
    years: "б.з.д. III ғ. – V ғ.",
    title: "Ежелгі негіз",
    body: "Сақ, ғұн, үйсін, қаңлы сияқты тайпалық бірлестіктер кейінгі ру-тайпа жадының тарихи қабатын құрайды.",
  },
  {
    years: "VI–XII ғ.",
    title: "Түрік дәуірі",
    body: "Түрік қағанаты, оғыз, қыпшақ, қарлұқ, найман, керей атаулары даладағы этникалық сабақтастықты күшейтті.",
  },
  {
    years: "XIII–XV ғ.",
    title: "Ұлыс пен Орда",
    body: "Шыңғыс ұлыстары, Алтын Орда, Ақ Орда кезеңінде ру атаулары саяси-әлеуметтік құрылыммен бірге орнықты.",
  },
  {
    years: "XV–XVIII ғ.",
    title: "Қазақ хандығы",
    body: "Жүздер, ру тармақтары, хан-сұлтан, би-батырлар дәуірі шежіре баяндауының негізгі желісіне айналды.",
  },
  {
    years: "XIX ғ.",
    title: "Ағартушылық және көтерілістер",
    body: "Кенесары, Исатай-Махамбет, Абай, Ыбырай, Шоқан сияқты тұлғалар арқылы тарихи дерек нақты жылдармен көрінеді.",
  },
  {
    years: "XX ғ. – 2000 ж.",
    title: "Алаш, Кеңес, тәуелсіздік басы",
    body: "Алаш қайраткерлері, ақын-жазушылар, қоғам тұлғалары шежірені 2000-жылдарға дейін жалғайды.",
  },
];

function animateList() {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function childrenFromBundled(parentSlug: string | null): GenealogyClanItem[] {
  if (!parentSlug) {
    return sortGenealogyItems(bundledNodes.filter((n) => n.level === 1).map(stripNode));
  }
  return sortGenealogyItems(bundledNodes
    .filter((n) => {
      const crumbs = n.breadcrumbs ?? [];
      return crumbs.length >= 2 && crumbs[crumbs.length - 2] === parentSlug;
    })
    .map(stripNode));
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

function sortGenealogyItems(rows: GenealogyClanItem[]): GenealogyClanItem[] {
  return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_kk.localeCompare(b.name_kk, "kk"));
}

function childCountForSlug(slug: string): number {
  return bundledNodes.filter((n) => {
    const crumbs = n.breadcrumbs ?? [];
    return crumbs.length >= 2 && crumbs[crumbs.length - 2] === slug;
  }).length;
}

function sourceCountForSlug(slug: string): number {
  return detailFromBundled(slug)?.sources?.length ?? 0;
}

export function GenealogyClansScreen() {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const nav = useNavigation<NativeStackNavigationProp<MoreStackParamList, "GenealogyClans">>();
  const [stack, setStack] = useState<string[]>([]);
  const [items, setItems] = useState<GenealogyClanItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailCache, setDetailCache] = useState<Record<string, GenealogyClanDetail>>({});
  const [personsCache, setPersonsCache] = useState<Record<string, GenealogyPerson[]>>({});
  const [personsLoading, setPersonsLoading] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<GenealogyPersonHit | null>(null);

  const parentSlug = stack.length > 0 ? stack[stack.length - 1] : null;
  const expandedCount = Object.values(expanded).filter(Boolean).length;
  const searchActive = query.trim().length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchGenealogyChildren(parentSlug ?? undefined);
      setItems(sortGenealogyItems(rows));
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

  const onToggleExpand = (item: GenealogyClanItem, isOpen: boolean) => {
    animateList();
    const slug = item.slug;
    if (genealogyHasChildren(slug, bundledNodes)) {
      setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
      return;
    }
    if (isOpen) {
      setExpanded((prev) => ({ ...prev, [slug]: false }));
      return;
    }
    setExpanded((prev) => ({ ...prev, [slug]: true }));
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

  const expandPathToNode = (node: BundledNode) => {
    animateList();
    setQuery("");
    setStack([]);
    const next: Record<string, boolean> = {};
    for (const slug of node.breadcrumbs ?? [node.slug]) next[slug] = true;
    setExpanded(next);
  };

  const onNavigateToPerson = (clanSlug: string) => {
    animateList();
    setQuery("");
    const node = bundledNodes.find((n) => n.slug === clanSlug);
    if (node) expandPathToNode(node);
    else setExpanded((prev) => ({ ...prev, [clanSlug]: true }));
    if (!personsCache[clanSlug]) void loadPersons(clanSlug);
    if (!detailCache[clanSlug]) void loadDetail(clanSlug);
  };

  const onNavigateToNode = (node: BundledNode) => {
    animateList();
    expandPathToNode(node);
  };

  const onCollapseAll = () => {
    animateList();
    setExpanded({});
  };

  const openPerson = (person: GenealogyPersonHit) => {
    setSelectedPerson(person);
  };

  const styles = useMemo(() => makeStyles(colors, palette), [colors, palette]);

  const timelinePersonCount = useMemo(
    () => bundledPersons.filter((p) => (p.birth_year ?? 0) > 0 && (p.birth_year ?? 0) <= 2000).length,
    []
  );
  const trustStats = useMemo(() => genealogyBundledStats(bundledNodes, bundledPersons.length), []);

  const collapseAllHeader =
    expandedCount > 0 ? (
      <Pressable
        oyuBackdrop={false}
        style={styles.collapseAllBtn}
        onPress={onCollapseAll}
        accessibilityRole="button"
        accessibilityLabel={kk.features.genealogyCollapseAll}
      >
        <MaterialIcons name="unfold-less" size={16} color={palette.gold} />
        <Text style={styles.collapseAllText}>{kk.features.genealogyCollapseAll}</Text>
      </Pressable>
    ) : null;

  const trustHeader =
    !searchActive && stack.length === 0 ? (
      <View>
        <View style={styles.trustCard}>
          <View style={styles.trustHead}>
            <View style={styles.trustIcon}>
              <MaterialIcons name="verified-user" size={20} color={palette.gold} />
            </View>
            <View style={styles.trustHeadText}>
              <Text style={styles.trustTitle}>{kk.features.genealogyTrustTitle}</Text>
              <Text style={styles.trustSub}>{kk.features.genealogyTrustCoverage(trustStats.sourceCoveragePercent)}</Text>
            </View>
          </View>
          <View style={styles.trustStatsRow}>
            <View style={styles.trustStatPill}>
              <Text style={styles.trustStatValue}>{trustStats.zhuzCount}</Text>
              <Text style={styles.trustStatLabel}>{kk.features.genealogyStatZhuz}</Text>
            </View>
            <View style={styles.trustStatPill}>
              <Text style={styles.trustStatValue}>{trustStats.ruCount}</Text>
              <Text style={styles.trustStatLabel}>{kk.features.genealogyLevelRu}</Text>
            </View>
            <View style={styles.trustStatPill}>
              <Text style={styles.trustStatValue}>{trustStats.branchCount}</Text>
              <Text style={styles.trustStatLabel}>{kk.features.genealogyStatBranches}</Text>
            </View>
            <View style={styles.trustStatPill}>
              <Text style={styles.trustStatValue}>{trustStats.personCount}</Text>
              <Text style={styles.trustStatLabel}>{kk.features.genealogyStatPersons}</Text>
            </View>
          </View>
          <View style={styles.trustLine}>
            <MaterialIcons name="library-books" size={17} color={palette.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trustLineTitle}>{kk.features.genealogyTrustVerifiedTitle}</Text>
              <Text style={styles.trustLineBody}>{kk.features.genealogyTrustVerifiedBody(trustStats.sourcedNodeCount)}</Text>
            </View>
          </View>
          <View style={styles.trustLine}>
            <MaterialIcons name="info-outline" size={17} color={palette.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trustLineTitle}>{kk.features.genealogyTrustEditorialTitle}</Text>
              <Text style={styles.trustLineBody}>{kk.features.genealogyTrustEditorialBody}</Text>
            </View>
          </View>
          <Text style={styles.trustPersonalNote}>{kk.features.genealogyTrustPersonalNote}</Text>
        </View>
        <GenealogyNotableCarousel persons={bundledPersons} onPressPerson={openPerson} />
      </View>
    ) : null;

  const timelineFooter =
    !searchActive && stack.length === 0 ? (
      <View style={styles.timelineCard}>
        <View style={styles.timelineHead}>
          <MaterialIcons name="timeline" size={20} color={palette.gold} />
          <View style={styles.timelineHeadText}>
            <Text style={styles.timelineTitle}>{kk.features.genealogyTimelineTitle}</Text>
            <Text style={styles.timelineSub}>{kk.features.genealogyTimelineSub(timelinePersonCount)}</Text>
          </View>
        </View>
        {GENEALOGY_TIMELINE.map((row) => (
          <View key={row.years} style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineBody}>
              <Text style={styles.timelineYears}>{row.years}</Text>
              <Text style={styles.timelinePeriod}>{row.title}</Text>
              <Text style={styles.timelineText}>{row.body}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.timelineNote}>{kk.features.genealogyTimelineNote}</Text>
      </View>
    ) : null;

  function renderTreeItem(item: GenealogyClanItem, depth = 0): React.ReactElement {
    const hasChildren = genealogyHasChildren(item.slug, bundledNodes);
    const isOpen = !!expanded[item.slug];
    const count = childCountForSlug(item.slug);
    const sourceCount = sourceCountForSlug(item.slug);
    const childRows = hasChildren && isOpen ? childrenFromBundled(item.slug) : [];
    return (
      <View key={item.slug} style={[styles.rowWrap, depth > 0 && styles.childRowWrap]}>
        <TraditionAccordion
          colors={colors}
          palette={palette}
          variant="section"
          title={item.name_kk}
          subtitle={
            count > 0
              ? `${genealogyLevelLabel(item.level)} · ${count} ${kk.features.genealogyChildCount} · ${
                  sourceCount > 0 ? kk.features.genealogyTrustBadgeSource : kk.features.genealogyTrustBadgeBundled
                }`
              : `${genealogyLevelLabel(item.level)} · ${
                  sourceCount > 0 ? kk.features.genealogyTrustBadgeSource : kk.features.genealogyTrustBadgeBundled
                }`
          }
          expanded={isOpen}
          onToggle={() => onToggleExpand(item, isOpen)}
          action="toggle"
        >
          {hasChildren ? (
            <View style={styles.childList}>
              {childRows.map((child) => renderTreeItem(child, depth + 1))}
            </View>
          ) : (
            renderDetailBody(item.slug, item.level)
          )}
        </TraditionAccordion>
      </View>
    );
  }

  const renderDetailBody = (slug: string, level: number) => {
    const detail = detailCache[slug] ?? detailFromBundled(slug);
    const isLoadingDetail = detailLoading === slug && !detail;
    if (isLoadingDetail) {
      return <RaqatOrnamentSpinner size={28} style={{ marginVertical: 8 }} />;
    }
    const persons = personsCache[slug] ?? (genealogyPersonsForClan(slug, bundledPersons) as GenealogyPerson[]);
    const loadingPersons = personsLoading === slug && persons.length === 0;
    const sourceCount = detail?.sources?.length ?? 0;
    return (
      <>
        <View style={styles.detailTrustBox}>
          <MaterialIcons
            name={sourceCount > 0 ? "verified" : "inventory-2"}
            size={18}
            color={sourceCount > 0 ? palette.gold : palette.muted}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTrustTitle}>
              {sourceCount > 0 ? kk.features.genealogyTrustVerifiedTitle : kk.features.genealogyTrustEditorialTitle}
            </Text>
            <Text style={styles.detailTrustBody}>
              {sourceCount > 0
                ? kk.features.genealogyTrustSourceEntryBody(sourceCount)
                : kk.features.genealogyTrustEditorialBody}
            </Text>
          </View>
        </View>
        {detail?.description_kk ? (
          <Text style={styles.description}>{detail.description_kk}</Text>
        ) : null}
        {detail?.name_kk_alt ? (
          <Text style={styles.altName}>{detail.name_kk_alt}</Text>
        ) : null}
        {loadingPersons ? (
          <RaqatOrnamentSpinner size={28} style={{ marginVertical: 6 }} />
        ) : persons.length > 0 ? (
          <View style={styles.personsBox}>
            <Text style={styles.sourcesTitle}>{kk.features.genealogyPersonsTitle}</Text>
            {persons.map((p) => {
              const years = genealogyLifeYears(p);
              const hit = bundledPersons.find((x) => x.slug === p.slug) ?? {
                slug: p.slug,
                clan_slug: p.clan_slug,
                name_kk: p.name_kk,
                name_lat: p.name_lat,
                era: p.era,
                role_kk: p.role_kk,
                birth_year: p.birth_year,
                death_year: p.death_year,
              };
              return (
                <Pressable
                  key={p.slug}
                  oyuBackdrop={false}
                  style={styles.personRow}
                  onPress={() => openPerson(hit)}
                  accessibilityRole="button"
                  accessibilityLabel={p.name_kk}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{p.name_kk}</Text>
                    <Text style={styles.personMeta}>
                      {[p.role_kk, years, genealogyEraLabel(p.era)].filter(Boolean).join(" · ")}
                    </Text>
                    {p.bio_kk ? (
                      <Text style={styles.personBio} numberOfLines={3}>
                        {p.bio_kk}
                      </Text>
                    ) : null}
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={palette.muted} />
                </Pressable>
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
        <Text style={styles.leafHint}>{kk.features.genealogyLeafLevel}</Text>
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

      {searchActive ? (
        <FlatList
          data={searchHits}
          keyExtractor={(item) => `${item.kind}-${item.slug}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.searchCount}>{kk.features.genealogySearchCount(searchHits.length)}</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>{kk.features.genealogySearchEmpty}</Text>}
          renderItem={({ item }) => (
            <Pressable
              oyuBackdrop={false}
              style={styles.searchHit}
              onPress={() => {
                if (item.kind === "person") {
                  const hit = bundledPersons.find((p) => p.slug === item.slug);
                  if (hit) openPerson(hit);
                  else onNavigateToPerson(item.clan_slug);
                } else {
                  onNavigateToNode(item.node);
                }
              }}
            >
              <View style={styles.searchHitTop}>
                <Text style={styles.searchHitName}>{item.name_kk}</Text>
                <Text style={styles.searchBadge}>
                  {item.kind === "person" ? kk.features.genealogySearchPerson : kk.features.genealogySearchClan}
                </Text>
              </View>
              <Text style={styles.searchHitPath}>{item.path}</Text>
            </Pressable>
          )}
        />
      ) : loading ? (
        <RaqatOrnamentSpinner size={52} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.slug}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {trustHeader}
              {collapseAllHeader}
            </>
          }
          ListFooterComponent={timelineFooter}
          renderItem={({ item }) => renderTreeItem(item)}
          ListEmptyComponent={<Text style={styles.empty}>{kk.features.genealogySearchEmpty}</Text>}
        />
      )}
      <GenealogyPersonModal
        visible={selectedPerson != null}
        person={selectedPerson}
        clanPath={
          selectedPerson ? genealogyClanPathLabel(selectedPerson.clan_slug, bundledNodes) : ""
        }
        onClose={() => setSelectedPerson(null)}
        onOpenClan={(clanSlug) => {
          setSelectedPerson(null);
          onNavigateToPerson(clanSlug);
        }}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"], palette: ReturnType<typeof getTraditionKazakhPalette>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.screenBg },
    list: { flex: 1, minHeight: 0 },
    collapseAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginBottom: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    collapseAllText: { color: palette.gold, fontSize: 12, fontWeight: "800" },
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
    timelineCard: {
      padding: 12,
      marginTop: 4,
      marginBottom: 10,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
    },
    timelineHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    timelineHeadText: { flex: 1 },
    timelineTitle: { color: palette.text, fontSize: 15, fontWeight: "800" },
    timelineSub: { color: palette.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
    timelineRow: { flexDirection: "row", gap: 10, paddingVertical: 7 },
    timelineDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: palette.gold,
      marginTop: 5,
    },
    timelineBody: { flex: 1 },
    timelineYears: { color: palette.gold, fontSize: 11, fontWeight: "900" },
    timelinePeriod: { color: palette.text, fontSize: 13, fontWeight: "800", marginTop: 1 },
    timelineText: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
    timelineNote: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
    trustCard: {
      padding: 12,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      gap: 10,
    },
    trustHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    trustIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.goldSurface,
    },
    trustHeadText: { flex: 1, minWidth: 0 },
    trustTitle: { color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: "900" },
    trustSub: { color: palette.gold, fontSize: 12, lineHeight: 16, fontWeight: "800", marginTop: 1 },
    trustStatsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    trustStatPill: {
      flexGrow: 1,
      minWidth: "22%",
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: palette.goldSurface,
      alignItems: "center",
    },
    trustStatValue: { color: palette.gold, fontSize: 15, fontWeight: "900" },
    trustStatLabel: { color: palette.text, fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: 1 },
    trustLine: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingTop: 2,
    },
    trustLineTitle: { color: palette.text, fontSize: 13, lineHeight: 18, fontWeight: "900" },
    trustLineBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
    trustPersonalNote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
    currentCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    currentLabel: { color: palette.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
    currentTitle: { color: palette.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
    currentMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
    rootBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: palette.goldSurface,
    },
    rootBtnText: { color: palette.gold, fontSize: 12, fontWeight: "800" },
    shortcutBar: { maxHeight: 74 },
    shortcutContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    shortcutChip: {
      minWidth: 116,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
    },
    shortcutChipActive: { borderColor: palette.gold, backgroundColor: palette.goldSurface },
    shortcutTitle: { color: palette.text, fontSize: 14, fontWeight: "800" },
    shortcutTitleActive: { color: palette.gold },
    shortcutMeta: { color: palette.muted, fontSize: 11, marginTop: 2, fontWeight: "700" },
    shortcutMetaActive: { color: palette.text },
    crumbBar: { maxHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
    crumbContent: { paddingHorizontal: 16, alignItems: "center", gap: 4 },
    crumb: { color: palette.muted, fontSize: 14 },
    crumbActive: { color: palette.gold, fontWeight: "600" },
    crumbSep: { color: palette.muted, marginHorizontal: 4 },
    listContent: { padding: 16, paddingBottom: 120, gap: 12 },
    rowWrap: { marginBottom: 8 },
    childRowWrap: { marginLeft: 10, marginBottom: 6 },
    childList: {
      paddingTop: 6,
      paddingLeft: 6,
      borderLeftWidth: 2,
      borderLeftColor: palette.border,
    },
    description: { color: palette.text, fontSize: 14, lineHeight: 20, marginBottom: 10 },
    altName: { color: palette.muted, fontSize: 14, marginBottom: 8 },
    personRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      paddingVertical: 4,
    },
    personName: { color: palette.text, fontSize: 15, fontWeight: "600" },
    personMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
    personBio: { color: palette.text, fontSize: 13, lineHeight: 18, marginTop: 4 },
    personsBox: { marginBottom: 10, paddingTop: 4 },
    sourcesBox: { marginBottom: 10, paddingTop: 4 },
    sourcesTitle: { color: palette.muted, fontSize: 12, fontWeight: "600", marginBottom: 4, textTransform: "uppercase" },
    sourceLine: { color: palette.text, fontSize: 13, lineHeight: 18, marginBottom: 2 },
    detailTrustBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: palette.goldSurface,
    },
    detailTrustTitle: { color: palette.text, fontSize: 13, lineHeight: 18, fontWeight: "900" },
    detailTrustBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
    leafHint: { color: palette.muted, fontSize: 13 },
    searchCount: { color: palette.muted, fontSize: 13, fontWeight: "700", marginBottom: 4 },
    searchHit: {
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
      borderColor: palette.border,
      borderRadius: 14,
      backgroundColor: palette.cardBg,
    },
    searchHitTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    searchHitName: { color: palette.text, fontSize: 16, fontWeight: "600" },
    searchBadge: {
      color: palette.gold,
      fontSize: 11,
      fontWeight: "800",
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 999,
      backgroundColor: palette.goldSurface,
      overflow: "hidden",
    },
    searchHitPath: { color: palette.muted, fontSize: 13, marginTop: 2 },
    empty: { textAlign: "center", color: palette.muted, marginTop: 24 },
    error: { textAlign: "center", color: colors.error, marginTop: 24, paddingHorizontal: 16 },
  });
}
