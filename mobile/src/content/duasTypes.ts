/** Сүреттеме: әр дұғаның араб мәтіні, қазақша оқылуы, қазақша мағынасы. */
export type DuaBlock = {
  title: string;
  ar: string;
  /** Кириллмен қазақша оқылу. Көрсетілмесе — экранда араб мәтінінен авто-оқылу. */
  translitKk?: string;
  meaningKk: string;
};

export type DuaCategory = { title: string; blocks: DuaBlock[] };
