#!/usr/bin/env node
/**
 * Al Quran Cloud quran-tajweed — 114 сураны офлайн bundle-ға жинайды.
 * @see https://alquran.cloud/tajweed-guide
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(mobileRoot, "assets", "bundled", "quran-tajweed-offline.json");
const API = "https://api.alquran.cloud/v1/surah";
const DELAY_MS = 120;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSurahTajweed(n) {
  const res = await fetch(`${API}/${n}/quran-tajweed`);
  if (!res.ok) throw new Error(`HTTP ${res.status} surah ${n}`);
  const body = await res.json();
  if (body.code !== 200 || !Array.isArray(body.data?.ayahs)) {
    throw new Error(`Bad payload surah ${n}`);
  }
  const ayahs = {};
  for (const ayah of body.data.ayahs) {
    const num = ayah.numberInSurah;
    const text = (ayah.text ?? "").trim();
    if (typeof num === "number" && text.includes("[")) ayahs[String(num)] = text;
  }
  return ayahs;
}

async function main() {
  const surahs = {};
  for (let n = 1; n <= 114; n += 1) {
    process.stdout.write(`\rSurah ${n}/114…`);
    surahs[String(n)] = await fetchSurahTajweed(n);
    if (n < 114) await sleep(DELAY_MS);
  }
  process.stdout.write("\n");

  const bundle = {
    version: 1,
    source: "api.alquran.cloud/v1/surah/{n}/quran-tajweed",
    generatedAt: new Date().toISOString(),
    surahs,
  };

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(bundle), "utf8");
  const stat = await fs.stat(outFile);
  const ayahCount = Object.values(surahs).reduce((acc, s) => acc + Object.keys(s).length, 0);
  console.log(`Wrote ${outFile}`);
  console.log(`  ${ayahCount} ayahs · ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
