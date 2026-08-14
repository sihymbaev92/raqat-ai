import { tryLoadBundledJson } from "../utils/loadBundledJson";
import { SANA_AUTHOR, SANA_ENTRIES } from "./sanaMindOpeningWords";

export type GreatWordsAuthor = {
  id: string;
  name: string;
  period: string;
  bio: string;
};

export type GreatWordsEntry = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  proverbKey?: string;
  /** Абай «Қара сөз» реттік нөмірі (1–45) */
  karaSozNumber?: number;
  /** UI: аттас жазбалар біріктірілген виртуалды мәтін. */
  mergedCount?: number;
  /** UI: біріктірілген тақырыптағы авторлар. */
  mergedAuthorNames?: string[];
};

export type GreatWordsMergedTopic = {
  id: string;
  key: string;
  title: string;
  entries: GreatWordsEntry[];
  authorNames: string[];
};

export type GreatWordsCatalog = {
  version: number;
  authors: GreatWordsAuthor[];
  entries: GreatWordsEntry[];
};

const EMPTY_CATALOG: GreatWordsCatalog = { version: 0, authors: [], entries: [] };

let catalogCache: GreatWordsCatalog = EMPTY_CATALOG;
let loadPromise: Promise<GreatWordsCatalog | null> | null = null;

let statsCache: {
  authors: number;
  entries: number;
  mergedTopics: number;
  reflectiveEntries: number;
} | null = null;
let reflectiveEntriesCache: GreatWordsEntry[] | null = null;
const displayEntriesCache = new Map<string, GreatWordsEntry[]>();

export function isGreatWordsCatalogReady(): boolean {
  return catalogCache.entries.length > 0;
}

function rebuildDerivedCaches(): void {
  mergedTopicsCache = buildMergedTopics(catalogCache.entries);
  mergedTopicsEntriesRef = catalogCache.entries;
  displayEntriesCache.clear();
  reflectiveEntriesCache = buildReflectiveGreatWordsEntries(999);
  statsCache = {
    authors: catalogCache.authors.length,
    entries: catalogCache.entries.length,
    mergedTopics: mergedTopicsCache.length,
    reflectiveEntries: reflectiveEntriesCache.length,
  };
}

/** CDN жоқ/ескі болса да «Сананы ашатын сөздер» толық ашылады. */
function withSanaSeed(catalog: GreatWordsCatalog): GreatWordsCatalog {
  const authors = catalog.authors.filter((a) => a.id !== "sana");
  const entries = catalog.entries.filter((e) => e.authorId !== "sana" && !e.id.startsWith("sana-"));
  const abaiIdx = authors.findIndex((a) => a.id === "abai");
  const insertAt = abaiIdx >= 0 ? abaiIdx + 1 : 0;
  authors.splice(insertAt, 0, SANA_AUTHOR);
  return {
    ...catalog,
    version: catalog.version || 1,
    authors,
    entries: [...SANA_ENTRIES, ...entries],
  };
}

