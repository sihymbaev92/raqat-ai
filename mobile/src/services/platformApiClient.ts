import {
  AI_HTTP_RETRY_MAX_DEFAULT,
  AI_RETRY_BASE_DELAY_MS,
  HALAL_PHOTO_ANALYZE_MS,
} from "../config/aiRequestPolicy";

/**
 * Imam Ai платформа API (platform_api / FastAPI) — тек оқу шақырулар.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type HealthPayload = {
  status?: string;
  version?: string;
  service?: string;
};

function isJsonRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export type PlatformLivenessFailureCode =
  | "timeout"
  | "network"
  | "ssl"
  | "cleartext"
  | "http"
  | "not_json"
  | "unexpected";

export type PlatformLivenessProbe =
  | { ok: true; health: HealthPayload }
  | { ok: false; health: null; code: PlatformLivenessFailureCode; httpStatus?: number };

type JsonTry =
  | { kind: "json"; status: number; body: unknown }
  | { kind: "error"; code: PlatformLivenessFailureCode; status?: number };

const LIVENESS_ERR_PRIORITY: Record<PlatformLivenessFailureCode, number> = {
  timeout: 0,
  cleartext: 1,
  ssl: 2,
  not_json: 3,
  http: 4,
  network: 5,
  unexpected: 6,
};

async function tryGetJsonForLiveness(base: string, path: string, timeoutMs: number): Promise<JsonTry> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let r: Response;
    try {
      r = await fetch(joinUrl(base, path), {
        method: "GET",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError") {
        return { kind: "error", code: "timeout" };
      }
      const msg = String(err?.message ?? e ?? "");
      if (/cleartext|CLEARTEXT|not permitted by network security policy/i.test(msg)) {
        return { kind: "error", code: "cleartext" };
      }
      if (/SSL|certificate|CERT|TLS|handshake|Trust anchor/i.test(msg)) {
        return { kind: "error", code: "ssl" };
      }
      return { kind: "error", code: "network" };
    }

    const text = await r.text();
    if (!r.ok) {
      return { kind: "error", code: "http", status: r.status };
    }
    const trimmed = text.trim();
    if (trimmed.startsWith("<")) {
      return { kind: "error", code: "not_json", status: r.status };
    }
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return { kind: "error", code: "not_json", status: r.status };
    }
    return { kind: "json", status: r.status, body };
  } catch (e) {
    const err = e as { name?: string };
    if (err?.name === "AbortError") {
      return { kind: "error", code: "timeout" };
    }
    return { kind: "error", code: "network" };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Баптаулар экраны үшін: /health және /api/v1/info бойынша нақты сәтсіздік коды.
 */
