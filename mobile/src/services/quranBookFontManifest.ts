import { getMushafPagesBaseUrl } from "../config/mushafPagesBase";

export type QuranBookFontId = "amiri" | "lateef" | "scheherazade";

export type QuranBookFontEntry = {
  id: QuranBookFontId;
  faceName: string;
  fileName: string;
  labelKk: string;
  remoteUrls: string[];
};

function bookFontUrls(fileName: string, githubPath: string): string[] {
  const cdn = `${getMushafPagesBaseUrl()}/fonts/book/${fileName}`;
  return [
    cdn,
    `https://cdn.jsdelivr.net/gh/googlefonts/${githubPath}`,
    `https://raw.githubusercontent.com/googlefonts/${githubPath}`,
  ];
}

/** Оқулық қаріптері — APK-да емес, қолданушы жүктейді (OFL). */
export const QURAN_BOOK_FONT_ENTRIES: QuranBookFontEntry[] = [
  {
    id: "amiri",
    faceName: "Amiri_400Regular",
    fileName: "Amiri-Regular.ttf",
    labelKk: "Amiri",
    remoteUrls: bookFontUrls("Amiri-Regular.ttf", "amiri@main/fonts/ttf/Amiri-Regular.ttf"),
  },
  {
    id: "lateef",
    faceName: "Lateef_400Regular",
    fileName: "Lateef-Regular.ttf",
    labelKk: "Lateef",
    remoteUrls: bookFontUrls("Lateef-Regular.ttf", "lateef@main/fonts/ttf/Lateef-Regular.ttf"),
  },
  {
    id: "scheherazade",
    faceName: "ScheherazadeNew_400Regular",
    fileName: "ScheherazadeNew-Regular.ttf",
    labelKk: "Scheherazade New",
    remoteUrls: bookFontUrls(
      "ScheherazadeNew-Regular.ttf",
      "scheherazadenew@main/fonts/ttf/ScheherazadeNew-Regular.ttf"
    ),
  },
];

export function quranBookFontTotalTasks(): number {
  return QURAN_BOOK_FONT_ENTRIES.length;
}
