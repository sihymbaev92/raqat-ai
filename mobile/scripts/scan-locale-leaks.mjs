#!/usr/bin/env node
/**
 * Scans kk tree after applying offline + manual patches for a target locale.
 * Reports UI strings that still contain Kazakh-specific letters.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;
const ALLOW_SUBSTR = [
  "Halal Damu",
  "halaldamu",
  "RAHAT OMIR",
  "Muftyat",
  "Fatua",
  "2GIS",
  "Telegram",
  "Gmail",
  "Apple",
  "Android",
  "API",
  "PDF",
  "GPS",
  "QA",
  "E‑код",
  "E-код",
  "штрихкод",
  "WhatsApp",
  "YouTube",
  "QMDB",
  "ҚМДБ",
  "KMDMB",
  "native azan",
  "Native azan",
  "kk-KZ",
  "http",
  "www.",
  ".kz",
  ".com",
];

function hashAutoTranslateSource(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function isPlainObject(v) {
  return typeof v === "object" && v != null && !Array.isArray(v);
}

function deepClone(obj) {
  if (typeof obj === "function") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  if (!isPlainObject(obj)) return obj;
  const o = {};
  for (const [k, v] of Object.entries(obj)) o[k] = deepClone(v);
  return o;
}

function applyIntoTarget(target, src) {
  for (const [k, v] of Object.entries(src)) {
    const curr = target[k];
    if (isPlainObject(v) && isPlainObject(curr)) {
      applyIntoTarget(curr, v);
      continue;
    }
    target[k] = v;
  }
}

function buildOfflineTree(obj, ruMap) {
  if (typeof obj === "string") {
    const translated = ruMap[hashAutoTranslateSource(obj.trim())];
    return translated?.trim() ? translated : obj;
  }
  if (typeof obj === "function") return obj;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => buildOfflineTree(item, ruMap));
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = buildOfflineTree(value, ruMap);
  }
  return out;
}

function collectStrings(obj, prefix, out) {
  if (typeof obj === "string") {
    out.push({ path: prefix, value: obj });
    return;
  }
  if (typeof obj === "function" || obj == null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectStrings(item, `${prefix}[${i}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    collectStrings(v, prefix ? `${prefix}.${k}` : k, out);
  }
}

function isAllowedLeak(value) {
  if (!KK_SPECIFIC.test(value)) return true;
  return ALLOW_SUBSTR.some((s) => value.includes(s));
}

async function main() {
  const target = process.argv[2] || "ru";
  const bundlePath = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const ruMap = bundle.targets?.[target] ?? {};
  if (!Object.keys(ruMap).length) {
    console.error(`No offline map for ${target}`);
    process.exit(1);
  }

  // Dynamic import compiled kk - use ts via register or read from dist
  // Jest compiles ts; for script, import runtime + kk after registering ts-node
  const { register } = await import("tsx/esm/api").catch(() => ({ register: null }));
  if (register) register();

  const kkMod = await import(pathToFileURL(path.join(mobileRoot, "src/i18n/kk.ts")).href);
  const patchesMod = await import(pathToFileURL(path.join(mobileRoot, "src/i18n/runtime.ts")).href).catch(() => null);

  const kk = kkMod.kk;
  const baseline = deepClone(kk);
  applyIntoTarget(kk, baseline);
  applyIntoTarget(kk, buildOfflineTree(baseline, ruMap));

  // Manual patches from runtime - re-import won't expose LOCALE_PATCHES; apply known ru features subset
  // For accurate scan, run via jest test instead. Here we only apply offline layer.

  const strings = [];
  collectStrings(kk, "", strings);
  const leaks = strings.filter(({ value }) => !isAllowedLeak(value));

  console.log(`Locale: ${target} (offline-only scan)`);
  console.log(`Total strings: ${strings.length}`);
  console.log(`Kazakh leaks: ${leaks.length}`);
  leaks.slice(0, 80).forEach(({ path: p, value }) => {
    console.log(`  ${p}: ${value.slice(0, 100)}${value.length > 100 ? "…" : ""}`);
  });
  if (leaks.length > 80) console.log(`  … and ${leaks.length - 80} more`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
