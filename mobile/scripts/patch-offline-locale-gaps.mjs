#!/usr/bin/env node
/**
 * Adds missing Kazakh UI strings (from locale leak scan) into
 * offline-auto-translations-core.json for all core locales.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleFile = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const leaksFile = path.join(mobileRoot, "tmp-locale-leaks.json");
const leaksFileLegacy = path.join(mobileRoot, "tmp-ru-locale-leaks.json");
const targets = (process.env.RAQAT_I18N_TARGETS || "ru,en,ky,uz,tr,ar")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const dryRun = process.argv.includes("--dry-run");

function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function translateText(text, target) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=kk&tl=${target}` +
    `&dt=t&q=${encodeURIComponent(text)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
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

function translationLooksKazakh(text, target) {
  if (target === "ky") return false;
  return KK_SPECIFIC.test(text);
}

async function main() {
  let leaksRaw;
  try {
    leaksRaw = await fs.readFile(leaksFile, "utf8");
  } catch {
    leaksRaw = await fs.readFile(leaksFileLegacy, "utf8");
  }
  const leaks = JSON.parse(leaksRaw);
  const sources = [...new Set(leaks.map((l) => normalizeText(l.value)).filter(Boolean))];
  const bundle = JSON.parse(await fs.readFile(bundleFile, "utf8"));
  bundle.targets ??= {};

  console.log(`patch-offline-locale-gaps: ${sources.length} unique leak strings`);
  for (const target of targets) {
    bundle.targets[target] ??= {};
    const missing = sources.filter((s) => !bundle.targets[target][hashString(s)]);
    console.log(`  ${target}: ${missing.length} missing`);
    if (dryRun) continue;

    let done = 0;
    for (const source of missing) {
      let translated = await translateText(source, target);
      if (translated && translationLooksKazakh(translated, target)) {
        translated = await translateText(source, target);
      }
      if (translated && !translationLooksKazakh(translated, target)) {
        bundle.targets[target][hashString(source)] = translated;
        done += 1;
      }
      if (done % 25 === 0 && done > 0) {
        await fs.writeFile(bundleFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        console.log(`    ${target}: saved ${done}/${missing.length}`);
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    await fs.writeFile(bundleFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    console.log(`  ${target}: complete (+${done})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
