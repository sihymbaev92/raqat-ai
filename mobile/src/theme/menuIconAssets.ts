/**
 * Меню / басты бет / мазмұн хабы үшін жергілікті PNG иконкалар (bundle).
 */
import type { ImageSourcePropType } from "react-native";

export const menuIconAssets = {
  /** Төменгі қатар: Дұғалар табы (қауым дұғасы тайлымен бір сурет) */
  tabDuas: require("../../assets/menu-icons/tile-community.png"),
  tabAsma: require("../../assets/menu-icons/tab-asma.png"),
  tabTasbih: require("../../assets/menu-icons/tab-tasbih.png"),
  heroQuran: require("../../assets/menu-icons/hero-quran.png"),
  heroHadith: require("../../assets/menu-icons/hero-hadith.png"),
  promoAi: require("../../assets/menu-icons/promo-ai.png"),
  tileNamaz: require("../../assets/menu-icons/tile-namaz.png"),
  /** Басты бет / мазмұн хабы: қажылық тайлы (Кағба) */
  tileHajj: require("../../assets/menu-icons/tile-hajj.png"),
  /** Басты бет / мазмұн хабы: тәжуид (хижайа әріптері) */
  tileTajweed: require("../../assets/menu-icons/tile-tajweed.png"),
  /** Басты бет / мазмұн хабы: халал тексеру */
  tileHalal: require("../../assets/menu-icons/tile-halal.png"),
  tileDaily: require("../../assets/menu-icons/tile-daily.png"),
  /** Басты бет / мазмұн хабы: Сира тайлы */
  tileSeerah: require("../../assets/menu-icons/tile-seerah.png"),
  /** Басты бет: қауым дұғасы тайлы */
  tileCommunity: require("../../assets/menu-icons/tile-community.png"),
  /** Қауым дұғасы экраны: иллюстрация (фонсыз PNG) */
  communityDuaHero: require("../../assets/menu-icons/community-dua-hero.png"),
  /** Хедер: Құбыла (Кағба PNG) */
  headerQibla: require("../../assets/menu-icons/header-qibla.png"),
  /** Хедер: «Басты» / Дұғалар·Тәспі (тәспі суреті) */
  headerHome: require("../../assets/menu-icons/header-home.png"),
} as const;

export type MenuIconAssetKey = keyof typeof menuIconAssets;
