import { isHtmlFontTajweedText } from "./htmlTajweedParse";

/** Тәжуид белгісі бар ма — bracket немесе HTML font color. */
export function hasTajweedMarkup(text: string | null | undefined): boolean {
  const raw = (text ?? "").trim();
  if (!raw) return false;
  return raw.includes("[") || isHtmlFontTajweedText(raw);
}
