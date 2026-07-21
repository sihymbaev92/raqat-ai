import {
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  seedApkOfflineTranslationsSync,
} from "../../services/offlineAutoTranslations";
import { resolveKkAutoTranslationText } from "../../quran/useKkAutoTranslator";
import { getTajweedManualBookPage } from "../../content/tajweedManualBook";
import { TAJWEED_APP_FIRST_PAGE } from "../../content/tajweedMuftyatScope";
import { TAJWEED_RULES_CATALOG } from "../../content/tajweedRulesCatalog";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

function hasKk(s: string) {
  return KK.test(s) && s !== "…" && !s.includes("ҚМДБ");
}

describe("tajweed textbook body RU offline", () => {
  beforeAll(async () => {
    seedApkOfflineTranslationsSync();
    await ensureOfflineAutoTranslationsLoaded("ru");
  });

  it("manual book page blocks translate without Kazakh letters (APK pack)", () => {
    const page = getTajweedManualBookPage(TAJWEED_APP_FIRST_PAGE);
    expect(page).toBeTruthy();
    const leaks: string[] = [];
    for (const block of page!.blocks) {
      for (const key of ["text", "title", "subtitle", "caption", "mouthCaption", "examplesCaption"] as const) {
        const raw = (block as Record<string, unknown>)[key];
        if (typeof raw !== "string" || !raw.trim()) continue;
        expect(getOfflineAutoTranslation(raw, "ru")).toBeTruthy();
        const tr = resolveKkAutoTranslationText(raw, "ru", {});
        if (hasKk(tr) || tr === "…") leaks.push(`${key}:${raw.slice(0, 40)}=>${tr.slice(0, 40)}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it("rules legend strings translate without Kazakh letters", () => {
    const samples = TAJWEED_RULES_CATALOG.slice(0, 12);
    for (const rule of samples) {
      for (const raw of [rule.labelKk, rule.detailKk]) {
        expect(getOfflineAutoTranslation(raw, "ru")).toBeTruthy();
        const tr = resolveKkAutoTranslationText(raw, "ru", {});
        expect(hasKk(tr)).toBe(false);
        expect(tr).not.toBe("…");
      }
    }
  });
});
