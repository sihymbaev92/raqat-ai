#!/usr/bin/env node
/**
 * Fill kk UI strings missing from offline-auto-translations-core.json
 * for ru/en/ky/uz/tr/ar, then rebuild APK slim pack.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const mobileRoot = path.join(__dirname, "..");
const corePath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const kkPath = path.join(mobileRoot, "src", "i18n", "kk.ts");
const TARGETS = ["ru", "en", "ky", "uz", "tr", "ar"];

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

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;
const KK_ONLY_NOT_KY = /[әғқұһӘҒҚҰҺ]/;

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

function looksOk(target, text) {
  const t = String(text ?? "").trim();
  if (!t) return false;
  if (target === "ky") return !KK_ONLY_NOT_KY.test(t);
  if (target === "ru" || target === "en" || target === "uz" || target === "tr" || target === "ar") {
    return !KK_SPECIFIC.test(t);
  }
  return true;
}

function polish(target, text) {
  if (target === "ky") return normalizeKkBleedToKy(text);
  return text;
}

async function translateOne(src, target, ruHint) {
  let translated = await translateVia("kk", target, src);
  if (translated) translated = polish(target, translated);
  if (translated && looksOk(target, translated)) return translated;

  await new Promise((r) => setTimeout(r, 120));
  translated = await translateVia("kk", target, src);
  if (translated) translated = polish(target, translated);
  if (translated && looksOk(target, translated)) return translated;

  if (ruHint && target !== "ru") {
    await new Promise((r) => setTimeout(r, 120));
    translated = await translateVia("ru", target, ruHint);
    if (translated) translated = polish(target, translated);
    if (translated && looksOk(target, translated)) return translated;
  }
  return translated && looksOk(target, polish(target, translated))
    ? polish(target, translated)
    : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  const targets = only ? only.split(",").filter((t) => TARGETS.includes(t)) : TARGETS;

  const kkStrings = [...collectKkStrings(fs.readFileSync(kkPath, "utf8"))];
  const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
  core.targets ??= {};

  const missingByLocale = {};
  for (const loc of targets) {
    core.targets[loc] ??= {};
    missingByLocale[loc] = kkStrings.filter((s) => !String(core.targets[loc][hashAutoTranslateSource(s)] ?? "").trim());
    console.log(`${loc}: missing ${missingByLocale[loc].length}`);
  }
  if (dryRun) {
    (missingByLocale[targets[0]] || []).slice(0, 15).forEach((s) => console.log(" -", s.slice(0, 90)));
    return;
  }

  // Translate ru first so others can use ru as pivot.
  const ordered = [...targets].sort((a, b) => (a === "ru" ? -1 : b === "ru" ? 1 : 0));

  for (const loc of ordered) {
    const missing = missingByLocale[loc];
    let done = 0;
    let failed = 0;
    for (let i = 0; i < missing.length; i++) {
      const src = missing[i];
      const h = hashAutoTranslateSource(src);
      const ruHint = core.targets.ru?.[h];
      const translated = await translateOne(src, loc, ruHint);
      if (translated) {
        core.targets[loc][h] = translated;
        done += 1;
      } else {
        failed += 1;
        console.warn(`[${loc}] fail: ${src.slice(0, 70)}`);
      }
      if ((i + 1) % 25 === 0 || i + 1 === missing.length) {
        fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
        console.log(`  ${loc}: ${i + 1}/${missing.length} (+${done}, fail ${failed})`);
      }
      await new Promise((r) => setTimeout(r, 90));
    }
    console.log(`${loc}: complete +${done} fail ${failed}`);
  }

  const apkScript = path.join(__dirname, "build-offline-auto-translations-apk.cjs");
  const r = spawnSync(process.execPath, [apkScript], { cwd: mobileRoot, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
