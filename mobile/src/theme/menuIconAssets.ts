/**
 * Меню / басты бет / мазмұн хабы үшін жергілікті PNG иконкалар (bundle).
 */
import type { ImageSourcePropType } from "react-native";

export const menuIconAssets = {
  tabDuas: require("../../assets/menu-icons/tab-duas.png"),
  tabAsma: require("../../assets/menu-icons/tab-asma.png"),
  tabTasbih: require("../../assets/menu-icons/tab-tasbih.png"),
  heroQuran: require("../../assets/menu-icons/hero-quran.png"),
  heroHadith: require("../../assets/menu-icons/hero-hadith.png"),
  promoAi: require("../../assets/menu-icons/promo-ai.png"),
  tileNamaz: require("../../assets/menu-icons/tile-namaz.png"),
  tileHalal: require("../../assets/menu-icons/tile-halal.png"),
  tileTajweed: require("../../assets/menu-icons/tile-tajweed.png"),
  tileHajj: require("../../assets/menu-icons/tile-hajj.png"),
  tileDaily: require("../../assets/menu-icons/tile-daily.png"),
  tileCommunity: require("../../assets/menu-icons/tile-community.png"),
  /** Қауым дұғасы экраны: иллюстрация (фонсыз PNG) */
  communityDuaHero: require("../../assets/menu-icons/community-dua-hero.png"),
  /** Хедер: Құбыла (жаңа Кағба PNG, tile-hajj емес) */
  headerQibla: require("../../assets/menu-icons/header-qibla.png"),
  /** Хедер: «Басты» / Дұғалар·Тәспі (тәспі суреті) */
  headerHome: require("../../assets/menu-icons/header-home.png"),
} as const;

export type MenuIconAssetKey = keyof typeof menuIconAssets;
