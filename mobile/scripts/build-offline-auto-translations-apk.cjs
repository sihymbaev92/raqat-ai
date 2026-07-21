#!/usr/bin/env node
/**
 * Slim APK i18n pack: UI (kk.ts) + guide/catalog chrome from core dictionary.
 * Hadith/Quran bodies are excluded (native editions only).
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const fullPath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const outPath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-apk.json");
const kkPath = path.join(mobileRoot, "src", "i18n", "kk.ts");

const KEEP_LOCALES = ["ru", "en", "ky", "uz", "tr", "ar"];
const { collectContentStrings, collectQuoted } = require("./i18n-content-collect.cjs");

function hashAutoTranslateSource(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

const kkStrings = new Set();
collectQuoted(fs.readFileSync(kkPath, "utf8"), kkStrings);
const contentStrings = collectContentStrings(mobileRoot);
const allStrings = new Set([...kkStrings, ...contentStrings]);
const hashes = new Set([...allStrings].map(hashAutoTranslateSource));
console.log(
  `kk UI: ${kkStrings.size}, content: ${contentStrings.size}, total hashes: ${hashes.size}`
);

const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));
const targets = {};
let kept = 0;
let missingContent = 0;
for (const s of contentStrings) {
  const h = hashAutoTranslateSource(s);
  if (!full.targets?.ru?.[h]) missingContent += 1;
}
console.log(`content strings missing from core(ru): ${missingContent}`);

for (const loc of KEEP_LOCALES) {
  const srcMap = full.targets?.[loc] || {};
  const slim = {};
  for (const [h, v] of Object.entries(srcMap)) {
    if (!hashes.has(h)) continue;
    const t = String(v ?? "").trim();
    if (!t) continue;
    slim[h] = t;
    kept += 1;
  }
  targets[loc] = slim;
  console.log(`${loc}: ${Object.keys(slim).length} / ${Object.keys(srcMap).length}`);
}

const out = {
  version: Number(full.version || 1),
  sourceLocale: "kk",
  generatedAt: new Date().toISOString(),
  scope: "apk-ui-and-spiritual-chrome",
  policy: "no-gtx-hadith-or-quran-body",
  locales: KEEP_LOCALES,
  targets,
};

fs.writeFileSync(outPath, `${JSON.stringify(out)}\n`, "utf8");
const mb = fs.statSync(outPath).size / (1024 * 1024);
console.log(`wrote ${outPath} (${mb.toFixed(2)} MB, ${kept} entries)`);
