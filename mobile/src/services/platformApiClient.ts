/**
 * RAQAT platform_api (FastAPI) — тек оқу шақырулар.
 */
const DEFAULT_TIMEOUT_MS = 10_000;

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
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

export type HealthPayload = {
  status?: string;
  version?: string;
  service?: string;
};

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
  try {
    const h = await fetchJson<HealthPayload>(base, "/health", timeoutMs);
    if (h?.status === "ok") return h;
  } catch {
    // fallback
  }
  try {
    const info = await fetchJson<{ name?: string; version?: string }>(base, "/api/v1/info", timeoutMs);
    if (info && (info.version != null || (info.name != null && String(info.name).length > 0))) {
      return { status: "ok", service: info.name, version: info.version };
    }
  } catch {
    // желі қатесі немесе жауап жоқ
  }
  return null;
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

/** POST /api/v1/ai/chat — X-Raqat-Ai-Secret немесе Bearer JWT (scope ai) */
export type AiChatResponse = {
  ok?: boolean;
  text?: string;
  detail?: unknown;
};

export async function fetchPlatformAiChat(
  base: string,
  prompt: string,
  opts?: {
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
    /** quick — қысқа жауап (алдымен жылдам); full — әдепкі толық */
    detailLevel?: "full" | "quick";
    /** Серверде Құран→хадис→іздеу конвейері (тек Raqat AI толық жауабы) */
    stagedPipeline?: boolean;
  }
): Promise<AiChatResponse & { status?: number }> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
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
    try {
    const r = await fetch(joinUrl(base, "/api/v1/ai/chat"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({
        prompt: prompt.trim(),
        detail_level: opts?.detailLevel ?? "full",
        staged_pipeline: opts?.stagedPipeline ?? false,
      }),
    });
    let j: AiChatResponse;
    try {
      j = (await r.json()) as AiChatResponse;
    } catch {
      return { ok: false, detail: "parse_error", status: r.status };
    }
    if (!r.ok) {
      return { ...j, ok: false, status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { ok: false, detail: String(e) };
  } finally {
    clearTimeout(id);
  }
}

export type AiAnalyzeImageResponse = {
  ok?: boolean;
  text?: string;
  error?: string;
  detail?: unknown;
};

export type HalalCheckTextResponse = {
  success?: boolean;
  data?: {
    status?: "haram" | "doubtful" | "halal_possible" | "empty" | string;
    message?: string;
  };
  error?: { code?: string; message?: string };
  meta?: { request_id?: string };
  status?: number;
};

export type HalalReferenceResponse = {
  success?: boolean;
  data?: {
    message?: string;
    counts?: { haram?: number; doubtful?: number };
    haram_keywords?: Array<{ keyword: string; reason_kk: string }>;
    doubtful_keywords?: Array<{ keyword: string; reason_kk: string }>;
  };
  error?: { code?: string; message?: string };
  meta?: { request_id?: string };
  status?: number;
};

/** POST /api/v1/halal/check-text — серверлік 1-деңгей сүзгісі */
export async function fetchPlatformHalalCheckText(
  base: string,
  text: string,
  opts?: {
    timeoutMs?: number;
    authorizationBearer?: string;
  }
): Promise<HalalCheckTextResponse> {
  const timeoutMs = opts?.timeoutMs ?? 30_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  try {
    const r = await fetch(joinUrl(base, "/api/v1/halal/check-text"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({ text: text.trim() }),
    });
    let j: HalalCheckTextResponse;
    try {
      j = (await r.json()) as HalalCheckTextResponse;
    } catch {
      return { success: false, error: { code: "parse_error", message: "parse_error" }, status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { success: false, error: { code: "network", message: String(e) } };
  } finally {
    clearTimeout(id);
  }
}

/** GET /api/v1/halal/reference — server dictionary */
export async function fetchPlatformHalalReference(
  base: string,
  opts?: {
    timeoutMs?: number;
    authorizationBearer?: string;
  }
): Promise<HalalReferenceResponse> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.authorizationBearer) {
    headers.Authorization = `Bearer ${opts.authorizationBearer}`;
  }
  try {
    const r = await fetch(joinUrl(base, "/api/v1/halal/reference"), {
      method: "GET",
      signal: ctrl.signal,
      headers,
    });
    let j: HalalReferenceResponse;
    try {
      j = (await r.json()) as HalalReferenceResponse;
    } catch {
      return { success: false, error: { code: "parse_error", message: "parse_error" }, status: r.status };
    }
    return { ...j, status: r.status };
  } catch (e) {
    return { success: false, error: { code: "network", message: String(e) } };
  } finally {
    clearTimeout(id);
  }
}

/** POST /api/v1/ai/analyze-image — халал сурет (X-Raqat-Ai-Secret немесе JWT) */
export async function fetchPlatformAiAnalyzeImage(
  base: string,
  body: { image_b64: string; mime_type: string; lang?: string; prompt?: string },
  opts?: {
    timeoutMs?: number;
    aiSecret?: string;
    authorizationBearer?: string;
  }
): Promise<AiAnalyzeImageResponse & { status?: number }> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
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
  try {
    const r = await fetch(joinUrl(base, "/api/v1/ai/analyze-image"), {
      method: "POST",
      signal: ctrl.signal,
      headers,
      body: JSON.stringify({
        image_b64: body.image_b64,
        mime_type: body.mime_type,
        lang: body.lang ?? "kk",
        ...(body.prompt ? { prompt: body.prompt } : {}),
      }),
    });
    let j: AiAnalyzeImageResponse;
    try {
      j = (await r.json()) as AiAnalyzeImageResponse;
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
