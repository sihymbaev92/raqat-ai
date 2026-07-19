#!/usr/bin/env node
/**
 * Builds an offline machine-translation dictionary for Kazakh prose used by the app.
 *
 * The app still treats Kazakh as the source of truth, but this bundle prevents
 * non-Kazakh users from falling back to Kazakh when the first launch is offline.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(mobileRoot, "assets", "bundled", "offline-auto-translations-core.json");
const defaultTargets = ["ru", "en", "ky", "uz", "tr", "ar"];
const targets = (process.env.RAQAT_I18N_TARGETS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (!targets.length) targets.push(...defaultTargets);
const maxChunkChars = 1600;
const maxBatchChars = 4200;
const includeAll = process.argv.includes("--all");
const defaultMaxSourceChars = Number(process.env.RAQAT_I18N_MAX_CHARS || 180);
const maxSources = Number(process.env.RAQAT_I18N_MAX_SOURCES || (includeAll ? 0 : 800));

const scanRoots = [
  path.join(mobileRoot, "src"),
  path.join(mobileRoot, "assets", "bundled"),
];

const priorityPathHints = [
  "src/i18n/kk.ts",
  "src/i18n/runtime.ts",
  "src/screens/AsmaAlHusnaScreen.tsx",
  "src/screens/ContentGuideScreens.tsx",
  "src/screens/ContentHubScreen.tsx",
  "src/screens/DashboardScreen.tsx",
  "src/screens/DuasScreen.tsx",
  "src/screens/HadithDetailScreen.tsx",
  "src/screens/HadithHubScreen.tsx",
  "src/screens/HajjScreen.tsx",
  "src/screens/KazakhTradition",
  "src/screens/KurbanAitScreen.tsx",
  "src/screens/Namaz",
  "src/screens/PrayerTimesScreen.tsx",
  "src/screens/Quran",
  "src/screens/SeerahScreen.tsx",
  "src/screens/SettingsScreen.tsx",
  "src/components/Hajj",
  "src/components/Kurban",
  "src/components/Namaz",
  "src/components/Tajweed",
  "src/components/dashboard",
  "src/components/quran",
  "src/components/settings",
  "src/components/tradition",
  "src/content/asma",
  "src/content/dhikr",
  "src/content/duas",
  "src/content/hajj",
  "src/content/namaz",
  "src/content/tajweed",
  "src/content/talbiyah",
  "src/content/tradition",
];

const skipPathParts = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}android${path.sep}`,
  `${path.sep}ios${path.sep}`,
  `${path.sep}assets${path.sep}bundled${path.sep}hadith-from-db.json`,
  `${path.sep}assets${path.sep}bundled${path.sep}quran-kk-from-db.json`,
  `${path.sep}assets${path.sep}bundled${path.sep}quran-translations-offline.json`,
  `${path.sep}assets${path.sep}bundled${path.sep}offline-auto-translations.json`,
  `${path.sep}assets${path.sep}bundled${path.sep}offline-auto-translations-core.json`,
];

function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function hasKazakhCyrillic(text) {
  return /[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/u.test(text);
}

function isLikelyUserFacingKazakhText(text) {
  if (!hasKazakhCyrillic(text)) return false;
  if (
    /https?:\/\//i.test(text) ||
    /[a-z][a-z0-9+.-]*:\/\//i.test(text) ||
    /\\[pPsSwWdD]\{?/.test(text) ||
    /<[^>]+>|class=|src=|typeof |const |return |=>|\?\.|\?\?|\(\?<?[!=]/.test(text)
  ) {
    return false;
  }
  const cyrillicLetters = text.match(/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/gu)?.length ?? 0;
  const visibleChars = text.replace(/\s+/g, "").length;
  return cyrillicLetters >= 2 && cyrillicLetters / Math.max(visibleChars, 1) >= 0.12;
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toRel(file) {
  return path.relative(mobileRoot, file).replace(/\\/g, "/");
}

function isPriorityFile(file) {
  const rel = toRel(file);
  return priorityPathHints.some((hint) => rel.startsWith(hint) || rel.includes(hint));
}

function collectJsonStrings(value, out) {
  if (typeof value === "string") {
    const text = normalizeText(value);
    if (text.length >= 2 && isLikelyUserFacingKazakhText(text)) out.add(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonStrings(item, out);
  }
}

function collectTsStrings(raw, out) {
  const patterns = [
    /"([^"\\]*(?:\\.[^"\\]*)*)"/gs,
    /'([^'\\]*(?:\\.[^'\\]*)*)'/gs,
    /`([^`\\]*(?:\\.[^`\\]*)*)`/gs,
  ];
  for (const re of patterns) {
    for (const match of raw.matchAll(re)) {
      const text = normalizeText(match[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\'/g, "'"));
      if (text.length >= 2 && isLikelyUserFacingKazakhText(text) && !text.includes("${")) out.add(text);
    }
  }
}

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (skipPathParts.some((part) => full.includes(part))) continue;
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (/\.(ts|tsx|json)$/i.test(entry.name)) {
      if (includeAll || isPriorityFile(full)) files.push(full);
    }
  }
  return files;
}

async function collectSources() {
  const out = new Set();
  for (const root of scanRoots) {
    const files = await walk(root);
    for (const file of files) {
      const raw = await fs.readFile(file, "utf8");
      if (file.endsWith(".json")) {
        try {
          collectJsonStrings(JSON.parse(raw), out);
        } catch {
          /* ignore malformed generated files */
        }
      } else {
        collectTsStrings(raw, out);
      }
    }
  }
  const sources = [...out]
    .filter((text) => includeAll || text.length <= defaultMaxSourceChars)
    .sort((a, b) => a.length - b.length || a.localeCompare(b, "kk"));
  return maxSources > 0 ? sources.slice(0, maxSources) : sources;
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

