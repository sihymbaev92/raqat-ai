/**
 * halaldamu.kz ресми WordPress JSON API (ашық, токенсіз).
 *
 * halal-bot/v1:
 * - GET /companies — search, lang, category_type, certificate_status, lat, lon, radius, per_page, page
 * - GET /companies/{id}
 * - GET /products — search, barcode, company_id, status, per_page, page
 * - GET /additives — search, per_page, page
 *
 * wp/v2:
 * - GET /company — соңғы мекемелер тізімі (_embed)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHalalDamuUrl } from "../config/halalDamuUrl";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { parseLatLngFromMapServiceUrl } from "../lib/halalDamuMapLinkGeo";
import { filterHalalCompaniesWithinRadius } from "../utils/halalGeoFilter";
import { halalBarcodeLookupKeys, normalizeHalalBarcodeDigits } from "../utils/halalBarcodeLookup";
import { dedupeHalalCompanyCards } from "../utils/halalInstantSearch";

const FETCH_TIMEOUT_MS = 25_000;
/** Толық реестр JSON үлкен — желі баяу болса ұзақ күту. */
const FETCH_MAP_COMPANIES_MS = 120_000;
/** halal-bot companies тізімі (~4 МБ) — әдепкі 25 с таймаут жетпей қалады. */
const FETCH_COMPANIES_BULK_MS = 120_000;

/** Іздеусіз каталог: API барлық ұйымды бір жауапта қайтарады — жадта сақтаймыз, беттеу клиентте. */
let companiesBulkMemory: { serverKey: string; items: HalalDamuCompanyCard[] } | null = null;

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: c.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Raqat/1.0 (Halal directory)",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

/** RN fetch().json() BOM / бос дене қателерін болдырмайды. */
async function parseHalalDamuResponseJson<T>(r: Response): Promise<T> {
  const text = await r.text();
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) throw new Error("empty_json");
  return JSON.parse(cleaned) as T;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function apiBase(): string {
  const raw = getHalalDamuUrl().replace(/\/+$/, "");
  let origin = raw;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    origin = u.origin;
  } catch {
    /* қалпы */
  }
  return `${origin}/wp-json`;
}

