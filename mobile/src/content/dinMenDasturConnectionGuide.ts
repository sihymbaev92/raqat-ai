/**
 * Дін мен дәстүрдің байланысы — қысқа түсіндірме (хаб).
 */

export type DinDasturPlainPoint = {
  id: string;
  title: string;
  body: string;
};

/** Бір-екі сөйлем — хабта бір рет. */
export const DIN_DASTUR_CONNECTION_SUMMARY =
  "Дін — сенім өлшемі. Дәстүр — игі әдеп. Ырым сенімге айналса немесе зиян келтірсе — тоқтаймыз; игі әдеп сақталады.";

/** Үш қысқа ой. */
export const DIN_DASTUR_PLAIN_POINTS: DinDasturPlainPoint[] = [
  {
    id: "keep-good",
    title: "Игі әдеп — сақталады",
    body: "Қонақ, бата, үлкенді сыйлау, көмек — дінмен үйлеседі.",
  },
  {
    id: "stop-belief",
    title: "Ырым сенімге айналса — тоқтаймыз",
    body: "«Зат/сан қорғайды» деп сену — дінге қайшы. Қайыр мен зиян Алладан.",
  },
  {
    id: "ask-when-unsure",
    title: "Күмән болса — сұраңыз",
    body: "Ұстазға немесе ҚМДБ / Fatua.kz / Muftyat.kz нұсқауына сүйеніңіз.",
  },
];

/** Ескі импорттар үшін үйлесім. */
export const DIN_DASTUR_PILLARS: DinDasturPlainPoint[] = [];
export const DIN_DASTUR_CONNECTION_RULES: DinDasturPlainPoint[] = [];
