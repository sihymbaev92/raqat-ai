import React from "react";
import { mushafBookPageImageUri } from "../../quran/mushafPageRenderBackend";
import { MushafBookPageRaster } from "./MushafBookPageRaster";
import type { MushafBookPageWebpProps } from "./MushafBookPageWebp";

/** Hafs 604 SVG — Mushaf Database / CDN ligature pages. */
export function MushafBookPageSvg(props: MushafBookPageWebpProps) {
  const uri = mushafBookPageImageUri(props.page.mushafPageNumber, props.readingThemeId);
  return <MushafBookPageRaster {...props} imageUri={uri} format="svg" />;
}