function truthyEnv(v: string | undefined): boolean {
  const t = (v ?? "").trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/** Жергілікті platform API (LAN / эмулятор). */
function isLikelyLocalDevApiBase(api: string): boolean {
  try {
    const u = new URL(api.includes("://") ? api : `http://${api}`);
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "10.0.2.2" ||
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      h.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/** Production platform API — /api/v1/halal-damu прокси + серверлік кэш. */
function isRaqatPlatformApiBase(api: string): boolean {
  try {
    const u = new URL(api.includes("://") ? api : `https://${api}`);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return (
      h === "api.rahatomir.com" ||
      h.endsWith(".rahatomir.com") ||
      h === "api.raqat.ai" ||
      h.endsWith(".raqat.ai")
    );
  } catch {
    return false;
  }
}

/**
 * Platform API прокси: жергілікті dev, api.rahatomir.com, немесе EXPO_PUBLIC_HALAL_DAMU_USE_PROXY=1.
 * Web-та да production proxy керек: браузер halaldamu.kz direct fetch-ін CORS-пен тоқтатады.
 * DIRECT=1 — проксиді міндетті түрде өшіреді.
 */
export function shouldUseHalalDamuPlatformProxy(): boolean {
  if (truthyEnv(typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_HALAL_DAMU_DIRECT : undefined)) {
    return false;
  }
  const force = typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY : undefined;
  if (force != null && String(force).trim() !== "") {
    return truthyEnv(String(force)) && !!getRaqatApiBase();
  }
  const api = getRaqatApiBase();
  if (!api) return false;
  return isLikelyLocalDevApiBase(api) || isRaqatPlatformApiBase(api);
}

/** JSON сұраулар: `/api/v1/halal-damu/...` немесе тікелей halaldamu wp-json. */
function halalApiRoot(): string {
  if (shouldUseHalalDamuPlatformProxy()) {
    return `${getRaqatApiBase()}/api/v1/halal-damu`;
  }
  return apiBase();
}

/** Прокси сәтсіз болса (404) — halaldamu.kz тікелей қайталау. */
async function halalDamuFetchGet(relativePath: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const rel = relativePath.replace(/^\//, "");
  const directUrl = `${apiBase()}/${rel}`;
  if (!shouldUseHalalDamuPlatformProxy()) {
    return fetchWithTimeout(directUrl, { method: "GET" }, timeoutMs);
  }
  const proxyUrl = `${getRaqatApiBase()}/api/v1/halal-damu/${rel}`;
  try {
    const r = await fetchWithTimeout(proxyUrl, { method: "GET" }, timeoutMs);
    if (r.ok) return r;
    if (r.status === 404 || r.status === 502 || r.status === 503) {
      return fetchWithTimeout(directUrl, { method: "GET" }, timeoutMs);
    }
    return r;
  } catch {
    return fetchWithTimeout(directUrl, { method: "GET" }, timeoutMs);
  }
}

/** WP `title.rendered` / halal-bot `title` — HTML entity қысқа декодер */
export function decodeHalalDamuHtmlEntities(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export type HalalDamuCompanyListRow = {
  id: number;
  slug: string;
  title: string;
  /** `wp/v2/company` + `_embed` — featured media, болмаса null */
  thumbnailUrl: string | null;
};

const HALAL_DAMU_WP_UPLOAD_SIZE_SUFFIX_RE = /-\d+x\d+$/;
const HALAL_DAMU_THUMBNAIL_IMAGE_EXT_RE = /\.(jpe?g|png|webp)$/i;

/**
 * WordPress upload image үшін dashboard thumbnail candidate.
 * Серверде variant жоқ болса caller original URL-ға fallback жасауы керек.
 */
export function halalDamuRemoteImageThumbnailUrl(
  url: string,
  size: number = 300
): string {
  const raw = url.trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const path = u.pathname;
    if (!path.includes("/wp-content/uploads/")) return raw;
    if (!HALAL_DAMU_THUMBNAIL_IMAGE_EXT_RE.test(path)) return raw;
    const dot = path.lastIndexOf(".");
    if (dot <= 0) return raw;
    const stem = path.slice(0, dot);
    if (HALAL_DAMU_WP_UPLOAD_SIZE_SUFFIX_RE.test(stem)) return raw;
    const ext = path.slice(dot);
    u.pathname = `${stem}-${size}x${size}${ext}`;
    return u.toString();
  } catch {
    return raw;
  }
}

/** WP CPT жауабындағы `_embedded['wp:featuredmedia']` → кіші сурет URL */
function halalDamuFeaturedThumbFromWpCompany(o: Record<string, unknown>): string | null {
  const embedded = o._embedded;
  if (!embedded || typeof embedded !== "object") return null;
  const em = embedded as Record<string, unknown>;
  const fm = em["wp:featuredmedia"];
  if (!Array.isArray(fm) || fm.length === 0) return null;
  const media = fm[0] as Record<string, unknown>;
  if (!media || typeof media !== "object") return null;
  const md = media.media_details as Record<string, unknown> | undefined;
  const sizes = md?.sizes as Record<string, { source_url?: string }> | undefined;
  const fromSize =
    sizes?.thumbnail?.source_url ??
    sizes?.medium?.source_url ??
    sizes?.woocommerce_thumbnail?.source_url ??
    sizes?.full?.source_url;
  if (fromSize && typeof fromSize === "string" && fromSize.startsWith("http")) return fromSize;
  const su = media.source_url;
  return su != null && typeof su === "string" && su.startsWith("http") ? su : null;
}

export type HalalDamuExtraLinkKind =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "telegram"
  | "youtube"
  | "tiktok"
  | "vk"
  | "other";

/** API `desc` немесе қосымша өрістерден табылған http сілтеме (әлеуметтік желі т.б.). */
export type HalalDamuExtraLink = {
  url: string;
  kind: HalalDamuExtraLinkKind;
  /** API кілті немесе desc */
  hint: string;
};

export type HalalDamuCompanyCard = {
  id: number;
  title: string;
  legalName: string | null;
  slug: string | null;
  categoryType: string | null;
  certificateStatus: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapLink: string | null;
  thumbnailUrl: string | null;
  updatedAt: string | null;
  /** Логотип / ірі сурет (logo_image немесе featured full) */
  logoUrl: string | null;
  /** Галерея `photos` */
  galleryUrls: string[];
  /** Бірнеше нөмір — телефон чиптері үшін */
  phones: string[];
  /** Тазартылған қысқа сипаттама (HTML тегтері алынып тасталған) */
  description: string | null;
  certNumber: string | null;
  certIssuedAt: string | null;
  certExpiresAt: string | null;
  lat: number | null;
  lon: number | null;
  /** Карта / маршрут: map_link немесе координат, әйтпесе Google Maps іздеу */
  resolvedMapUrl: string | null;
  extraUrls: HalalDamuExtraLink[];
};

function halalPickHttpUrl(val: unknown): string | null {
  if (typeof val === "string") {
    const u = val.trim();
    return u.startsWith("http") ? u : null;
  }
  if (!val || typeof val !== "object") return null;
  const o = val as Record<string, unknown>;
  for (const key of ["full", "url", "source_url", "src", "large", "medium", "thumbnail"]) {
    const u = halalPickHttpUrl(o[key]);
    if (u) return u;
  }
  const sizes = o.sizes;
  if (sizes && typeof sizes === "object") {
    const sz = sizes as Record<string, unknown>;
    for (const sk of ["thumbnail", "medium", "woocommerce_thumbnail", "full"]) {
      const entry = sz[sk];
      if (entry && typeof entry === "object") {
        const u = halalPickHttpUrl((entry as Record<string, unknown>).source_url);
        if (u) return u;
      }
    }
  }
  return null;
}

function halalImageObjectPickBest(img: unknown, preferFull: boolean): string | null {
  if (!img) return null;
  const direct = halalPickHttpUrl(img);
  if (direct) return direct;
  if (typeof img !== "object") return null;
  const o = img as Record<string, unknown>;
  const full = o.full != null ? String(o.full) : null;
  const thumb = o.thumbnail != null ? String(o.thumbnail) : null;
  const url = preferFull ? full ?? thumb : thumb ?? full;
  return url && url.startsWith("http") ? url : null;
}

/** Тізім/іздеу карточкасына көрсетілетін сурет (логотип → кіші → галерея). */
export function halalCompanyDisplayImageUrl(c: HalalDamuCompanyCard): string | null {
  return c.logoUrl ?? c.thumbnailUrl ?? c.galleryUrls[0] ?? null;
}

function halalMergeCompanyMedia(
  item: HalalDamuCompanyCard,
  rich: HalalDamuCompanyCard
): HalalDamuCompanyCard {
  if (
    item.logoUrl === rich.logoUrl &&
    item.thumbnailUrl === rich.thumbnailUrl &&
    item.galleryUrls.length === rich.galleryUrls.length
  ) {
    return item;
  }
  return {
    ...item,
    logoUrl: item.logoUrl ?? rich.logoUrl,
    thumbnailUrl: item.thumbnailUrl ?? rich.thumbnailUrl,
    galleryUrls: item.galleryUrls.length > 0 ? item.galleryUrls : rich.galleryUrls,
  };
}

/** Жад/диск bulk кэшінен логотип/сурет толықтыру (іздеу жауабында жоқ болса). */
export function enrichHalalCompanyCardsFromBulkCache(
  items: HalalDamuCompanyCard[]
): HalalDamuCompanyCard[] {
  const lookup = new Map<number, HalalDamuCompanyCard>();
  if (companiesBulkMemory) {
    for (const c of companiesBulkMemory.items) lookup.set(c.id, c);
  }
  if (lookup.size === 0) return items;
  return items.map((item) => {
    const rich = lookup.get(item.id);
    return rich ? halalMergeCompanyMedia(item, rich) : item;
  });
}

const wpCompanyThumbMemory = new Map<number, string>();
const WP_THUMB_CACHE_MAX = 200;

function rememberWpCompanyThumb(id: number, thumb: string): void {
  if (wpCompanyThumbMemory.size >= WP_THUMB_CACHE_MAX) {
    const oldest = wpCompanyThumbMemory.keys().next().value;
    if (oldest != null) wpCompanyThumbMemory.delete(oldest);
  }
  wpCompanyThumbMemory.set(id, thumb);
}

async function halalFetchWpCompanyThumbUrl(id: number): Promise<string | null> {
  if (!id) return null;
  const cached = wpCompanyThumbMemory.get(id);
  if (cached) return cached;
  const path = `wp/v2/company/${id}?_embed=1`;
  try {
    const r = await halalDamuFetchGet(path, 12_000);
    if (!r.ok) return null;
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    const thumb = halalDamuFeaturedThumbFromWpCompany(data);
    if (thumb) rememberWpCompanyThumb(id, thumb);
    return thumb;
  } catch {
    return null;
  }
}

const WP_THUMB_ENRICH_MAX = 24;

/** Іздеу/жақындық тізімі: bulk кэш + WP `_embed` арқылы логотип. */
export async function enrichHalalCompanyCardsWithMedia(
  items: HalalDamuCompanyCard[]
): Promise<HalalDamuCompanyCard[]> {
  let out = enrichHalalCompanyCardsFromBulkCache(items);
  const need = out.filter((c) => !halalCompanyDisplayImageUrl(c)).slice(0, WP_THUMB_ENRICH_MAX);
  if (need.length === 0) return out;
  const thumbs = await Promise.all(
    need.map(async (c) => ({ id: c.id, url: await halalFetchWpCompanyThumbUrl(c.id) }))
  );
  const byId = new Map(thumbs.filter((t) => t.url).map((t) => [t.id, t.url!]));
  if (byId.size === 0) return out;
  out = out.map((c) => {
    const url = byId.get(c.id);
    if (!url) return c;
    return {
      ...c,
      logoUrl: c.logoUrl ?? url,
      thumbnailUrl: c.thumbnailUrl ?? url,
    };
  });
  return out;
}

function halalParsePhotoArray(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  const out: string[] = [];
  for (const p of photos) {
    if (typeof p === "string") {
      if (p.startsWith("http")) out.push(p);
    } else if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      const u =
        (o.full != null && String(o.full).startsWith("http") ? String(o.full) : null) ??
        (o.url != null && String(o.url).startsWith("http") ? String(o.url) : null) ??
        (o.source_url != null && String(o.source_url).startsWith("http") ? String(o.source_url) : null);
      if (u) out.push(u);
    }
  }
  return out;
}

function halalSplitPhones(phoneRaw: string | null): string[] {
  if (!phoneRaw) return [];
  return phoneRaw
    .split(/[,;/|\n]+/)
    .map((s) => s.trim().replace(/^tel:/i, ""))
    .filter((s) => s.replace(/\D/g, "").length >= 5);
}

function halalLatLon(raw: Record<string, unknown>): { lat: number | null; lon: number | null } {
  const lat = raw.lat != null ? Number(raw.lat) : NaN;
  const lon = raw.lon != null ? Number(raw.lon) : raw.lng != null ? Number(raw.lng) : NaN;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
  };
}

function halalCertFields(raw: unknown): {
  certNumber: string | null;
  certIssuedAt: string | null;
  certExpiresAt: string | null;
} {
  if (!raw || typeof raw !== "object") {
    return { certNumber: null, certIssuedAt: null, certExpiresAt: null };
  }
  const c = raw as Record<string, unknown>;
  return {
    certNumber: c.number != null && String(c.number).trim() ? String(c.number) : null,
    certIssuedAt: c.issued_at != null && String(c.issued_at).trim() ? String(c.issued_at) : null,
    certExpiresAt: c.expires_at != null && String(c.expires_at).trim() ? String(c.expires_at) : null,
  };
}

const HALAL_URL_IN_TEXT_RE = /https?:\/\/[^\s"'<>)\]]+/gi;

function halalExtractUrls(text: string, max: number): string[] {
  const m = text.match(HALAL_URL_IN_TEXT_RE);
  if (!m) return [];
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (let u of m) {
    u = u.replace(/[),.;:]+$/g, "");
    const low = u.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    uniq.push(u);
    if (uniq.length >= max) break;
  }
  return uniq;
}

function halalInferLinkKind(url: string, keyHint: string): HalalDamuExtraLinkKind {
  const u = url.toLowerCase();
  const k = keyHint.toLowerCase();
  if (u.includes("wa.me") || u.includes("whatsapp") || k.includes("whatsapp") || k === "wa") return "whatsapp";
  if (u.includes("instagram.com") || k.includes("instagram") || k.includes("insta")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.com") || k.includes("facebook") || k === "fb") return "facebook";
  if (u.includes("t.me/") || u.includes("telegram") || k.includes("telegram")) return "telegram";
  if (u.includes("youtube.com") || u.includes("youtu.be") || k.includes("youtube")) return "youtube";
  if (u.includes("tiktok.com") || k.includes("tiktok")) return "tiktok";
  if (u.includes("vk.com") || k.includes("vk")) return "vk";
  return "other";
}

const HALAL_CARD_EXTRA_SKIP_KEYS = new Set([
  "id",
  "title",
  "legal_name",
  "slug",
  "category_type",
  "certificate_status",
  "address",
  "phone",
  "website",
  "map_link",
  "featured_image",
  "logo_image",
  "photos",
  "products",
  "certificate",
  "updated_at",
  "success",
  "items",
  "lat",
  "lon",
  "lng",
  "desc",
]);

function halalCollectExtraLinks(raw: Record<string, unknown>, seenUrls: Set<string>): HalalDamuExtraLink[] {
  const out: HalalDamuExtraLink[] = [];
  for (const [key, val] of Object.entries(raw)) {
    if (HALAL_CARD_EXTRA_SKIP_KEYS.has(key)) continue;
    if (val == null) continue;
    const s = typeof val === "string" || typeof val === "number" ? String(val) : null;
    if (!s || s.length > 2000) continue;
    const slice = s.length > 1200 ? s.slice(0, 1200) : s;
    for (const url of halalExtractUrls(slice, 10)) {
      const low = url.toLowerCase();
      if (seenUrls.has(low)) continue;
      seenUrls.add(low);
      out.push({ url, kind: halalInferLinkKind(url, key), hint: key });
    }
  }
  const desc = raw.desc != null ? String(raw.desc) : "";
  if (desc.trim()) {
    const dec = decodeHalalDamuHtmlEntities(desc);
    for (const url of halalExtractUrls(dec, 10)) {
      const low = url.toLowerCase();
      if (seenUrls.has(low)) continue;
      seenUrls.add(low);
      out.push({ url, kind: halalInferLinkKind(url, "desc"), hint: "desc" });
    }
  }
  return out;
}

function halalBuildResolvedMapUrl(
  mapLink: string | null,
  address: string | null,
  lat: number | null,
  lon: number | null
): string | null {
  if (mapLink && mapLink.trim().startsWith("http")) return mapLink.trim();
  if (lat != null && lon != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lon}`)}`;
  }
  if (address && address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }
  return null;
}

/** halal-bot тізім жауабындағы беттеу / санақ (өрістер нұсқаға қарай өзгеруі мүмкін). */
export type HalalDamuListMeta = {
  totalItems: number | null;
  totalPages: number | null;
  page: number | null;
  perPage: number | null;
};

function parseListMeta(data: Record<string, unknown>): HalalDamuListMeta {
  const totalItems =
    typeof data.total_items === "number"
      ? data.total_items
      : typeof data.total === "number"
        ? data.total
        : typeof data.count === "number"
          ? data.count
          : null;
  let totalPages = typeof data.total_pages === "number" ? data.total_pages : null;
  const page = typeof data.page === "number" ? data.page : null;
  const perPage = typeof data.per_page === "number" ? data.per_page : null;
  if (totalPages == null && totalItems != null && perPage != null && perPage > 0) {
    totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  }
  return { totalItems, totalPages, page, perPage };
}

export type HalalDamuCompanyQuery = {
  lang?: string;
  categoryType?: string;
  certificateStatus?: string;
  lat?: number;
  lon?: number;
  radius?: number;
  page?: number;
  perPage?: number;
};

/** Тізім/іздеу: WP логотип сұрауларын өткізу (экран ашылу жылдамдығы). */
export type HalalDamuCompanyFetchOpts = HalalDamuCompanyQuery & {
  skipMediaEnrich?: boolean;
};

async function halalEnrichCompanyListItems(
  items: HalalDamuCompanyCard[],
  skipMediaEnrich?: boolean
): Promise<HalalDamuCompanyCard[]> {
  if (skipMediaEnrich) return enrichHalalCompanyCardsFromBulkCache(items);
  return enrichHalalCompanyCardsWithMedia(items);
}

export type HalalDamuProductQuery = {
  companyId?: number;
  status?: string;
  page?: number;
  perPage?: number;
};

export type HalalDamuAdditiveQuery = {
  page?: number;
  perPage?: number;
};

function parseCompanyCard(raw: Record<string, unknown>): HalalDamuCompanyCard {
  const galleryUrls = halalParsePhotoArray(raw.photos);
  const logoFromLogo = halalImageObjectPickBest(raw.logo_image, true);
  const logoFromFeatured = halalImageObjectPickBest(raw.featured_image, true);
  const logoUrl =
    logoFromLogo ??
    logoFromFeatured ??
    halalPickHttpUrl(raw.logo) ??
    halalPickHttpUrl(raw.logo_url) ??
    halalPickHttpUrl(raw.image) ??
    halalPickHttpUrl(raw.image_url) ??
    halalPickHttpUrl(raw.thumbnail) ??
    galleryUrls[0] ??
    null;
  const thumbSmall =
    halalImageObjectPickBest(raw.featured_image, false) ??
    halalImageObjectPickBest(raw.logo_image, false) ??
    halalPickHttpUrl(raw.thumbnail) ??
    logoUrl;
  const thumbnailUrl = thumbSmall ?? logoUrl;
  const phoneStr = raw.phone != null ? String(raw.phone) : null;
  const phones = halalSplitPhones(phoneStr);
  const { lat, lon } = halalLatLon(raw);
  const website = raw.website != null && String(raw.website).trim() ? String(raw.website) : null;
  const mapLink = raw.map_link != null && String(raw.map_link).trim() ? String(raw.map_link) : null;
  const address = raw.address != null ? String(raw.address) : null;
  const resolvedMapUrl = halalBuildResolvedMapUrl(mapLink, address, lat, lon);
  const { certNumber, certIssuedAt, certExpiresAt } = halalCertFields(raw.certificate);
  const descRaw = raw.desc != null ? String(raw.desc) : null;
  const description =
    descRaw != null && descRaw.trim() ? decodeHalalDamuHtmlEntities(descRaw) : null;
  const seen = new Set<string>();
  if (website) seen.add(website.toLowerCase());
  if (mapLink) seen.add(mapLink.toLowerCase());
  if (resolvedMapUrl) seen.add(resolvedMapUrl.toLowerCase());
  const extraUrls = halalCollectExtraLinks(raw, seen);
  return {
    id: Number(raw.id) || 0,
    title: decodeHalalDamuHtmlEntities(String(raw.title ?? "")),
    legalName: raw.legal_name != null ? String(raw.legal_name) : null,
    slug: raw.slug != null ? String(raw.slug) : null,
    categoryType: raw.category_type != null ? String(raw.category_type) : null,
    certificateStatus: raw.certificate_status != null ? String(raw.certificate_status) : null,
    address,
    phone: phoneStr,
    website,
    mapLink,
    thumbnailUrl,
    updatedAt: raw.updated_at != null ? String(raw.updated_at) : null,
    logoUrl,
    galleryUrls,
    phones,
    description,
    certNumber,
    certIssuedAt,
    certExpiresAt,
    lat,
    lon,
    resolvedMapUrl,
    extraUrls,
  };
}

/** Соңғы жаңартылған мекемелер (`wp/v2/company`, `_embed` — эмблема URL). */
export async function fetchHalalDamuRecentCompanies(
  perPage: number = 12,
  page: number = 1
): Promise<{ rows: HalalDamuCompanyListRow[]; error?: string }> {
  const q = new URLSearchParams({
    per_page: String(Math.min(100, Math.max(1, perPage))),
    page: String(Math.max(1, page)),
    orderby: "date",
    order: "desc",
    _embed: "1",
  });
  const url = `${halalApiRoot()}/wp/v2/company?${q.toString()}`;
  try {
    const r = await fetchWithTimeout(url, { method: "GET" });
    if (!r.ok) return { rows: [], error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<unknown>(r);
    if (!Array.isArray(data)) return { rows: [], error: "invalid_json" };
    const rows: HalalDamuCompanyListRow[] = [];
    for (const it of data) {
      const o = it as Record<string, unknown>;
      const titleObj = o.title as { rendered?: string } | undefined;
      const titleRaw = titleObj?.rendered != null ? String(titleObj.rendered) : "";
      rows.push({
        id: Number(o.id) || 0,
        slug: String(o.slug ?? ""),
        title: decodeHalalDamuHtmlEntities(titleRaw) || "—",
        thumbnailUrl: halalDamuFeaturedThumbFromWpCompany(o),
      });
    }
    return { rows };
  } catch {
    return { rows: [], error: "network" };
  }
}

const RECENT_COMPANIES_DAY_CACHE_KEY = "raqat_halal_recent_companies_day_v1";
const CATALOG_PAGE1_CACHE_KEY = "raqat_halal_catalog_page1_v3";
const CATALOG_META_CACHE_KEY = "raqat_halal_catalog_meta_v1";
/** 1-бет UI кэші — желіден жаңарту кезінде жаңартылады. */
const CATALOG_CACHE_TTL_MS = 30 * 60 * 1000;
/** Толық companies bulk — желісіз де каталог/карта жұмыс істеуі үшін (7 күн «жаңа», содан кейін де stale). */
const COMPANIES_BULK_DISK_KEY = "raqat_halal_companies_bulk_v2";
const COMPANIES_BULK_FRESH_MS = 7 * 24 * 60 * 60 * 1000;

type CatalogPage1Cache = {
  syncedAt: string;
  filterKey: string;
  items: HalalDamuCompanyCard[];
  meta: HalalDamuListMeta;
};

type CatalogMetaCache = {
  syncedAt: string;
  totalItems: number | null;
};

type RecentCompaniesDayCache = {
  day: string;
  perPage: number;
  page: number;
  rows: HalalDamuCompanyListRow[];
};

type CompaniesBulkDiskCache = {
  serverKey: string;
  syncedAt: string;
  items: HalalDamuCompanyCard[];
};

function halalLocalCalendarDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * «Соңғы мекемелер» тізімі: желіден күніне бір рет жаңартылады; қолмен тарту/force — қайта жүктейді.
 */
export async function fetchHalalDamuRecentCompaniesCachedDaily(
  perPage: number = 12,
  page: number = 1,
  opts?: { forceNetwork?: boolean }
): Promise<{ rows: HalalDamuCompanyListRow[]; error?: string; fromCache: boolean }> {
  const pp = Math.min(30, Math.max(1, perPage));
  const pg = Math.max(1, page);
  const day = halalLocalCalendarDayKey();
  if (!opts?.forceNetwork) {
    try {
      const raw = await AsyncStorage.getItem(RECENT_COMPANIES_DAY_CACHE_KEY);
      if (raw) {
        const j = JSON.parse(raw) as RecentCompaniesDayCache;
        if (
          j &&
          j.day === day &&
          j.perPage === pp &&
          j.page === pg &&
          Array.isArray(j.rows) &&
          j.rows.length > 0
        ) {
          return { rows: j.rows, fromCache: true };
        }
      }
    } catch {
      /* кэш оқылмады */
    }
  }
  const { rows, error } = await fetchHalalDamuRecentCompanies(pp, pg);
  if (!error && rows.length > 0) {
    try {
      const payload: RecentCompaniesDayCache = { day, perPage: pp, page: pg, rows };
      await AsyncStorage.setItem(RECENT_COMPANIES_DAY_CACHE_KEY, JSON.stringify(payload));
    } catch {
      /* сақталмады */
    }
  }
  return { rows, error, fromCache: false };
}

function halalAppendCompanyQueryParams(
  qs: URLSearchParams,
  o?: HalalDamuCompanyQuery,
  mode: "server" | "full" = "full"
) {
  if (!o) return;
  /** halaldamu API: lang=kk → бос тізім; category_type=food/catering → 0 (деректе көбінесе other). */
  if (mode === "full") {
    if (o.lang?.trim()) qs.set("lang", o.lang.trim());
    if (o.categoryType?.trim()) qs.set("category_type", o.categoryType.trim());
  }
  if (o.certificateStatus?.trim()) qs.set("certificate_status", o.certificateStatus.trim());
  if (o.lat != null && Number.isFinite(o.lat)) qs.set("lat", String(o.lat));
  if (o.lon != null && Number.isFinite(o.lon)) qs.set("lon", String(o.lon));
  if (o.radius != null && Number.isFinite(o.radius) && o.radius > 0) qs.set("radius", String(o.radius));
  const pp = o.perPage != null ? Math.min(100, Math.max(1, Math.floor(o.perPage))) : null;
  const pg = o.page != null ? Math.max(1, Math.floor(o.page)) : null;
  if (pp != null) qs.set("per_page", String(pp));
  if (pg != null) qs.set("page", String(pg));
}

function halalAppendProductQueryParams(qs: URLSearchParams, o?: HalalDamuProductQuery) {
  if (!o) return;
  if (o.companyId != null && o.companyId > 0) qs.set("company_id", String(Math.floor(o.companyId)));
  if (o.status?.trim()) qs.set("status", o.status.trim());
  const pp = o.perPage != null ? Math.min(100, Math.max(1, Math.floor(o.perPage))) : null;
  const pg = o.page != null ? Math.max(1, Math.floor(o.page)) : null;
  if (pp != null) qs.set("per_page", String(pp));
  if (pg != null) qs.set("page", String(pg));
}

function halalAppendAdditiveQueryParams(qs: URLSearchParams, o?: HalalDamuAdditiveQuery) {
  if (!o) return;
  const pp = o.perPage != null ? Math.min(100, Math.max(1, Math.floor(o.perPage))) : null;
  const pg = o.page != null ? Math.max(1, Math.floor(o.page)) : null;
  if (pp != null) qs.set("per_page", String(pp));
  if (pg != null) qs.set("page", String(pg));
}

/**
 * Іздеу: `search` 3+ таңба ұсынылады (API бір әріпте жүздеген нәтиже қайтарады).
 * Қосымша: category_type, certificate_status, lang, lat/lon/radius, беттеу.
 */
function halalCatalogFilterKey(opts?: HalalDamuCompanyQuery): string {
  const pp = opts?.perPage != null ? Math.floor(opts.perPage) : 30;
  return [opts?.categoryType?.trim() ?? "", opts?.certificateStatus?.trim() ?? "", String(pp)].join("|");
}

function halalServerBulkKey(opts?: HalalDamuCompanyQuery): string {
  return opts?.certificateStatus?.trim() ?? "";
}

function halalFilterCompaniesClient(
  all: HalalDamuCompanyCard[],
  opts?: HalalDamuCompanyQuery
): HalalDamuCompanyCard[] {
  let out = all;
  const cat = opts?.categoryType?.trim();
  if (cat) {
    out = out.filter((c) => (c.categoryType ?? "").toLowerCase() === cat.toLowerCase());
  }
  const cert = opts?.certificateStatus?.trim();
  if (cert) {
    out = out.filter((c) => (c.certificateStatus ?? "").toLowerCase() === cert.toLowerCase());
  }
  if (
    opts?.lat != null &&
    opts?.lon != null &&
    Number.isFinite(opts.lat) &&
    Number.isFinite(opts.lon) &&
    opts.radius != null &&
    opts.radius > 0
  ) {
    out = filterHalalCompaniesWithinRadius(out, opts.lat, opts.lon, opts.radius, {
      allowCityApprox: true,
    }).map(({ distanceM: _d, ...c }) => c);
  }
  return out;
}

export function halalPaginateCompanies(
  filtered: HalalDamuCompanyCard[],
  opts?: HalalDamuCompanyQuery
): { items: HalalDamuCompanyCard[]; meta: HalalDamuListMeta } {
  const perPage = Math.min(100, Math.max(1, Math.floor(opts?.perPage ?? 30)));
  const page = Math.max(1, Math.floor(opts?.page ?? 1));
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  return {
    items: filtered.slice(start, start + perPage),
    meta: { totalItems, totalPages, page: safePage, perPage },
  };
}

/** APK bundled snapshot → bulk memory (офлайн каталог, API сәтсіз болса). */
export function seedHalalCompaniesBulkFromBundled(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getHalalCompaniesBundledCards } =
      require("../services/halalCompaniesSnapshot") as typeof import("../services/halalCompaniesSnapshot");
    const cards = getHalalCompaniesBundledCards();
    if (!cards.length) return;
    const serverKey = halalServerBulkKey(undefined);
    if (companiesBulkMemory?.serverKey === serverKey && companiesBulkMemory.items.length >= cards.length) {
      return;
    }
    companiesBulkMemory = { serverKey, items: cards };
  } catch {
    /* bundled asset жоқ */
  }
}

async function halalWriteCompaniesBulkDisk(_serverKey: string, _items: HalalDamuCompanyCard[]): Promise<void> {
  /** ~4 МБ JSON AsyncStorage лимитін (Android ~6 МБ) асады — тек жадта сақтаймыз. */
}

/** Ескі ~4 МБ bulk кэш — AsyncStorage лимитін асады; бір рет тазалау. */
export async function purgeHalalDamuOversizedDiskCaches(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COMPANIES_BULK_DISK_KEY);
    if (raw && raw.length > 400_000) {
      await AsyncStorage.removeItem(COMPANIES_BULK_DISK_KEY);
    }
  } catch {
    try {
      await AsyncStorage.removeItem(COMPANIES_BULK_DISK_KEY);
    } catch {
      /* жоқ */
    }
  }
}

