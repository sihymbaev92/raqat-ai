import { getRaqatApiBase } from "../config/raqatApiBase";

const DEFAULT_TIMEOUT_MS = 20_000;

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type FamilyPerson = {
  id: string;
  name_kk: string;
  gender: string;
  birth_year?: number | null;
  death_year?: number | null;
  clan_slug?: string | null;
  notes_kk?: string | null;
  relation?: string;
  depth?: number;
  is_self?: boolean;
};

export type FamilyTreeView = {
  ok: boolean;
  tree_id?: string;
  has_self: boolean;
  self: FamilyPerson | null;
  parents: FamilyPerson[];
  ancestors: FamilyPerson[];
  descendants: FamilyPerson[];
};

export type SelfPersonInput = {
  name_kk: string;
  gender?: string;
  birth_year?: number | null;
  death_year?: number | null;
  clan_slug?: string | null;
  notes_kk?: string | null;
};

export type AddPersonInput = SelfPersonInput & {
  relation: "father" | "mother" | "child";
  relative_to_id?: string | null;
};

async function parseJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function fetchMeFamilyTree(
  accessToken: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<FamilyTreeView> {
  const base = getRaqatApiBase();
  if (!base) throw new Error("api_not_configured");
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
    const body = await parseJson(r);
    if (!r.ok) {
      throw new Error(String(body.detail ?? r.status));
    }
    return body as unknown as FamilyTreeView;
  } finally {
    clearTimeout(id);
  }
}

export async function putMeFamilySelf(
  accessToken: string,
  payload: SelfPersonInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<FamilyTreeView> {
  const base = getRaqatApiBase();
  if (!base) throw new Error("api_not_configured");
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/genealogy/self"), {
      method: "PUT",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await parseJson(r);
    if (!r.ok) {
      throw new Error(String(body.detail ?? r.status));
    }
    return body as unknown as FamilyTreeView;
  } finally {
    clearTimeout(id);
  }
}

export async function postMeFamilyPerson(
  accessToken: string,
  payload: AddPersonInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<FamilyTreeView> {
  const base = getRaqatApiBase();
  if (!base) throw new Error("api_not_configured");
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(joinUrl(base, "/api/v1/me/genealogy/persons"), {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.trim()}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await parseJson(r);
    if (!r.ok) {
      throw new Error(String(body.detail ?? r.status));
    }
    return body as unknown as FamilyTreeView;
  } finally {
    clearTimeout(id);
  }
}

export function familyLifeYears(p: FamilyPerson): string {
  const b = p.birth_year;
  const d = p.death_year;
  if (b && d) return `${b}–${d}`;
  if (b) return `${b}`;
  if (d) return `† ${d}`;
  return "";
}

export function familyRelationLabel(relation?: string): string {
  if (relation === "father") return "Әке";
  if (relation === "mother") return "Ана";
  return "";
}
