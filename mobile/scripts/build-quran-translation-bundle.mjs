#!/usr/bin/env node
/**
 * Downloads verified Quran translation editions into one offline JSON bundle.
 * This prevents non-Kazakh readers from falling back to Kazakh on first
 * launch when there is no internet connection.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(mobileRoot, "assets", "bundled", "quran-translations-offline.json");

const editions = {
  ru: "ru.kuliev",
  en: "en.sahih",
  tr: "tr.diyanet",
  uz: "uz.sodik",
  ky: "quranenc:kyrgyz_hakimov",
};

const fieldByLocale = {
  ru: "textRu",
  en: "textEn",
  tr: "textTr",
  uz: "textUz",
  ky: "textKy",
};

const verifiedFallbacks = [
  {
    locale: "ku",
    field: "textKu",
    surah: 108,
    ayah: 3,
    source: "quranenc.com kurdish_bamoki",
    text: "بێگومان ھەر ناحەزت دوا بڕاوە (ئەی موحەممەد ﷺ)",
  },
];

function applyVerifiedFallbacks(bundle) {
  for (const row of verifiedFallbacks) {
    const surah = ensureSurah(bundle, row.surah);
    const ayah = ensureAyah(surah, row.ayah);
    if (!String(ayah[row.field] ?? "").trim()) {
      ayah[row.field] = row.text;
    }
  }
}

async function readExistingBundle() {
  try {
    return JSON.parse(await fs.readFile(outFile, "utf8"));
  } catch {
    return { version: 1, source: "alquran.cloud", editions, surahs: [] };
  }
}

function ensureSurah(bundle, surahNumber) {
  bundle.surahs ??= [];
  let surah = bundle.surahs.find((row) => row.number === surahNumber);
  if (!surah) {
    surah = { number: surahNumber, ayahs: [] };
    bundle.surahs.push(surah);
    bundle.surahs.sort((a, b) => a.number - b.number);
  }
  return surah;
}

function ensureAyah(surah, ayahNumber) {
  let ayah = surah.ayahs.find((row) => row.numberInSurah === ayahNumber);
  if (!ayah) {
    ayah = { numberInSurah: ayahNumber };
    surah.ayahs.push(ayah);
    surah.ayahs.sort((a, b) => a.numberInSurah - b.numberInSurah);
  }
  return ayah;
}

async function fetchSurah(surahNumber, edition) {
  const isQuranEnc = edition.startsWith("quranenc:");
  const url = isQuranEnc
    ? `https://quranenc.com/api/v1/translation/sura/${edition.slice("quranenc:".length)}/${surahNumber}`
    : `https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (isQuranEnc) {
      const ayahs = json?.result;
      if (!Array.isArray(ayahs)) throw new Error("missing quranenc ayahs");
      return ayahs
        .map((ayah) => {
          const numberInSurah = typeof ayah.aya === "number" ? ayah.aya : Number(ayah.aya);
          return {
            numberInSurah,
            text: String(ayah.translation ?? "").trim(),
          };
        })
        .filter((ayah) => Number.isFinite(ayah.numberInSurah) && ayah.numberInSurah > 0 && ayah.text);
    }
    const ayahs = json?.data?.ayahs;
    if (!Array.isArray(ayahs)) throw new Error("missing ayahs");
    return ayahs
      .map((ayah) => ({
        numberInSurah: ayah.numberInSurah,
        text: String(ayah.text ?? "").trim(),
      }))
      .filter((ayah) => typeof ayah.numberInSurah === "number" && ayah.text);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const bundle = await readExistingBundle();
  bundle.version = 1;
  bundle.source = "alquran.cloud + quranenc fallback";
  bundle.generatedAt = new Date().toISOString();
  bundle.editions = editions;
  bundle.surahs ??= [];
  applyVerifiedFallbacks(bundle);

  for (const [locale, edition] of Object.entries(editions)) {
    const field = fieldByLocale[locale];
    for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
      const surah = ensureSurah(bundle, surahNumber);
      const alreadyComplete = surah.ayahs.length > 0 && surah.ayahs.every((ayah) => String(ayah[field] ?? "").trim());
      if (alreadyComplete) continue;

      const rows = await fetchSurah(surahNumber, edition);
      for (const row of rows) {
        ensureAyah(surah, row.numberInSurah)[field] = row.text;
      }
      if (surahNumber % 10 === 0) {
        await fs.writeFile(outFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
      }
      console.log(`quran-translations-offline: ${locale} ${surahNumber}/114`);
    }
    await fs.writeFile(outFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