async function halalReadCompaniesBulkDisk(
  serverKey: string,
  opts?: { allowStale?: boolean }
): Promise<{ items: HalalDamuCompanyCard[]; syncedAt: string | null; stale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(COMPANIES_BULK_DISK_KEY);
    if (!raw) return null;
    if (raw.length > 400_000) {
      await AsyncStorage.removeItem(COMPANIES_BULK_DISK_KEY);
      return null;
    }
    const j = JSON.parse(raw) as CompaniesBulkDiskCache;
    if (!j || j.serverKey !== serverKey || !Array.isArray(j.items) || j.items.length === 0) return null;
    const age = Date.now() - new Date(j.syncedAt).getTime();
    const stale = !Number.isFinite(age) || age > COMPANIES_BULK_FRESH_MS;
    if (stale && opts?.allowStale !== true) return null;
    return { items: j.items, syncedAt: j.syncedAt ?? null, stale };
  } catch {
    return null;
  }
}

async function fetchHalalDamuCompaniesBulk(
  serverOpts?: Pick<HalalDamuCompanyQuery, "certificateStatus">
): Promise<{ all: HalalDamuCompanyCard[]; error?: string; fromDisk?: boolean; syncedAt?: string | null }> {
  const serverKey = halalServerBulkKey(serverOpts);
  if (companiesBulkMemory?.serverKey === serverKey) {
    return { all: companiesBulkMemory.items };
  }
  const qs = new URLSearchParams();
  halalAppendCompanyQueryParams(qs, serverOpts, "server");
  const path = `halal-bot/v1/companies?${qs.toString()}`;
  try {
    const r = await halalDamuFetchGet(path, FETCH_COMPANIES_BULK_MS);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await yieldToUi();
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) throw new Error("api");
    const itemsRaw = data.items;
    if (!Array.isArray(itemsRaw)) throw new Error("invalid_json");
    const all = dedupeHalalCompanyCards(
      itemsRaw
        .map((it) => parseCompanyCard(it as Record<string, unknown>))
        .filter((x) => x.id > 0)
    );
    companiesBulkMemory = { serverKey, items: all };
    return { all };
  } catch {
    try {
      await AsyncStorage.removeItem(COMPANIES_BULK_DISK_KEY);
    } catch {
      /* жоқ */
    }
    const disk = await halalReadCompaniesBulkDisk(serverKey, { allowStale: true });
    if (disk) {
      companiesBulkMemory = { serverKey, items: disk.items };
      return { all: disk.items, fromDisk: true, syncedAt: disk.syncedAt };
    }
    seedHalalCompaniesBulkFromBundled();
    if (companiesBulkMemory?.serverKey === serverKey && companiesBulkMemory.items.length > 0) {
      return { all: companiesBulkMemory.items, fromDisk: true, syncedAt: null };
    }
    return { all: [], error: "network" };
  }
}

