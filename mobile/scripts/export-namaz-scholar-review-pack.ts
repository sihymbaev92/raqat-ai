/**
 * Export namaz guide content for Hanafi scholar review (QMDB / local imam).
 * Output: mobile/docs/operations/namaz-scholar-review-pack.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NAMAZ_CONTENT_REVIEW,
  NAMAZ_WUDU_LEARNING_MODULES,
} from "../src/content/namazLearningContent";
import type { LearningModule, RecitationBlock } from "../src/content/namazLearningContent";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(mobileRoot, "docs", "operations", "namaz-scholar-review-pack.md");

function readTitlesFromTs(rel: string): string[] {
  const raw = fs.readFileSync(path.join(mobileRoot, rel), "utf8");
  return [...raw.matchAll(/title:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"')
  );
}

function fmtRecitations(recitations: RecitationBlock[]) {
  if (!recitations.length) return "_—_\n";
  return recitations
    .map((r) => {
      const lines = [
        `**${r.label}**`,
        `- Арабша: ${r.arabic.replace(/\n/g, " / ")}`,
        `- Транскрипция (KK): ${r.transliterationKk}`,
        r.transliterationEn ? `- Transliteration (EN): ${r.transliterationEn}` : null,
        `- Мағына: ${r.meaningKk}`,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
}

function fmtLearningModule(mod: LearningModule) {
  let out = `**${mod.title}**\n\n${mod.intro}\n`;
  for (const step of mod.steps) {
    out += `\n### ${step.title} (\`${step.id}\`)\n`;
    out += `- **Әрекет:** ${step.action}\n`;
    out += `- **Қимыл:** ${step.bodyPositionHint}\n`;
    if (step.genderNoteHanafi) out += `- **Ер/әйел (ханафи):** ${step.genderNoteHanafi}\n`;
    out += `\n**Оқылатын мәтін:**\n\n${fmtRecitations(step.recitations)}`;
    out += `\n**Жиі қателер:**\n${step.commonMistakes.map((x) => `- ${x}`).join("\n")}\n`;
    out += `\n**Тексеру:**\n${step.checkpoint.map((x) => `- ${x}`).join("\n")}\n`;
  }
  return out;
}

function section(title: string, body: string) {
  return `\n## ${title}\n\n${body.trim()}\n`;
}

const md = `# Намаз оқулығы — сарапшы review пакеті

> **Мақсат:** Ханафи фиқһы бойынша намаз/дәрет оқу материалын мақұлдау (пәтуа емес, оқу нұсқаулығы).
> **Қолданба:** RAHAT OMIR (тәуелсіз, ҚМДБ ресми қолданбасы емес).
> **Күні:** ${new Date().toISOString().slice(0, 10)}

## Review checklist (сарапшы толтырады)

${NAMAZ_CONTENT_REVIEW.checklist.map((c, i) => `${i + 1}. [ ] ${c}`).join("\n")}

**Сарапшы аты-тегі:** ___________________________

**Күні:** ___________________________

**Қолы / мөр (скан):** ___________________________

---

## Саясат

- Мәзһаб: **Ханафи**
- Ақида: **Матуриди** (UI copy)
- Бұл материал **жеке фиқһ үкімі емес** — оқу нұсқаулығы.
- Қате табылса, нақты пунктті және дұрыс нұсқаны жазыңыз.

${NAMAZ_WUDU_LEARNING_MODULES.map((mod) =>
  section(mod.id === "wudu" ? "Дәрет (learning module)" : "Намаз (learning module)", fmtLearningModule(mod))
).join("")}${section(
  "Дәрет визуал қадамдары (сурет)",
  readTitlesFromTs("src/content/namazWuduSteps.ts")
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n")
)}${section(
  "Намаз pose cards (сурет)",
  readTitlesFromTs("src/content/namazPrayerGuideContent.ts")
    .slice(0, 24)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n")
)}${section(
  "Sign-off қолдану (инженер)",
  `\`\`\`bash
cd mobile
RAQAT_NAMAZ_REVIEWER_NAME="Аты Тегі, лауазым" \\
RAQAT_NAMAZ_REVIEWED_AT="2026-08-15" \\
npm run namaz:scholar-signoff
\`\`\`
`
)}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");
console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
