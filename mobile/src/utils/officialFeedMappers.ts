import { halalCompanyDisplayImageUrl, type HalalDamuCompanyCard } from "../api/halalDamuWp";
import type { PlatformIslamicKbArticle } from "../services/platformApiClient";
import type { OfficialFeedItem, OfficialFeedSource } from "../types/officialFeedItem";
import { halalCertLabelKk } from "./halalCertDisplay";

function formatPublishedLine(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const d = t.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  }
  return t.length > 24 ? `${t.slice(0, 24)}…` : t;
}

function sourceBadge(site: OfficialFeedSource): string {
  if (site === "halaldamu") return "Halal Damu";
  if (site === "muftyat") return "Muftyat.kz";
  return "Fatua.kz";
}

export function halalCompanyToFeedItem(c: HalalDamuCompanyCard): OfficialFeedItem {
  const cert = halalCertLabelKk(c.certificateStatus);
  return {
    id: `halal-${c.id}`,
    source: "halaldamu",
    sourceLabel: "Halal Damu",
    title: c.title,
    subtitle: c.address?.trim() || null,
    excerpt: c.description?.trim() || null,
    imageUrl: halalCompanyDisplayImageUrl(c),
    badge: cert || c.categoryType,
    url: c.website || null,
    publishedAt: c.updatedAt,
  };
}

export function kbArticleToFeedItem(a: PlatformIslamicKbArticle): OfficialFeedItem {
  const site: OfficialFeedSource = a.site === "muftyat" ? "muftyat" : "fatua";
  return {
    id: `kb-${a.document_id}`,
    source: site,
    sourceLabel: a.source_label || sourceBadge(site),
    title: a.title,
    subtitle: formatPublishedLine(a.published_at ?? null),
    excerpt: a.excerpt?.trim() || null,
    imageUrl: (a.image_url ?? "").trim() || null,
    badge: sourceBadge(site),
    url: a.url,
    publishedAt: a.published_at ?? null,
  };
}
