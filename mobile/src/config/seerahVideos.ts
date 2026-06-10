/**
 * ARAL MEŞITI (YouTube: @aral_meshiti) — ұстаз Нұрсұлтан Рысмағанбетұлы
 * «Пайғамбарымыз (ﷺ) өмірбаяны» 1–38 дәріске бейне сілтемелер.
 * Ескерту: YouTube сілтемесін арна өзгертсе немесе бейнелерді ауыстырса, бұл id-ларды жаңартыңыз.
 */
export const SEERAH_LESSON_COUNT = 38;

const WATCH = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Индекс 0 = 1-сабақ, …, 37 = 38-сабақ.
 * Көз: 2026-04 — `@aral_meshiti/videos` плейлистінен 1..38 нөмірлі дәріс тақырыптары.
 */
export const SEERAH_DIRECT_URLS: (string | undefined)[] = [
  WATCH("ChfE00I41Ls"), // 1
  WATCH("5gk3iKFiXik"),
  WATCH("ROecVeH8Z4c"),
  WATCH("8fbD_gUYsW0"),
  WATCH("Zf3t52JuiQk"),
  WATCH("9ZnukVeNnZI"),
  WATCH("Otn1leB2eds"),
  WATCH("28OA_nPr0QQ"),
  WATCH("eOXbG7vpTIc"),
  WATCH("1XT7KKq9EJw"), // 10
  WATCH("rc09v-qVj9c"),
  WATCH("SwNlCSM-ShM"),
  WATCH("KyROguK9I8k"),
  WATCH("1LStrzppLmQ"),
  WATCH("sFknU2LA8Hg"),
  WATCH("em8Vb2P3h8Q"),
  WATCH("_WYuvkLHitA"),
  WATCH("cjmxb24vjPc"),
  WATCH("Co7pA_QY0AI"),
  WATCH("A1b5QcGTnDs"), // 20
  WATCH("u6yUFZydnR0"),
  WATCH("7LfI2NOsSpY"),
  WATCH("U6n3rcTwpvE"),
  WATCH("5DcWqrpPacY"),
  WATCH("JsWYNvnpFwk"),
  WATCH("SQKaIg4VQbA"),
  WATCH("pOn5SQ-WhhU"),
  WATCH("_ESqeOH34AQ"),
  WATCH("bWxl2MMCTBg"),
  WATCH("arKOSVapezU"),
  WATCH("LnRdaSbHn0Q"), // 30
  WATCH("lLJfQLQQl_M"),
  WATCH("APghn1stNLQ"),
  WATCH("WSQHxWbuyS0"),
  WATCH("rElGM3mCH3Q"),
  WATCH("mOoOLlaWeCk"),
  WATCH("JBBMAALqKvQ"),
  WATCH("uAigXDEzbVI"), // 38
];

export function urlForSeerahLesson(lesson: number): string {
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > SEERAH_LESSON_COUNT) {
    throw new RangeError(`Seerah: сабақ 1-${SEERAH_LESSON_COUNT} аралығында болуы керек`);
  }
  const raw = SEERAH_DIRECT_URLS[lesson - 1];
  const u = typeof raw === "string" ? raw.trim() : "";
  if (u && /^https?:\/\//i.test(u)) return u;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `Нұрсұлтан ұстаз сира ${lesson} сабақ`
  )}`;
}
