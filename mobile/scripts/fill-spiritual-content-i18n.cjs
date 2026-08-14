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
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const MAX_CHUNK_CHARS = 1500;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function splitLongText(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const parts = [];
  let buf = "";
  for (const sentence of text.split(/(?<=[.!?…])\s+/u)) {
    const next = buf ? `${buf} ${sentence}` : sentence;
    if (next.length > MAX_CHUNK_CHARS && buf) {
      parts.push(buf);
      buf = sentence;
    } else {
      buf = next;
    }
  }
  if (buf) parts.push(buf);
  return parts.length ? parts : [text];
}

async function translateGtxOnce(text, target) {
  const lang = GTX_LANG[target] || target;
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=kk&tl=" +
    encodeURIComponent(lang) +
    "&dt=t&q=" +
    encodeURIComponent(text);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`gtx ${res.status}`);
    const data = await res.json();
    const parts = Array.isArray(data?.[0]) ? data[0] : [];
    const out = parts
      .map((row) => (Array.isArray(row) ? row[0] : ""))
      .filter(Boolean)
      .join("");
    return String(out || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

async function translateGtx(text, target) {
  const chunks = splitLongText(text);
  const out = [];
  for (const chunk of chunks) {
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const tr = await translateGtxOnce(chunk, target);
        if (tr) {
          out.push(tr);
          lastErr = null;
          break;
        }
        lastErr = new Error("empty translation");
      } catch (e) {
        lastErr = e;
        await sleep(400 * (attempt + 1));
      }
    }
    if (lastErr) throw lastErr;
    await sleep(80);
  }
  return out.join(" ").trim();
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
        let tr = await translateGtx(src, loc);
        if (!tr && (loc === "ky" || loc === "uz")) tr = src;
        if (!tr && src.length <= 4) tr = src;
        if (tr) {
          map[hash(src)] = tr;
          filled++;
        } else {
          failed++;
          console.warn(`empty ${loc} [${i + 1}/${missing.length}]: ${src.slice(0, 60)}`);
        }
      } catch (e) {
        failed++;
        console.warn(`fail ${loc} [${i + 1}/${missing.length}]: ${e.message}`);
        await sleep(1200);
      }
      if ((i + 1) % 5 === 0) {
        process.stdout.write(`  ${loc} ${i + 1}/${missing.length}\r`);
        await sleep(180);
      } else {
        await sleep(100);
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
