import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HalalHubWebTabId } from "../config/halalHubWebTabs";
import type { KmdbHubWebTabId } from "../config/kmdbHubWebTabs";
import type { OfficialIslamicSourceId } from "../config/officialIslamicSources";
import type { PlatformIslamicKbArticle } from "../services/platformApiClient";

export type MoreStackParamList = {
  /** Мазмұн тізімі (басты бет тайлдары өзгермейді). */
  ContentHub: undefined;
  KmdbHub:
    | {
        initialTab?: KmdbHubWebTabId;
      }
    | undefined;
  Seerah: undefined;
  QuranList: undefined;
  QuranSurah: {
    surahNumber: number;
    /** URL арқылы ашылғанда бос болуы мүмкін — экран кеш/бандлдан толықтырады */
    englishName?: string;
    arabicName?: string;
    /** Хатымнан «жалғастыру» — осы аятқа скролл */
    initialAyah?: number;
    /** Хатым оқуы: мұсафқа ұқсас қарапайым бет, декоративті тақырып жолы */
    mushafLayout?: boolean;
    /** Опция: сүре оқу экранында оқу баптамаларының араб қарпі бөлімін бірден ашу */
    hatimOpenReaderPrefs?: boolean;
  };
  Duas: undefined;
  /** Платформадағы ортақ дұғалар · әмин */
  CommunityDua: undefined;
  TelegramInfo: undefined;
  Settings: undefined;
  PrayerSettings: undefined;
  QuranSettings: undefined;
  Hatim: undefined;
  HatimSettings: undefined;
  /** Офлайн 114 сүре — assets/quran_tajweed.json (Flutter QuranSurahListScreen). */
  HatimTajweedList: undefined;
  HatimTajweedSurah: {
    surahNumber: number;
    englishName?: string;
    arabicName?: string;
  };
  /** Hafs 604-беттік хатым мұсаф (Madinah layout metadata). */
  QuranMushafBook:
    | {
        initialPage?: number;
        focusSurah?: number;
        focusAyah?: number;
        /** Hatim/book mode: keep the full 604-page mushaf so Al-Fatiha continues to Al-Baqarah. */
        continuousMushaf?: boolean;
      }
    | undefined;
  Hajj: undefined;
  /** Қағба тікелей эфир (HD HLS). */
  MakkahLive: undefined;
  ZakatCalculator: undefined;
  Halal:
    | {
        initialTab?: HalalHubWebTabId;
        siteUrl?: string;
      }
    | undefined;
  /** Fatua.kz / Muftyat.kz локальды FTS іздеу */
  IslamicKbSearch: undefined;
  /** Fatua.kz + Muftyat.kz біріктірілген портал (RAHAT OMIR AI) */
  OfficialKnowledgePortal: undefined;
  Ecosystem: undefined;
  NamazGuide: undefined;
  TajweedGuide: undefined;
  KazakhTradition:
    | {
        scrollToBlockTitle?: string;
        scrollToCategory?: "family" | "social" | "ceremony" | "faith";
        showTopics?: boolean;
      }
    | undefined;
  KazakhTraditionTopicDetail: { topicId: string };
  KazakhTraditionArticles: { articleId?: string } | undefined;
  KazakhTraditionFavorites: undefined;
  /** Құрбан айт — жеке нұсқаулық (дәстүр экранынан бөлек) */
  KurbanAit: { focusSectionId?: string } | undefined;
  /** Дін мен дәстүр: бабалар сөзі, нақылдар жинағы */
  KazakhTraditionBooks:
    | {
        scope?: "catalog" | "ait";
        /** Кітаптар каталогында бір топты ғана көрсету */
        shelf?: "ibada" | "quran" | "ilm" | "tools" | "tradition" | "all";
      }
    | undefined;
  KazakhGreatWords: undefined;
  KazakhGreatWordsAuthor: { authorId: string };
  KazakhGreatWordsEntry: { entryId: string };
  /** Fatua.kz кітабы — bundled PDF metadata */
  OfficialFatuaBook: { bookId: string };
  HadithHub: undefined;
  HadithList: undefined;
  HadithDetail: { hadithId: string };
  /** Fatua/Muftyat мақала карточкасы */
  KbArticleDetail: { article: PlatformIslamicKbArticle };
  /** Fatua.kz / Muftyat.kz толық WebView */
  OfficialIslamicWeb: {
    site: OfficialIslamicSourceId;
    url?: string;
  };
};

/** Тәспі табы: тізім → таңдалған зікірдің тәспі экраны */
export type TasbihStackParamList = {
  TasbihList: undefined;
  TasbihCounter: { dhikrId: number; titleKk?: string };
};

/** Дұғалар табы: жергілікті дұғалар жинақтары */
export type DuasStackParamList = {
  DuasHome: undefined;
};

/** Негізгі экрандар (таб жолағы жоқ — stack). */
export type MainTabParamList = {
  Home: undefined;
  Articles: undefined;
  PrayerTab: undefined;
  Saved: undefined;
  Profile: undefined;
  /** Тордан ашу — таб жолында жоқ */
  Duas: NavigatorScreenParams<DuasStackParamList>;
  Tasbih: NavigatorScreenParams<TasbihStackParamList>;
};

/** Түбір stack: табтар + қосымша экрандар (More табы жоқ) */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  /** Түбір stack: 99 есім (мазмұннан немесе терең сілтемеден) */
  AsmaAlHusna: undefined;
  PrayerTimes: undefined;
  PrayerAzan:
    | {
        label?: string;
        enteredTitle?: string;
        time?: string;
        soundId?: string;
        salatKey?: string;
        nativeAudio?: string;
      }
    | undefined;
  Qibla: { mode?: "compass" | "camera" } | undefined;
  MoreStack: NavigatorScreenParams<MoreStackParamList>;
};

/** Басты экран: main stack + түбір stack (Құбыла, MoreStack, Asma, т.б.) */
export type HomeTabCompositeNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;