async function halalWriteCatalogPage1Cache(filterKey: string, items: HalalDamuCompanyCard[], meta: HalalDamuListMeta) {
  try {
    const payload: CatalogPage1Cache = {
      syncedAt: new Date().toISOString(),
      filterKey,
      items,
      meta,
    };
    await AsyncStorage.setItem(CATALOG_PAGE1_CACHE_KEY, JSON.stringify(payload));
    if (meta.totalItems != null) {
      const metaPayload: CatalogMetaCache = {
        syncedAt: payload.syncedAt,
        totalItems: meta.totalItems,
      };
      await AsyncStorage.setItem(CATALOG_META_CACHE_KEY, JSON.stringify(metaPayload));
    }
  } catch {
    /* сақталмады */
  }
}

async function halalReadCatalogPage1Cache(filterKey: string): Promise<CatalogPage1Cache | null> {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_PAGE1_CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as CatalogPage1Cache;
    if (!j || j.filterKey !== filterKey || !Array.isArray(j.items) || j.items.length === 0) return null;
    const age = Date.now() - new Date(j.syncedAt).getTime();
    if (!Number.isFinite(age) || age > CATALOG_CACHE_TTL_MS) return null;
    return j;
  } catch {
    return null;
  }
}

/**
 * halaldamu.kz сайтымен бірдей `halal-bot/v1/companies` тізімі (іздеусіз, беттеу).
 */
