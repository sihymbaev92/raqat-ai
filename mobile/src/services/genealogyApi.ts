import { getRaqatApiBase } from "../config/raqatApiBase";

export type GenealogyClanItem = {
  slug: string;
  name_kk: string;
  name_kk_alt?: string | null;
  name_lat?: string | null;
  level: number;
  sort_order: number;
};

export type GenealogyClanDetail = GenealogyClanItem & {
  description_kk?: string | null;
  breadcrumbs?: string[];
  sources?: {
    source_key: string;
    citation_note?: string | null;
    page_or_section?: string | null;
  }[];
  path?: string;
  engine?: string;
};

export type GenealogyPerson = {
  slug: string;
  clan_slug: string;
  name_kk: string;
  name_lat?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  era: string;
  role_kk?: string | null;
  bio_kk?: string | null;
  sort_order?: number;
  sources?: { source_key: string; citation_note?: string | null; page_or_section?: string | null }[];
};

type ListResponse = { ok?: boolean; items?: GenealogyClanItem[] };
type DetailResponse = { ok?: boolean; clan?: GenealogyClanDetail };

export async function fetchGenealogyChildren(parentSlug?: string): Promise<GenealogyClanItem[]> {
  const base = getRaqatApiBase();
  const q = parentSlug ? `?parent=${encodeURIComponent(parentSlug)}` : "";
  const res = await fetch(`${base}/api/v1/genealogy/clans${q}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`genealogy_list_${res.status}`);
  const data = (await res.json()) as ListResponse;
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchGenealogyClan(slug: string): Promise<GenealogyClanDetail | null> {
  const base = getRaqatApiBase();
  const res = await fetch(`${base}/api/v1/genealogy/clans/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`genealogy_detail_${res.status}`);
  const data = (await res.json()) as DetailResponse;
  return data.clan ?? null;
}

export async function fetchGenealogyPersonsByClan(clanSlug: string): Promise<GenealogyPerson[]> {
  const base = getRaqatApiBase();
  const res = await fetch(`${base}/api/v1/genealogy/clans/${encodeURIComponent(clanSlug)}/persons`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`genealogy_persons_${res.status}`);
  const data = (await res.json()) as { items?: GenealogyPerson[] };
  return Array.isArray(data.items) ? data.items : [];
}
