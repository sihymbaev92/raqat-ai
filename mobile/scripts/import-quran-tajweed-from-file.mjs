#!/usr/bin/env node
/**
 * Al Quran Cloud quran-tajweed JSON → mobile/assets/bundled/quran-tajweed-offline.json
 *
 * Usage:
 *   node scripts/import-quran-tajweed-from-file.mjs [inputPath]
 *
 * Accepts full-Quran API payload ({ data: { surahs: [...] } }) or a single-surah payload.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "assets", "bundled", "quran-tajweed-offline.json");
const defaultInput = path.join(process.env.USERPROFILE ?? "", "Desktop", "quran_tajweed.json.txt");

function ayahsToMap(ayahs) {
  const map = {};
  for (const ayah of ayahs ?? []) {
    const num = ayah.numberInSurah ?? ayah.number;
    const text = (ayah.text ?? "").trim();
    if (typeof num === "number" && Number.isFinite(num) && text.includes("[")) {
      map[String(num)] = text;
    }
  }
  return map;
}

function parseSource(raw) {
  const body = JSON.parse(raw);
  if (body.code !== 200 || !body.data) {
    throw new Error("Expected Al Quran Cloud payload with code 200 and data");
  }

  const surahs = {};
  if (Array.isArray(body.data.surahs)) {
    for (const surah of body.data.surahs) {
      const n = surah.number;
      if (typeof n !== "number" || n < 1 || n > 114) continue;
      surahs[String(n)] = ayahsToMap(surah.ayahs);
    }
  } else if (Array.isArray(body.data.ayahs)) {
    const n = body.data.number ?? body.data.surah?.number;
    if (typeof n !== "number") throw new Error("Single-surah payload missing surah number");
    surahs[String(n)] = ayahsToMap(body.data.ayahs);
  } else {
    throw new Error("Unsupported payload: expected data.surahs or data.ayahs");
  }

  return surahs;
}

function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const surahs = parseSource(fs.readFileSync(inputPath, "utf8"));
  const surahKeys = Object.keys(surahs);
  if (surahKeys.length !== 114) {
    console.warn(`Warning: expected 114 surahs, got ${surahKeys.length}`);
  }

  let ayahCount = 0;
  for (const map of Object.values(surahs)) ayahCount += Object.keys(map).length;

  const bundle = {
    version: 1,
    source: path.basename(inputPath),
    generatedAt: new Date().toISOString(),
    surahs,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(bundle), "utf8");

  const mb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
  console.log(`Wrote ${outFile}`);
  console.log(`  ${surahKeys.length} surahs · ${ayahCount} tagged ayahs · ${mb} MB`);
}

main();
