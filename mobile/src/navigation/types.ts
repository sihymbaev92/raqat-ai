import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type MoreStackParamList = {
  /** Мазмұн тізімі (басты бет тайлдары өзгермейді). */
  ContentHub: undefined;
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
  TelegramInfo: undefined;
  /** iOS: Siri + Жарлықтар арқылы қолданбаны дауыспен ашу нұсқауы */
  SiriShortcutHelp: undefined;
  Settings: undefined;
  PrayerSettings: undefined;
  QuranSettings: undefined;
  Hatim: undefined;
  HatimSettings: undefined;
  /** Hafs 604-беттік хатым мұсаф (Madinah layout metadata). */
  QuranMushafBook:
    | {
        initialPage?: number;
        focusSurah?: number;
        focusAyah?: number;
      }
    | undefined;
  CommunityDua: undefined;
  Hajj: undefined;
  Halal: undefined;
  ImamAI:
    | undefined
    | {
        initialPrompt?: string;
        autoSend?: boolean;
      };
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
      }
    | undefined;
  /** Қазақ шежіресі — ру ағашы (FlatList accordion) */
  GenealogyClans: undefined;
  /** Жеке отбасылық шежіре (JWT) */
  FamilyTree: undefined;
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
  HadithHub: undefined;
  HadithList: undefined;
  HadithDetail: { hadithId: string };
  ScrapedHadithMuftyatList: undefined;
  ScrapedHadithMuftyatDetail: { id: string };
};

/** Тәспі табы: тізім → таңдалған зікірдің тәспі экраны */
export type TasbihStackParamList = {
  TasbihList: undefined;
  TasbihCounter: { dhikrId: number; titleKk?: string };
};

/** Дұғалар табы: жергілікті дұғалар → қауым дұғасы */
export type DuasStackParamList = {
  DuasHome: undefined;
  CommunityDua: undefined;
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
  Qibla: { mode?: "compass" | "camera" } | undefined;
  MoreStack: NavigatorScreenParams<MoreStackParamList>;
};

/** Басты экран: main stack + түбір stack (Құбыла, MoreStack, Asma, т.б.) */
export type HomeTabCompositeNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;