export async function ensureGreatWordsCatalogLoaded(): Promise<GreatWordsCatalog | null> {
  if (catalogCache.entries.length) return catalogCache;
  if (!loadPromise) {
    loadPromise = tryLoadBundledJson<GreatWordsCatalog>("great-words-catalog.json")
      .then((data) => {
        if (data?.entries?.length) {
          catalogCache = withSanaSeed(data);
        } else {
          catalogCache = withSanaSeed({ version: 1, authors: [], entries: [] });
        }
        rebuildDerivedCaches();
        return catalogCache.entries.length ? catalogCache : null;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function releaseGreatWordsCatalogMemory(): void {
  catalogCache = EMPTY_CATALOG;
  loadPromise = null;
  mergedTopicsCache = null;
  mergedTopicsEntriesRef = null;
  statsCache = null;
  reflectiveEntriesCache = null;
  displayEntriesCache.clear();
}

const MERGED_TOPIC_ID_PREFIX = "merged-topic:";
const MERGED_AUTHOR_TOPIC_ID_PREFIX = "merged-author-topic:";

let mergedTopicsCache: GreatWordsMergedTopic[] | null = null;
let mergedTopicsEntriesRef: GreatWordsEntry[] | null = null;

function getCachedMergedTopics(): GreatWordsMergedTopic[] {
  if (mergedTopicsCache && mergedTopicsEntriesRef === catalogCache.entries) {
    return mergedTopicsCache;
  }
  mergedTopicsCache = buildMergedTopics(catalogCache.entries);
  mergedTopicsEntriesRef = catalogCache.entries;
  return mergedTopicsCache;
}

function normalizeTopicTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[«»"“”'`]/g, "")
    .replace(/[—–-]+/g, " ")
    .replace(/[.,:;!?()]+/g, " ")
    .replace(/\s+/g, " ");
}

function topicSlug(title: string): string {
  return normalizeTopicTitle(title)
    .replace(/[^0-9a-zа-яёәғқңөұүһі\s]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function authorName(authorId: string): string {
  return getAuthorById(authorId)?.name ?? authorId;
}

function shortExcerpt(text: string, max = 850): string {
  const cleaned = text.trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const sentence = cut.lastIndexOf(".");
  return `${cut.slice(0, sentence > 220 ? sentence + 1 : max).trim()}…`;
}

function buildMergedEntry(topic: GreatWordsMergedTopic, scopedAuthorId?: string): GreatWordsEntry {
  const entries = topic.entries;
  const authors = topic.authorNames;
  const heading = [
    `Бұл — аттас тақырыптарды біріктірген жинақ: «${topic.title}».`,
    `${entries.length} жазба, ${authors.length} автор: ${authors.join(", ")}.`,
    "Төмендегі үзінділер бір тақырыптың әр тұлғадағы ой желісін салыстырып оқуға арналған.",
  ].join("\n");
  const body = entries
    .slice(0, 18)
    .map((entry, index) => {
      const au = authorName(entry.authorId);
      return `${index + 1}. ${au} — ${entry.title}\n${shortExcerpt(entry.body)}`;
    })
    .join("\n\n");
  return {
    id: scopedAuthorId
      ? `${MERGED_AUTHOR_TOPIC_ID_PREFIX}${scopedAuthorId}:${topic.key}`
      : `${MERGED_TOPIC_ID_PREFIX}${topic.key}`,
    authorId: scopedAuthorId ?? "editorial",
    title: topic.title,
    body: `${heading}\n\n${body}`,
    mergedCount: entries.length,
    mergedAuthorNames: authors,
  };
}

function buildMergedTopics(entries: GreatWordsEntry[]): GreatWordsMergedTopic[] {
  const groups = new Map<string, GreatWordsEntry[]>();
  for (const entry of entries) {
    const key = normalizeTopicTitle(entry.title);
    if (!key) continue;
    const rows = groups.get(key) ?? [];
    rows.push(entry);
    groups.set(key, rows);
  }
  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => {
      const sorted = [...rows].sort((a, b) => authorName(a.authorId).localeCompare(authorName(b.authorId), "kk") || a.id.localeCompare(b.id));
      return {
        id: `${MERGED_TOPIC_ID_PREFIX}${topicSlug(sorted[0]?.title ?? key)}`,
        key: topicSlug(sorted[0]?.title ?? key),
        title: sorted[0]?.title ?? key,
        entries: sorted,
        authorNames: [...new Set(sorted.map((entry) => authorName(entry.authorId)))],
      };
    })
    .sort((a, b) => b.entries.length - a.entries.length || a.title.localeCompare(b.title, "kk"));
}

export function getGreatWordsCatalog(): GreatWordsCatalog {
  return catalogCache;
}

export function getGreatWordsAuthors(): GreatWordsAuthor[] {
  return catalogCache.authors;
}

export function getAuthorById(id: string): GreatWordsAuthor | undefined {
  return catalogCache.authors.find((a) => a.id === id);
}

export function getEntriesByAuthorId(authorId: string): GreatWordsEntry[] {
  const list = catalogCache.entries.filter((e) => e.authorId === authorId);
  if (authorId === "abai") {
    return [...list].sort(
      (a, b) => (a.karaSozNumber ?? 0) - (b.karaSozNumber ?? 0) || a.title.localeCompare(b.title, "kk")
    );
  }
  if (authorId === "sana") {
    return [...list].sort((a, b) => a.id.localeCompare(b.id) || a.title.localeCompare(b.title, "kk"));
  }
  return list;
}

export function getDisplayEntriesByAuthorId(authorId: string): GreatWordsEntry[] {
  const cached = displayEntriesCache.get(authorId);
  if (cached) return cached;
  const entries = getEntriesByAuthorId(authorId);
  /** Сана жинағы — бірегей тақырыптар; біріктіру қажет емес. */
  if (authorId === "sana") {
    displayEntriesCache.set(authorId, entries);
    return entries;
  }
  const merged = buildMergedTopics(entries);
  const mergedIds = new Set(merged.flatMap((topic) => topic.entries.map((entry) => entry.id)));
  const singles = entries.filter((entry) => !mergedIds.has(entry.id));
  const virtual = merged.map((topic) => buildMergedEntry(topic, authorId));
  const result = [...virtual, ...singles].sort((a, b) => {
    if (authorId === "abai") {
      return (a.karaSozNumber ?? 0) - (b.karaSozNumber ?? 0) || a.title.localeCompare(b.title, "kk");
    }
    return a.title.localeCompare(b.title, "kk") || a.id.localeCompare(b.id);
  });
  displayEntriesCache.set(authorId, result);
  return result;
}

export function getEntryById(id: string): GreatWordsEntry | undefined {
  if (id.startsWith(MERGED_AUTHOR_TOPIC_ID_PREFIX)) {
    const rest = id.slice(MERGED_AUTHOR_TOPIC_ID_PREFIX.length);
    const sep = rest.indexOf(":");
    const authorId = sep >= 0 ? rest.slice(0, sep) : "";
    const key = sep >= 0 ? rest.slice(sep + 1) : rest;
    const topic = buildMergedTopics(getEntriesByAuthorId(authorId)).find((item) => item.key === key);
    return topic ? buildMergedEntry(topic, authorId) : undefined;
  }
  if (id.startsWith(MERGED_TOPIC_ID_PREFIX)) {
    const key = id.slice(MERGED_TOPIC_ID_PREFIX.length);
    const topic = getMergedGreatWordsTopics().find((item) => item.key === key);
    return topic ? buildMergedEntry(topic) : undefined;
  }
  return catalogCache.entries.find((e) => e.id === id);
}

export function getMergedGreatWordsTopics(limit = 14): GreatWordsMergedTopic[] {
  return getCachedMergedTopics().slice(0, limit);
}

export function searchMergedGreatWordsTopics(query: string, limit = 16): GreatWordsMergedTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return getMergedGreatWordsTopics(limit);
  return getCachedMergedTopics()
    .filter((topic) => {
      const blob = [
        topic.title,
        topic.authorNames.join(" "),
        topic.entries.map((entry) => entry.body.slice(0, 240)).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    })
    .slice(0, limit);
}

function buildReflectiveGreatWordsEntries(limit: number): GreatWordsEntry[] {
  const chosen: GreatWordsEntry[] = [];
  const seenAuthors = new Set<string>();
  const candidates = [...catalogCache.entries]
    .filter((entry) => entry.body.trim().length >= 480)
    .sort((a, b) => {
      const aScore = (a.karaSozNumber ? 400 : 0) + Math.min(a.body.length, 2400);
      const bScore = (b.karaSozNumber ? 400 : 0) + Math.min(b.body.length, 2400);
      return bScore - aScore;
    });
  for (const entry of candidates) {
    if (seenAuthors.has(entry.authorId) && chosen.length < Math.ceil(limit / 2)) continue;
    chosen.push(entry);
    seenAuthors.add(entry.authorId);
    if (chosen.length >= limit) break;
  }
  return chosen;
}

export function getReflectiveGreatWordsEntries(limit = 8): GreatWordsEntry[] {
  if (reflectiveEntriesCache) {
    return reflectiveEntriesCache.slice(0, limit);
  }
  return buildReflectiveGreatWordsEntries(limit);
}

export function searchGreatWordsEntries(query: string): GreatWordsEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalogCache.entries;
  return catalogCache.entries.filter((e) => {
    const author = getAuthorById(e.authorId);
    const blob = [e.title, e.body, author?.name ?? "", author?.bio ?? ""].join(" ").toLowerCase();
    return blob.includes(q);
  });
}

export function countEntriesForAuthor(authorId: string): number {
  return catalogCache.entries.filter((e) => e.authorId === authorId).length;
}

export function getGreatWordsStats(): { authors: number; entries: number; mergedTopics: number; reflectiveEntries: number } {
  if (statsCache) return statsCache;
  return {
    authors: catalogCache.authors.length,
    entries: catalogCache.entries.length,
    mergedTopics: getCachedMergedTopics().length,
    reflectiveEntries: getReflectiveGreatWordsEntries(999).length,
  };
}

export function hydrateGreatWordsCatalog(): Promise<void> {
  return ensureGreatWordsCatalogLoaded().then(() => undefined);
}