function splitLongText(text) {
  if (text.length <= maxChunkChars) return [text];
  const parts = [];
  let buf = "";
  for (const sentence of text.split(/(?<=[.!?…])\s+/u)) {
    const next = buf ? `${buf} ${sentence}` : sentence;
    if (next.length > maxChunkChars && buf) {
      parts.push(buf);
      buf = sentence;
    } else {
      buf = next;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

async function translateWithChunks(text, target) {
  const chunks = splitLongText(text);
  const out = [];
  for (const chunk of chunks) {
    const translated = await translateText(chunk, target);
    if (!translated) return null;
    out.push(translated);
  }
  return out.join(" ");
}

function buildBatch(items) {
  return items.map((text, i) => `<<<RAQAT_${i}>>>\n${text}`).join("\n");
}

function parseBatchTranslation(translated, count) {
  const markerRe = /<<<RAQAT_(\d+)>>>/g;
  const markers = [...translated.matchAll(markerRe)];
  if (markers.length < count) return null;

  const out = new Array(count).fill(null);
  for (let i = 0; i < markers.length; i += 1) {
    const idx = Number(markers[i][1]);
    if (!Number.isInteger(idx) || idx < 0 || idx >= count) continue;
    const start = (markers[i].index ?? 0) + markers[i][0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index ?? translated.length : translated.length;
    const value = normalizeText(translated.slice(start, end));
    if (value) out[idx] = value;
  }
  return out;
}

async function translateBatch(items, target) {
  if (!items.length) return [];
  if (items.length === 1) return [await translateWithChunks(items[0], target)];
  const translated = await translateText(buildBatch(items), target);
  const parsed = translated ? parseBatchTranslation(translated, items.length) : null;
  if (parsed) return parsed;

  const fallback = [];
  for (const item of items) fallback.push(await translateWithChunks(item, target));
  return fallback;
}

function takeBatch(items, start) {
  const batch = [];
  let size = 0;
  for (let i = start; i < items.length; i += 1) {
    const item = items[i];
    if (item.length > maxChunkChars) {
      if (!batch.length) batch.push(item);
      break;
    }
    const nextSize = size + item.length + 20;
    if (batch.length && nextSize > maxBatchChars) break;
    batch.push(item);
    size = nextSize;
  }
  return batch;
}

async function readExistingBundle() {
  try {
    return JSON.parse(await fs.readFile(outFile, "utf8"));
  } catch {
    return { version: 1, sourceLocale: "kk", targets: {} };
  }
}

async function main() {
  const sources = await collectSources();
  const bundle = await readExistingBundle();
  bundle.version = 1;
  bundle.sourceLocale = "kk";
  bundle.generatedAt = new Date().toISOString();
  bundle.targets ??= {};
  for (const target of targets) bundle.targets[target] ??= {};

  console.log(
    `offline-auto-translations: ${sources.length} Kazakh source strings (${includeAll ? "all" : "core"} mode)`
  );
  for (const target of targets) {
    const missing = sources.filter((source) => !bundle.targets[target][hashString(source)]);
    let done = 0;
    for (let i = 0; i < missing.length; ) {
      const batch = takeBatch(missing, i);
      const translated = await translateBatch(batch, target);
      batch.forEach((source, idx) => {
        const value = translated[idx];
        if (value) bundle.targets[target][hashString(source)] = value;
      });
      i += batch.length;
      done += batch.length;
      if (done % 250 < batch.length) {
        await fs.writeFile(outFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        console.log(`offline-auto-translations: ${target} +${done}/${missing.length}`);
      }
    }
    await fs.writeFile(outFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    console.log(`offline-auto-translations: ${target} complete`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
