import { Platform } from "react-native";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

function webPrefixes(): string[] {
  if (Platform.OS !== "web") return [];
  if (typeof window === "undefined" || !window.location?.origin) return [];
  const { origin, pathname } = window.location;
  const base = pathname && pathname !== "/" ? `${origin}${pathname.replace(/\/+$/, "")}/` : `${origin}/`;
  return [base, origin + "/"];
}

/** Вебте браузер «Артқа» түймесі navigation stack-пен синхрондалады. */
export const raqatLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [...webPrefixes(), "raqat://"],
  config: {
    screens: {
      Main: {
        path: "",
        screens: {
          Home: "",
          Duas: "duas",
          Tasbih: "tasbih",
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
            path: "surah/:surahNumber",
            parse: {
              surahNumber: (v: string) => {
                const n = parseInt(v, 10);
                return Number.isFinite(n) ? n : 1;
              },
            },
          },
          DailyAyah: "daily-ayah",
          Duas: "extra-duas",
          TelegramInfo: "telegram",
          Settings: "more-settings",
          Hatim: "hatim",
          CommunityDua: "community-dua",
          NamazGuide: "namaz-guide",
          TajweedGuide: "tajweed",
          Hajj: "hajj",
          Halal: "halal",
          RaqatAI: "ai",
          Ecosystem: "ecosystem",
          HadithList: "hadith",
          HadithDetail: {
            path: "hadith/:hadithId",
            parse: { hadithId: (v: string) => v },
          },
        },
      },
    },
  },
};
