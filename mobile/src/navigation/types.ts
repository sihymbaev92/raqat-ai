import type { NavigatorScreenParams } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
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
  };
  Duas: undefined;
  TelegramInfo: undefined;
  Settings: undefined;
  Hatim: undefined;
  CommunityDua: undefined;
  Hajj: undefined;
  Halal: undefined;
  RaqatAI: undefined;
  Ecosystem: undefined;
  HadithList: undefined;
  HadithDetail: { hadithId: string };
  NamazGuide: undefined;
  TajweedGuide: undefined;
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

export type MainTabParamList = {
  /** Басты бет (намаз тор, мазмұн тайлдары) — төменгі кастом таб жолында жоқ */
  Home: undefined;
  Duas: NavigatorScreenParams<DuasStackParamList>;
  Tasbih: NavigatorScreenParams<TasbihStackParamList>;
};

/** Түбір stack: табтар + қосымша экрандар (More табы жоқ) */
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  /** Түбір stack: 99 есім (мазмұннан немесе терең сілтемеден) */
  AsmaAlHusna: undefined;
  PrayerTimes: undefined;
  Qibla: undefined;
  MoreStack: NavigatorScreenParams<MoreStackParamList>;
};

/** Басты экран: таб + түбір stack (Құбыла, MoreStack, Asma, т.б.) */
export type HomeTabCompositeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;
