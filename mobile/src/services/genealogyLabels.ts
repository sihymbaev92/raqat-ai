import { kk } from "../i18n/kk";

const SOURCE_LABELS: Record<string, string> = {
  mashhur_jusip_shezhire: kk.features.genealogySourceMashhur,
  shakarim_shezhire: kk.features.genealogySourceShakarim,
  nas_ethnography_kz: kk.features.genealogySourceNas,
  genealogy_public_figure_bio: kk.features.genealogySourcePublicBio,
};

export function genealogySourceLabel(sourceKey: string): string {
  return SOURCE_LABELS[sourceKey] ?? sourceKey;
}

export function genealogyLevelLabel(level: number): string {
  if (level === 1) return kk.features.genealogyLevelZhuz;
  if (level === 2) return kk.features.genealogyLevelRu;
  if (level === 3) return kk.features.genealogyLevelBranch;
  return kk.features.genealogyLevelSubBranch;
}

export function genealogyHasChildren(
  slug: string,
  nodes: { slug: string; breadcrumbs?: string[] }[],
): boolean {
  return nodes.some((n) => {
    const crumbs = n.breadcrumbs ?? [];
    return crumbs.length >= 2 && crumbs[crumbs.length - 2] === slug;
  });
}

export function genealogySearchNodes(
  query: string,
  nodes: {
    slug: string;
    name_kk: string;
    name_kk_alt?: string | null;
    name_lat?: string | null;
    level: number;
    breadcrumbs?: string[];
  }[],
  limit = 40,
): typeof nodes {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: typeof nodes = [];
  for (const n of nodes) {
    const hay = [n.name_kk, n.name_kk_alt, n.name_lat, n.slug]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (hay.includes(q)) hits.push(n);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function genealogyBreadcrumbLabel(
  slug: string,
  nodes: { slug: string; name_kk: string }[],
): string {
  return nodes.find((x) => x.slug === slug)?.name_kk ?? slug;
}

export type GenealogyPersonHit = {
  slug: string;
  clan_slug: string;
  name_kk: string;
  name_lat?: string | null;
  era: string;
  role_kk?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
};

export function genealogySearchPersons(
  query: string,
  persons: GenealogyPersonHit[],
  nodes: { slug: string; name_kk: string }[],
  limit = 40,
): Array<GenealogyPersonHit & { clan_label: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: Array<GenealogyPersonHit & { clan_label: string }> = [];
  for (const p of persons) {
    const hay = [p.name_kk, p.name_lat, p.role_kk, p.slug].filter(Boolean).join(" ").toLowerCase();
    if (hay.includes(q)) {
      hits.push({ ...p, clan_label: genealogyBreadcrumbLabel(p.clan_slug, nodes) });
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

export function genealogyPersonsForClan(
  clanSlug: string,
  persons: GenealogyPersonHit[],
): GenealogyPersonHit[] {
  return persons.filter((p) => p.clan_slug === clanSlug);
}

export function genealogyEraLabel(era: string): string {
  return era === "contemporary" ? kk.features.genealogyEraContemporary : kk.features.genealogyEraHistorical;
}

export function genealogyLifeYears(p: { birth_year?: number | null; death_year?: number | null }): string | null {
  if (!p.birth_year && !p.death_year) return null;
  if (p.birth_year && p.death_year) return `${p.birth_year}–${p.death_year}`;
  if (p.birth_year) return `${p.birth_year}–`;
  return `–${p.death_year}`;
}
