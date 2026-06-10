/** Қажылық бет мәтіні → KK сол / оқылуы (араб транскрипция) оң */

const ARAB_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const KK_CHAR = /[а-яёәіңғүұқөһ]/gi;
const LATIN_TRANS = /[a-z]/i;

const ROTATION_TITLE =
  /^(Бірінші|Екінші|Үшінші|Төртінші|Бесінші|Алтыншы|Жетінші)\s+(айналым|сағи)\s*$/i;

export type HajjMuftyatSegment =
  | { kind: "prose"; text: string; align: "kk" | "ar" | "full" }
  | { kind: "dua"; title?: string; oqyly: string; magynasy: string };

function isOqylyLabel(text: string): boolean {
  return /^Оқылуы\s*:?\s*$/i.test(text.trim());
}

function isMagynasyLabel(text: string): boolean {
  return /^Мағынасы\s*:?\s*$/i.test(text.trim());
}

function stripOqylyPrefix(text: string): string {
  return text.replace(/^Оқылуы\s*:\s*/i, "").trim();
}

function stripMagynasyPrefix(text: string): string {
  return text.replace(/^Мағынасы\s*:\s*/i, "").trim();
}

function isArabicHeavy(text: string): boolean {
  const arab = (text.match(ARAB_CHAR) ?? []).length;
  const kk = (text.match(KK_CHAR) ?? []).length;
  return arab >= 3 && arab >= kk;
}

function isTransliteration(text: string): boolean {
  const latin = (text.match(LATIN_TRANS) ?? []).length;
  const kk = (text.match(KK_CHAR) ?? []).length;
  return latin >= 12 && latin > kk * 0.6;
}

function classifyProse(text: string): "kk" | "ar" | "full" {
  if (isArabicHeavy(text)) return "ar";
  if (isTransliteration(text) && !isArabicHeavy(text)) return "ar";
  return "kk";
}

/** sanitizeHajjMuftyatPageText() шығысын UI сегменттеріне бөлу */
export function parseHajjMuftyatDisplaySegments(text: string): HajjMuftyatSegment[] {
  const blocks = text
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: HajjMuftyatSegment[] = [];
  let pendingTitle: string | undefined;
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (ROTATION_TITLE.test(block)) {
      pendingTitle = block;
      i += 1;
      continue;
    }

    if (isOqylyLabel(block) || /^Оқылуы\s*:/i.test(block)) {
      let oqyly = stripOqylyPrefix(block);
      i += 1;
      if (!oqyly && i < blocks.length && !isMagynasyLabel(blocks[i]) && !isOqylyLabel(blocks[i])) {
        oqyly = blocks[i];
        i += 1;
      }
      let magynasy = "";
      if (i < blocks.length && isMagynasyLabel(blocks[i])) {
        i += 1;
        if (i < blocks.length && !isOqylyLabel(blocks[i]) && !isMagynasyLabel(blocks[i])) {
          magynasy = stripMagynasyPrefix(blocks[i]);
          i += 1;
        }
      } else if (i < blocks.length && /^Мағынасы\s*:/i.test(blocks[i])) {
        magynasy = stripMagynasyPrefix(blocks[i]);
        i += 1;
      }
      if (oqyly || magynasy) {
        out.push({ kind: "dua", title: pendingTitle, oqyly, magynasy });
        pendingTitle = undefined;
      }
      continue;
    }

    if (isMagynasyLabel(block)) {
      i += 1;
      if (i < blocks.length) {
        out.push({
          kind: "dua",
          title: pendingTitle,
          oqyly: "",
          magynasy: stripMagynasyPrefix(blocks[i]),
        });
        pendingTitle = undefined;
        i += 1;
      }
      continue;
    }

    out.push({ kind: "prose", text: block, align: classifyProse(block) });
    pendingTitle = undefined;
    i += 1;
  }

  return out;
}
