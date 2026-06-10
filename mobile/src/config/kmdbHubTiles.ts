import type { ImageSourcePropType } from "react-native";
import { kk } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";
import type { MoreStackParamList } from "../navigation/types";

export type KmdbHubTileKey =
  | "ai"
  | "zakat";

export type KmdbHubTileDef = {
  key: KmdbHubTileKey;
  label: string;
  subtitle: string;
  screen: keyof MoreStackParamList;
  image: ImageSourcePropType;
};

export function getKmdbHubTiles(): KmdbHubTileDef[] {
  return [
    {
      key: "ai",
      label: kk.kmdbHub.tileAi,
      subtitle: kk.kmdbHub.tileAiSub,
      screen: "ImamAI",
      image: menuIconAssets.promoAi,
    },
    {
      key: "zakat",
      label: kk.zakatCalculator.title,
      subtitle: kk.kmdbHub.tileZakatSub,
      screen: "ZakatCalculator",
      image: menuIconAssets.tileDaily,
    },
  ];
}
