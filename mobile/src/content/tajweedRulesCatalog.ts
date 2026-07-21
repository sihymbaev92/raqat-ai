import type { TajweedRuleKey } from "../utils/alquranTajweedParse";
import { TAJWEED_ALQURAN_BY_RULE } from "./tajweedColorPalette";

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

function ruleColors(rule: TajweedRuleKey): Pick<TajweedRuleMeta, "colorLight" | "colorDark"> {
  const pair = TAJWEED_ALQURAN_BY_RULE[rule];
  return { colorLight: pair.light, colorDark: pair.dark };
}

export const TAJWEED_RULES_CATALOG: TajweedRuleMeta[] = [
  {
    rule: "h",
    tagOpen: "[h[",
    labelKk: "Һәмзәт уасл",
    detailKk: "Жазылып тұрады, бірақ оқылмайды — келесі дауыстыға жабысады.",
    ...ruleColors("h"),
  },
  {
    rule: "s",
    tagOpen: "[s[",
    labelKk: "Тыныш әріп",
    detailKk: "Дыбыс шығарылмайды; келесі әріпке жұмсақ өту.",
    ...ruleColors("s"),
  },
  {
    rule: "l",
    tagOpen: "[l[",
    labelKk: "Ләм шәмси",
    detailKk: "«ال» ішіндегі ل жұмсартылады — келесі әріп қосарланады (الشَّمْس).",
    ...ruleColors("l"),
  },
  {
    rule: "n",
    tagOpen: "[n[",
    labelKk: "Мәдд — табиғи (2)",
    detailKk: "Қалыпты ұзарту — екі харакат созылуы.",
    ...ruleColors("n"),
  },
  {
    rule: "p",
    tagOpen: "[p[",
    labelKk: "Мәдд — рұқсат (2/4/6)",
    detailKk: "Рұқсатты ұзарту — 2, 4 немесе 6 харакат (ұстазбен).",
    ...ruleColors("p"),
  },
  {
    rule: "m",
    tagOpen: "[m[",
    labelKk: "Мәдд — лазым (6)",
    detailKk: "Міндетті ұзын мәдд — әдетте 6 харакат.",
    ...ruleColors("m"),
  },
  {
    rule: "o",
    tagOpen: "[o[",
    labelKk: "Мәдд — вәжіп (4–5)",
    detailKk: "Міндетті орта мәдд — 4–5 харакат.",
    ...ruleColors("o"),
  },
  {
    rule: "q",
    tagOpen: "[q[",
    labelKk: "Қалқала",
    detailKk: "ق ط ب ج د сукунмен — қысқа «секіру» дыбысы.",
    ...ruleColors("q"),
  },
  {
    rule: "g",
    tagOpen: "[g[",
    labelKk: "Ғунна",
    detailKk: "Мұрыннан екі харакат созылуы (шәддәлы ن / م).",
    ...ruleColors("g"),
  },
  {
    rule: "f",
    tagOpen: "[f[",
    labelKk: "Ихфа",
    detailKk: "Нун сәкин/тәнуин — ن дыбысы жасырынып, ғуннамен оқылады.",
    ...ruleColors("f"),
  },
  {
    rule: "c",
    tagOpen: "[c[",
    labelKk: "Ихфа шафави",
    detailKk: "Мим сәкиннен кейін ب — ерін жабық, дыбыс жеңіл (ғунна).",
    ...ruleColors("c"),
  },
  {
    rule: "i",
    tagOpen: "[i[",
    labelKk: "Иқлаб",
    detailKk: "Нун сәкин/тәнуиннен кейін ب — дыбыс م-ге ауысады (ғуннамен).",
    ...ruleColors("i"),
  },
  {
    rule: "w",
    tagOpen: "[w[",
    labelKk: "Идғам шафави",
    detailKk: "Мим сәкиннен кейін م — қосарланып, 2 харакат ғунна.",
    ...ruleColors("w"),
  },
  {
    rule: "a",
    tagOpen: "[a[",
    labelKk: "Идғам (ғуннамен)",
    detailKk: "Нун сәкин/тәнуин — келесі әріпке (ي ن م و) сіңісіп, ғуннамен оқылады.",
    ...ruleColors("a"),
  },
  {
    rule: "u",
    tagOpen: "[u[",
    labelKk: "Идғам (ғуннасыз)",
    detailKk: "Нун сәкин/тәнуин — келесі әріпке (ل ر) сіңісіп, ғуннасыз оқылады.",
    ...ruleColors("u"),
  },
  {
    rule: "d",
    tagOpen: "[d[",
    labelKk: "Идғам мутәжанисайн",
    detailKk: "Ұқсас дыбысты әріптердің бірі жұмсартылады.",
    ...ruleColors("d"),
  },
  {
    rule: "b",
    tagOpen: "[b[",
    labelKk: "Идғам мутақарибайн",
    detailKk: "Жақын маһражды әріптер бірігіп оқылады.",
    ...ruleColors("b"),
  },
];

/** Легенда топтары — әр ереженің өз түсі Al Quran Cloud бойынша. */
export const TAJWEED_LEGEND_SECTIONS: { titleKk: string; rules: TajweedRuleKey[] }[] = [
  {
    titleKk: "Мәдд",
    rules: ["n", "p", "m", "o"],
  },
  {
    titleKk: "Ғунна, ихфа, иқлаб",
    rules: ["g", "f", "c", "i"],
  },
  {
    titleKk: "Қалқала",
    rules: ["q"],
  },
  {
    titleKk: "Идғам",
    rules: ["a", "u", "w", "d", "b"],
  },
  {
    titleKk: "Жұмсарту / оқылмайды",
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
