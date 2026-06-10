/**
 * Аят нөмірі көрсету нұсқалары (қажет болса импорттап таңдаңыз).
 * Бұрынғы Unicode оюлы жақшалар (U+FD3E/U+FD3F) кей құрылғыларда дұрыс көрінбеуі мүмкін —
 * негізгі UI енді медальон-пилл (MushafContinuousArabicBlock) қолданады.
 */
export const ORNATE_AYAH_PAREN_OPEN = "\uFD3E";
export const ORNATE_AYAH_PAREN_CLOSE = "\uFD3F";

/** Оюлы жақша (RTL көрінісіне қарай қажет болса `wrapOrnateAyahNumberFlipped` қолданыңыз). */
export function wrapOrnateAyahNumber(easternDigits: string): string {
  return `${ORNATE_AYAH_PAREN_OPEN}${easternDigits}${ORNATE_AYAH_PAREN_CLOSE}`;
}

export function wrapOrnateAyahNumberFlipped(easternDigits: string): string {
  return `${ORNATE_AYAH_PAREN_CLOSE}${easternDigits}${ORNATE_AYAH_PAREN_OPEN}`;
}
