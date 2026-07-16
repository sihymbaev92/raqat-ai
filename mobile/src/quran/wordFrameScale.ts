/**
 * Quran.com iOS WordFrameScale (quran/quran-ios, Apache-2.0).
 * Aspect-fit mushaf page into a viewport — preserve ratio, center offsets.
 */
export type WordFrameScale = {
  scale: number;
  xOffset: number;
  yOffset: number;
};

export type Size2 = { width: number; height: number };

export function computeWordFrameScale(imageSize: Size2, viewSize: Size2): WordFrameScale {
  if (
    imageSize.width <= 0 ||
    imageSize.height <= 0 ||
    viewSize.width <= 0 ||
    viewSize.height <= 0
  ) {
    return { scale: 0, xOffset: 0, yOffset: 0 };
  }
  const imageAR = imageSize.width / imageSize.height;
  const viewAR = viewSize.width / viewSize.height;
  const scale =
    imageAR < viewAR ? viewSize.height / imageSize.height : viewSize.width / imageSize.width;
  return {
    scale,
    xOffset: (viewSize.width - scale * imageSize.width) / 2,
    yOffset: (viewSize.height - scale * imageSize.height) / 2,
  };
}

export function scaledImageSize(imageSize: Size2, viewSize: Size2): Size2 {
  const { scale } = computeWordFrameScale(imageSize, viewSize);
  return {
    width: imageSize.width * scale,
    height: imageSize.height * scale,
  };
}

export function scaleRect(
  rect: { x: number; y: number; width: number; height: number },
  frame: WordFrameScale
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x * frame.scale + frame.xOffset,
    y: rect.y * frame.scale + frame.yOffset,
    width: rect.width * frame.scale,
    height: rect.height * frame.scale,
  };
}

/** Screen point → native image coordinates (inverse WordFrameScale). */
export function screenToImage(
  localX: number,
  localY: number,
  frame: WordFrameScale
): { x: number; y: number } {
  if (frame.scale <= 0) return { x: 0, y: 0 };
  return {
    x: (localX - frame.xOffset) / frame.scale,
    y: (localY - frame.yOffset) / frame.scale,
  };
}
