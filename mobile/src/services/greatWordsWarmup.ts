import { ensureGreatWordsCatalogLoaded, getDisplayEntriesByAuthorId } from "../content/greatWordsCatalog";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";

let warmInflight: Promise<void> | null = null;

/**
 * «Асыл сөздер» — экран chunk + каталог + танымал автор индекстері.
 * Салт-сана экраны focus / CTA basу алдында шақырылады.
 */
export function warmGreatWordsHub(): void {
  if (warmInflight) return;
  warmInflight = (async () => {
    await Promise.all([
      import("../screens/KazakhGreatWordsScreen"),
      import("../screens/KazakhGreatWordsAuthorScreen"),
      import("../screens/KazakhGreatWordsEntryScreen"),
    ]);
    await runWhenHeavyWorkAllowed();
    const catalog = await ensureGreatWordsCatalogLoaded();
    if (!catalog?.entries?.length) return;
    getDisplayEntriesByAuthorId("abai");
    getDisplayEntriesByAuthorId("sana");
  })().catch(() => undefined);
}
