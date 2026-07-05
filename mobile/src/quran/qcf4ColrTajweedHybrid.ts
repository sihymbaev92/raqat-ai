import type { TajweedRuleKey } from "../utils/alquranTajweedParse";
import { tajweedRuleForWordGlyph } from "../utils/alquranTajweedParse";
import type { Qcf4Word } from "./qcf4Types";
import {
  qcf4ColrPreferApiTagOverColr,
  qcf4ColrSuppressTajweedColor,
} from "./qcf4ColrTajweedOverride";

/** QCF4 тәжуид бояу: COLR glyph | API тег түсі | базалық сия. */
export type Qcf4TajweedPaintMode = "colr" | "tag" | "base";

export type Qcf4TajweedPaint = {
  mode: Qcf4TajweedPaintMode;
  rule?: TajweedRuleKey;
};

export function resolveQcf4TajweedPaint(opts: {
  useColrGlyphs: boolean;
  word: Qcf4Word;
  nextWord?: Qcf4Word;
  taggedAyah?: string | null;
  wordIndex?: number;
  glyphIndexInWord?: number;
}): Qcf4TajweedPaint {
  const { useColrGlyphs, word, nextWord, taggedAyah, wordIndex, glyphIndexInWord } = opts;

  const rule =
    wordIndex != null
      ? tajweedRuleForWordGlyph(taggedAyah, wordIndex, glyphIndexInWord ?? 0)
      : undefined;

  if (!useColrGlyphs) {
    return rule ? { mode: "tag", rule } : { mode: "base" };
  }

  if (qcf4ColrSuppressTajweedColor(word, nextWord)) {
    return { mode: "base" };
  }

  if (rule && qcf4ColrPreferApiTagOverColr(word, nextWord, rule)) {
    return { mode: "tag", rule };
  }

  return { mode: "colr" };
}
