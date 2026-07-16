/** Al Quran Cloud `quran-tajweed` HTML палитрасы — халықаралық 4 түс + сұр көмекші. */
export const TAJWEED_STD = {
  madd: { light: "#DD2C00", dark: "#FF6E40" },
  ghunnahIkhfa: { light: "#00C853", dark: "#69F0AE" },
  qalqalah: { light: "#1A237E", dark: "#7986CB" },
  idgham: { light: "#FFD600", dark: "#FFEA00" },
  neutral: { light: "#6b7280", dark: "#9ca3af" },
} as const;

export type TajweedStdColorKey = keyof typeof TAJWEED_STD;

export function tajweedStdColor(key: TajweedStdColorKey, isDark: boolean): string {
  return isDark ? TAJWEED_STD[key].dark : TAJWEED_STD[key].light;
}

/** Қысқа шпаргалка — легенда/анықтама үшін. */
export const TAJWEED_COLOR_CHEATSHEET_KK = [
  { hex: TAJWEED_STD.madd.light, label: "Мәдд әріптері (ұзартып оқылатын)" },
  { hex: TAJWEED_STD.ghunnahIkhfa.light, label: "Ғунна, ихфа, изһар (мұрынмен)" },
  { hex: TAJWEED_STD.qalqalah.light, label: "Қалқала (секірмелі дыбыстар)" },
  { hex: TAJWEED_STD.idgham.light, label: "Идғам және жеңілдетілген белгілер" },
] as const;
