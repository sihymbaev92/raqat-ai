import { Platform } from "react-native";
import {
  getPathFromState as RNGetPathFromState,
  getStateFromPath as RNGetStateFromPath,
} from "@react-navigation/native";
import type { LinkingOptions } from "@react-navigation/native";
import type { NavigationState, PartialState } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import {
  applyQuranSurahParamsFromDeepLink,
  getFocusedQuranSurahParams,
  normalizeDeepLinkPath,
  parseQuranSurahDeepPath,
  rewriteMushafSurahPathToRouterPath,
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
          Duas: {
            path: "duas",
            screens: {
              DuasHome: "",
              CommunityDua: "community",
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
      Qibla: "qibla",
      MoreStack: {
        path: "more",
        screens: {
          ContentHub: "",
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
          SiriShortcutHelp: "siri-shortcuts",
          Hatim: "hatim",
          CommunityDua: "community-dua",
          NamazGuide: "namaz-guide",
          TajweedGuide: "tajweed",
          Hajj: "hajj",
          Halal: "halal",
          HadithHub: "hadith",
          GenealogyClans: "genealogy",
          FamilyTree: "genealogy/my",
          ImamAI: "ai",
          OfficialKnowledgePortal: "knowledge",
          IslamicKbSearch: "knowledge/search",
          Ecosystem: "ecosystem",
          KazakhTradition: "tradition",
          KazakhTraditionBooks: "tradition/books",
          KazakhGreatWords: "tradition/great-words",
          KazakhGreatWordsAuthor: "tradition/great-words/author/:authorId",
          KazakhGreatWordsEntry: "tradition/great-words/entry/:entryId",
        },
      },
    },
  },
  getStateFromPath(path, options) {
    const normalized = normalizeDeepLinkPath(path);
    const mushafRouterPath = rewriteMushafSurahPathToRouterPath(normalized);
    if (mushafRouterPath != null) {
      const parsed = parseQuranSurahDeepPath(normalized);
      const built = RNGetStateFromPath(mushafRouterPath, options);
      if (parsed && built) {
        return applyQuranSurahParamsFromDeepLink(
          built as NavigationState | PartialState<NavigationState>,
          parsed
        ) as typeof built;
      }
      return built;
    }
    return RNGetStateFromPath(path, options);
  },
  getPathFromState(state, options) {
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
