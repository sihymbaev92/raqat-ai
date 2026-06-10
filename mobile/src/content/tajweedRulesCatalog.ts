import type { TajweedRuleKey } from "../utils/alquranTajweedParse";

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

export const TAJWEED_RULES_CATALOG: TajweedRuleMeta[] = [
  {
    rule: "h",
    tagOpen: "[h[",
    labelKk: "Һәмзәт уасл",
    detailKk: "Жазылып тұрады, бірақ оқылмайды — келесі дауыстыға жабысады.",
    colorLight: "#6b7280",
    colorDark: "#b6bcc6",
  },
  {
    rule: "s",
    tagOpen: "[s[",
    labelKk: "Тыныш әріп",
    detailKk: "Дыбыс шығарылмайды; келесі әріпке жұмсақ өту.",
    colorLight: "#6b7280",
    colorDark: "#9ca3af",
  },
  {
    rule: "l",
    tagOpen: "[l[",
    labelKk: "Ләм шәмси",
    detailKk: "«ال» ішіндегі ل жұмсартылады — келесі әріп қосарланады (الشَّمْس).",
    colorLight: "#0284c7",
    colorDark: "#67e8f9",
  },
  {
    rule: "n",
    tagOpen: "[n[",
    labelKk: "Мәдд — табиғи (2)",
    detailKk: "Қалыпты ұзарту — екі харакат созылуы.",
    colorLight: "#537fff",
    colorDark: "#93c5fd",
  },
  {
    rule: "p",
    tagOpen: "[p[",
    labelKk: "Мәдд — рұқсат (2/4/6)",
    detailKk: "Рұқсатты ұзарту — 2, 4 немесе 6 харакат (ұстазбен).",
    colorLight: "#4050ff",
    colorDark: "#818cf8",
  },
  {
    rule: "m",
    tagOpen: "[m[",
    labelKk: "Мәдд — лазым (6)",
    detailKk: "Міндетті ұзын мәдд — әдетте 6 харакат.",
    colorLight: "#1e3a8a",
    colorDark: "#60a5fa",
  },
  {
    rule: "o",
    tagOpen: "[o[",
    labelKk: "Мәдд — вәжіп (4–5)",
    detailKk: "Міндетті орта мәдд — 4–5 харакат.",
    colorLight: "#2144c1",
    colorDark: "#7dd3fc",
  },
  {
    rule: "q",
    tagOpen: "[q[",
    labelKk: "Қалқала",
    detailKk: "ق ط ب ج د сукунмен — қысқа «секіру» дыбысы.",
    colorLight: "#dc2626",
    colorDark: "#f87171",
  },
  {
    rule: "g",
    tagOpen: "[g[",
    labelKk: "Ғунна",
    detailKk: "Мұрыннан екі харакат созылуы (нун/мим ғунна).",
    colorLight: "#ea580c",
    colorDark: "#fdba74",
  },
  {
    rule: "f",
    tagOpen: "[f[",
    labelKk: "Ихфа",
    detailKk: "Нун сәкин/тәнуин — н дыбысы жасырынып оқылады.",
    colorLight: "#9400a8",
    colorDark: "#e879f9",
  },
  {
    rule: "c",
    tagOpen: "[c[",
    labelKk: "Ихфа шафави",
    detailKk: "Мим сәкиннен кейін ب — ерін жабық, дыбыс жеңіл.",
    colorLight: "#c026d3",
    colorDark: "#f0abfc",
  },
  {
    rule: "w",
    tagOpen: "[w[",
    labelKk: "Идғам шафави",
    detailKk: "Мим сәкиннен кейін м — қосарланып, 2 харакат ғунна.",
    colorLight: "#16a34a",
    colorDark: "#6ee7b7",
  },
  {
    rule: "i",
    tagOpen: "[i[",
    labelKk: "Иқлаб",
    detailKk: "Нун сәкиннен кейін ب — дыбыс мимге ауысады.",
    colorLight: "#0891b2",
    colorDark: "#67e8f9",
  },
  {
    rule: "a",
    tagOpen: "[a[",
    labelKk: "Идғам (ғуннамен)",
    detailKk: "Нун келесі әріпке сіңісіп, ғуннамен оқылады.",
    colorLight: "#059669",
    colorDark: "#34d399",
  },
  {
    rule: "u",
    tagOpen: "[u[",
    labelKk: "Идғам (ғуннасыз)",
    detailKk: "Нун келесі әріпке сіңісіп, ғуннасыз оқылады.",
    colorLight: "#15803d",
    colorDark: "#4ade80",
  },
  {
    rule: "d",
    tagOpen: "[d[",
    labelKk: "Идғам мутәжанисайн",
    detailKk: "Ұқсас дыбысты әріптердің бірі жұмсартылады.",
    colorLight: "#78716c",
    colorDark: "#a8a29e",
  },
  {
    rule: "b",
    tagOpen: "[b[",
    labelKk: "Идғам мутақарибайн",
    detailKk: "Жақын маһражды әріптер бірігіп оқылады.",
    colorLight: "#78716c",
    colorDark: "#a8a29e",
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