export async function fetchHalalDamuCompaniesList(
  opts?: HalalDamuCompanyFetchOpts
): Promise<{
  items: HalalDamuCompanyCard[];
  error?: string;
  meta?: HalalDamuListMeta;
  fromDisk?: boolean;
  syncedAt?: string | null;
}> {
  const { all, error, fromDisk, syncedAt } = await fetchHalalDamuCompaniesBulk({
    certificateStatus: opts?.certificateStatus,
  });
  if (error) return { items: [], error };
  const filtered = halalFilterCompaniesClient(all, opts);
  const { items, meta } = halalPaginateCompanies(filtered, opts);
  const enriched = await halalEnrichCompanyListItems(items, opts?.skipMediaEnrich);
  return { items: enriched, meta, fromDisk, syncedAt };
}

/**
 * 1-бет каталогы: кэш (30 мин) + желіден синхрондау (halaldamu.kz API).
 */
export async function peekHalalDamuCatalogPage1(
  opts?: HalalDamuCompanyFetchOpts
): Promise<{
  items: HalalDamuCompanyCard[];
  meta: HalalDamuListMeta;
  syncedAt: string;
} | null> {
  const filterKey = halalCatalogFilterKey(opts);
  const cached = await halalReadCatalogPage1Cache(filterKey);
  if (!cached) return null;
  return { items: cached.items, meta: cached.meta, syncedAt: cached.syncedAt };
}

export async function fetchHalalDamuCompaniesCatalog(
  opts?: HalalDamuCompanyFetchOpts & { forceNetwork?: boolean }
): Promise<{
  items: HalalDamuCompanyCard[];
  meta?: HalalDamuListMeta;
  error?: string;
  fromCache: boolean;
  syncedAt: string | null;
}> {
  const page = opts?.page ?? 1;
  const filterKey = halalCatalogFilterKey(opts);
  if (page === 1 && !opts?.forceNetwork) {
    const cached = await halalReadCatalogPage1Cache(filterKey);
    if (cached) {
      return {
        items: cached.items,
        meta: cached.meta,
        fromCache: true,
        syncedAt: cached.syncedAt,
      };
    }
  }
  const { items, error, meta, fromDisk, syncedAt: bulkSyncedAt } = await fetchHalalDamuCompaniesList(opts);
  const syncedAt = fromDisk && bulkSyncedAt ? bulkSyncedAt : new Date().toISOString();
  if (!error && page === 1 && items.length > 0 && meta) {
    await halalWriteCatalogPage1Cache(filterKey, items, meta);
  }
  if (error && page === 1) {
    seedHalalCompaniesBulkFromBundled();
    const bulk = companiesBulkMemory?.items ?? [];
    if (bulk.length > 0) {
      const filtered = halalFilterCompaniesClient(bulk, opts);
      const paginated = halalPaginateCompanies(filtered, opts);
      return {
        items: paginated.items,
        meta: paginated.meta,
        fromCache: true,
        syncedAt,
      };
    }
  }
  return {
    items,
    error,
    meta,
    fromCache: fromDisk === true,
    syncedAt: error ? null : syncedAt,
  };
}

/** Жадтағы API кэштерін босату; bundled snapshot seed қалдырылады. */
export function releaseHalalDamuMemoryCache(): void {
  companiesBulkMemory = null;
  clearHalalDamuMapMarkersCache();
}

/** Кэш пен карта маркерлерін тазалау (жаңарту/синхрондау). */
export async function invalidateHalalDamuAllCaches(): Promise<void> {
  releaseHalalDamuMemoryCache();
  try {
    await AsyncStorage.multiRemove([
      RECENT_COMPANIES_DAY_CACHE_KEY,
      CATALOG_PAGE1_CACHE_KEY,
      CATALOG_META_CACHE_KEY,
      COMPANIES_BULK_DISK_KEY,
    ]);
  } catch {
    /* жоқ */
  }
}

