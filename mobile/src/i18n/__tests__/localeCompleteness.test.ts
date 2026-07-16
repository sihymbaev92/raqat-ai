import fs from "node:fs";
import path from "node:path";
import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";
import {
  CRITICAL_RU_UI_KEYS,
  assertNoKazakhLetters,
  findKkLocaleLeaks,
} from "../localeLeakScan";

const OFFLINE_BUNDLE_PATH = path.join(
  __dirname,
  "../../../assets/bundled/offline-auto-translations-core.json"
);
const mockOfflineBundle = JSON.parse(fs.readFileSync(OFFLINE_BUNDLE_PATH, "utf8"));

jest.mock("../../utils/loadBundledJson", () => ({
  loadBundledJson: jest.fn(async (name: string) => {
    if (name === "offline-auto-translations-core.json") {
      return mockOfflineBundle;
    }
    return {};
  }),
  tryLoadBundledJson: jest.fn(async (name: string) => {
    if (name === "offline-auto-translations-core.json") {
      return mockOfflineBundle;
    }
    return null;
  }),
  releaseBundledJsonMemory: jest.fn(),
}));

/** kk→ky MT often keeps Kazakh-specific letters (қ, ғ, ұ…) — full-tree scan is noisy for ky. */
const FULL_OFFLINE_LOCALES: AppLocale[] = ["ru", "en", "uz", "tr", "ar"];

describe("global locale completeness", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it.each(FULL_OFFLINE_LOCALES)(
    "hydrates %s without Kazakh letter leaks in scanned kk tree",
    async (locale) => {
      await setCurrentLocale(locale);
      const leaks = findKkLocaleLeaks(kk);
      if (leaks.length > 0) {
        const sample = leaks
          .slice(0, 25)
          .map((l) => `  ${l.path}: ${l.value.slice(0, 80)}`)
          .join("\n");
        throw new Error(
          `[${locale}] ${leaks.length} kk strings still look Kazakh:\n${sample}${
            leaks.length > 25 ? `\n  … +${leaks.length - 25} more` : ""
          }`
        );
      }
    }
  );

  it("translates critical Russian UI keys away from Kazakh", async () => {
    await setCurrentLocale("ru");
    for (const { path: keyPath, get } of CRITICAL_RU_UI_KEYS) {
      const value = get(kk as unknown as Record<string, unknown>);
      try {
        assertNoKazakhLetters(value, keyPath);
      } catch (e) {
        throw new Error(`[ru] ${(e as Error).message}`);
      }
    }
    expect(kk.features.halalTabInstitutions).toBe("Учреждения");
    expect(kk.features.halalTabVerify).not.toBe("Тексеру");
    expect(kk.settings.languageSectionSub).toMatch(/7|семи|русск/i);
  });
});
