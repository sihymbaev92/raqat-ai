import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
import { parseLatLngFromMapServiceUrl } from "../lib/halalDamuMapLinkGeo";

/** 2GIS карта / маршрут — halaldamu map_link немесе координаттан. */
export function halalCompany2GisUrl(card: HalalDamuCompanyCard): string | null {
  const mapLink = (card.mapLink ?? "").trim();
  if (/2gis\./i.test(mapLink)) return mapLink;

  const fromResolved = parseLatLngFromMapServiceUrl(card.resolvedMapUrl ?? mapLink);
  const lat = card.lat ?? fromResolved?.lat ?? null;
  const lon = card.lon ?? fromResolved?.lng ?? null;
  if (lat != null && lon != null) {
    return `https://2gis.kz/geo/${lon},${lat}`;
  }

  if (mapLink.startsWith("http")) return mapLink;
  if (card.resolvedMapUrl?.startsWith("http")) return card.resolvedMapUrl;

  const address = (card.address ?? "").trim();
  if (address) {
    return `https://2gis.kz/search/${encodeURIComponent(address)}`;
  }
  return null;
}

export function halalCompanyTelUrl(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function halalCompanyWhatsAppUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export function halalExtraLinkLabel(kind: string): string {
  switch (kind) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "telegram":
      return "Telegram";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "vk":
      return "VK";
    default:
      return "Сілтеме";
  }
}
