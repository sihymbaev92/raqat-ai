/**
 * Меню / басты бет / мазмұн хабы үшін жергілікті PNG иконкалар (bundle).
 */
import type { ImageSourcePropType } from "react-native";

export const menuIconAssets = {
  /** Төменгі қатар / дұғалар: дөңгелек портрет (тайл/табта scale арқылы сыртқы жиек пен «ДҰҒАЛАР» тақтайшасы кесілуі мүмкін) */
  tabDuas: require("../../assets/duas/tile-duas.png"),
  /** 99 есім табы / тор: алтын шеңбер, араб жазба (scale арқылы сыртқы жиек пен төменгі қазақша жазу кесілуі мүмкін) */
  tabAsma: require("../../assets/asma/tile-asma.png"),
  /** Тәспі табы / тор: зікір бусалары (тайл қоршауында scale арқылы төменгі жазу кесілуі мүмкін) */
  tabTasbih: require("../../assets/tasbih/tile-tasbih.png"),
  heroQuran: require("../../assets/menu-icons/hero-quran.png"),
  heroHadith: require("../../assets/menu-icons/hero-hadith.png"),
  promoAi: require("../../assets/menu-icons/imam-ai-mascot.png"),
  /** Намаз тайлы: ішкі сәжде суреті (тайл қоршауында scale арқылы сыртқы жиек кесіледі) */
  tileNamaz: require("../../assets/namaz/tile-namaz.png"),
  /** Қажылық тайлы: алтын шеңбер ішіндегі сурет (тайл қоршауында scale арқылы сыртқы жиек пен төменгі жазу кесілуі мүмкін) */
  tileHajj: require("../../assets/hajj/tile-hajj.png"),
  /** Басты бет: құрбан айт промо жолы (дәстүр экранына сілтеме) */
  promoKurbanAit: require("../../assets/hajj/kurban-ait-promo.png"),
  /** Басты бет / мазмұн хабы: тәжуид — custom нұсқа (алтын әріптер, айқындық) */
  tileTajweed: require("../../assets/menu-icons/tile-tajweed-custom.png"),
  /** Басты бет / мазмұн хабы: «Дәстүр мен дін» (KazakhTradition) */
  tileDinTradition: require("../../assets/menu-icons/tile-din-tradition.png"),
  /** Дәстүр хабы: отбасы әдебі */
  heroDinTraditionFamily: require("../../assets/menu-icons/hero-din-tradition-family.png"),
  /** Дәстүр хабы: салт-дәстүр оюы */
  traditionOrnament: require("../../assets/tradition/tradition-ornament.png"),
  /** Басты бет / мазмұн хабы: халал тексеру */
  tileHalal: require("../../assets/menu-icons/tile-halal.png"),
  tileDaily: require("../../assets/menu-icons/tile-daily.png"),
  /** Сира тайлы: дөңгелек эмблема (тайлда scale арқылы төменгі «СИРА» жазуы мен сыртқы жиек кесілуі мүмкін) */
  tileSeerah: require("../../assets/seerah/tile-seerah.png"),
  /** Басты бет: қауым дұғасы тайлы */
  tileCommunity: require("../../assets/menu-icons/tile-community.png"),
  /** Қауым дұғасы экраны: иллюстрация (фонсыз PNG) */
  communityDuaHero: require("../../assets/menu-icons/community-dua-hero.png"),
  /** Хедер: Құбыла (Кағба PNG) */
  headerQibla: require("../../assets/menu-icons/header-qibla-custom.png"),
  /** Хедер: «Басты» / Дұғалар·Тәспі (тәспі суреті) */
  headerHome: require("../../assets/menu-icons/header-home.png"),
  /** Басты бет FAB: RAHAT OMIR эмблема (фонсыз) */
  dashboardFabLogo: require("../../assets/rahat-omir-fab-logo.png"),
} as const;

export type MenuIconAssetKey = keyof typeof menuIconAssets;
