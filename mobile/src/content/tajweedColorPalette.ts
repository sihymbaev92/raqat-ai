/**
 * Al Quran Cloud `quran-tajweed` ресми палитрасы.
 * @see https://alquran.cloud/tajweed-guide
 *
 * light = ресми hex; dark = қара фонда оқылатын ашықтау нұсқа.
 */
export const TAJWEED_ALQURAN_BY_RULE = {
  h: { light: "#AAAAAA", dark: "#CFCFCF" },
  s: { light: "#AAAAAA", dark: "#CFCFCF" },
  l: { light: "#AAAAAA", dark: "#CFCFCF" },
  n: { light: "#537FFF", dark: "#8FB3FF" },
  p: { light: "#4050FF", dark: "#7B85FF" },
  m: { light: "#000EBC", dark: "#5C6CFF" },
  o: { light: "#2144C1", dark: "#6B82E8" },
  q: { light: "#DD0008", dark: "#FF5252" },
  g: { light: "#FF7E1E", dark: "#FFAB40" },
  f: { light: "#9400A8", dark: "#CE93D8" },
  c: { light: "#D500B7", dark: "#EA80FC" },
  i: { light: "#26BFFD", dark: "#80D8FF" },
  w: { light: "#58B800", dark: "#9CCC65" },
  a: { light: "#169777", dark: "#4DB6AC" },
  u: { light: "#169200", dark: "#66BB6A" },
  d: { light: "#A1A1A1", dark: "#C0C0C0" },
  b: { light: "#A1A1A1", dark: "#C0C0C0" },
} as const;

export type TajweedAlquranRuleKey = keyof typeof TAJWEED_ALQURAN_BY_RULE;

/** Легенда/HTML fallback үшін топтық өкіл түстер (ресми палитрадан). */
export const TAJWEED_STD = {
  madd: { light: "#537FFF", dark: "#8FB3FF" },
  ghunnahIkhfa: { light: "#FF7E1E", dark: "#FFAB40" },
  qalqalah: { light: "#DD0008", dark: "#FF5252" },
  idgham: { light: "#169777", dark: "#4DB6AC" },
  neutral: { light: "#AAAAAA", dark: "#CFCFCF" },
} as const;

export type TajweedStdColorKey = keyof typeof TAJWEED_STD;

export function tajweedStdColor(key: TajweedStdColorKey, isDark: boolean): string {
  return isDark ? TAJWEED_STD[key].dark : TAJWEED_STD[key].light;
}

/** Ресми hex → light/dark (HTML `<font color>` үшін). */
const OFFICIAL_HEX_PAIR = new Map<string, { light: string; dark: string }>();
for (const pair of Object.values(TAJWEED_ALQURAN_BY_RULE)) {
  OFFICIAL_HEX_PAIR.set(pair.light.replace(/^#/, "").toLowerCase(), pair);
}

export function tajweedOfficialColorFromHex(
  hex: string | undefined,
  isDark: boolean
): string | null {
  if (!hex) return null;
  const key = hex.replace(/^#/, "").toLowerCase();
  const pair = OFFICIAL_HEX_PAIR.get(key);
  if (!pair) return null;
  return isDark ? pair.dark : pair.light;
}

/** Қысқа шпаргалка — Al Quran Cloud негізгі түстер. */
export const TAJWEED_COLOR_CHEATSHEET_KK = [
  { hex: "#537FFF", label: "Мәдд (табиғи / рұқсат / лазым / вәжіп)" },
  { hex: "#FF7E1E", label: "Ғунна" },
  { hex: "#9400A8", label: "Ихфа" },
  { hex: "#26BFFD", label: "Иқлаб" },
  { hex: "#DD0008", label: "Қалқала" },
  { hex: "#169777", label: "Идғам (ғунналы)" },
  { hex: "#AAAAAA", label: "Оқылмайтын / жұмсартылатын" },
] as const;
