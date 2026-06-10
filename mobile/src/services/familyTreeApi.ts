const DEFAULT_TIMEOUT_MS = 10_000;

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  return `${b}${path.startsWith("/") ? path : `/${path}`}`;
}

export type MeFamilyTreeSyncPayload = {
  ok?: boolean;
  sync?: {
    self_id?: string | null;
    persons?: Array<{
      id: string;
      name_kk?: string;
      gender?: string;
      birth_year?: number | null;
      death_year?: number | null;
      clan_slug?: string | null;
      notes_kk?: string | null;
      father_id?: string | null;
      mother_id?: string | null;
      is_self?: boolean;
    }>;
    updated_at?: string | null;
  };
  status?: number;
  detail?: unknown;
};

export async function fetchMeFamilyTree(
  base: string,
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeFamilyTreeSyncPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/genealogy"), {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });
    let j: MeFamilyTreeSyncPayload;
    try {
      j = (await r.json()) as MeFamilyTreeSyncPayload;
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

export async function putMeFamilyTree(
  base: string,
  accessToken: string,
  body: {
    self_id: string | null;
    persons: Array<{
      id: string;
      name_kk: string;
      gender: string;
      birth_year?: number | null;
      death_year?: number | null;
      clan_slug?: string | null;
      notes_kk?: string | null;
      father_id?: string | null;
      mother_id?: string | null;
      is_self?: boolean;
    }>;
  },
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<MeFamilyTreeSyncPayload> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/genealogy/tree"), {
      method: "PUT",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify(body),
    });
    let j: MeFamilyTreeSyncPayload;
    try {
      j = (await r.json()) as MeFamilyTreeSyncPayload;
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
