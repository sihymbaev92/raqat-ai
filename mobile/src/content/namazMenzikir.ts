/** Намаз оқулығы — бөлімдер (NamazGuideScreen секциялары). */
export type NamazMenzikirTarget =
  | "wudu"
  | "unified"
  | { restTitle: string };

export type NamazMenzikirSection = {
  id: string;
  label: string;
  hint: string;
  target: NamazMenzikirTarget;
};

export const NAMAZ_GUIDE_MENZIKIR: NamazMenzikirSection[] = [
  {
    id: "wudu",
    label: "I. Дәрет",
    hint: "Ниет, қадамдар, ер/әйел суреті",
    target: "wudu",
  },
  {
    id: "steps",
    label: "II. Намаз қадамдары",
    hint: "Тәкбір → қиям → рүкуғ → сәжде → сәлем",
    target: "unified",
  },
  {
    id: "sunnah",
    label: "III. Сүннет кестесі",
    hint: "Ханафи жиі нұсқа — 5 уақыт",
    target: { restTitle: "VII. Сүннет пен мүәккад сүннеттер" },
  },
  {
    id: "jamaat",
    label: "IV. Жамағат",
    hint: "Имамға ілесу, сап, сәжде сәһв",
    target: { restTitle: "VIII. Жамағат пен имамға ілесу" },
  },
  {
    id: "travel",
    label: "V. Саяхат намазы",
    hint: "Қаср, жамъ",
    target: { restTitle: "IX. Саяхат намазы" },
  },
  {
    id: "women",
    label: "VI. Әйелдер · мешіт",
    hint: "Ерекшеліктер және мешіт әдебі",
    target: { restTitle: "X. Әйелдерге ерекшеліктер" },
  },
  {
    id: "janaza",
    label: "VII. Жаназа · сәжде тәлауат",
    hint: "Жаназа қадамдары, Құран белгілері",
    target: { restTitle: "XII. Сәжде тәлауат (Құран)" },
  },
  {
    id: "quiz",
    label: "VIII. Қысқа сынақ",
    hint: "3 сұрақ — білімді бекіту",
    target: "unified",
  },
];
