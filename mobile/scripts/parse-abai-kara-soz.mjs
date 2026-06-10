/**
 * Абай «Қара сөз» (45) — толық мәтінді көз файлдан JSON-ға шығарады.
 * Көз: mobile/scripts/data/abai-kara-soz-source.txt (arda.com.kz сияқты толық жинақ)
 *
 * node mobile/scripts/parse-abai-kara-soz.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "data", "abai-kara-soz-source.txt");
const OUT = path.join(__dirname, "..", "assets", "bundled", "abai-kara-soz-full.json");

/** Кез келген «N-ші/нші СӨЗ» тақырыбын 1..45 нөміріне айналдыру */
const ORDINAL_NUM = {
  БІРІНШІ: 1,
  ЕКІНШІ: 2,
  ҮШІНШІ: 3,
  ТӨРТІНШІ: 4,
  БЕСІНШІ: 5,
  АЛТЫНШЫ: 6,
  ЖЕТІНШІ: 7,
  СЕГІЗІНШІ: 8,
  ТОҒЫЗЫНШЫ: 9,
  ОНЫНШЫ: 10,
  "ОН БІРІНШІ": 11,
  "ОН ЕКІНШІ": 12,
  "ОН ҮШІНШІ": 13,
  "ОН ТӨРТІНШІ": 14,
  "ОН БЕСІНШІ": 15,
  "ОН АЛТЫНШЫ": 16,
  "ОН ЖЕТІНШІ": 17,
  "ОН СЕГІЗІНШІ": 18,
  "ОН ТОҒЫЗЫНШЫ": 19,
  ЖИЫРМАСЫНШЫ: 20,
  "ЖИЫРМА БІРІНШІ": 21,
  "ЖИЫРМА ЕКІНШІ": 22,
  "ЖИЫРМА ҮШІНШІ": 23,
  "ЖИЫРМА ТӨРТІНШІ": 24,
  "ЖИЫРМА БЕСІНШІ": 25,
  "ЖИЫРМА АЛТЫНШЫ": 26,
  "ЖИЫРМА ЖЕТІНШІ": 27,
  "ЖИЫРМА СЕГІЗІНШІ": 28,
  "ЖИЫРМА ТОҒЫЗЫНШЫ": 29,
  ОТЫЗЫНШЫ: 30,
  "ОТЫЗ БІРІНШІ": 31,
  "ОТЫЗ ЕКІНШІ": 32,
  "ОТЫЗ ҮШІНШІ": 33,
  "ОТЫЗ ТӨРТІНШІ": 34,
  "ОТЫЗ БЕСІНШІ": 35,
  "ОТЫЗ АЛТЫНШЫ": 36,
  "ОТЫЗ ЖЕТІНШІ": 37,
  "ОТЫЗ СЕГІЗІНШІ": 38,
  "ОТЫЗ ТОҒЫЗЫНШЫ": 39,
  /** Кей басылымда «ҚЫРЫҚЫНШІ»; Абай мәтінінде «ҚЫРҚЫНШЫ» */
  ҚЫРҚЫНШЫ: 40,
  ҚЫРЫҚЫНШІ: 40,
  "ҚЫРЫҚ БІРІНШІ": 41,
  "ҚЫРЫҚ ЕКІНШІ": 42,
  "ҚЫРЫҚ ҮШІНШІ": 43,
  "ҚЫРЫҚ ТӨРТІНШІ": 44,
  "ҚЫРЫҚ БЕСІНШІ": 45,
};

const HEADER_RE =
  /^((?:ҚЫРЫҚ |ОТЫЗ |ЖИЫРМА |ОН )?(?:БІР|ЕКІ|ҮШ|ТӨРТ|БЕС|АЛТЫ|ЖЕТІ|СЕГІЗ|ТОҒЫЗ|ОН|ЖИЫРМА|ОТЫЗ|ҚЫРЫҚ)[А-ЯӘІҢҒҮҰҚӨҺ]*|ҚЫРҚЫНШЫ|ҚЫРЫҚЫНШІ)\s+СӨЗ(?:\s+\([^)]+\))?\s+(.*)$/u;

function parseSource(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const startIdx = lines.findIndex((l) => /^БІРІНШІ\s+СӨЗ(?:\s|$)/.test(l.trim()));
  if (startIdx < 0) throw new Error("БІРІНШІ СӨЗ табылмады");
  const bodyLines = lines.slice(startIdx);
  const endIdx = bodyLines.findIndex((l, i) => i > 0 && /^Бөлісу\b/.test(l.trim()));
  const slice = endIdx > 0 ? bodyLines.slice(0, endIdx) : bodyLines;

  const chunks = [];
  let current = null;

  for (const line of slice) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) current.paragraphs.push("");
      continue;
    }
    const m = trimmed.match(HEADER_RE);
    if (m) {
      const ordinal = m[1].replace(/\s+/g, " ").trim();
      const num = ORDINAL_NUM[ordinal];
      if (!num) throw new Error(`Белгісіз рет саны: «${ordinal}»`);
      if (current) chunks.push(current);
      current = {
        number: num,
        titleOrdinal: ordinal,
        title: `${num}-ші қара сөз`,
        paragraphs: [m[2].trim()],
        years: [],
      };
      continue;
    }
    if (/^(18|19)\d{2}$/.test(trimmed) && current) {
      current.years.push(trimmed);
      continue;
    }
    if (current) {
      const last = current.paragraphs[current.paragraphs.length - 1];
      if (last === "") current.paragraphs[current.paragraphs.length - 1] = trimmed;
      else if (last) current.paragraphs[current.paragraphs.length - 1] = `${last}\n${trimmed}`;
      else current.paragraphs[current.paragraphs.length - 1] = trimmed;
    }
  }
  if (current) chunks.push(current);

  chunks.sort((a, b) => a.number - b.number);
  const nums = chunks.map((c) => c.number);
  for (let i = 1; i <= 45; i++) {
    if (!nums.includes(i)) throw new Error(`Жетіспейді: ${i}-ші қара сөз`);
  }

  return chunks.map((c) => {
    const text = c.paragraphs
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n");
    const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      number: c.number,
      title: c.title,
      titleOrdinal: c.titleOrdinal,
      years: [...new Set(c.years)],
      excerpt: excerpt.length < text.length ? `${excerpt}…` : excerpt,
      text,
    };
  });
}

if (!fs.existsSync(SRC)) {
  console.error(`Көз файл жоқ: ${SRC}`);
  process.exit(1);
}

const items = parseSource(fs.readFileSync(SRC, "utf8"));
const out = {
  version: 1,
  author: "Абай Құнанбаев",
  work: "Қара сөз",
  count: items.length,
  items,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 0), "utf8");
console.log(`Wrote ${OUT} (${items.length} қара сөз)`);
