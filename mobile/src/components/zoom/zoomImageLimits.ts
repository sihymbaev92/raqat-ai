export const IMAGE_ZOOM_MIN_SCALE = 1;
export const IMAGE_ZOOM_MAX_SCALE = 5;
export const IMAGE_ZOOM_DOUBLE_TAP_SCALE = 2.5;

export function clampZoomScale(value: number, min = IMAGE_ZOOM_MIN_SCALE, max = IMAGE_ZOOM_MAX_SCALE): number {
  "worklet";
  return Math.min(max, Math.max(min, value));
}
