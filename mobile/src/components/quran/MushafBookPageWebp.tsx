import React from "react";
import { mushafBookPageImageUri } from "../../quran/mushafPageRenderBackend";
import { MushafBookPageRaster, type MushafBookPageRasterProps } from "./MushafBookPageRaster";

export type MushafBookPageWebpProps = Omit<MushafBookPageRasterProps, "imageUri" | "format">;

/** WebP raster page wrapper (604 хатым). */
export function MushafBookPageWebp(props: MushafBookPageWebpProps) {
  const uri = mushafBookPageImageUri(props.page.mushafPageNumber, props.readingThemeId);
  return <MushafBookPageRaster {...props} imageUri={uri} format="webp" />;
}

export type MushafBookPageWebpRouteProps = MushafBookPageWebpProps;
