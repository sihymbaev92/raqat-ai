/** Auto-generated — scripts/import_muftyat_hajj_book.py */
import pageTextData from "./hajjMuftyatPageText.json";

export type HajjMuftyatPageText = {
  page: number;
  text: string;
  readable: boolean;
  score: number;
};

const PAGES = pageTextData as HajjMuftyatPageText[];

export function getHajjMuftyatPageText(page: number): HajjMuftyatPageText | undefined {
  return PAGES.find((p) => p.page === page);
}