export async function searchHalalDamuCompanies(
  query: string,
  opts?: HalalDamuCompanyFetchOpts
): Promise<{ items: HalalDamuCompanyCard[]; error?: string; meta?: HalalDamuListMeta }> {
  const q = query.trim();
  if (q.length < 3) return { items: [] };
  const qs = new URLSearchParams();
  qs.set("search", q);
  halalAppendCompanyQueryParams(qs, opts, "server");
  if (!qs.has("per_page")) qs.set("per_page", String(Math.min(100, Math.max(1, Math.floor(opts?.perPage ?? 30)))));
  if (opts?.page != null) qs.set("page", String(Math.max(1, Math.floor(opts.page))));
  const url = `${halalApiRoot()}/halal-bot/v1/companies?${qs.toString()}`;
  try {
    const r = await fetchWithTimeout(url, { method: "GET" }, FETCH_TIMEOUT_MS);
    if (!r.ok) return { items: [], error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) return { items: [], error: "api" };
    const itemsRaw = data.items;
    if (!Array.isArray(itemsRaw)) return { items: [], error: "invalid_json" };
    const parsed = itemsRaw
      .map((it) => parseCompanyCard(it as Record<string, unknown>))
      .filter((x) => x.id > 0);
    const filtered = halalFilterCompaniesClient(parsed, opts);
    const enriched = await halalEnrichCompanyListItems(filtered, opts?.skipMediaEnrich);
    const perPage = opts?.perPage ?? 30;
    const page = opts?.page ?? 1;
    /** Сервер per_page-ті елемей толық тізім қайтарса да — клиент 10/22 шектеуін сақтайды. */
    const { items, meta } = halalPaginateCompanies(enriched, { ...opts, perPage, page });
    const serverMeta = parseListMeta(data);
    return {
      items,
      meta: {
        ...meta,
        totalItems: meta.totalItems ?? serverMeta.totalItems,
        totalPages: meta.totalPages ?? serverMeta.totalPages,
      },
    };
  } catch {
    return { items: [], error: "network" };
  }
}

export async function fetchHalalDamuCompanyById(
  id: number
): Promise<{ card: HalalDamuCompanyCard | null; error?: string }> {
  if (!id) return { card: null, error: "bad_id" };
  const url = `${halalApiRoot()}/halal-bot/v1/companies/${id}`;
  try {
    const r = await fetchWithTimeout(url, { method: "GET" });
    if (!r.ok) return { card: null, error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) return { card: null, error: "api" };
    const item = data.item as Record<string, unknown> | undefined;
    if (!item || typeof item !== "object") return { card: null, error: "invalid_json" };
    return { card: parseCompanyCard(item) };
  } catch {
    return { card: null, error: "network" };
  }
}

function halalFlattenWpCompanyRecord(o: Record<string, unknown>): Record<string, unknown> {
  const acf = o.acf && typeof o.acf === "object" ? (o.acf as Record<string, unknown>) : {};
  const meta = o.meta && typeof o.meta === "object" ? (o.meta as Record<string, unknown>) : {};
  const titleObj = o.title as { rendered?: string } | undefined;
  const title =
    titleObj?.rendered != null
      ? String(titleObj.rendered)
      : o.title != null
        ? String(o.title)
        : "";
  return {
    ...meta,
    ...acf,
    ...o,
    id: o.id,
    slug: o.slug,
    title,
    updated_at: o.modified ?? o.date ?? o.updated_at,
  };
}

/** WP CPT — halal-bot бос/қысқа жауап бергенде толық карточка. */
export async function fetchHalalDamuCompanyFromWp(
  id: number
): Promise<{ card: HalalDamuCompanyCard | null; error?: string }> {
  if (!id) return { card: null, error: "bad_id" };
  try {
    const r = await halalDamuFetchGet(`wp/v2/company/${id}?_embed=1`, 12_000);
    if (!r.ok) return { card: null, error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    return { card: parseCompanyCard(halalFlattenWpCompanyRecord(data)) };
  } catch {
    return { card: null, error: "network" };
  }
}

function halalPreferRicherString(a: string | null | undefined, b: string | null | undefined): string | null {
  const aa = (a ?? "").trim();
  const bb = (b ?? "").trim();
  if (!aa) return bb || null;
  if (!bb) return aa;
  return bb.length > aa.length ? bb : aa;
}

/** Карточка деректерін біріктіру — бос өрістер кейінгі көзден толықтырылады. */
export function mergeHalalCompanyCards(
  ...parts: (HalalDamuCompanyCard | null | undefined)[]
): HalalDamuCompanyCard | null {
  const cards = parts.filter(Boolean) as HalalDamuCompanyCard[];
  if (cards.length === 0) return null;
  const base = { ...cards[0] };
  for (let i = 1; i < cards.length; i++) {
    const c = cards[i];
    base.legalName = halalPreferRicherString(base.legalName, c.legalName);
    base.slug = base.slug ?? c.slug;
    base.categoryType = base.categoryType ?? c.categoryType;
    base.certificateStatus = base.certificateStatus ?? c.certificateStatus;
    base.address = halalPreferRicherString(base.address, c.address);
    base.phone = halalPreferRicherString(base.phone, c.phone);
    base.website = halalPreferRicherString(base.website, c.website);
    base.mapLink = halalPreferRicherString(base.mapLink, c.mapLink);
    base.description = halalPreferRicherString(base.description, c.description);
    base.certNumber = base.certNumber ?? c.certNumber;
    base.certIssuedAt = base.certIssuedAt ?? c.certIssuedAt;
    base.certExpiresAt = base.certExpiresAt ?? c.certExpiresAt;
    base.updatedAt = base.updatedAt ?? c.updatedAt;
    base.logoUrl = base.logoUrl ?? c.logoUrl;
    base.thumbnailUrl = base.thumbnailUrl ?? c.thumbnailUrl;
    base.lat = base.lat ?? c.lat;
    base.lon = base.lon ?? c.lon;
    base.resolvedMapUrl = base.resolvedMapUrl ?? c.resolvedMapUrl;
    base.phones = base.phones.length ? base.phones : c.phones;
    base.galleryUrls = base.galleryUrls.length ? base.galleryUrls : c.galleryUrls;
    const extraSeen = new Set(base.extraUrls.map((e) => e.url.toLowerCase()));
    for (const link of c.extraUrls) {
      const low = link.url.toLowerCase();
      if (!extraSeen.has(low)) {
        extraSeen.add(low);
        base.extraUrls.push(link);
      }
    }
  }
  if (!base.phones.length && base.phone) {
    base.phones = halalSplitPhones(base.phone);
  }
  if (!base.resolvedMapUrl) {
    base.resolvedMapUrl = halalBuildResolvedMapUrl(base.mapLink, base.address, base.lat, base.lon);
  }
  return base;
}

/** halal-bot + WP + тізім карточкасын біріктіреді. */
export async function fetchHalalDamuCompanyFull(
  seed: HalalDamuCompanyCard
): Promise<{ card: HalalDamuCompanyCard; error?: string }> {
  const [{ card: bot }, { card: wp }] = await Promise.all([
    fetchHalalDamuCompanyById(seed.id),
    fetchHalalDamuCompanyFromWp(seed.id),
  ]);
  const merged = mergeHalalCompanyCards(seed, bot ?? undefined, wp ?? undefined);
  return { card: merged ?? seed, error: bot || wp ? undefined : "partial" };
}

/** halal-bot өнім карточкасы (өрістер сайт нұсқасына қарай өзгеруі мүмкін). */
export type HalalDamuProductItem = {
  id: number;
  title: string;
  barcode: string | null;
  /** Нақты өнім сертификаты; fallback/seed үшін "reference" болып қалады. */
  certificateStatus: string | null;
  verificationStatus?: "official_product" | "raqat_reference" | "certified_producer";
  /** Өнім емес, өндіруші/ұйым сертификатының күйі. */
  producerCertificateStatus?: string | null;
  /** Product API / company fallback суреті. */
  imageUrl?: string | null;
  /** products API бос болса — сертификатты өндіруші (company id). */
  companyId?: number;
  fromCertifiedProducer?: boolean;
  /** RAQAT қолмен seed (halaldamu products API бос кезде). */
  fromRaqatSeed?: boolean;
  ingredients?: string | null;
  seedBrand?: string | null;
  seedNote?: string | null;
};

function halalProductImageUrl(raw: Record<string, unknown>): string | null {
  for (const key of [
    "image",
    "image_url",
    "imageUrl",
    "photo",
    "photo_url",
    "thumbnail",
    "thumbnail_url",
    "picture",
    "logo",
    "logo_image",
  ]) {
    const url = halalImageObjectPickBest(raw[key], key !== "thumbnail" && key !== "thumbnail_url");
    if (url) return url;
  }
  const gallery = raw.images ?? raw.photos ?? raw.gallery;
  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      const url = halalImageObjectPickBest(item, true);
      if (url) return url;
    }
  }
  return null;
}

