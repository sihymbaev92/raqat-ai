/**
 * Collect Kazakh UI/guide strings for the offline MT pack.
 * Hadith / Quran bodies must NOT enter gtx — only short chrome labels.
 */
const fs = require("fs");
const path = require("path");

const CONTENT_SOURCES = require("./i18n-content-sources.cjs");

const HADITH_RELS = new Set([
  "src/content/kzTrustedHadithCatalog.ts",
  "assets/bundled/kz-trusted-hadith-catalog.json",
  "assets/bundled/hadith-from-db-seed.json",
]);

/** Keys that are hadith/quran body — never machine-translate into UI pack. */
const SKIP_JSON_KEYS = new Set([
  "textKk",
  "textRu",
  "textEn",
  "textTr",
  "textKy",
  "textUz",
  "arabic",
  "sourceNoteKk",
  "narratorKk",
  "kyUzSourceAttribution",
]);

const HADITH_MAX_CHARS = 120;

function isKkString(s) {
  return (
    typeof s === "string" &&
    s.trim().length >= 2 &&
    /[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(s) &&
    !s.includes("${")
  );
}

function collectQuoted(fileText, out, maxChars) {
  const re = /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g;
  let m;
  while ((m = re.exec(fileText))) {
    const raw = m[0];
    let s;
    try {
      if (raw.startsWith("`")) {
        s = raw.slice(1, -1).replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\n/g, "\n");
      } else if (raw.startsWith("'")) {
        s = raw.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, "\n");
      } else {
        s = JSON.parse(raw);
      }
    } catch {
      s = raw.slice(1, -1);
    }
    s = String(s ?? "").trim();
    if (!isKkString(s)) continue;
    if (maxChars != null && s.length > maxChars) continue;
    out.add(s);
  }
}

function collectJson(value, out, opts) {
  const { skipKeys, maxChars } = opts || {};
  if (typeof value === "string") {
    const s = value.trim();
    if (!isKkString(s)) return;
    if (maxChars != null && s.length > maxChars) return;
    out.add(s);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJson(item, out, opts);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (skipKeys && skipKeys.has(key)) continue;
      collectJson(item, out, opts);
    }
  }
}

function collectContentStrings(mobileRoot) {
  const out = new Set();
  for (const rel of CONTENT_SOURCES) {
    const full = path.join(mobileRoot, rel);
    if (!fs.existsSync(full)) {
      console.warn(`missing content source: ${rel}`);
      continue;
    }
    const hadith = HADITH_RELS.has(rel.replace(/\\/g, "/")) || /hadith/i.test(rel);
    const raw = fs.readFileSync(full, "utf8");
    if (rel.endsWith(".json")) {
      try {
        collectJson(JSON.parse(raw), out, {
          skipKeys: hadith ? SKIP_JSON_KEYS : undefined,
          maxChars: hadith ? HADITH_MAX_CHARS : undefined,
        });
      } catch (e) {
        console.warn(`bad json ${rel}:`, e.message);
      }
    } else {
      collectQuoted(raw, out, hadith ? HADITH_MAX_CHARS : undefined);
    }
  }
  return out;
}

module.exports = {
  CONTENT_SOURCES,
  collectContentStrings,
  collectQuoted,
  isKkString,
};
