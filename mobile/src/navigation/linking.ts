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

type PrayerAzanParams = NonNullable<RootStackParamList["PrayerAzan"]>;

function prayerAzanParamValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "").trim();
}

export function parsePrayerAzanQueryParams(rawPath: string): PrayerAzanParams | undefined {
  const q = rawPath.indexOf("?");
  if (q === -1) return undefined;
  const queryEnd = rawPath.indexOf("#", q + 1);
  const query = rawPath.slice(q + 1, queryEnd === -1 ? undefined : queryEnd);
  const sp = new URLSearchParams(query);
  const params: PrayerAzanParams = {};
  (["label", "enteredTitle", "time", "soundId", "salatKey", "nativeAudio"] as const).forEach((key) => {
    const value = sp.get(key);
    if (value != null && value.trim()) {
      params[key] = prayerAzanParamValue(value);
    }
  });
  return Object.keys(params).length ? params : undefined;
}

function applyPrayerAzanParams<S extends NavigationState | PartialState<NavigationState>>(
  state: S | undefined,
  params: PrayerAzanParams | undefined
): S | undefined {
  if (!state || !params || !state.routes?.length) return state;
  return {
    ...state,
    routes: state.routes.map((route) => {
      const r = route as { name: string; state?: NavigationState | PartialState<NavigationState>; params?: unknown };
      if (r.name === "PrayerAzan") {
        return { ...r, params: { ...(typeof r.params === "object" && r.params ? r.params : {}), ...params } };
      }
      if (r.state) {
        return { ...r, state: applyPrayerAzanParams(r.state, params) };
      }
      return route;
    }),
  } as S;
}

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
      PrayerAzan: {
        path: "azan",
        parse: {
          label: prayerAzanParamValue,
          enteredTitle: prayerAzanParamValue,
          time: prayerAzanParamValue,
          soundId: prayerAzanParamValue,
          salatKey: prayerAzanParamValue,
          nativeAudio: prayerAzanParamValue,
        },
      },
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
          MakkahLive: "makkah-live",
          KbArticleDetail: "knowledge/article",
          OfficialIslamicWeb: "official/:site",
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
    const prayerAzanParams = parsePrayerAzanQueryParams(path);
    if (prayerAzanParams) {
      return applyPrayerAzanParams(
        built as NavigationState | PartialState<NavigationState> | undefined,
        prayerAzanParams
      ) as typeof built;
    }
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
    if (mushafBook?.continuousMushaf) {
      const page = mushafBook.initialPage != null ? `/${mushafBook.initialPage}` : "";
      const q = new URLSearchParams();
      if (mushafBook.focusSurah != null) q.set("focusSurah", String(mushafBook.focusSurah));
      if (mushafBook.focusAyah != null) q.set("focusAyah", String(mushafBook.focusAyah));
      q.set("continuousMushaf", "1");
      return `more/mushaf-book${page}?${q.toString()}`;
    }
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