function parseProductItem(raw: Record<string, unknown>): HalalDamuProductItem {
  const titleRaw = raw.title ?? raw.name ?? raw.product_name ?? "";
  const bc = raw.barcode ?? raw.gtin ?? raw.ean ?? raw.code;
  return {
    id: Number(raw.id) || 0,
    title: decodeHalalDamuHtmlEntities(String(titleRaw)) || "—",
    barcode: bc != null && String(bc).trim() ? String(bc).trim() : null,
    certificateStatus:
      raw.certificate_status != null && String(raw.certificate_status).trim()
        ? String(raw.certificate_status)
        : null,
    verificationStatus: "official_product",
    imageUrl: halalProductImageUrl(raw),
  };
}

/** Қосымша (E‑код т.б.) — сайт дерегі. */
export type HalalDamuAdditiveItem = {
  id: number;
  title: string;
  description: string | null;
  /** RAQAT seed: HARAM | MUSHKIL | REFERENCE */
  risk?: string | null;
};

function parseAdditiveItem(raw: Record<string, unknown>): HalalDamuAdditiveItem {
  const titleRaw = raw.title ?? raw.name ?? raw.code ?? "";
  const desc = raw.description ?? raw.desc ?? raw.content;
  return {
    id: Number(raw.id) || 0,
    title: decodeHalalDamuHtmlEntities(String(titleRaw)) || "—",
    description: desc != null && String(desc).trim() ? decodeHalalDamuHtmlEntities(String(desc)) : null,
  };
}

function parseProductListPayload(data: Record<string, unknown>): HalalDamuProductItem[] {
  const candidates = [data.items, data.products, data.data];
  for (const itemsRaw of candidates) {
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) continue;
    const parsed = itemsRaw
      .map((it) => parseProductItem(it as Record<string, unknown>))
      .filter((x) => x.title.length > 0 && x.title !== "—");
    if (parsed.length > 0) return parsed;
  }
  return [];
}

