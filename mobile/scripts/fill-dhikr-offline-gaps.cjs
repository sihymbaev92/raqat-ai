#!/usr/bin/env node
/** Fill missing dhikr-list.json Kazakh strings into offline-auto-translations-core.json. */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const corePath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const dhikrPath = path.join(mobileRoot, "assets", "bundled", "dhikr-list.json");
const KEEP_LOCALES = ["ru", "en", "ky", "uz", "tr", "ar"];
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
  return parts
    .map((row) => (Array.isArray(row) ? row[0] : ""))
    .filter(Boolean)
    .join("")
    .trim();
}

async function main() {
  const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
  if (!core.targets) core.targets = {};
  const pack = JSON.parse(fs.readFileSync(dhikrPath, "utf8"));
  const sources = new Set();
  for (const item of pack.items ?? []) {
    if (item.textKk) sources.add(String(item.textKk).trim());
    if (item.meaningKk) sources.add(String(item.meaningKk).trim());
  }
  console.log(`dhikr strings: ${sources.size}`);

  let filled = 0;
  for (const loc of KEEP_LOCALES) {
    if (!core.targets[loc]) core.targets[loc] = {};
    const map = core.targets[loc];
    const missing = [...sources].filter((s) => !map[hash(s)]);
    console.log(`${loc}: missing ${missing.length}`);
    for (let i = 0; i < missing.length; i++) {
      const src = missing[i];
      try {
        const tr = await translateGtx(src, loc);
        if (tr && tr !== src) {
          map[hash(src)] = tr;
          filled++;
        }
      } catch (e) {
        console.warn(`fail ${loc}: ${e.message}`);
        await sleep(500);
      }
      await sleep(80);
    }
  }

  core.generatedAt = new Date().toISOString();
  fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
  console.log(`filled=${filled}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
