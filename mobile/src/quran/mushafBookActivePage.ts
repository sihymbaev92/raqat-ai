export function isMushafBookRenderPageActive(
  itemIndex: number,
  currentIndex: number,
  preloadRadius = 1
): boolean {
  if (!Number.isFinite(itemIndex) || !Number.isFinite(currentIndex)) return false;
  const radius = Math.max(0, Math.floor(preloadRadius));
  return Math.abs(itemIndex - currentIndex) <= radius;
}
