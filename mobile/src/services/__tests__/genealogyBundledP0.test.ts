import bundled from "../../../assets/bundled/genealogy-p0.json";
import { genealogyBundledStats } from "../genealogyBundledStats";

type BundledNode = {
  slug: string;
  name_kk: string;
  level: number;
  breadcrumbs?: string[];
  sources?: { source_key: string }[];
};

type BundledPayload = {
  version: number;
  engine: string;
  roots: { slug: string; level: number }[];
  nodes: BundledNode[];
  persons?: { slug: string; clan_slug: string; era: string }[];
};

const payload = bundled as BundledPayload;

describe("genealogy-p0 bundled snapshot", () => {
  it("has P0 engine metadata and 3 zhuz roots", () => {
    expect(payload.version).toBeGreaterThanOrEqual(5);
    expect(payload.engine).toBe("p0");
    expect(payload.roots).toHaveLength(3);
    expect(payload.roots.map((r) => r.slug).sort()).toEqual(["kishi_zhuz", "orta_zhuz", "uly_zhuz"]);
  });

  it("has expanded catalog with valid breadcrumbs and sources", () => {
    expect(payload.nodes.length).toBeGreaterThanOrEqual(150);
    const withSources = payload.nodes.filter((n) => (n as { sources?: unknown[] }).sources?.length);
    expect(withSources.length).toBeGreaterThan(0);
    for (const node of payload.nodes) {
      expect(node.slug.length).toBeGreaterThan(0);
      expect(node.name_kk.length).toBeGreaterThan(0);
      expect(node.level).toBeGreaterThanOrEqual(1);
      expect(node.level).toBeLessThanOrEqual(5);
      if (node.level > 1) {
        const crumbs = node.breadcrumbs ?? [];
        expect(crumbs.length).toBeGreaterThanOrEqual(2);
        expect(crumbs[crumbs.length - 1]).toBe(node.slug);
      }
    }
  });

  it("includes curated persons linked to clans", () => {
    const persons = payload.persons ?? [];
    expect(persons.length).toBeGreaterThanOrEqual(35);
    const abai = persons.find((p) => p.slug === "abai_kunanbayev");
    expect(abai?.clan_slug).toBe("argyn");
    expect(abai?.era).toBe("historical");
  });

  it("reports source coverage for trust UI", () => {
    const stats = genealogyBundledStats(payload.nodes, payload.persons?.length ?? 0);

    expect(stats.zhuzCount).toBe(3);
    expect(stats.ruCount).toBeGreaterThan(0);
    expect(stats.branchCount).toBeGreaterThan(100);
    expect(stats.sourcedNodeCount).toBeGreaterThan(0);
    expect(stats.sourceCoveragePercent).toBeGreaterThan(0);
    expect(stats.sourceCoveragePercent).toBeLessThanOrEqual(100);
  });
});