async function fetchHalalBotProductsList(
  qs: URLSearchParams,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<{ items: HalalDamuProductItem[]; error?: string; meta?: HalalDamuListMeta }> {
  if (!qs.has("per_page")) qs.set("per_page", "30");
  try {
    const r = await halalDamuFetchGet(`halal-bot/v1/products?${qs.toString()}`, timeoutMs);
    if (!r.ok) return { items: [], error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) return { items: [], error: "api" };
    return { items: parseProductListPayload(data), meta: parseListMeta(data) };
  } catch {
    return { items: [], error: "network" };
  }
}

/** Штрихкод бойынша өнімдер (дерек halaldamu.kz). */
export async function fetchHalalDamuProductsByBarcode(
  barcode: string,
  opts?: HalalDamuProductQuery
): Promise<{ items: HalalDamuProductItem[]; error?: string; meta?: HalalDamuListMeta }> {
  const trimmed = (barcode || "").trim();
  const digits = normalizeHalalBarcodeDigits(trimmed);
  if (digits.length < 4 && trimmed.length < 4) return { items: [] };

  const variants = halalBarcodeLookupKeys(digits.length >= 4 ? digits : trimmed);
  const seen = new Set<string>();
  const merged: HalalDamuProductItem[] = [];
  let lastError: string | undefined;

  for (const variant of variants) {
    const qs = new URLSearchParams();
    qs.set("barcode", variant);
    halalAppendProductQueryParams(qs, opts);
    const res = await fetchHalalBotProductsList(qs);
    if (res.error) lastError = res.error;
    for (const item of res.items) {
      const key = `${item.barcode ?? ""}|${item.id}|${item.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    if (merged.length > 0) return { items: merged, meta: res.meta };
  }

  const searchQs = new URLSearchParams();
  searchQs.set("search", digits.length >= 4 ? digits : trimmed);
  halalAppendProductQueryParams(searchQs, opts);
  const searchRes = await fetchHalalBotProductsList(searchQs);
  if (searchRes.error) lastError = searchRes.error;
  for (const item of searchRes.items) {
    const key = `${item.barcode ?? ""}|${item.id}|${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return { items: merged, error: merged.length ? undefined : lastError, meta: searchRes.meta };
}

function halalCompanySlugFromUrl(url: string): string | null {
  const m = /\/company\/([^/?#]+)/i.exec(url);
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1]).trim().toLowerCase();
  } catch {
    return m[1].trim().toLowerCase();
  }
}

/** wp/v2/search — company subtype (products API бос кезде fallback). */
export async function searchHalalDamuWpSiteCompanies(
  query: string,
  catalog: HalalDamuCompanyCard[],
  opts?: { limit?: number }
): Promise<HalalDamuCompanyCard[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const limit = Math.min(20, Math.max(1, opts?.limit ?? 10));
  const bySlug = new Map<string, HalalDamuCompanyCard>();
  const byId = new Map<number, HalalDamuCompanyCard>();
  for (const c of catalog) {
    if (c.id > 0) byId.set(c.id, c);
    const slug = c.slug?.trim().toLowerCase();
    if (slug) bySlug.set(slug, c);
  }
  const url = `${apiBase()}/wp/v2/search?${new URLSearchParams({
    search: q,
    per_page: String(limit),
  }).toString()}`;
  try {
    const r = await fetchWithTimeout(url, { method: "GET" });
    if (!r.ok) return [];
    const hits = await parseHalalDamuResponseJson<Array<Record<string, unknown>>>(r);
    if (!Array.isArray(hits)) return [];
    const out: HalalDamuCompanyCard[] = [];
    const seen = new Set<number>();
    for (const hit of hits) {
      if (String(hit.subtype ?? "") !== "company") continue;
      const hitUrl = String(hit.url ?? "");
      const slug = halalCompanySlugFromUrl(hitUrl);
      let card = slug ? bySlug.get(slug) : undefined;
      if (!card && typeof hit.id === "number" && byId.has(hit.id)) {
        card = byId.get(hit.id);
      }
      if (!card || !card.id || seen.has(card.id)) continue;
      seen.add(card.id);
      out.push(card);
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Өнім каталогы — search жоқ (хатым/тізім беті). */
export async function fetchHalalDamuProductsBrowse(
  opts?: HalalDamuProductQuery
): Promise<{ items: HalalDamuProductItem[]; error?: string; meta?: HalalDamuListMeta }> {
  const qs = new URLSearchParams();
  halalAppendProductQueryParams(qs, opts);
  if (!qs.has("page")) qs.set("page", "1");
  return fetchHalalBotProductsList(qs);
}

export async function searchHalalDamuProducts(
  query: string,
  opts?: HalalDamuProductQuery
): Promise<{ items: HalalDamuProductItem[]; error?: string; meta?: HalalDamuListMeta }> {
  const q = query.trim();
  if (q.length < 2 && !(opts?.companyId != null && opts.companyId > 0)) return { items: [] };
  const qs = new URLSearchParams();
  if (q.length >= 2) qs.set("search", q);
  halalAppendProductQueryParams(qs, opts);
  return fetchHalalBotProductsList(qs);
}

/** Ұйым идентификаторы бойынша өнімдер тізімі (search жоқ). */
export async function fetchHalalDamuProductsByCompany(
  companyId: number,
  opts?: HalalDamuProductQuery
): Promise<{ items: HalalDamuProductItem[]; error?: string; meta?: HalalDamuListMeta }> {
  if (!companyId) return { items: [] };
  return searchHalalDamuProducts("", { ...opts, companyId });
}

export async function searchHalalDamuAdditives(
  query: string,
  opts?: HalalDamuAdditiveQuery
): Promise<{ items: HalalDamuAdditiveItem[]; error?: string; meta?: HalalDamuListMeta }> {
  const q = query.trim();
  if (q.length < 2) return { items: [] };
  const qs = new URLSearchParams();
  qs.set("search", q);
  halalAppendAdditiveQueryParams(qs, opts);
  if (!qs.has("per_page")) qs.set("per_page", "30");
  const url = `${halalApiRoot()}/halal-bot/v1/additives?${qs.toString()}`;
  try {
    const r = await fetchWithTimeout(url, { method: "GET" });
    if (!r.ok) return { items: [], error: `HTTP ${r.status}` };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) return { items: [], error: "api" };
    const itemsRaw = data.items;
    if (!Array.isArray(itemsRaw)) return { items: [], error: "invalid_json" };
    return {
      items: itemsRaw
        .map((it) => parseAdditiveItem(it as Record<string, unknown>))
        .filter((x) => x.id > 0 || x.title !== "—"),
      meta: parseListMeta(data),
    };
  } catch {
    return { items: [], error: "network" };
  }
}

/** Карта маркерлері — тек координатасы бар жазбалар. */
export type HalalDamuMapMarker = {
  id: number;
  title: string;
  lat: number;
  lng: number;
  address: string | null;
};

let mapMarkersCache: { markers: HalalDamuMapMarker[]; totalFromApi: number; v: number } | null = null;

const MAP_MARKERS_CACHE_V = 2;

/** Кэшті тазалау (мысалы, тест немесе күшті жаңарту). */
export function clearHalalDamuMapMarkersCache(): void {
  mapMarkersCache = null;
}

/** Синхрон — API кэші дайын болса маркерлер (карта лезде ашу). */
export function peekHalalDamuCompanyMapMarkersCache(): HalalDamuMapMarker[] | null {
  if (mapMarkersCache?.v === MAP_MARKERS_CACHE_V && mapMarkersCache.markers.length > 0) {
    return mapMarkersCache.markers;
  }
  return null;
}

let mapMarkersPrefetchInflight: Promise<void> | null = null;

/** Карта табы / Halal hub — API маркерлерін фонда алдын ала жүктеу. */
export function prefetchHalalDamuCompanyMapMarkers(): void {
  if (mapMarkersCache?.v === MAP_MARKERS_CACHE_V) return;
  if (!mapMarkersPrefetchInflight) {
    mapMarkersPrefetchInflight = fetchHalalDamuCompanyMapMarkers()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        mapMarkersPrefetchInflight = null;
      });
  }
}

/**
 * halal-bot `/companies` толық тізімін алады (сайт бір жауапта қайтарады),
 * `certificate_status` сүзгілейді, координатаны API lat/lon немесе `map_link`-тен шығарады.
 */
export async function fetchHalalDamuCompanyMapMarkers(): Promise<{
  markers: HalalDamuMapMarker[];
  error?: string;
  totalFromApi: number;
  withCoords: number;
}> {
  if (mapMarkersCache && mapMarkersCache.v === MAP_MARKERS_CACHE_V) {
    return {
      markers: mapMarkersCache.markers,
      totalFromApi: mapMarkersCache.totalFromApi,
      withCoords: mapMarkersCache.markers.length,
    };
  }
  try {
    const r = await halalDamuFetchGet("halal-bot/v1/companies", FETCH_MAP_COMPANIES_MS);
    if (!r.ok) return { markers: [], error: `HTTP ${r.status}`, totalFromApi: 0, withCoords: 0 };
    const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
    if (!data.success) return { markers: [], error: "api", totalFromApi: 0, withCoords: 0 };
    const itemsRaw = data.items;
    if (!Array.isArray(itemsRaw)) return { markers: [], error: "invalid_json", totalFromApi: 0, withCoords: 0 };
    const totalFromApi = itemsRaw.length;
    const markers: HalalDamuMapMarker[] = [];
    const badCert = new Set(["expired", "revoked", "cancelled", "inactive", "suspended", "rejected", "draft"]);
    for (const it of itemsRaw) {
      const o = it as Record<string, unknown>;
      const status = String(o.certificate_status ?? "").trim().toLowerCase();
      /** Тек анық нашар күйлерді шығарамыз; бос немесе «active» емес басқа мәндер картада қалуы мүмкін (API өзгерісі). */
      if (badCert.has(status)) continue;
      const id = Number(o.id) || 0;
      if (!id) continue;
      const title = decodeHalalDamuHtmlEntities(String(o.title ?? "")) || "—";
      let lat: number | null = null;
      let lng: number | null = null;
      if (o.lat != null && (o.lon != null || o.lng != null)) {
        const la = Number(o.lat);
        const ln = Number(o.lon ?? o.lng);
        if (Number.isFinite(la) && Number.isFinite(ln)) {
          lat = la;
          lng = ln;
        }
      }
      if (lat == null || lng == null) {
        const ml = o.map_link != null ? String(o.map_link) : null;
        const parsed = parseLatLngFromMapServiceUrl(ml);
        if (parsed) {
          lat = parsed.lat;
          lng = parsed.lng;
        }
      }
      if (lat == null || lng == null) continue;
      const address = o.address != null && String(o.address).trim() ? String(o.address) : null;
      markers.push({ id, title, lat, lng, address });
    }
    mapMarkersCache = { markers, totalFromApi, v: MAP_MARKERS_CACHE_V };
    return { markers, totalFromApi, withCoords: markers.length };
  } catch {
    return { markers: [], error: "network", totalFromApi: 0, withCoords: 0 };
  }
}

export function halalDamuSiteOrigin(): string {
  const raw = getHalalDamuUrl().replace(/\/+$/, "");
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return raw;
  }
}

/** Ресми сайттың басты беті. */
export function halalDamuSiteHomeUrl(): string {
  return `${halalDamuSiteOrigin()}/`;
}

/** Ресми сайтта іздеу (штрихкод/атау) — API-да жоқ болса қолданушыға сілтеме. */
export function halalDamuRegistryWebSearchUrl(query: string): string {
  const q = query.trim();
  if (!q) return halalDamuSiteHomeUrl();
  return `${halalDamuSiteOrigin()}/?s=${encodeURIComponent(q)}`;
}

/** Ұйым карточкасына веб сілтеме (slug болса). */
export function halalDamuCompanyWebUrl(card: { id: number; slug?: string | null }): string {
  const origin = halalDamuSiteOrigin();
  const slug = (card.slug ?? "").trim();
  if (slug) return `${origin}/company/${slug}/`;
  return `${origin}/?company_id=${card.id}`;
}

/** Қолданба орналасуы бойынша жақын ұйымдар.
 * Ескерту: halaldamu lat/lon/radius серверде іс жүзінде елемейді (барлық каталог қайтады).
 * Сондықтан негізгі жол — жергілікті бандл/кэш + клиент радиусы (қала мекенжайы шамамен).
 */
export async function fetchHalalDamuCompaniesNearby(
  lat: number,
  lon: number,
  radiusKm: number = 5,
  opts?: Omit<HalalDamuCompanyFetchOpts, "lat" | "lon" | "radius">
): Promise<{ items: HalalDamuCompanyCard[]; error?: string; meta?: HalalDamuListMeta }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { items: [] };
  const radiusM = Math.min(80, Math.max(1, radiusKm)) * 1000;

  seedHalalCompaniesBulkFromBundled();
  const bulk = companiesBulkMemory?.items ?? [];
  const fromBulk = filterHalalCompaniesWithinRadius(bulk, lat, lon, radiusM, {
    allowCityApprox: true,
  }).map(({ distanceM: _d, ...c }) => c);

  // Желі: қысқа таймаут — толық 3.8k dump күтпейміз; сәтті болса координат/map_link байытамыз.
  try {
    const perPage = Math.min(100, Math.max(1, Math.floor(opts?.perPage ?? 40)));
    const qs = new URLSearchParams();
    qs.set("lat", String(lat));
    qs.set("lon", String(lon));
    qs.set("radius", String(radiusM));
    halalAppendCompanyQueryParams(qs, { ...opts, perPage, page: 1 }, "server");
    if (!qs.has("per_page")) qs.set("per_page", String(perPage));
    const url = `${halalApiRoot()}/halal-bot/v1/companies?${qs.toString()}`;
    const r = await fetchWithTimeout(url, { method: "GET" }, 8_000);
    if (r.ok) {
      const data = await parseHalalDamuResponseJson<Record<string, unknown>>(r);
      if (data.success && Array.isArray(data.items)) {
        const parsed = data.items
          .slice(0, 400)
          .map((it) => parseCompanyCard(it as Record<string, unknown>))
          .filter((x) => x.id > 0);
        const enriched = enrichHalalCompanyCardsFromBulkCache(parsed);
        const fromApi = filterHalalCompaniesWithinRadius(enriched, lat, lon, radiusM, {
          allowCityApprox: true,
        }).map(({ distanceM: _d, ...c }) => c);
        const merged = dedupeHalalCompanyCards([...fromApi, ...fromBulk]);
        const items = await halalEnrichCompanyListItems(merged.slice(0, 120), opts?.skipMediaEnrich ?? true);
        return {
          items,
          meta: { totalItems: merged.length, totalPages: 1, page: 1, perPage: items.length },
        };
      }
    }
  } catch {
    /* офлайн / баяу API — bulk жеткілікті */
  }

  if (fromBulk.length > 0) {
    return {
      items: fromBulk.slice(0, 120),
      meta: { totalItems: fromBulk.length, totalPages: 1, page: 1, perPage: Math.min(120, fromBulk.length) },
    };
  }
  return { items: [], error: "empty" };
}
