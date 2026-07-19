#!/usr/bin/env node
/**
 * Slim APK UI i18n pack: APP_LOCALE languages × strings from kk.ts (+ critical patches).
 * Full 36MB CDN file stays optional; this file is small enough to bundle in APK.
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const fullPath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const outPath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-apk.json");
const kkPath = path.join(mobileRoot, "src", "i18n", "kk.ts");

const KEEP_LOCALES = ["ru", "en", "ky", "uz", "tr", "ar"];

function hashAutoTranslateSource(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function collectKkStrings(fileText) {
  const out = new Set();
  const re = /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g;
  let m;
  while ((m = re.exec(fileText))) {
    const raw = m[0];
    let s;
    try {
      if (raw.startsWith("`")) {
        s = raw.slice(1, -1).replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\n/g, "\n");
      } else {
        s = JSON.parse(raw.replace(/^'/, '"').replace(/'$/, '"').replace(/\\'/g, "'"));
      }
    } catch {
      s = raw.slice(1, -1);
    }
    s = String(s ?? "").trim();
    if (s.length < 2) continue;
    if (!/[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(s)) continue;
    if (s.includes("${")) continue;
    out.add(s);
  }
  return out;
}

const kkStrings = collectKkStrings(fs.readFileSync(kkPath, "utf8"));
const hashes = new Set([...kkStrings].map(hashAutoTranslateSource));
console.log(`kk UI strings: ${kkStrings.size}, hashes: ${hashes.size}`);

const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));
const targets = {};
let kept = 0;
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
  scope: "apk-ui-locales",
  locales: KEEP_LOCALES,
  targets,
};

fs.writeFileSync(outPath, `${JSON.stringify(out)}\n`, "utf8");
const mb = fs.statSync(outPath).size / (1024 * 1024);
console.log(`wrote ${outPath} (${mb.toFixed(2)} MB, ${kept} entries)`);
