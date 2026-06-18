import * as fs from "fs";
import * as path from "path";

/** UI мәтіндерінде жиі кездесетін қате: барлығы орнына барлықы (толық сөз бітпей қалған). */
const FORBIDDEN_UI_PATTERNS: Array<{ re: RegExp; hint: string }> = [
  { re: /\u0431\u0430\u0440\u043b\u044b\u049b\u044b/gi, hint: "use FILTER_ALL_KK / barlygy" },
  { re: /\u0411\u0430\u0440\u043b\u044b\u049b\u044b/g, hint: "use FILTER_ALL_KK / Barlygy" },
  { re: /\u0431\u0430\u0440\u043b\u044b\u049b\u049b\u0430/gi, hint: "use «барлығына»" },
  { re: /\u0442\u043e\u043b\u044b\u049b\u044b/gi, hint: "tolik/tolygy per context" },
  { re: /\u049b\u04af\u0434\u0456\u0440\u0435\u0442/gi, hint: "use «құдірет»" },
  { re: /KMDA/g, hint: "use «ҚМДБ»" },
  { re: /Сұрақ жауап/g, hint: "use «Сұрақ-жауап»" },
  { re: /Ру\s+slug|slug\s*\(мысалы/gi, hint: "use user-facing clan wording, not technical slug" },
  { re: /второй столп/gi, hint: "use Kazakh «екінші тірегі»" },
  { re: /өшіқ|өшікті|Өшіккенде/g, hint: "use «өшірулі» / «Өшірулі кезде»" },
  { re: /Көшірру/g, hint: "use «Көшіру»" },
  { re: /арап мәтіні/g, hint: "use «араб мәтіні»" },
  { re: /үздіксін/g, hint: "use «үздіксіз»" },
  { re: /үстемани/g, hint: "use «усмани» or context-specific spelling" },
  { re: /Маанисы/g, hint: "use Kyrgyz «Мааниси»" },
  { re: /\u0415\u0441\u043a\u0435\u0440\u0442\u043f\u0430/g, hint: "use «Ескертпе»" },
  { re: /\u0442\u0430\u0440maq|t\u04b1\u043b\u0493alar|\u049baz|\u0422\u0435\u043b\u0435\u0444onda|qatar|\u0441ana|uer\u0434\u0435|\u041c\u0430\u0437\u043c\u04b1ndan/gi, hint: "mixed Latin/Cyrillic in Kazakh UI text" },
  {
    re: /[\u041c\u043c]\u0435\u043d\u0437\u0456\u043b\u0434/g,
    hint: 'use «Бөлімдер» instead of «Мензілдір» / «мензілдір»',
  },
  {
    re: /[\u049B\u04B1\u049b\u04b1][\u006E\u0064][\u043B\u044B\u049B\u0442]/,
    hint: "use Cyrillic «нд» not Latin «nd» (e.g. құndылықтар → құndылықтар)",
  },
];

const SKIP_DIR_NAMES = new Set(["node_modules", ".git", "android", "ios"]);
const SKIP_PATH_PARTS = ["assets/bundled", "assets\\bundled"];

function shouldScan(file: string): boolean {
  if (!/\.(ts|tsx|xml)$/.test(file)) return false;
  const norm = file.replace(/\\/g, "/");
  if (SKIP_PATH_PARTS.some((p) => norm.includes(p))) return false;
  if (norm.includes("/__tests__/")) return false;
  return norm.includes("/src/") || norm.endsWith("strings.xml");
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walk(p, acc);
    } else if (shouldScan(p)) {
      acc.push(p);
    }
  }
  return acc;
}

describe("kk UI orthography", () => {
  it("does not use common Kazakh UI suffix typos in app source", () => {
    const mobileRoot = path.resolve(__dirname, "../../..");
    const files = walk(mobileRoot);
    const violations: string[] = [];

    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*") || line.trimStart().startsWith("/**")) {
          continue;
        }
        if (!/["'`]/.test(line)) continue;
        for (const { re, hint } of FORBIDDEN_UI_PATTERNS) {
          re.lastIndex = 0;
          if (re.test(line)) {
            violations.push(`${path.relative(mobileRoot, file)}:${i + 1} — ${hint}\n  ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
