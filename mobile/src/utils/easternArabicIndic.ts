const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Аят/бет нөмірлері: батыс сандары → шығыс араб (Ҳинд) сандары (Құран оқу стилі). */
export function toEasternArabicIndic(n: number): string {
  return String(Math.max(0, Math.floor(n)))
    .split("")
    .map((ch) => {
      const d = ch.charCodeAt(0) - 48;
      return d >= 0 && d <= 9 ? EASTERN_ARABIC_DIGITS[d]! : ch;
    })
    .join("");
}
