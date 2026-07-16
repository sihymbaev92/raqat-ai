import type { TajweedRuleKey } from "../utils/alquranTajweedParse";
import { TAJWEED_STD } from "./tajweedColorPalette";

/** Al Quran Cloud quran-tajweed тегтері — түс және қазақша анықтама (tajweed-guide). */
export type TajweedRuleMeta = {
  rule: TajweedRuleKey;
  /** API тегінің қысқа түрі */
  tagOpen: string;
  labelKk: string;
  detailKk: string;
  colorLight: string;
  colorDark: string;
};

function ruleColors(light: string, dark: string): Pick<TajweedRuleMeta, "colorLight" | "colorDark"> {
  return { colorLight: light, colorDark: dark };
}

const MADD = ruleColors(TAJWEED_STD.madd.light, TAJWEED_STD.madd.dark);
const GHUNNA_IKHFA = ruleColors(TAJWEED_STD.ghunnahIkhfa.light, TAJWEED_STD.ghunnahIkhfa.dark);
const QALQALAH = ruleColors(TAJWEED_STD.qalqalah.light, TAJWEED_STD.qalqalah.dark);
const IDGHAM = ruleColors(TAJWEED_STD.idgham.light, TAJWEED_STD.idgham.dark);
const NEUTRAL = ruleColors(TAJWEED_STD.neutral.light, TAJWEED_STD.neutral.dark);

export const TAJWEED_RULES_CATALOG: TajweedRuleMeta[] = [
  {
    rule: "h",
    tagOpen: "[h[",
    labelKk: "Һәмзәт уасл",
    detailKk: "Жазылып тұрады, бірақ оқылмайды — келесі дауыстыға жабысады.",
    ...NEUTRAL,
  },
  {
    rule: "s",
    tagOpen: "[s[",
    labelKk: "Тыныш әріп",
    detailKk: "Дыбыс шығарылмайды; келесі әріпке жұмсақ өту.",
    ...NEUTRAL,
  },
  {
    rule: "l",
    tagOpen: "[l[",
    labelKk: "Ләм шәмси",
    detailKk: "«ال» ішіндегі ل жұмсартылады — келесі әріп қосарланады (الشَّمْس).",
    ...NEUTRAL,
  },
  {
    rule: "n",
    tagOpen: "[n[",
    labelKk: "Мәдд — табиғи (2)",
    detailKk: "Қалыпты ұзарту — екі харакат созылуы.",
    ...MADD,
  },
  {
    rule: "p",
    tagOpen: "[p[",
    labelKk: "Мәдд — рұқсат (2/4/6)",
    detailKk: "Рұқсатты ұзарту — 2, 4 немесе 6 харакат (ұстазбен).",
    ...MADD,
  },
  {
    rule: "m",
    tagOpen: "[m[",
    labelKk: "Мәдд — лазым (6)",
    detailKk: "Міндетті ұзын мәдд — әдетте 6 харакат.",
    ...MADD,
  },
  {
    rule: "o",
    tagOpen: "[o[",
    labelKk: "Мәдд — вәжіп (4–5)",
    detailKk: "Міндетті орта мәдд — 4–5 харакат.",
    ...MADD,
  },
  {
    rule: "q",
    tagOpen: "[q[",
    labelKk: "Қалқала",
    detailKk: "ق ط ب ج д сукунмен — қысқа «секіру» дыбысы.",
    ...QALQALAH,
  },
  {
    rule: "g",
    tagOpen: "[g[",
    labelKk: "Ғунна",
    detailKk: "Мұрыннан екі харакат созылуы (нун/мим ғунна).",
    ...GHUNNA_IKHFA,
  },
  {
    rule: "f",
    tagOpen: "[f[",
    labelKk: "Ихфа",
    detailKk: "Нун сәкин/тәнуин — н дыбысы жасырынып оқылады.",
    ...GHUNNA_IKHFA,
  },
  {
    rule: "c",
    tagOpen: "[c[",
    labelKk: "Ихфа шафави",
    detailKk: "Мим сәкиннен кейін ب — ерін жабық, дыбыс жеңіл.",
    ...GHUNNA_IKHFA,
  },
  {
    rule: "i",
    tagOpen: "[i[",
    labelKk: "Иқлаб",
    detailKk: "Нун сәкиннен кейін ب — дыбыс мимге ауысады.",
    ...GHUNNA_IKHFA,
  },
  {
    rule: "w",
    tagOpen: "[w[",
    labelKk: "Идғам шафави",
    detailKk: "Мим сәкиннен кейін м — қосарланып, 2 харакат ғунна.",
    ...IDGHAM,
  },
  {
    rule: "a",
    tagOpen: "[a[",
    labelKk: "Идғам (ғуннамен)",
    detailKk: "Нун келесі әріпке сіңісіп, ғуннамен оқылады.",
    ...IDGHAM,
  },
  {
    rule: "u",
    tagOpen: "[u[",
    labelKk: "Идғам (ғуннасыз)",
    detailKk: "Нун келесі әріпке сіңісіп, ғуннасыз оқылады.",
    ...IDGHAM,
  },
  {
    rule: "d",
    tagOpen: "[d[",
    labelKk: "Идғам мутәжанисайн",
    detailKk: "Ұқсас дыбысты әріптердің бірі жұмсартылады.",
    ...IDGHAM,
  },
  {
    rule: "b",
    tagOpen: "[b[",
    labelKk: "Идғам мутақарибайн",
    detailKk: "Жақын маһражды әріптер бірігіп оқылады.",
    ...IDGHAM,
  },
];

/** Легенда — 4 халықаралық түс тобы + сұр көмекші ережелер. */
export const TAJWEED_LEGEND_SECTIONS: { titleKk: string; rules: TajweedRuleKey[] }[] = [
  {
    titleKk: `Мәдд · ${TAJWEED_STD.madd.light}`,
    rules: ["n", "p", "m", "o"],
  },
  {
    titleKk: `Ғунна, ихфа, иқлаб · ${TAJWEED_STD.ghunnahIkhfa.light}`,
    rules: ["g", "f", "c", "i"],
  },
  {
    titleKk: `Қалқала · ${TAJWEED_STD.qalqalah.light}`,
    rules: ["q"],
  },
  {
    titleKk: `Идғам · ${TAJWEED_STD.idgham.light}`,
    rules: ["a", "u", "w", "d", "b"],
  },
  {
    titleKk: `Жұмсарту / оқылмайды · ${TAJWEED_STD.neutral.light}`,
    rules: ["h", "l", "s"],
  },
];

const RULE_META = new Map<TajweedRuleKey, TajweedRuleMeta>(
  TAJWEED_RULES_CATALOG.map((m) => [m.rule, m])
);

export function tajweedRuleMeta(rule: TajweedRuleKey): TajweedRuleMeta | undefined {
  return RULE_META.get(rule);
}

export function tajweedColorForRule(rule: TajweedRuleKey, isDark: boolean): string {
  const m = RULE_META.get(rule);
  if (!m) return isDark ? "#f0f0f3" : "#27272a";
  return isDark ? m.colorDark : m.colorLight;
}
