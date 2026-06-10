/** Muftyat CDN: `orxl` — карточка превью, `orxxl` — slider/full (айқын). */
export function upgradeMuftyatImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/\/orxl\//i, "/orxxl/");
}

/** Жаңалық/hero суреттері — максималды қолжетімді ажыратымашылық. */
export function upgradeRemoteFeedImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("imgs.muftyat.kz")) {
    return upgradeMuftyatImageUrl(trimmed);
  }
  return trimmed;
}
