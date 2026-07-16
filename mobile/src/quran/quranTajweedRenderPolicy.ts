import { Platform } from "react-native";
import {
  mushafBookEffectiveRenderBackend,
  type MushafPageRenderBackend,
} from "./mushafPageRenderBackend";
import { qcf4ColrTajweedEnabledOnPlatform } from "./qcf4ColrFontLoader";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";

/** User-visible tajweed rendering limitation (Sajda in-glyph parity gap). */
export type TajweedRenderNoticeKind =
  | "none"
  | "script_not_madinah"
  | "surah_unicode_tags"
  | "hatim_unicode_fallback"
  | "hatim_colr_fallback";

export type TajweedRenderContext = {
  showTajweed: boolean;
  arabicScriptEdition: string;
  /** Surah scroll reader vs mushaf/hatim book page. */
  surface: "surah" | "hatim";
  mushafBackend?: MushafPageRenderBackend;
  platformOS?: string;
  /** Per-page COLR font load result (hatim only). */
  colrPageReady?: boolean;
};

export function resolveMushafTajweedBackend(
  readingThemeId?: string | null,
  opts?: { showTajweedColors?: boolean; arabicScriptEdition?: string | null }
): MushafPageRenderBackend {
  return mushafBookEffectiveRenderBackend(readingThemeId as QuranReadingThemeId | null | undefined, {
    showTajweedColors: opts?.showTajweedColors,
    arabicScriptEdition: opts?.arabicScriptEdition,
  });
}

export function tajweedRenderNoticeKind(ctx: TajweedRenderContext): TajweedRenderNoticeKind {
  if (!ctx.showTajweed) return "none";
  if (ctx.arabicScriptEdition !== "madinah") return "script_not_madinah";

  if (ctx.surface === "surah") {
    return "surah_unicode_tags";
  }

  const platform = ctx.platformOS ?? Platform.OS;
  const backend =
    ctx.mushafBackend ??
    resolveMushafTajweedBackend(undefined, {
      showTajweedColors: true,
      arabicScriptEdition: ctx.arabicScriptEdition,
    });

  if (backend !== "qcf4") {
    return "hatim_unicode_fallback";
  }

  if (!qcf4ColrTajweedEnabledOnPlatform()) {
    return "hatim_unicode_fallback";
  }

  if (ctx.colrPageReady === false) {
    return "hatim_colr_fallback";
  }

  return "none";
}

export function tajweedRenderNoticeVisible(kind: TajweedRenderNoticeKind): boolean {
  if (kind === "hatim_unicode_fallback" || kind === "hatim_colr_fallback") return false;
  return kind !== "none" && kind !== "script_not_madinah";
}
