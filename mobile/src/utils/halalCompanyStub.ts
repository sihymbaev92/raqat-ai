import type { HalalDamuCompanyCard } from "../api/halalDamuWp";

/** Карта нүктесінен ашылған уақытша карточка (толық дерек жоқ). */
export function isHalalMapCompanyStub(card: HalalDamuCompanyCard): boolean {
  return /^№\d+$/.test(card.title.trim()) && !(card.address ?? "").trim();
}
