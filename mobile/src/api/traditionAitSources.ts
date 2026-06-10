/**

 * Айт жинағы: halaldamu.kz + Raqat ресми вебі.

 * halaldamu — WordPress JSON (`/wp-json/wp/v2/*`), сәтсіз болса HTML /kk.

 * Raqat — маркетинг HTML; 30 мин кэш.

 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { decodeHalalDamuHtmlEntities, halalDamuSiteHomeUrl, halalDamuSiteOrigin } from "./halalDamuWp";

import { getRaqatMarketingWebUrl } from "../config/raqatMarketingWebUrl";



const FETCH_TIMEOUT_MS = 25_000;

const CACHE_KEY = "tradition_ait_sources_v2";

const CACHE_TTL_MS = 30 * 60 * 1000;

const MAX_SNIPPETS_PER_SITE = 6;

const MAX_SNIPPET_CHARS = 280;

const FETCH_UA = "Raqat/1.0 (Halal directory)";



const SNIPPET_RE =

  /айт|орaza|ұраза|құрбан|курбан|фитр|намаз|мереке|fitr|eid|ramadan|құрбандық|мейрам|сәре|ураза|праздник/i;



export type TraditionAitSourceId = "halaldamu" | "raqat";



export type TraditionAitSourceSnapshot = {

  id: TraditionAitSourceId;

  label: string;

  url: string;

  ok: boolean;

  snippets: string[];

  error?: string;

};



export type TraditionAitSyncBundle = {

  sources: TraditionAitSourceSnapshot[];

  syncedAt: string | null;

  fromCache: boolean;

};



type CachePayload = {

  syncedAt: string;

  sources: TraditionAitSourceSnapshot[];

};



type WpContentRow = {

  title?: { rendered?: string };

  content?: { rendered?: string };

  excerpt?: { rendered?: string };

};



async function fetchWithTimeout(url: string, accept: string): Promise<Response> {

  const c = new AbortController();

  const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);

  try {

    return await fetch(url, {

      method: "GET",

      signal: c.signal,

      headers: {

        Accept: accept,

        "User-Agent": FETCH_UA,

      },

    });

  } finally {

    clearTimeout(t);

  }

}



export function htmlToPlainText(html: string): string {

  if (!html) return "";

  let t = html;

  t = t.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");

  t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");

  t = t.replace(/<[^>]+>/g, " ");

  t = t

    .replace(/&nbsp;/g, " ")

    .replace(/&amp;/g, "&")

    .replace(/&lt;/g, "<")

    .replace(/&gt;/g, ">")

    .replace(/&quot;/g, '"')

    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  return t.replace(/\s+/g, " ").trim();

}



export function extractAitSnippetsFromPlainText(plain: string): string[] {

  if (!plain) return [];

  const parts = plain

    .split(/(?<=[.!?…])\s+/)

    .map((s) => s.trim())

    .filter((s) => s.length >= 24 && s.length <= MAX_SNIPPET_CHARS && SNIPPET_RE.test(s));

  const seen = new Set<string>();

  const out: string[] = [];

  for (const p of parts) {

    const key = p.slice(0, 64).toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);

    out.push(p);

    if (out.length >= MAX_SNIPPETS_PER_SITE) break;

  }

  return out;

}



function halalDamuWpApiBase(): string {

  return `${halalDamuSiteOrigin()}/wp-json`;

}



function halalDamuKkUrl(): string {

  const home = halalDamuSiteHomeUrl().replace(/\/+$/, "");

  return `${home}/kk`;

}



function siteLabelFromUrl(url: string): string {

  try {

    return new URL(url).hostname.replace(/^www\./, "");

  } catch {

    return url;

  }

}



function wpRowsToPlain(rows: WpContentRow[]): string {

  const chunks: string[] = [];

  for (const row of rows) {

    const title = decodeHalalDamuHtmlEntities(row.title?.rendered ?? "");

    const content = decodeHalalDamuHtmlEntities(row.content?.rendered ?? "");

    const excerpt = decodeHalalDamuHtmlEntities(row.excerpt?.rendered ?? "");

    if (title) chunks.push(title);

    if (excerpt) chunks.push(excerpt);

    if (content) chunks.push(htmlToPlainText(content));

  }

  return chunks.join(" ").replace(/\s+/g, " ").trim();

}



async function fetchHalalDamuWpPlain(): Promise<string> {

  const base = halalDamuWpApiBase();

  const endpoints = [

    `${base}/wp/v2/article?per_page=30&_fields=title,content,excerpt`,

    `${base}/wp/v2/posts?per_page=20&_fields=title,content,excerpt`,

    `${base}/wp/v2/pages?per_page=20&_fields=title,content,excerpt`,

  ];

  const chunks: string[] = [];

  for (const url of endpoints) {

    try {

      const r = await fetchWithTimeout(url, "application/json");

      if (!r.ok) continue;

      const data = (await r.json()) as unknown;

      if (!Array.isArray(data)) continue;

      const plain = wpRowsToPlain(data as WpContentRow[]);

      if (plain) chunks.push(plain);

    } catch {

      /* келесі endpoint */

    }

  }

  return chunks.join(" ").replace(/\s+/g, " ").trim();

}



