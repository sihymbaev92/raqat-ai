import {
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  seedApkOfflineTranslationsSync,
} from "../../services/offlineAutoTranslations";
import { DHIKR_CHAPTERS } from "../../content/dhikrChapters";
import { DUA_CATEGORIES } from "../../content/duasCatalog";
import { resolveKkAutoTranslationText } from "../../quran/useKkAutoTranslator";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

describe("spiritual content RU offline (APK slim pack)", () => {
  beforeAll(async () => {
    seedApkOfflineTranslationsSync();
    await ensureOfflineAutoTranslationsLoaded("ru");
  });

  it("duas titles and meanings resolve without Kazakh letters", () => {
    const cat = DUA_CATEGORIES[0]!;
    const block = cat.blocks[0]!;
    const catTr = resolveKkAutoTranslationText(cat.title, "ru", {});
    const titleTr = resolveKkAutoTranslationText(block.title, "ru", {});
    const meaningTr = resolveKkAutoTranslationText(block.meaningKk, "ru", {});
    expect(getOfflineAutoTranslation(cat.title, "ru")).toBeTruthy();
    expect(getOfflineAutoTranslation(block.title, "ru")).toBeTruthy();
    expect(getOfflineAutoTranslation(block.meaningKk, "ru")).toBeTruthy();
    expect(KK.test(catTr)).toBe(false);
    expect(KK.test(titleTr)).toBe(false);
    expect(KK.test(meaningTr)).toBe(false);
    expect(catTr).not.toBe("…");
    expect(titleTr).not.toBe("…");
    expect(meaningTr).not.toBe("…");
  });

  it("asma names resolve without Kazakh letters", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asma = require("../../../assets/bundled/asma-al-husna-kk.json") as Array<{ kk: string }>;
    expect(asma.length).toBeGreaterThanOrEqual(99);
    for (const row of asma.slice(0, 20)) {
      const tr = resolveKkAutoTranslationText(row.kk, "ru", {});
      expect(getOfflineAutoTranslation(row.kk, "ru")).toBeTruthy();
      expect(KK.test(tr)).toBe(false);
      expect(tr).not.toBe("…");
    }
  });

  it("dhikr chapter + sample items resolve without Kazakh letters", () => {
    const ch = DHIKR_CHAPTERS[0]!;
    const chTr = resolveKkAutoTranslationText(ch.titleKk, "ru", {});
    expect(getOfflineAutoTranslation(ch.titleKk, "ru")).toBeTruthy();
    expect(KK.test(chTr)).toBe(false);
    expect(chTr).not.toBe("…");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pack = require("../../../assets/bundled/dhikr-list.json") as {
      items: Array<{ textKk: string; meaningKk?: string }>;
    };
    const items = pack.items.slice(0, 15);
    for (const item of items) {
      const t = resolveKkAutoTranslationText(item.textKk, "ru", {});
      expect(getOfflineAutoTranslation(item.textKk, "ru")).toBeTruthy();
      expect(KK.test(t)).toBe(false);
      expect(t).not.toBe("…");
      if (item.meaningKk) {
        const m = resolveKkAutoTranslationText(item.meaningKk, "ru", {});
        expect(getOfflineAutoTranslation(item.meaningKk, "ru")).toBeTruthy();
        expect(KK.test(m)).toBe(false);
        expect(m).not.toBe("…");
      }
    }
  });
});
