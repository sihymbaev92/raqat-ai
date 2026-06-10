import { StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

/** Кіші превью контейнері — Android-да Pressable биіктігі анық болуы керек. */
export function resolveGuideImageThumbFrame(
  thumbStyle: StyleProp<ImageStyle>,
  imageAspectRatio?: number
): ViewStyle {
  const flat = StyleSheet.flatten(thumbStyle) ?? {};
  const width = (flat.width as ViewStyle["width"]) ?? "100%";
  if (typeof flat.height === "number") {
    return {
      width,
      height: flat.height,
      minHeight: flat.height,
      alignSelf: "stretch",
    };
  }
  if (imageAspectRatio != null && imageAspectRatio > 0) {
    return {
      width,
      aspectRatio: imageAspectRatio,
      alignSelf: "stretch",
    };
  }
  const height =
    typeof flat.height === "number"
      ? flat.height
      : typeof flat.minHeight === "number"
        ? flat.minHeight
        : 220;
  return { width, height, minHeight: height, alignSelf: "stretch" };
}

/** Превью Image — жиек/фон thumbStyle-дан (өлшемін aspectRatio анықтайды). */
export function resolveGuideImageThumbImageStyle(thumbStyle: StyleProp<ImageStyle>): ImageStyle {
  const flat = StyleSheet.flatten(thumbStyle) ?? {};
  return {
    borderRadius: flat.borderRadius,
    backgroundColor: flat.backgroundColor,
    borderWidth: flat.borderWidth,
    borderColor: flat.borderColor,
  };
}

/** @deprecated resolveGuideImageThumbImageStyle қолданыңыз */
export function resolveGuideImageThumbChromeStyle(thumbStyle: StyleProp<ImageStyle>): ViewStyle {
  return resolveGuideImageThumbImageStyle(thumbStyle);
}

/**
 * Карточка превьюсі — bundle пикселінен үлкейтпейді (Android-да пикселдеу болмауы үшін).
 */
export function guideThumbDisplaySize(
  maxLayoutWidthDp: number,
  aspectRatio: number,
  sourcePixels?: { width: number; height: number },
  pixelRatio = 1
): { width: number; height: number } {
  const safeAspect = aspectRatio > 0 ? aspectRatio : 1;
  let width = Math.max(1, maxLayoutWidthDp);
  let height = width / safeAspect;
  if (sourcePixels && pixelRatio > 0) {
    const capW = sourcePixels.width / pixelRatio;
    const capH = sourcePixels.height / pixelRatio;
    if (width > capW) {
      width = capW;
      height = width / safeAspect;
    }
    if (height > capH) {
      height = capH;
      width = height * safeAspect;
    }
  }
  return { width, height };
}

/**
 * Карточка/бет превьюсі — берілген max ен × max биіктікке contain (телефон экранына сыйдыру).
 * Әдепкі: bundle пикселінен артық upscale етпейді (Android пикселдеу).
 */
export type GuideThumbFitOpts = {
  /** Скан/PDF беттері — экран еніне дейін үлкейту рұқсат. */
  allowUpscale?: boolean;
  /** true: алдымен толық ен, содан биіктікке кесу (тәжуид кітабы). */
  preferWidth?: boolean;
};

export function guideThumbFitContain(
  maxLayoutWidthDp: number,
  maxLayoutHeightDp: number,
  aspectRatio: number,
  sourcePixels?: { width: number; height: number },
  pixelRatio = 1,
  opts?: GuideThumbFitOpts
): { width: number; height: number } {
  const safeAspect = aspectRatio > 0 ? aspectRatio : 1;
  const maxW = Math.max(1, maxLayoutWidthDp);
  const maxH = Math.max(1, maxLayoutHeightDp);
  let width: number;
  let height: number;
  if (opts?.preferWidth) {
    width = maxW;
    height = width / safeAspect;
    if (height > maxH) {
      height = maxH;
      width = height * safeAspect;
    }
  } else if (maxW / maxH > safeAspect) {
    height = maxH;
    width = height * safeAspect;
  } else {
    width = maxW;
    height = width / safeAspect;
  }
  if (!opts?.allowUpscale && sourcePixels && pixelRatio > 0) {
    const capW = sourcePixels.width / pixelRatio;
    const capH = sourcePixels.height / pixelRatio;
    if (width > capW) {
      width = capW;
      height = width / safeAspect;
    }
    if (height > capH) {
      height = capH;
      width = height * safeAspect;
    }
  }
  return { width: Math.round(width), height: Math.round(height) };
}

/** Толық экранда сурет шеттері кеспелесін есептелген өлшем (contain). */
export function guideLightboxFitSize(
  windowWidth: number,
  windowHeight: number,
  insetTop: number,
  aspectRatio: number
): { width: number; height: number } {
  const padH = 20;
  const headerAndPad = insetTop + 56 + 20;
  const maxW = Math.max(1, windowWidth - padH * 2);
  const maxH = Math.max(1, windowHeight - headerAndPad);
  if (maxW / maxH > aspectRatio) {
    return { width: maxH * aspectRatio, height: maxH };
  }
  return { width: maxW, height: maxW / aspectRatio };
}
