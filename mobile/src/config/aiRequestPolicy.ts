/**
 * Бір жерден: Imam Ai чат сұрауларының timeout және retry әдепкілері.
 * «Ұзақ күту» (Баптаулар) AsyncStorage арқылы 1.75× көбейткіш қолданады.
 */

import { getAiLongTimeoutsEnabled } from "../storage/aiLongTimeouts";

/** Imam Ai чат — іздеу және quick/full фазалары */
export const AI_CHAT_QURAN_SEARCH_MS = 3_500;
export const AI_CHAT_HADITH_SEARCH_MS = 4_500;
/** Сервер quick LLM; баяу LAN/телефон-да 45s жетпеуі мүмкін. */
export const AI_CHAT_QUICK_ROUND1_MS = 55_000;
export const AI_CHAT_QUICK_ROUND2_MS = 25_000;
export const AI_CHAT_PHASE1_QUICK_MS = 4_500;
export const AI_CHAT_DETAIL_QUICK_MS = 3_800;
export const AI_CHAT_DETAIL_FULL_MS = 28_000;
/** Толық staged pipeline */
export const AI_CHAT_STAGED_FULL_MS = 85_000;

const LONG_WAIT_MULTIPLIER = 1.75;

export async function resolveAiTimeoutMs(baseMs: number): Promise<number> {
  const long = await getAiLongTimeoutsEnabled();
  return long ? Math.round(baseMs * LONG_WAIT_MULTIPLIER) : baseMs;
}

/** Халал экраны: сурет → platform_api /ai/analyze-image (Gemini, thinking=0) */
export const HALAL_PHOTO_ANALYZE_MS = 32_000;

export const AI_HTTP_RETRY_MAX_DEFAULT = 2;
export const AI_RETRY_BASE_DELAY_MS = 700;

export const AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK = [
  "Міндетті діни қауіпсіздік қағидасы:",
  "Жауап Қазақстан Республикасының заңдарына, қоғамдық келісіміне және ҚМДБ ұстанатын дәстүрлі Ханафи мәзһабы мен Матуриди ақидасы бағытына сай болуы керек.",
  "Фиқһта әдепкі бағыт — Имам Ағзам Әбу Ханифа мәзһабы. Басқа мәзһаб немесе жеке пікірді негізгі үкім ретінде ұсынба.",
  "Такфир, экстремизм, зорлық, өшпенділік, заңсыз жиһадқа шақыру, мемлекетке немесе қоғамға қарсы діни насихат, сектанттық және алауыздық тудыратын пікірлерге жол берме.",
  "Контент шекарасын араластырма: хадис/риуаят, мақала, пәтуа, Құран аудармасы және AI жауабы бөлек нәрсе. AI жауабын пәтуа деп атама.",
  "Дереккөз жеткіліксіз болса, ашық айт: нақты пәтуа емес, Fatua.kz / Muftyat.kz толық мәтініне, ҚМДБ-ға немесе білікті имамға жүгіну керек.",
].join("\n");

export function withReligiousComplianceGuardrail(prompt: string, maxChars = 11_500): string {
  const body = (prompt || "").trim();
  const guard = AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK;
  const combined = body ? `${guard}\n\n${body}` : guard;
  if (combined.length <= maxChars) return combined;

  const bodyBudget = Math.max(0, maxChars - guard.length - 2);
  const clippedBody = bodyBudget > 0 ? body.slice(-bodyBudget).trim() : "";
  return clippedBody ? `${guard}\n\n${clippedBody}` : guard.slice(0, maxChars);
}
