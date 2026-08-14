#!/usr/bin/env node
/** dhikr-list.json: араб мәтіні бойынша дубликаттарды жою, id 1..N қайта нөмірлеу. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const JSON_PATH = path.join(ROOT, "assets/bundled/dhikr-list.json");
const MIGRATION_PATH = path.join(ROOT, "src/content/dhikrIdMigration.ts");
const CHAPTERS_PATH = path.join(ROOT, "src/content/dhikrChapters.ts");

function normAr(text) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const sorted = [...data.items].sort((a, b) => a.id - b.id);

const seen = new Map();
const kept = [];
const oldToNew = {};

for (const item of sorted) {
  const key = normAr(item.textAr);
  if (seen.has(key)) {
    oldToNew[item.id] = seen.get(key);
    continue;
  }
  const newId = kept.length + 1;
  seen.set(key, newId);
  oldToNew[item.id] = newId;
  kept.push({
    ...item,
    id: newId,
  });
}

/** Бұрынғы тарау id-ларын жаңа id-ға аудару (жоқ болса — өткізу). */
function mapIds(oldIds) {
  const out = [];
  for (const oldId of oldIds) {
    const mapped = oldToNew[oldId];
    if (mapped != null && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

const r = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const chapterDefs = [
  {
    titleKk: "1. Намаздан кейінгі тәспих",
    ids: mapIds([1]),
  },
  {
    titleKk: "2. Тәсбих пен мадақ",
    subtitleKk: "Жиі айтылатын тәсбих сөздері және қысқа зікірлер.",
    ids: mapIds(r(2, 15)),
  },
  {
    titleKk: "3. Тәухид, қанағаттану және сәләуәт",
    subtitleKk: "Келісім, Пайғамбарға сәләу, рүкуғ/сәжде тәсбихі.",
    ids: mapIds(r(16, 30)),
  },
  {
    titleKk: "4. Қысқа дұғалар мен еске салулар",
    subtitleKk: "«Йа Муғис», «Бисмиллаһ» сияқты дұғалар.",
    ids: mapIds(r(31, 45)),
  },
  {
    titleKk: "5. Сәләуәт, құран сүре бастаулары",
    subtitleKk: "Ибраһимия бастауы, Фалақ/Нас бастауы, ұзақ дұғаның басы.",
    ids: mapIds(r(46, 60)),
  },
  {
    titleKk: "6. Жеке тәсбих сөздері және нұсқалар",
    subtitleKk: "СубханаЛлаһ, Әлхамдулиллаһ, Аллаһу акбар жеке қайталау.",
    ids: mapIds(r(61, 75)),
  },
  {
    titleKk: "7. Тәухид толығы және ұзақ дұға үзінділері",
    subtitleKk: "Ұзақ тәухид формулалары және аят үзінділері.",
    ids: mapIds([...r(76, 86), ...r(88, 90)]),
  },
  {
    titleKk: "8. Түйінді зікірлер",
    subtitleKk: "Сәләуәт қысқалары, Раббана дұғалары және мәзірдің соңғы нұсқалары.",
    ids: mapIds(r(91, 99)),
  },
  {
    titleKk: "9. Кешірім мен жеңілдік",
    subtitleKk: "«Рабби, кешір», «Рабби, жеңілдет» — қысқа дұғалар.",
    ids: mapIds([108, 109]),
  },
  {
    titleKk: "10. Жүрек, тәубе және тәлімдік зікірлер",
    subtitleKk: "Хидаят, ризық, амандық және Құран үзінділеріне негізделген жолдар.",
    ids: mapIds(r(201, 219)),
  },
];

const chaptersTs = `/**
 * Зікірлер тізімін тарауларға бөлу (${kept.length} нұсқа).
 * Әр тараудағы рет нөмірлері dhikr-list.json id-ларына сәйкес.
 */

export type DhikrChapterMeta = {
  /** Тарау тақырыбы */
  titleKk: string;
  /** Қысқа сипат (аккордеон астында) */
  subtitleKk?: string;
  ids: number[];
};

/** Барлық id 1..${kept.length} дәл бір рет қамтылады. */
export const DHIKR_CHAPTERS: DhikrChapterMeta[] = ${JSON.stringify(chapterDefs, null, 2)
  .replace(/"titleKk":/g, "titleKk:")
  .replace(/"subtitleKk":/g, "subtitleKk:")
  .replace(/"ids":/g, "ids:")};
`;

const migrationTs = `/** dhikr-list.json id қайта нөмірлеу (220 → ${kept.length}) — санау миграциясы. */
export const DHIKR_ID_MIGRATION_VERSION = 5 as const;

/** Еski id → жаңа id (дубликаттар алғашқы нұсқаға біріктіріледі). */
export const DHIKR_OLD_TO_NEW_ID: Record<number, number> = ${JSON.stringify(oldToNew, null, 2)};

export function migrateDhikrId(oldId: number): number {
  return DHIKR_OLD_TO_NEW_ID[oldId] ?? oldId;
}

export function migrateDhikrCountsMap(raw: Record<number, number>): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const oldId = parseInt(key, 10);
    if (!Number.isFinite(oldId) || value == null) continue;
    const count = Math.max(0, Math.floor(Number(value)));
    if (count <= 0) continue;
    const newId = migrateDhikrId(oldId);
    out[newId] = (out[newId] ?? 0) + count;
  }
  return out;
}
`;

data.version = 5;
data.items = kept;

fs.writeFileSync(JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(CHAPTERS_PATH, chaptersTs, "utf8");
fs.writeFileSync(MIGRATION_PATH, migrationTs, "utf8");

console.log(`dedupe: ${sorted.length} → ${kept.length} items, version ${data.version}`);
console.log(`chapters: ${chapterDefs.length}, migration keys: ${Object.keys(oldToNew).length}`);
