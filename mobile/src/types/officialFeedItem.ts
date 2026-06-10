/** Halal Damu / Fatua / Muftyat — бірдей тізім карточкасы. */
export type OfficialFeedSource = "halaldamu" | "fatua" | "muftyat";

export type OfficialFeedItem = {
  id: string;
  source: OfficialFeedSource;
  sourceLabel: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  imageUrl?: string | null;
  badge?: string | null;
  url?: string | null;
  publishedAt?: string | null;
};
