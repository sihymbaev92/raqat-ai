/**
 * Хатым mushaf — экран профилі (Fold cover / inner, phone, tablet).
 * Margin әр дисплейде әртүрлі болуы мүмкін — pagerWidth жалпы, windowWidth профиль анықтайды.
 */
export type HatimDisplayProfileId = "phone" | "foldCover" | "foldInner" | "tablet";

export type HatimDisplayMarginProfile = {
  id: HatimDisplayProfileId;
  ayahEdgeInset: number;
  ayahLineEndExtra: number;
  nativeSafeInset: number;
  webSafeInset: number;
};

const MARGIN_BY_PROFILE: Record<HatimDisplayProfileId, Omit<HatimDisplayMarginProfile, "id">> = {
  /** Fold cover / тар телефон — sol kashida резерві сақталған, бірақ кішірек edge. */
  foldCover: {
    ayahEdgeInset: 24,
    ayahLineEndExtra: 52,
    nativeSafeInset: 10,
    webSafeInset: 8,
  },
  phone: {
    ayahEdgeInset: 30,
    ayahLineEndExtra: 64,
    nativeSafeInset: 16,
    webSafeInset: 10,
  },
  /** Fold inner / unfolded — кең, бірақ 520 cap сақталады. */
  foldInner: {
    ayahEdgeInset: 30,
    ayahLineEndExtra: 60,
    nativeSafeInset: 14,
    webSafeInset: 12,
  },
  tablet: {
    ayahEdgeInset: 32,
    ayahLineEndExtra: 68,
    nativeSafeInset: 18,
    webSafeInset: 14,
  },
};

export function resolveHatimDisplayProfile(
  windowWidth: number,
  windowHeight: number
): HatimDisplayProfileId {
  const w = Math.max(1, Math.round(windowWidth));
  const h = Math.max(1, Math.round(windowHeight));
  const shortSide = Math.min(w, h);
  const longSide = Math.max(w, h);

  if (w >= 900 && shortSide >= 600) return "tablet";
  if (w >= 620 && w < 900) return "foldInner";
  if (w <= 420 && longSide >= 700) return "foldCover";
  return "phone";
}

export function hatimDisplayMarginProfile(
  windowWidth: number,
  windowHeight: number
): HatimDisplayMarginProfile {
  const id = resolveHatimDisplayProfile(windowWidth, windowHeight);
  return { id, ...MARGIN_BY_PROFILE[id] };
}

export function hatimAyahBlockPaddingForProfile(profile: HatimDisplayMarginProfile): {
  paddingLeft: number;
  paddingRight: number;
} {
  return {
    paddingLeft: profile.ayahEdgeInset + profile.ayahLineEndExtra,
    paddingRight: profile.ayahEdgeInset,
  };
}
