#!/usr/bin/env node
/**
 * Fill missing guide/chrome strings into offline-auto-translations-core.json
 * (Google gtx). Skips hadith/Quran bodies — those use native editions.
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const corePath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const KEEP_LOCALES = (process.env.RAQAT_I18N_TARGETS || "ru,en,ky,uz,tr,ar")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const { collectContentStrings } = require("./i18n-content-collect.cjs");

const GTX_LANG = { ru: "ru", en: "en", ky: "ky", uz: "uz", tr: "tr", ar: "ar" };

function hash(s) {
  let h = 5381;
  const t = String(s).trim();
  for (let i = 0; i < t.length; i++) h = (h * 33) ^ t.charCodeAt(i);
  return (h >>> 0).toString(36);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateGtx(text, target) {
  const lang = GTX_LANG[target] || target;
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=kk&tl=" +
    encodeURIComponent(lang) +
    "&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data = await res.json();
  const parts = Array.isArray(data?.[0]) ? data[0] : [];
  const out = parts
    .map((row) => (Array.isArray(row) ? row[0] : ""))
    .filter(Boolean)
    .join("");
  return String(out || "").trim();
}

async function main() {
  const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
  if (!core.targets) core.targets = {};
  const sources = [...collectContentStrings(mobileRoot)];
  console.log(`content strings (chrome only): ${sources.length}`);

  let filled = 0;
  let failed = 0;
  for (const loc of KEEP_LOCALES) {
    if (!core.targets[loc]) core.targets[loc] = {};
    const map = core.targets[loc];
    const missing = sources.filter((s) => !map[hash(s)]);
    console.log(`${loc}: missing ${missing.length}`);
    for (let i = 0; i < missing.length; i++) {
      const src = missing[i];
      try {
        const tr = await translateGtx(src, loc);
        if (tr && tr !== src) {
          map[hash(src)] = tr;
          filled++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
        console.warn(`fail ${loc} [${i + 1}/${missing.length}]: ${e.message}`);
        await sleep(800);
      }
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`  ${loc} ${i + 1}/${missing.length}\r`);
        await sleep(120);
      } else {
        await sleep(60);
      }
    }
    console.log(`${loc}: done`);
  }

  core.generatedAt = new Date().toISOString();
  core.policy = "no-gtx-hadith-or-quran-body";
  fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
  const mb = fs.statSync(corePath).size / (1024 * 1024);
  console.log(`wrote core (${mb.toFixed(2)} MB), filled=${filled}, failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
