/**
 * muftyat.kz «Қажылық» PDF-інде араб дұғалары арнайы шрифтпен — PyMuPDF
 * мәтінді ÊǶȈËƷ… сияқты «қоқыс» символдарға айналдырады. Оқылуы/мағынасы (KK)
 * дұрыс, араб жолы — жоқ. Сол қоқыс жолдарын UI-дан алып тастаймыз.
 */

import { normalizeMuftyatKkPageText } from "./muftyatKkTextNormalize";

const GARBAGE_CHAR =
  /[\u0100-\u024F\u0300-\u036F\u0250-\u02AF]/g;
const ARAB_CHAR = /[\u0600-\u06FF]/g;
const KK_CHAR = /[а-яёәіңғүұқөһ]/gi;

const KEEP_LINE =
  /^(Оқылуы|Мағынасы|Қажылық|مناسك الحج|Ескерту|Меккеге кірген|Пайғамбар)/i;

function mergePdfHyphenBreaks(text: string): string {
  return text
    .replace(/([а-яёәіңғүұқөһ])-\n([а-яёәіңғүұқөһ])/giu, "$1$2")
    .replace(/(\d)-\n([а-яёәіңғүұқөһ])/giu, "$1$2")
    .replace(/(\d)-\n(\d)/g, "$1-$2");
}

/** Жеке жолда қалуы керек тақырық/блок атаулары */
const STRUCTURAL_LINE =
  /^(Оқылуы|Мағынасы|مناسك الحج|Қажылық|Ескерту)(\s|:|$)|^(Бірінші|Екінші|Үшінші|Төртінші|Бесінші|Алтыншы|Жетінші)\s+(айналым|сағи)\s*$/i;

function mergeSoftLineBreaks(lines: string[]): string[] {
  const out: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf.trim()) out.push(buf.trim());
    buf = "";
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (STRUCTURAL_LINE.test(line)) {
      flush();
      out.push(line);
      continue;
    }
    if (buf.endsWith("-")) {
      buf = `${buf.slice(0, -1)}${line}`;
      continue;
    }
    if (!buf) {
      buf = line;
      continue;
    }
    const prevEnds = /[.!?:»"…)]$/.test(buf);
    const nextStartsUpper = /^[A-ZА-ЯӘІҢҒҮҰҚӨҺО"«(]/.test(line);
    if (prevEnds || (nextStartsUpper && line.length > 3)) {
      flush();
      buf = line;
    } else {
      buf = `${buf} ${line}`;
    }
  }
  flush();
  return out;
}

export function isHajjMuftyatGarbageLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (KEEP_LINE.test(t)) return false;
  if (/^\(\s*Ескерту:/.test(t)) return false;

  const garbage = (t.match(GARBAGE_CHAR) ?? []).length;
  const arab = (t.match(ARAB_CHAR) ?? []).length;
  const kk = (t.match(KK_CHAR) ?? []).length;

  if (arab >= 8 && garbage < 3) return false;
  if (kk >= 10) return false;
  if (garbage >= 4) return true;
  if (garbage >= 2 && kk < 6 && arab < 6) return true;
  return false;
}

export function sanitizeHajjMuftyatPageText(raw: string): string {
  const normalized = mergePdfHyphenBreaks(raw.replace(/\r\n/g, "\n"));
  const lines = normalized.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (isHajjMuftyatGarbageLine(line)) continue;
    kept.push(line.trimEnd());
  }
  return normalizeMuftyatKkPageText(
    mergeSoftLineBreaks(kept)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export function hajjMuftyatTextGarbageRatio(raw: string): number {
  const t = raw.trim();
  if (!t) return 0;
  return (t.match(GARBAGE_CHAR) ?? []).length / t.length;
}

/** Көрсетуге жарай ма: KK/тranslit бар, қоқыс аз. */
export function isHajjMuftyatTextDisplayable(raw: string, readableFlag: boolean): boolean {
  if (!readableFlag || !raw.trim()) return false;
  const cleaned = sanitizeHajjMuftyatPageText(raw);
  if (cleaned.length < 60) return false;
  const kk = (cleaned.match(KK_CHAR) ?? []).length;
  if (kk < 40) return false;
  if (hajjMuftyatTextGarbageRatio(cleaned) > 0.04) return false;
  return true;
}