export async function probePlatformLiveness(
  base: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PlatformLivenessProbe> {
  const h = await tryGetJsonForLiveness(base, "/health", timeoutMs);
  if (h.kind === "json" && isJsonRecord(h.body) && h.body["status"] === "ok") {
    return { ok: true, health: h.body as HealthPayload };
  }

  const i = await tryGetJsonForLiveness(base, "/api/v1/info", timeoutMs);
  if (i.kind === "json" && isJsonRecord(i.body)) {
    const name = i.body["name"];
    const version = i.body["version"];
    if (version != null || (typeof name === "string" && name.length > 0)) {
      return {
        ok: true,
        health: {
          status: "ok",
          service: typeof name === "string" ? name : undefined,
          version: version != null ? String(version) : undefined,
        },
      };
    }
  }

  if (h.kind === "json" && i.kind === "json") {
    return { ok: false, health: null, code: "unexpected" };
  }
  if (h.kind === "json" && i.kind === "error") {
    return { ok: false, health: null, code: i.code, httpStatus: i.status };
  }
  if (h.kind === "error" && i.kind === "json") {
    return { ok: false, health: null, code: h.code, httpStatus: h.status };
  }
  if (h.kind === "error" && i.kind === "error") {
    const pick =
      LIVENESS_ERR_PRIORITY[h.code] <= LIVENESS_ERR_PRIORITY[i.code]
        ? { code: h.code, httpStatus: h.status }
        : { code: i.code, httpStatus: i.status };
    return { ok: false, health: null, ...pick };
  }
  return { ok: false, health: null, code: "unexpected" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function isAiHttpRetriable(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export type FetchHeaders = Record<string, string>;

async function fetchJson<T>(
  base: string,
  path: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  extraHeaders?: FetchHeaders
): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }
  try {
    const r = await fetch(joinUrl(base, path), {
      method: "GET",
      signal: ctrl.signal,
      headers,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

/** GET /ready — дерекқорға қосылу (503 = ok:false) */
export type ReadinessPayload = {
  ok?: boolean;
  status?: string;
  backend?: string;
  service?: string;
  version?: string;
  error?: string;
};

/** 503 денесін де оқиды (дерекқор жоқ). 404 — ескі сервер (endpoint жоқ). */
export async function fetchPlatformReadiness(
  base: string,
  timeoutMs?: number
): Promise<ReadinessPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const r = await fetch(joinUrl(base, "/ready"), {
      method: "GET",
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    let j: ReadinessPayload;
    try {
      j = (await r.json()) as ReadinessPayload;
    } catch {
      return { ok: false, status: "parse_error" };
    }
    if (r.status === 404) return { ok: false, status: "unsupported" };
    return j;
  } catch {
    return { ok: false, status: "network" };
  } finally {
    clearTimeout(id);
  }
}

export type ContentStatsPayload = {
  ok: boolean;
  path?: string;
  error?: string;
  tables?: {
    hadith?: {
      rows: number;
      text_kk_filled?: number;
      text_kk_pct?: number;
    } | null;
    quran?: {
      rows: number;
      text_kk_filled?: number;
      text_kk_pct?: number;
    } | null;
  };
};

export function fetchPlatformHealth(
  base: string,
  timeoutMs?: number
): Promise<HealthPayload> {
  return fetchJson<HealthPayload>(base, "/health", timeoutMs);
}

/**
 * Сервер «жанғанын» білдіру: GET /health, сәтсіз болса GET /api/v1/info (нұсқа атау бар).
 * Баптау экранының «жалғанбаған» күйі тек дерекқор дайындығына бағынбауы керек.
 */
export async function fetchPlatformLiveness(
  base: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HealthPayload | null> {
  const p = await probePlatformLiveness(base, timeoutMs);
  return p.ok ? p.health : null;
}

export function fetchContentStats(
  base: string,
  timeoutMs?: number,
  extraHeaders?: FetchHeaders
): Promise<ContentStatsPayload> {
  return fetchJson<ContentStatsPayload>(
    base,
    "/api/v1/stats/content",
    timeoutMs,
    extraHeaders
  );
}

export type QuranSurahIndexItem = {
  surah: number;
  ayah_count: number;
  title: string | null;
};

export type QuranAyahRef = { surah: number; ayah: number };

export type MetadataChangesPayload = {
  ok: boolean;
  since_query?: string | null;
  since_invalid?: boolean;
  since_normalized_sqlite?: string | null;
  incremental_diff_available?: boolean;
  quran_changed?: QuranAyahRef[];
  hadith_changed?: number[];
  hint_kk?: string;
  etag?: string;
  last_modified_http?: string;
  fingerprint?: Record<string, unknown>;
};

/** Құран сүре тізімі (read-only API). JWT scope «content» немесе серверде контент құпиясы өшік. */
export function fetchQuranSurahs(
  base: string,
  opts?: {
    timeoutMs?: number;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<{ ok: boolean; surahs: QuranSurahIndexItem[] }> {
  const h = contentHeaders(opts?.contentSecret, opts?.authorizationBearer);
  return fetchJson(base, "/api/v1/quran/surahs", opts?.timeoutMs, h);
}

/** ETag / since — синхрон индикаторы */
export async function fetchMetadataChanges(
  base: string,
  opts?: {
    timeoutMs?: number;
    since?: string;
    ifNoneMatch?: string;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<MetadataChangesPayload | null> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const params = opts?.since ? `?since=${encodeURIComponent(opts.since)}` : "";
  const headers: FetchHeaders = { Accept: "application/json" };
  if (opts?.ifNoneMatch) {
    headers["If-None-Match"] = opts.ifNoneMatch;
  }
  if (opts?.contentSecret) {
    headers["X-Raqat-Content-Secret"] = opts.contentSecret;
  }
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, `/api/v1/metadata/changes${params}`), {
      method: "GET",
      signal: ctrl.signal,
      headers,
    });
    if (r.status === 304) {
      return null;
    }
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    return (await r.json()) as MetadataChangesPayload;
  } finally {
    clearTimeout(id);
  }
}

/** GET /api/v1/quran/{surah} — толық сүре кесіндісі */
export type PlatformQuranAyahRow = {
  ayah?: number;
  text_ar?: string | null;
  text_kk?: string | null;
  translit?: string | null;
};

export type PlatformQuranSurahPayload = {
  ok: boolean;
  surah: number;
  count: number;
  ayahs: PlatformQuranAyahRow[];
};

export function fetchPlatformQuranSurah(
  base: string,
  surah: number,
  opts?: {
    timeoutMs?: number;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformQuranSurahPayload> {
  return fetchJson<PlatformQuranSurahPayload>(
    base,
    `/api/v1/quran/${surah}`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

export type PlatformAyahResponse = {
  ok: boolean;
  ayah?: Record<string, unknown>;
};

export type PlatformHadithResponse = {
  ok: boolean;
  hadith?: Record<string, unknown>;
};

export type PlatformQuranSearchItem = {
  surah?: number;
  ayah?: number;
  text_ar?: string | null;
  text_tr?: string | null;
  translit?: string | null;
};

export type PlatformHadithSearchItem = {
  id?: number;
  source?: string | null;
  text_ar?: string | null;
  text_tr?: string | null;
  grade?: string | null;
};

function contentHeaders(
  contentSecret?: string,
  authorizationBearer?: string
): FetchHeaders | undefined {
  const h: FetchHeaders = {};
  if (contentSecret) h["X-Raqat-Content-Secret"] = contentSecret;
  if (authorizationBearer) h.Authorization = `Bearer ${authorizationBearer}`;
  return Object.keys(h).length ? h : undefined;
}

/** GET /api/v1/quran/{surah}/{ayah} */
export function fetchPlatformQuranAyah(
  base: string,
  surah: number,
  ayah: number,
  opts?: {
    timeoutMs?: number;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformAyahResponse> {
  return fetchJson<PlatformAyahResponse>(
    base,
    `/api/v1/quran/${surah}/${ayah}`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

export type AiChatSource = {
  site?: string;
  title?: string;
  url?: string;
};

/** POST /api/v1/ai/chat — X-Raqat-Ai-Secret немесе Bearer JWT (scope ai) */
export type AiChatResponse = {
  ok?: boolean;
  text?: string;
  error?: string;
  detail?: unknown;
  sources?: AiChatSource[];
};

export type PlatformAiKbStatus = {
  ok?: boolean;
  enabled?: boolean;
  /** RAQAT_AI_KB_ONLY=1 — тек Fatua/Muftyat RAG */
  kb_only?: boolean;
  documents?: number;
  chunks?: number;
  by_site?: Record<string, number>;
  /** GET /ai/kb/status жоқ (404) — API ескі нұсқа */
  endpointMissing?: boolean;
};

/** GET /api/v1/ai/kb/status — Fatua/Muftyat индекс күйі */
export type PlatformIslamicKbArticle = {
  document_id: number;
  site: string;
  source_label: string;
  title: string;
  excerpt: string;
  url: string;
  score?: number;
  published_at?: string | null;
  image_url?: string | null;
};

export type PlatformIslamicKbSearchResponse = {
  ok?: boolean;
  query?: string;
  rag_enabled?: boolean;
  results?: PlatformIslamicKbArticle[];
  error?: string;
};

export type PlatformIslamicKbBrowseResponse = {
  ok?: boolean;
  site?: string | null;
  rag_enabled?: boolean;
  results?: PlatformIslamicKbArticle[];
  error?: string;
};

export type PlatformHomeFeedItem = {
  site: "fatua" | "muftyat";
  source_label: string;
  title: string;
  subtitle?: string;
  url: string;
  image_url: string;
};

export type PlatformHomeFeedResponse = {
  ok?: boolean;
  results?: PlatformHomeFeedItem[];
  error?: string;
};

/** GET /api/v1/ai/kb/home-feed — fatua.kz + muftyat.kz басты бет (API proxy). */
export async function fetchPlatformHomeNewsFeed(
  base: string,
  opts?: {
    limit?: number;
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformHomeFeedResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.aiSecret) headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const timeoutMs = opts?.timeoutMs ?? 15_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, `/api/v1/ai/kb/home-feed?${params}`), {
      headers,
      signal: ctrl.signal,
    });
    if (r.status === 404) {
      return { ok: false, error: "endpoint_missing", results: [] };
    }
    if (!r.ok) {
      return { ok: false, error: `http_${r.status}`, results: [] };
    }
    return (await r.json()) as PlatformHomeFeedResponse;
  } catch {
    return { ok: false, error: "network", results: [] };
  } finally {
    clearTimeout(id);
  }
}

/** GET /api/v1/ai/kb/browse — каталог (сат), іздеусіз соңғы мақалалар */
export async function fetchPlatformIslamicKbBrowse(
  base: string,
  opts?: {
    site?: "fatua" | "muftyat" | "";
    limit?: number;
    offset?: number;
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformIslamicKbBrowseResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.aiSecret) headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.offset != null) params.set("offset", String(opts.offset));
  if (opts?.site) params.set("site", opts.site);
  const timeoutMs = opts?.timeoutMs ?? 12_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, `/api/v1/ai/kb/browse?${params}`), {
      headers,
      signal: ctrl.signal,
    });
    if (r.status === 404) {
      return { ok: false, error: "endpoint_missing", results: [] };
    }
    if (!r.ok) {
      return { ok: false, error: `http_${r.status}`, results: [] };
    }
    return (await r.json()) as PlatformIslamicKbBrowseResponse;
  } catch {
    return { ok: false, error: "network", results: [] };
  } finally {
    clearTimeout(id);
  }
}

/** GET /api/v1/ai/kb/search — локальды FTS (Fatua/Muftyat индексі) */
export async function fetchPlatformIslamicKbSearch(
  base: string,
  query: string,
  opts?: {
    limit?: number;
    site?: string;
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformIslamicKbSearchResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.aiSecret) headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  const params = new URLSearchParams({ q: query.trim() });
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.site) params.set("site", opts.site);
  const timeoutMs = opts?.timeoutMs ?? 12_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, `/api/v1/ai/kb/search?${params}`), {
      headers,
      signal: ctrl.signal,
    });
    if (r.status === 404) {
      return { ok: false, error: "endpoint_missing", results: [] };
    }
    if (!r.ok) {
      return { ok: false, error: `http_${r.status}`, results: [] };
    }
    return (await r.json()) as PlatformIslamicKbSearchResponse;
  } catch {
    return { ok: false, error: "network", results: [] };
  } finally {
    clearTimeout(id);
  }
}

export async function fetchPlatformAiKbStatus(
  base: string,
  opts?: {
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformAiKbStatus> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.aiSecret) headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  const timeoutMs = opts?.timeoutMs ?? 8_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/ai/kb/status"), {
      headers,
      signal: ctrl.signal,
    });
    if (r.status === 404) return { ok: false, enabled: false, endpointMissing: true };
    if (!r.ok) return { ok: false, enabled: false };
    return (await r.json()) as PlatformAiKbStatus;
  } catch {
    return { ok: false, enabled: false };
  } finally {
    clearTimeout(id);
  }
}

export async function fetchPlatformAiChat(
  base: string,
  prompt: string,
  opts?: {
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
    /** quick — қысқа жауап (алдымен жылдам); full — әдепкі толық */
    detailLevel?: "full" | "quick";
    /** Серверде Құран→хадис→іздеу конвейері (Imam Ai толық жауап) */
    stagedPipeline?: boolean;
    /** Тек ресми KB (Fatua.kz + Muftyat.kz) — серверге kb_only жіберу. */
    kbOnly?: boolean;
    /** HTTP 429/502/503/504 және желі қатесінде қайталау саны (әдепкі: 2 = барлығы 3 әрекет) */
    maxRetries?: number;
  }
): Promise<AiChatResponse & { status?: number }> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const maxAttempts = Math.max(1, (opts?.maxRetries ?? AI_HTTP_RETRY_MAX_DEFAULT) + 1);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (opts?.aiSecret) {
    headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  }
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(joinUrl(base, "/api/v1/ai/chat"), {
        method: "POST",
        signal: ctrl.signal,
        headers,
        body: JSON.stringify({
          prompt: prompt.trim(),
          detail_level: opts?.detailLevel ?? "full",
          staged_pipeline: opts?.stagedPipeline ?? false,
          ...(opts?.kbOnly != null ? { kb_only: opts.kbOnly } : {}),
        }),
      });
      let j: AiChatResponse;
      try {
        j = (await r.json()) as AiChatResponse;
      } catch {
        return { ok: false, detail: "parse_error", status: r.status };
      }
      if (r.ok) {
        if (j.ok === false) {
          const failed = { ...j, ok: false, status: r.status };
          const geminiBusy = j.error === "gemini_busy";
          if (attempt < maxAttempts - 1 && geminiBusy) {
            const retryAfter =
              j.detail &&
              typeof j.detail === "object" &&
              "retry_after_s" in j.detail &&
              typeof (j.detail as { retry_after_s?: unknown }).retry_after_s === "number"
                ? Math.min(120, Math.max(2, (j.detail as { retry_after_s: number }).retry_after_s)) *
                  1000
                : 3_000;
            await sleep(retryAfter);
            continue;
          }
          return failed;
        }
        return { ...j, status: r.status };
      }
      const failed = { ...j, ok: false, status: r.status };
      if (attempt >= maxAttempts - 1 || !isAiHttpRetriable(r.status)) {
        return failed;
      }
      const delay = r.status === 429 ? 2_500 : AI_RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(delay);
    } catch (e) {
      if (attempt >= maxAttempts - 1) {
        return { ok: false, detail: String(e) };
      }
      await sleep(AI_RETRY_BASE_DELAY_MS * 2 ** attempt);
    } finally {
      clearTimeout(id);
    }
  }
  return { ok: false, detail: "max_retries" };
}

