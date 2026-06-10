import catalog from "../../assets/bundled/official-books-catalog.json";
import type { TraditionBookEntry } from "./traditionBooksCatalog";
import { FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";

export type OfficialBookSite = "fatua" | "muftyat";

export type OfficialBookRecord = {
  id: string;
  title: string;
  category: string;
  url: string;
  site: OfficialBookSite;
  /** Fatua.kz — толық PDF (ресми CDN). */
  pdfUrl?: string;
  coverUrl?: string;
  author?: string;
  publishedYear?: string;
  about?: string;
};

export type OfficialBooksCatalogPayload = {
  syncedAt: string;
  sources: Record<
    OfficialBookSite,
    {
      label: string;
      listUrl: string;
      count: number;
      books: OfficialBookRecord[];
    }
  >;
};

const payload = catalog as OfficialBooksCatalogPayload;

function siteLabel(site: OfficialBookSite): string {
  return site === "fatua" ? FATUA_KZ_LABEL_KK : MUFTYAT_KZ_LABEL_KK;
}

function mapOfficialBook(book: OfficialBookRecord): TraditionBookEntry {
  const label = siteLabel(book.site);
  const category = book.category.trim();
  const hasPdf = Boolean(book.site === "fatua" && book.pdfUrl?.trim());
  return {
    id: `${book.site}-${book.id}`,
    group: "faith",
    title: book.title,
    subtitle: category || label,
    badge: hasPdf ? "PDF" : label,
    summary: hasPdf
      ? `${label} · ${category || "кітап"}. PDF толық мәтіні қолданба ішінде оқылады.`
      : category
        ? `${label} кітапханасы · ${category}. Онлайн оқуға сілтеме.`
        : `${label} ресми кітапханасынан. Онлайн оқуға сілтеме.`,
    contents: hasPdf
      ? [label, "PDF толық нұсқа", category || "Кітап", "Fatua.kz ресми көзі"]
      : [label, category || "Кітап", "Онлайн оқу (браузер)"],
    religionLink: "Ресми ҚМДБ кітапханасы — діни білім мен анықтау үшін сенімді көз.",
    howToRead: hasPdf
      ? [
          "«Кітапты ашу» — PDF қолданба ішінде ашылады.",
          "Қажет болса Fatua.kz сайтында да қараңыз.",
          "Күрделі фиқх бойынша мешіт немесе ұстазға жүгініңіз.",
        ]
      : [
          "«Кітапты ашу» батырмасын басып браузерде ашыңыз.",
          "Мобильде саусақпен үлкейтіп оқыңыз.",
          "Күрделі фиқх бойынша мешіт немесе ұстазға жүгініңіз.",
        ],
    action: hasPdf
      ? { kind: "screen", screen: "OfficialFatuaBook", params: { bookId: book.id } }
      : { kind: "externalUrl", url: book.url },
  };
}

export function getOfficialBookRecord(
  site: OfficialBookSite,
  bookId: string
): OfficialBookRecord | undefined {
  return payload.sources[site].books.find((b) => b.id === bookId);
}

export function getFatuaBooksWithPdf(): OfficialBookRecord[] {
  return payload.sources.fatua.books.filter((b) => Boolean(b.pdfUrl?.trim()));
}

export function getOfficialBooksCatalogMeta(): { syncedAt: string; fatuaCount: number; muftyatCount: number } {
  return {
    syncedAt: payload.syncedAt,
    fatuaCount: payload.sources.fatua.count,
    muftyatCount: payload.sources.muftyat.count,
  };
}

export function getOfficialBooksBySite(site: OfficialBookSite): TraditionBookEntry[] {
  return payload.sources[site].books.map(mapOfficialBook);
}

export function getOfficialBooks(): TraditionBookEntry[] {
  return [...getOfficialBooksBySite("fatua"), ...getOfficialBooksBySite("muftyat")];
}

export function getOfficialBooksListUrl(site: OfficialBookSite): string {
  return payload.sources[site].listUrl;
}
