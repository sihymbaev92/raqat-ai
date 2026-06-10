import { Image, Platform, type ImageSourcePropType } from "react-native";

/** Bundle PNG/JPEG өлшемінен ені/биіктік қатынасы (GuideImageLightbox contain үшін). */
export function imageAssetAspectRatio(source: ImageSourcePropType): number | undefined {
  const size = imageAssetPixelSize(source);
  if (size == null) return undefined;
  return size.width / size.height;
}

/** Bundle PNG/JPEG нақты пиксель өлшемі — upscale-ды болдырмау үшін. */
export function imageAssetPixelSize(
  source: ImageSourcePropType
): { width: number; height: number } | undefined {
  const resolve = Image.resolveAssetSource as
    | ((s: ImageSourcePropType) => { width?: number; height?: number } | undefined)
    | undefined;
  if (typeof resolve === "function") {
    try {
      const resolved = resolve(source);
      if (resolved?.width && resolved?.height && resolved.width > 0 && resolved.height > 0) {
        return { width: resolved.width, height: resolved.height };
      }
    } catch {
      /* веб/export bundle кейінде resolveAssetSource жоқ */
    }
  }

  if (Platform.OS === "web" && typeof source === "object" && source != null) {
    const candidate = source as { width?: number; height?: number };
    if (candidate.width && candidate.height && candidate.width > 0 && candidate.height > 0) {
      return { width: candidate.width, height: candidate.height };
    }
  }

  return undefined;
}
