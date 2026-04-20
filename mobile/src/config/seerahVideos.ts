/**
 * Нұрсұлтан ұстаз — сира бейнесабақтары (YouTube), 38 сабақ.
 * Нақты «Бөлісу» сілтемелерін YouTube-тан көшіріп, `SEERAH_DIRECT_URLS[сабақ-1]` орнына қойыңыз.
 * Бос немесе жарамсыз болса, сәйкес батырма YouTube іздеуін ашады.
 */
export const SEERAH_LESSON_COUNT = 38;

/** Индекс 0 = 1-сабақ, …, 37 = 38-сабақ */
export const SEERAH_DIRECT_URLS: (string | undefined)[] = Array.from(
  { length: SEERAH_LESSON_COUNT },
  () => undefined
);

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
