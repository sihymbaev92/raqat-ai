const UNAVAILABLE_PATTERNS = [
  /this text will be translated soon/i,
  /the text will be translated soon/i,
  /текст скоро будет переведен/i,
  /бул текст жакында которулат/i,
  /bu matn tez orada tarjima qilinadi/i,
  /bu metin yakında çevrilecek/i,
  /ستتم ترجمة هذا النص قريبًا/i,
];

const CODE_FRAGMENT_PATTERNS = [
  /\b(?:screenTitle|offlineSectionTitle|sahihTab|kmdmbTab|sourcesTitle|languageSection|sectionAppearance|knowledgePortal|cardTitle|accountSection|settings)\s*:/i,
  /\b(?:ИсточникиНазвание|LanguageSection|KnowledgePortal|Chevrimdışı)\b/i,
  /[{}]\s*,/,
  /=>/,
  /\b(?:import|export|const|function)\s+[A-Za-z0-9_]+/i,
  /\b(?:undefined|NaN|\[object Object\])\b/i,
];

export function isUsableOfflineAutoTranslation(value: string): boolean {
  const out = (value ?? "").trim();
  if (!out) return false;
  if (UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(out))) return false;
  if (CODE_FRAGMENT_PATTERNS.some((pattern) => pattern.test(out))) return false;
  return true;
}
