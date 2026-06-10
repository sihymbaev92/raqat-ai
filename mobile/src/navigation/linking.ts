import { Platform } from "react-native";
import {
  getPathFromState as RNGetPathFromState,
  getStateFromPath as RNGetStateFromPath,
} from "@react-navigation/native";
import type { LinkingOptions } from "@react-navigation/native";
import type { NavigationState, PartialState } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import {
  applyQuranMushafBookParamsFromDeepLink,
  applyQuranSurahParamsFromDeepLink,
  getFocusedMushafBookParams,
  getFocusedQuranSurahParams,
  mushafBookParamsFromSurahLink,
  normalizeDeepLinkPath,
  parseMushafBookQueryParams,
  parseQuranSurahDeepPath,
} from "./quranSurahDeepLink";

function webPrefixes(): string[] {
  if (Platform.OS !== "web") return [];
  if (typeof window === "undefined" || !window.location?.origin) return [];
  const { origin, pathname } = window.location;
  const base = pathname && pathname !== "/" ? `${origin}${pathname.replace(/\/+$/, "")}/` : `${origin}/`;
  return [base, origin + "/"];
}

/** Терең сілтемелер — `imamai://` әдепкі; `raqat://` мұрагер сілтемелер үшін. */
export const appDeepLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [...webPrefixes(), "imamai://", "raqat://"],
  config: {
    screens: {
      Main: {
        path: "",
        screens: {
          Home: "",
          Articles: "articles",
          PrayerTab: "prayer",
          Saved: "saved",
          Profile: "profile",
          Duas: {
            path: "duas",
            screens: {
              DuasHome: "",
            },
          },
          Tasbih: {
            path: "tasbih",
            screens: {
              TasbihList: "",
              TasbihCounter: {
                path: "dhikr/:dhikrId",
                parse: {
                  dhikrId: (v: string) => {
                    const n = parseInt(v, 10);
                    return Number.isFinite(n) ? n : 1;
                  },
                },
              },
            },
          },
        },
      },
      AsmaAlHusna: "asma",
      PrayerTimes: "prayer-times",
      PrayerAzan: "azan",
      Qibla: "qibla",
      MoreStack: {
        path: "more",
        screens: {
          ContentHub: "",
          KmdbHub: "kmdb",
          QuranList: "quran",
          QuranSurah: {
            path: "surah/:surahNumber/:initialAyah?",
            parse: {
              surahNumber: (v: string) => {
                const n = parseInt(v, 10);
                return Number.isFinite(n) ? Math.min(114, Math.max(1, n)) : 1;
              },
              initialAyah: (v?: string) => {
                if (v == null || v === "") return undefined;
                const n = parseInt(v, 10);
                return Number.isFinite(n) && n > 0 ? n : undefined;
              },
            },
          },
          Seerah: "seerah",
          Duas: "extra-duas",
          TelegramInfo: "telegram",
          Settings: "more-settings",
          PrayerSettings: "prayer-settings",
          QuranSettings: "quran-settings",
          SiriShortcutHelp: "siri-shortcuts",
          Hatim: "hatim",
          HatimSettings: "hatim/settings",
          QuranMushafBook: {
            path: "mushaf-book/:initialPage?",
            parse: {
              initialPage: (v?: string) => {
                if (v == null || v === "") return undefined;
                const n = parseInt(v, 10);
                return Number.isFinite(n) && n >= 1 && n <= 604 ? n : undefined;
              },
            },
          },
          NamazGuide: "namaz-guide",
          TajweedGuide: "tajweed",
          Hajj: "hajj",
          ZakatCalculator: "zakat",
          Halal: "halal",
          HadithHub: "hadith",
          HadithList: "hadith/list",
          HadithDetail: "hadith/detail/:hadithId",
          ScrapedHadithMuftyatList: "hadith/muftyat",
          ScrapedHadithMuftyatDetail: "hadith/muftyat/:id",
          GenealogyClans: "genealogy",
          FamilyTree: "genealogy/my",
          ImamAI: "ai",
          OfficialKnowledgePortal: "knowledge",
          IslamicKbSearch: "knowledge/search",
          Ecosystem: "ecosystem",
          KazakhTradition: "tradition",
          KazakhTraditionTopicDetail: "tradition/topic/:topicId",
          KazakhTraditionArticles: "tradition/articles/:articleId?",
          KazakhTraditionFavorites: "tradition/favorites",
          KazakhTraditionBooks: "tradition/books",
          KurbanAit: "kurban-ait",
          OfficialFatuaBook: "books/fatua/:bookId",
          KazakhGreatWords: "tradition/great-words",
          KazakhGreatWordsAuthor: "tradition/great-words/author/:authorId",
          KazakhGreatWordsEntry: "tradition/great-words/entry/:entryId",
        },
      },
    },
  },
  getStateFromPath(path, options) {
    const normalized = normalizeDeepLinkPath(path);
    const mushafSurah = parseQuranSurahDeepPath(normalized);
    if (mushafSurah != null) {
      const built = RNGetStateFromPath("more/mushaf-book", options);
      if (built) {
        return applyQuranMushafBookParamsFromDeepLink(
          built as NavigationState | PartialState<NavigationState>,
          mushafBookParamsFromSurahLink(mushafSurah)
        ) as typeof built;
      }
    }
    const query = parseMushafBookQueryParams(path);
    const built = RNGetStateFromPath(normalized, options);
    if (built && (query.focusSurah || query.focusAyah || query.initialPage)) {
      return applyQuranMushafBookParamsFromDeepLink(
        built as NavigationState | PartialState<NavigationState>,
        query
      ) as typeof built;
    }
    return built;
  },
  getPathFromState(state, options) {
    const mushafBook = getFocusedMushafBookParams(state as NavigationState | PartialState<NavigationState>);
    if (mushafBook?.focusSurah != null) {
      const s = mushafBook.focusSurah;
      const a = mushafBook.focusAyah;
      return a != null && a > 1 ? `more/mushaf-surah/${s}/${a}` : `more/mushaf-surah/${s}`;
    }
    const p = getFocusedQuranSurahParams(state as NavigationState | PartialState<NavigationState>);
    if (p?.mushafLayout) {
      return p.initialAyah != null
        ? `more/mushaf-surah/${p.surahNumber}/${p.initialAyah}`
        : `more/mushaf-surah/${p.surahNumber}`;
    }
    if (p?.initialAyah != null) {
      return `more/surah/${p.surahNumber}/${p.initialAyah}`;
    }
    return RNGetPathFromState(state, options);
  },
};
