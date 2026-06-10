import React from "react";
import type { ThemeColors } from "../theme/colors";
import type { OrnamentTone } from "../theme/ornamentAssets";

type Props = {
  colors: ThemeColors;
  compact?: boolean;
  tone?: OrnamentTone;
  noMargin?: boolean;
  bleed?: number;
  translucent?: boolean;
  stripOnly?: boolean;
};

/** Орнамент жолақтары қолданбадан алынып тасталды — API сақталған, бос рендер. */
export function KazakhOrnamentBand(_props: Props) {
  return null;
}
