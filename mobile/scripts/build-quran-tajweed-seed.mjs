#!/usr/bin/env node
/** Al Quran Cloud quran-tajweed → offline bundled seed (114 surahs, ~1.1 MB). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "assets", "bundled", "quran-tajweed-offline.json");
const API = "https://api.alquran.cloud/v1/surah";

async function fetchSurah(n) {
  const res = await fetch(`${API}/${n}/quran-tajweed`, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`surah ${n}: HTTP ${res.status}`);
  const body = await res.json();
  if (body.code !== 200 || !Array.isArray(body.data?.ayahs)) {
    throw new Error(`surah ${n}: bad payload`);
  }
  const map = {};
  for (const ayah of body.data.ayahs) {
    const text = (ayah.text ?? "").trim();
    if (text.includes("[")) map[String(ayah.numberInSurah)] = text;
  }
  return map;
}

async function main() {
  const seed = { version: 1, surahs: {} };
  for (let s = 1; s <= 114; s += 1) {
    seed.surahs[String(s)] = await fetchSurah(s);
    if (s % 10 === 0) console.log(`tajweed seed: ${s}/114`);
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(seed));
  const mb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
  console.log(`wrote ${outFile} (${mb} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
