import type { QuranReaderNavMode } from "../storage/quranReaderPrefs";

export function resolveEffectiveQuranReaderNavMode(opts: {
  platformOS: string;
  mushafLayout: boolean;
  windowWidth: number;
  preferredMode: QuranReaderNavMode;
}): QuranReaderNavMode {
  if (opts.platformOS === "web" && opts.mushafLayout && opts.windowWidth < 720) {
    return "scroll";
  }
  return opts.preferredMode;
}

export function shouldRenderSingleMushafBookPageOnWeb(platformOS: string): boolean {
  return platformOS === "web";
}