async function fetchHalalDamuHtmlPlain(url: string): Promise<string> {

  const r = await fetchWithTimeout(url, "text/html,application/xhtml+xml");

  if (!r.ok) {

    throw new Error(`HTTP ${r.status}`);

  }

  const html = await r.text();

  return htmlToPlainText(html);

}



async function fetchHalalDamuSource(): Promise<TraditionAitSourceSnapshot> {

  const url = halalDamuKkUrl();

  const label = siteLabelFromUrl(url);

  try {

    let plain = await fetchHalalDamuWpPlain();

    if (!plain.trim()) {

      try {

        plain = await fetchHalalDamuHtmlPlain(url);

      } catch {

        plain = await fetchHalalDamuHtmlPlain(halalDamuSiteHomeUrl());

      }

    }

    const snippets = extractAitSnippetsFromPlainText(plain);

    return {

      id: "halaldamu",

      label,

      url,

      ok: true,

      snippets,

      error: snippets.length === 0 ? "no_snippets" : undefined,

    };

  } catch {

    return { id: "halaldamu", label, url, ok: false, snippets: [], error: "network" };

  }

}



async function fetchHtmlSource(

  id: TraditionAitSourceId,

  url: string

): Promise<TraditionAitSourceSnapshot> {

  const label = siteLabelFromUrl(url);

  try {

    const r = await fetchWithTimeout(url, "text/html,application/xhtml+xml");

    if (!r.ok) {

      return { id, label, url, ok: false, snippets: [], error: `HTTP ${r.status}` };

    }

    const html = await r.text();

    const snippets = extractAitSnippetsFromPlainText(htmlToPlainText(html));

    return {

      id,

      label,

      url,

      ok: true,

      snippets,

      error: snippets.length === 0 ? "no_snippets" : undefined,

    };

  } catch {

    return { id, label, url, ok: false, snippets: [], error: "network" };

  }

}



async function readCache(): Promise<CachePayload | null> {

  try {

    const raw = await AsyncStorage.getItem(CACHE_KEY);

    if (!raw) return null;

    const j = JSON.parse(raw) as CachePayload;

    if (!j?.syncedAt || !Array.isArray(j.sources)) return null;

    const age = Date.now() - new Date(j.syncedAt).getTime();

    if (!Number.isFinite(age) || age > CACHE_TTL_MS) return null;

    return j;

  } catch {

    return null;

  }

}



async function writeCache(sources: TraditionAitSourceSnapshot[]): Promise<string> {

  const syncedAt = new Date().toISOString();

  const payload: CachePayload = { syncedAt, sources };

  try {

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));

  } catch {

    /* сақталмады */

  }

  return syncedAt;

}



export function traditionAitSourceUrls(): { halaldamu: string; raqat: string } {

  return {

    halaldamu: halalDamuKkUrl(),

    raqat: getRaqatMarketingWebUrl(),

  };

}



async function fetchNetworkBundle(): Promise<TraditionAitSyncBundle> {

  const { raqat } = traditionAitSourceUrls();

  const sources = await Promise.all([fetchHalalDamuSource(), fetchHtmlSource("raqat", raqat)]);

  const syncedAt = await writeCache(sources);

  return { sources, syncedAt, fromCache: false };

}



export async function fetchTraditionAitSources(opts?: {

  forceNetwork?: boolean;

}): Promise<TraditionAitSyncBundle> {

  if (!opts?.forceNetwork) {

    const cached = await readCache();

    if (cached) {

      return { sources: cached.sources, syncedAt: cached.syncedAt, fromCache: true };

    }

  }

  return fetchNetworkBundle();

}



export async function invalidateTraditionAitCaches(): Promise<void> {

  try {

    await AsyncStorage.multiRemove([CACHE_KEY, "tradition_ait_sources_v1"]);

  } catch {

    /* */

  }

}



export function countAitSnippets(bundle: TraditionAitSyncBundle | null | undefined): number {

  if (!bundle) return 0;

  return bundle.sources.reduce((n, s) => n + s.snippets.length, 0);

}


