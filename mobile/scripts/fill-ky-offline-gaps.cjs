#!/usr/bin/env node
/**
 * Fill missing Kyrgyz (ky) entries in offline-auto-translations-core.json
 * for hashes present in other APK locales, then rebuild APK slim pack.
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const corePath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const kkPath = path.join(mobileRoot, "src", "i18n", "kk.ts");

function hashAutoTranslateSource(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
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
        s = raw
          .slice(1, -1)
          .replace(/\\`/g, "`")
          .replace(/\\\$/g, "$")
          .replace(/\\n/g, "\n");
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

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function translateText(text, target) {
  return translateVia("kk", target, text);
}

async function translateVia(sourceLang, target, text) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${target}` +
    `&dt=t&q=${encodeURIComponent(text)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const segs = Array.isArray(json?.[0]) ? json[0] : [];
    const translated = segs.map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("");
    return normalizeText(translated) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Kazakh-only letters (not in Kyrgyz Cyrillic alphabet). Kyrgyz keeps ө/ү/ң. */
const KK_ONLY = /[әғқұһӘҒҚҰҺ]/;

function normalizeKkBleedToKy(text) {
  return String(text ?? "")
    .replace(/ә/g, "е")
    .replace(/Ә/g, "Е")
    .replace(/ғ/g, "г")
    .replace(/Ғ/g, "Г")
    .replace(/қ/g, "к")
    .replace(/Қ/g, "К")
    .replace(/ұ/g, "у")
    .replace(/Ұ/g, "У")
    .replace(/һ/g, "х")
    .replace(/Һ/g, "Х")
    .replace(/і/g, "и")
    .replace(/І/g, "И");
}

function kyLooksOk(text) {
  const t = String(text ?? "").trim();
  if (!t) return false;
  if (KK_ONLY.test(t)) return false;
  return true;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const kkStrings = collectKkStrings(fs.readFileSync(kkPath, "utf8"));
  const byHash = new Map([...kkStrings].map((s) => [hashAutoTranslateSource(s), s]));
  const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
  core.targets ??= {};
  core.targets.ky ??= {};

  /** Prefer parity with ru APK-relevant hashes (same kk UI set). */
  const ruHashes = new Set();
  for (const [h, src] of byHash) {
    if (core.targets.ru?.[h]) ruHashes.add(h);
  }
  const missing = [...byHash.keys()].filter((h) => !core.targets.ky[h] && (ruHashes.has(h) || true));
  /** Focus: hashes that exist for ru but not ky among kk UI strings */
  const focus = [...byHash.entries()]
    .filter(([h]) => core.targets.ru?.[h] && !core.targets.ky[h])
    .map(([h, src]) => ({ h, src }));

  console.log(`kk strings: ${kkStrings.size}`);
  console.log(`ky missing vs ru (UI set): ${focus.length}`);
  if (dryRun) {
    focus.slice(0, 10).forEach((x) => console.log("-", x.src.slice(0, 90)));
    return;
  }

  let done = 0;
  let failed = 0;
  for (let i = 0; i < focus.length; i++) {
    const { h, src } = focus[i];
    let translated = await translateText(src, "ky");
    if (translated) translated = normalizeKkBleedToKy(translated);
    if (translated && !kyLooksOk(translated)) {
      await new Promise((r) => setTimeout(r, 150));
      translated = await translateText(src, "ky");
      if (translated) translated = normalizeKkBleedToKy(translated);
    }
    if (translated && !kyLooksOk(translated) && core.targets.ru?.[h]) {
      await new Promise((r) => setTimeout(r, 150));
      const viaRu = await translateVia("ru", "ky", core.targets.ru[h]);
      if (viaRu) translated = normalizeKkBleedToKy(viaRu);
    }
    if (translated && kyLooksOk(translated)) {
      core.targets.ky[h] = translated;
      done += 1;
    } else if (translated) {
      // Last resort: force letter normalize even if residual odd chars
      const forced = normalizeKkBleedToKy(translated);
      if (forced && !KK_ONLY.test(forced)) {
        core.targets.ky[h] = forced;
        done += 1;
      } else {
        failed += 1;
        console.warn(`fail: ${src.slice(0, 60)}`);
      }
    } else {
      failed += 1;
      console.warn(`fail: ${src.slice(0, 60)}`);
    }
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
      console.log(`  progress ${i + 1}/${focus.length} (+${done}, fail ${failed})`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
  console.log(`done: +${done}, fail ${failed}, ky now ${Object.keys(core.targets.ky).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
