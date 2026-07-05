import { Platform } from "react-native";
import { qcf4ColrTajweedEnabledOnPlatform } from "./qcf4ColrFontLoader";
import {
  mushafBookEffectiveRenderBackend,
  type MushafPageRenderBackend,
} from "./mushafPageRenderBackend";

/** User-visible tajweed rendering limitation (Sajda in-glyph parity gap). */
export type TajweedRenderNoticeKind =
  | "none"
  | "script_not_madinah"
  | "surah_unicode_tags"
  | "hatim_unicode_fallback"
  | "hatim_colr_word_fallback";

export type TajweedRenderContext = {
  showTajweed: boolean;
  arabicScriptEdition: string;
  /** Surah scroll reader vs mushaf/hatim book page. */
  surface: "surah" | "hatim";
  mushafBackend?: MushafPageRenderBackend;
  colrActive?: boolean;
  platformOS?: string;
};

export function resolveMushafTajweedBackend(
  readingThemeId?: string | null,
  opts?: { showTajweedColors?: boolean; arabicScriptEdition?: string | null }
): MushafPageRenderBackend {
  return mushafBookEffectiveRenderBackend(readingThemeId, {
    showTajweedColors: opts?.showTajweedColors,
    arabicScriptEdition: opts?.arabicScriptEdition,
  });
}

export function tajweedRenderNoticeKind(ctx: TajweedRenderContext): TajweedRenderNoticeKind {
  if (!ctx.showTajweed) return "none";
  if (ctx.arabicScriptEdition !== "madinah") return "script_not_madinah";

  const platform = ctx.platformOS ?? Platform.OS;

  if (ctx.surface === "surah") {
    return "surah_unicode_tags";
  }

  const backend =
    ctx.mushafBackend ??
    resolveMushafTajweedBackend(undefined, {
      showTajweedColors: true,
      arabicScriptEdition: ctx.arabicScriptEdition,
    });

  if (backend !== "qcf4" || platform === "web" || !qcf4ColrTajweedEnabledOnPlatform()) {
    return "hatim_unicode_fallback";
  }

  if (ctx.colrActive === false) {
    return "hatim_colr_word_fallback";
  }

  return "none";
}

export function tajweedRenderNoticeVisible(kind: TajweedRenderNoticeKind): boolean {
  return kind !== "none" && kind !== "script_not_madinah";
}