/** POST /api/v1/ai/analyze-image — серверде analyze_halal_image (Gemini, жылдам режим) */
export type AiAnalyzeImageResponse = {
  ok?: boolean;
  text?: string;
  error?: string;
  detail?: string;
};

export async function fetchPlatformAiAnalyzeImage(
  base: string,
  opts: {
    imageB64: string;
    mimeType: string;
    lang?: string;
    prompt?: string;
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
    maxRetries?: number;
  }
): Promise<AiAnalyzeImageResponse & { status?: number }> {
  const timeoutMs = opts.timeoutMs ?? HALAL_PHOTO_ANALYZE_MS;
  const maxAttempts = Math.max(1, (opts.maxRetries ?? AI_HTTP_RETRY_MAX_DEFAULT) + 1);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (opts.aiSecret) {
    headers["X-Raqat-Ai-Secret"] = opts.aiSecret;
  }
  if (opts.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(joinUrl(base, "/api/v1/ai/analyze-image"), {
        method: "POST",
        signal: ctrl.signal,
        headers,
        body: JSON.stringify({
          image_b64: opts.imageB64,
          mime_type: opts.mimeType || "image/jpeg",
          lang: (opts.lang ?? "kk").trim() || "kk",
          prompt: opts.prompt?.trim() || undefined,
          async_mode: false,
        }),
      });
      let j: AiAnalyzeImageResponse;
      try {
        j = (await r.json()) as AiAnalyzeImageResponse;
      } catch {
        return { ok: false, error: "parse_error", status: r.status };
      }
      if (r.ok) {
        return { ...j, status: r.status };
      }
      const failed = { ...j, ok: false, status: r.status };
      if (attempt >= maxAttempts - 1 || !isAiHttpRetriable(r.status)) {
        return failed;
      }
      const delay = r.status === 429 ? 2_500 : AI_RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(delay);
    } catch (e) {
      if (attempt >= maxAttempts - 1) {
        return { ok: false, error: String(e) };
      }
      await sleep(AI_RETRY_BASE_DELAY_MS * 2 ** attempt);
    } finally {
      clearTimeout(id);
    }
  }
  return { ok: false, error: "max_retries" };
}

