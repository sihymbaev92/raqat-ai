/** Auto-generated — scan JPG CDN; мәтін: hajjMuftyatPageText.json. Regen: scripts/gen-hajj-muftyat-pages.cjs */
import type { ImageSourcePropType } from "react-native";
import { hajjMuftyatPageImageUri } from "../config/hajjMuftyatAssetsBase";

export type HajjMuftyatPage = {
  page: number;
  source: ImageSourcePropType;
};

export const HAJJ_MUFTYAT_SOURCE = {
  title: "Қажылық",
  org: "Қазақстан мұсылмандары Діни басқармасы (muftyat.kz)",
  url: "https://www.muftyat.kz/kk/book/28689/",
  pdfUrl: "https://www.muftyat.kz/media/muftyat/982258_1387348468.pdf",
  totalPages: 214,
  year: 2010,
  authors: ["Ламашәріп Қайрат Қайырбекұлы"],
} as const;

export const HAJJ_MUFTYAT_PAGES: HajjMuftyatPage[] = Array.from(
  { length: HAJJ_MUFTYAT_SOURCE.totalPages },
  (_, i) => {
    const page = i + 1;
    return { page, source: { uri: hajjMuftyatPageImageUri(page) } };
  }
);
