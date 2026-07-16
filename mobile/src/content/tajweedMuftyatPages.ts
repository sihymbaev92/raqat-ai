/** Auto-generated — CDN JPG; мәтін: tajweedMuftyatPageText. Regen: scripts/gen-tajweed-muftyat-pages.cjs */
import type { ImageSourcePropType } from "react-native";
import { tajweedMuftyatPageImageUri } from "../config/tajweedAssetsBase";

export type TajweedMuftyatPage = {
  page: number;
  source: ImageSourcePropType;
};

export const TAJWEED_MUFTYAT_SOURCE = {
  title: "Құран оқып-үйренейік!",
  org: "Қазақстан мұсылмандары Діни басқармасы",
  url: "https://www.muftyat.kz/kk/book/28695/",
  pdfUrl: "https://www.muftyat.kz/media/muftyat/231950_1387364184.pdf",
  totalPages: 104,
  year: 2011,
  authors: ["Еркебұлан Ыбрайымұлы", "Нұрлан Сайлауұлы"],
} as const;

export const TAJWEED_MUFTYAT_PAGES: TajweedMuftyatPage[] = Array.from(
  { length: TAJWEED_MUFTYAT_SOURCE.totalPages },
  (_, i) => {
    const page = i + 1;
    return { page, source: { uri: tajweedMuftyatPageImageUri(page) } };
  }
);