/** GET /api/v1/hadith/{id} */
export function fetchPlatformHadith(
  base: string,
  hadithId: number,
  opts?: {
    timeoutMs?: number;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformHadithResponse> {
  return fetchJson<PlatformHadithResponse>(
    base,
    `/api/v1/hadith/${hadithId}`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

/** GET /api/v1/hadith/random — source берілмесе барлық кітаптан кездейсоқ */
export function fetchPlatformHadithRandom(
  base: string,
  opts?: {
    timeoutMs?: number;
    lang?: string;
    source?: string;
    strictSahih?: boolean;
    unique?: boolean;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<PlatformHadithResponse> {
  const lang = encodeURIComponent((opts?.lang ?? "kk").trim() || "kk");
  const unique = opts?.unique === false ? "0" : "1";
  const strict = opts?.strictSahih ? "true" : "false";
  const qs = [`lang=${lang}`, `unique=${unique}`, `strict_sahih=${strict}`];
  const src = (opts?.source ?? "").trim();
  if (src) qs.push(`source=${encodeURIComponent(src)}`);
  return fetchJson<PlatformHadithResponse>(
    base,
    `/api/v1/hadith/random?${qs.join("&")}`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

/** GET /api/v1/quran/search */
export function fetchPlatformQuranSearch(
  base: string,
  query: string,
  opts?: {
    timeoutMs?: number;
    limit?: number;
    includeTranslit?: boolean;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<{ ok: boolean; items?: PlatformQuranSearchItem[] }> {
  const q = encodeURIComponent(query.trim());
  const limit = Math.min(10, Math.max(1, opts?.limit ?? 3));
  const includeTranslit = opts?.includeTranslit ?? true;
  return fetchJson<{ ok: boolean; items?: PlatformQuranSearchItem[] }>(
    base,
    `/api/v1/quran/search?q=${q}&lang=kk&include_translit=${includeTranslit ? "1" : "0"}&limit=${limit}`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

/** GET /api/v1/hadith/search */
export function fetchPlatformHadithSearch(
  base: string,
  query: string,
  opts?: {
    timeoutMs?: number;
    limit?: number;
    contentSecret?: string;
    authorizationBearer?: string;
  }
): Promise<{ ok: boolean; items?: PlatformHadithSearchItem[] }> {
  const q = encodeURIComponent(query.trim());
  const limit = Math.min(20, Math.max(1, opts?.limit ?? 4));
  return fetchJson<{ ok: boolean; items?: PlatformHadithSearchItem[] }>(
    base,
    `/api/v1/hadith/search?q=${q}&lang=kk&limit=${limit}&unique=1`,
    opts?.timeoutMs,
    contentHeaders(opts?.contentSecret, opts?.authorizationBearer)
  );
}

export type CommunityDuaRow = {
  id: number;
  body: string;
  amen_count: number;
  created_at: string;
};

export type CommunityDuasPayload = {
  ok: boolean;
  duas?: CommunityDuaRow[];
  status?: number;
  detail?: unknown;
};

/**
 * GET /api/v1/community/duas — fetchJson емес: 4xx/5xx денесін оқи алады, желі қатесінде лақтырмайды.
 */
export async function fetchCommunityDuas(
  base: string,
  opts?: { limit?: number; timeoutMs?: number; authorizationBearer?: string }
): Promise<CommunityDuasPayload> {
  const lim = opts?.limit != null ? Math.min(100, Math.max(1, opts.limit)) : 35;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: "application/json" };
  const b = opts?.authorizationBearer?.trim();
  if (b) headers.Authorization = `Bearer ${b}`;
  try {
    const r = await fetch(joinUrl(base, `/api/v1/community/duas?limit=${lim}`), {
      method: "GET",
      signal: ctrl.signal,
      headers,
    });
    let j: CommunityDuasPayload;
    try {
      j = (await r.json()) as CommunityDuasPayload;
    } catch {
      return { ok: false, duas: [], status: r.status, detail: "parse_error" };
    }
    if (!r.ok) {
      return {
        ok: false,
        duas: Array.isArray(j.duas) ? j.duas : [],
        status: r.status,
        detail: j.detail,
      };
    }
    if (!Array.isArray(j.duas)) {
      return { ok: false, duas: [], status: r.status, detail: "invalid_payload" };
    }
    return { ok: j.ok !== false, duas: j.duas, status: r.status };
  } catch {
    return { ok: false, duas: [], detail: "network" };
  } finally {
    clearTimeout(id);
  }
}

export async function postCommunityDua(
  base: string,
  text: string,
  clientId: string,
  opts?: { timeoutMs?: number; authorizationBearer?: string }
): Promise<{ ok?: boolean; id?: number; detail?: unknown; status?: number }> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Raqat-Client-Id": clientId.trim(),
  };
  const b = opts?.authorizationBearer?.trim();
  if (b) headers.Authorization = `Bearer ${b}`;
  try {
    const r = await fetch(joinUrl(base, "/api/v1/community/duas"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ text: text.trim() }),
    });
    let j: { ok?: boolean; id?: number; detail?: unknown };
    try {
      j = (await r.json()) as { ok?: boolean; id?: number; detail?: unknown };
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function postCommunityDuaAmen(
  base: string,
  duaId: number,
  clientId: string,
  opts?: { timeoutMs?: number; authorizationBearer?: string }
): Promise<{
  ok?: boolean;
  inserted?: boolean;
  amen_count?: number;
  detail?: unknown;
  status?: number;
}> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Raqat-Client-Id": clientId.trim(),
  };
  const b = opts?.authorizationBearer?.trim();
  if (b) headers.Authorization = `Bearer ${b}`;
  try {
    const r = await fetch(joinUrl(base, `/api/v1/community/duas/${duaId}/amen`), {
      method: "POST",
      signal: ctrl.signal,
      headers,
    });
    let j: { ok?: boolean; inserted?: boolean; amen_count?: number; detail?: unknown };
    try {
      j = (await r.json()) as {
        ok?: boolean;
        inserted?: boolean;
        amen_count?: number;
        detail?: unknown;
      };
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type AuthLoginResponse = {
  ok?: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  platform_user_id?: string;
  detail?: unknown;
  status?: number;
};

export async function postAuthOauthGoogle(
  base: string,
  idToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AuthLoginResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/oauth/google"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ id_token: idToken.trim() }),
    });
    let j: AuthLoginResponse;
    try {
      j = (await r.json()) as AuthLoginResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function postAuthOauthApple(
  base: string,
  identityToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AuthLoginResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/oauth/apple"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ identity_token: identityToken.trim() }),
    });
    let j: AuthLoginResponse;
    try {
      j = (await r.json()) as AuthLoginResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type PhoneStartResponse = {
  ok?: boolean;
  challenge_id?: string;
  dev_otp?: string;
  detail?: unknown;
  status?: number;
};

export async function postAuthPhoneStart(
  base: string,
  phone_e164: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PhoneStartResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/phone/start"), {
      method: "POST",
      signal: ctrl.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ phone_e164: phone_e164.trim() }),
    });
    let j: PhoneStartResponse;
    try {
      j = (await r.json()) as PhoneStartResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function postAuthPhoneVerify(
  base: string,
  challengeId: string,
  code: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AuthLoginResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/phone/verify"), {
      method: "POST",
      signal: ctrl.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: challengeId.trim(), code: code.trim() }),
    });
    let j: AuthLoginResponse;
    try {
      j = (await r.json()) as AuthLoginResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type LinkCodeMintResponse = {
  ok?: boolean;
  code?: string;
  expires_in?: number;
  platform_user_id?: string;
  hint_kk?: string;
  detail?: unknown;
  status?: number;
};

export async function postAuthLinkCodeMint(
  base: string,
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<LinkCodeMintResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/link/code"), {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });
    let j: LinkCodeMintResponse;
    try {
      j = (await r.json()) as LinkCodeMintResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function postAuthLogin(
  base: string,
  username: string,
  password: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AuthLoginResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/login"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ username: username.trim(), password }),
    });
    let j: AuthLoginResponse;
    try {
      j = (await r.json()) as AuthLoginResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type AuthRefreshResponse = {
  ok?: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  platform_user_id?: string;
  detail?: unknown;
  status?: number;
};

export async function postAuthRefresh(
  base: string,
  refreshToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AuthRefreshResponse> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const r = await fetch(joinUrl(base, "/api/v1/auth/refresh"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ refresh_token: refreshToken.trim() }),
    });
    let j: AuthRefreshResponse;
    try {
      j = (await r.json()) as AuthRefreshResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type MeHatimPayload = {
  ok?: boolean;
  read_surahs?: number[];
  updated_at?: string | null;
  detail?: unknown;
  status?: number;
};

export async function fetchMeHatim(
  base: string,
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeHatimPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/hatim"), {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });
    let j: MeHatimPayload;
    try {
      j = (await r.json()) as MeHatimPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function putMeHatim(
  base: string,
  accessToken: string,
  readSurahs: number[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeHatimPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/hatim"), {
      method: "PUT",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify({ read_surahs: readSurahs }),
    });
    let j: MeHatimPayload;
    try {
      j = (await r.json()) as MeHatimPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type MeQuranLastReadGlobal = {
  surah: number;
  ayah: number;
  ts: string;
};

export type MeQuranLastReadPayload = {
  ok?: boolean;
  global?: MeQuranLastReadGlobal | null;
  by_surah?: Record<string, number>;
  updated_at?: string | null;
  detail?: unknown;
  status?: number;
};

export async function fetchMeQuranLastRead(
  base: string,
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeQuranLastReadPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/quran-last-read"), {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });
    let j: MeQuranLastReadPayload;
    try {
      j = (await r.json()) as MeQuranLastReadPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function putMeQuranLastRead(
  base: string,
  accessToken: string,
  state: { global: MeQuranLastReadGlobal | null; by_surah: Record<string, number> },
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeQuranLastReadPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/quran-last-read"), {
      method: "PUT",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify(state),
    });
    let j: MeQuranLastReadPayload;
    try {
      j = (await r.json()) as MeQuranLastReadPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type MeQuranAyahMarkersPayload = {
  ok?: boolean;
  markers?: Record<string, { colorId: string; note: string }>;
  updated_at?: string | null;
  detail?: unknown;
  status?: number;
};

export async function fetchMeQuranAyahMarkers(
  base: string,
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeQuranAyahMarkersPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/quran-ayah-markers"), {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });
    let j: MeQuranAyahMarkersPayload;
    try {
      j = (await r.json()) as MeQuranAyahMarkersPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export async function putMeQuranAyahMarkers(
  base: string,
  accessToken: string,
  markers: Record<string, { colorId: string; note: string }>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeQuranAyahMarkersPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/quran-ayah-markers"), {
      method: "PUT",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify({ markers }),
    });
    let j: MeQuranAyahMarkersPayload;
    try {
      j = (await r.json()) as MeQuranAyahMarkersPayload;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}
