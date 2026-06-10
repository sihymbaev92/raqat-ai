import { genealogyHasChildren } from "./genealogyLabels";

type BundledNode = {
  slug: string;
  level: number;
  breadcrumbs?: string[];
  sources?: { source_key: string }[];
};

export type GenealogyBundledStats = {
  zhuzCount: number;
  ruCount: number;
  branchCount: number;
  leafCount: number;
  personCount: number;
  sourcedNodeCount: number;
  sourceCoveragePercent: number;
};

export function genealogyBundledStats(nodes: BundledNode[], personCount: number): GenealogyBundledStats {
  const ruCount = nodes.filter((n) => n.level === 2).length;
  const branchCount = nodes.filter((n) => n.level >= 3).length;
  const leafCount = nodes.filter((n) => !genealogyHasChildren(n.slug, nodes)).length;
  const sourcedNodeCount = nodes.filter((n) => (n.sources?.length ?? 0) > 0).length;
  return {
    zhuzCount: nodes.filter((n) => n.level === 1).length,
    ruCount,
    branchCount,
    leafCount,
    personCount,
    sourcedNodeCount,
    sourceCoveragePercent: nodes.length > 0 ? Math.round((sourcedNodeCount / nodes.length) * 100) : 0,
  };
}

/** Карусельге — белгілі тұлғалар (slug реті). */
export const GENEALOGY_FEATURED_PERSON_SLUGS = [
  "abai_kunanbayev",
  "shokan_walihanov",
  "kenesary_khan",
  "abylai_khan",
  "makhambet_otemisuly",
  "isatai_taymanuly",
  "ybyray_altynsarin",
  "mashhur_jusip_kopeyuly",
  "shakarim_kudaiberdiuly",
  "kazybek_biy",
  "tole_bi_uly",
  "bauyrzhan",
  "dimash_kudaibergen",
  "kurmanjan_datka",
  "alikhan_bokeikhan",
] as const;
