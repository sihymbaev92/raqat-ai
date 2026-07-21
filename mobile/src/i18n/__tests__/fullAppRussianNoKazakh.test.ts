import {
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  seedApkOfflineTranslationsSync,
} from "../../services/offlineAutoTranslations";
import { resolveKkAutoTranslationText } from "../../quran/useKkAutoTranslator";
import { setCurrentLocale } from "../runtime";
import { findKkLocaleLeaks } from "../localeLeakScan";
import { kk } from "../kk";
import { NAMAZ_WUDU_LEARNING_MODULES } from "../../content/namazLearningContent";
import { ZAKAT_GUIDE_SECTIONS } from "../../content/zakatCalculatorContent";
import { quranAyahMeaningForLocale } from "../../storage/quranSurahCache";
import { quranKkTextProvenanceForLocale } from "../../config/quranKkTranslation";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

describe("full app Russian — no Kazakh on screen", () => {
  beforeAll(async () => {
    seedApkOfflineTranslationsSync();
    await ensureOfflineAutoTranslationsLoaded("ru");
    await setCurrentLocale("ru");
  });

  afterAll(async () => {
    await setCurrentLocale("kk");
  });

  it("kk chrome has zero Kazakh-letter leaks", () => {
    expect(findKkLocaleLeaks(kk)).toEqual([]);
  });

  it("Quran meanings never fall back to Kazakh under ru", () => {
    const m = quranAyahMeaningForLocale(
      {
        numberInSurah: 1,
        surahNumber: 999,
        textKk: "Аса қамқор мейірімді",
      },
      "ru"
    );
    expect(m).toBe("");
    expect(KK.test(m)).toBe(false);
  });

  it("Hatim provenance is Russian without Kazakh letters", () => {
    const line = quranKkTextProvenanceForLocale("ru");
    expect(line.length).toBeGreaterThan(40);
    expect(KK.test(line)).toBe(false);
  });

  it("namaz learning labels/meanings resolve from APK pack", () => {
    const samples: string[] = [];
    for (const mod of NAMAZ_WUDU_LEARNING_MODULES.slice(0, 3)) {
      for (const step of mod.steps.slice(0, 2)) {
        for (const b of step.recitations ?? []) {
          samples.push(b.label, b.meaningKk, b.transliterationKk);
        }
      }
    }
    const leaks: string[] = [];
    for (const raw of samples.filter(Boolean)) {
      const tr = resolveKkAutoTranslationText(raw, "ru", {});
      if (KK.test(tr) || tr === "…") leaks.push(`${raw.slice(0, 40)}=>${tr.slice(0, 40)}`);
    }
    expect(leaks).toEqual([]);
  });

  it("zakat guide sections resolve from APK pack", () => {
    const leaks: string[] = [];
    for (const sec of ZAKAT_GUIDE_SECTIONS.slice(0, 8)) {
      for (const raw of [sec.title, sec.body].filter(Boolean)) {
        expect(getOfflineAutoTranslation(raw, "ru")).toBeTruthy();
        const tr = resolveKkAutoTranslationText(raw, "ru", {});
        if (KK.test(tr) || tr === "…") leaks.push(raw.slice(0, 50));
      }
    }
    expect(leaks).toEqual([]);
  });
});
