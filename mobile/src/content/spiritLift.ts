import { KAZAKH_GREAT_WORDS_SECTIONS } from "./kazakhGreatWordsContent";
import { getAuthorById, getGreatWordsCatalog, type GreatWordsEntry } from "./greatWordsCatalog";

export type SpiritLiftQuote = {
  text: string;
  attribution: string;
  entryId?: string;
};

const CURATED: SpiritLiftQuote[] = [
  { text: "Береке — бірлікте, бақыт — сабырда.", attribution: "халық нақылы" },
  { text: "Сабыр — жеңіс, асығыс — қателік.", attribution: "халық даналығы" },
  { text: "Ілім — нұр; нұрсыз жүрек қаңтарылып қалады.", attribution: "рухани дәстүр" },
  { text: "Кішіге мейірім, үлкенге құрмет.", attribution: "Абай, «Қара сөз»" },
  { text: "Құдайға сен, өзіңе сенбе.", attribution: "Абай, «Қара сөз»" },
  { text: "Жақсылыққа жаны құмар ету керек; жамандыққа жаны құмар етпе.", attribution: "Абай" },
  { text: "Отан — ана, Отан — тіл, Отан — жүрек.", attribution: "Мағжан Жұмабаев" },
  { text: "Қазақтың тілі — ұлттың жүрегі.", attribution: "Ахмет Байтұрсынұлы" },
  { text: "Тәубә — жүректің тазаруы.", attribution: "халық нақылы" },
  { text: "Қонақты құрметте, көршіні кемсітпе.", attribution: "салттық ақыл" },
  { text: "Ықылас пен еңбек — алға бастар жол.", attribution: "рухани дәстүр" },
  { text: "Адалдық — сенім, сенім — бірлік.", attribution: "халық нақылы" },
];

function quoteFromEntry(entry: GreatWordsEntry): string | null {
  const quoted = entry.body.match(/«([^»]+)»/);
  const text = (quoted?.[1] ?? entry.title).trim();
  if (text.length < 8 || text.length > 240) return null;
  return text;
}

function entryToLift(entry: GreatWordsEntry): SpiritLiftQuote | null {
  const text = quoteFromEntry(entry);
  if (!text) return null;
  const author = getAuthorById(entry.authorId);
  const attribution =
    author?.name === "Жинақ редакциясы"
      ? entry.title
      : author?.name ?? entry.authorId;
  return { text, attribution, entryId: entry.id };
}

function pickCurated(excludeText?: string): SpiritLiftQuote {
  const pool = excludeText ? CURATED.filter((q) => q.text !== excludeText) : CURATED;
  const list = pool.length ? pool : CURATED;
  return list[Math.floor(Math.random() * list.length)]!;
}

function pickFromSections(excludeText?: string): SpiritLiftQuote | null {
  const flat = KAZAKH_GREAT_WORDS_SECTIONS.flatMap((s) =>
    s.items.map((it) => ({
      text: it.text,
      attribution: it.source ?? s.title,
    }))
  );
  const pool = excludeText ? flat.filter((q) => q.text !== excludeText) : flat;
  if (!pool.length) return null;
  const hit = pool[Math.floor(Math.random() * pool.length)]!;
  return { text: hit.text, attribution: hit.attribution };
}

/** Кездейсоқ рухани нақыл — жинақтан немесе қысқа тізімнен */
export function pickSpiritLift(excludeText?: string): SpiritLiftQuote {
  const { entries } = getGreatWordsCatalog();
  const maxTries = 12;
  for (let t = 0; t < maxTries; t++) {
    const entry = entries[Math.floor(Math.random() * entries.length)];
    if (!entry) break;
    const lift = entryToLift(entry);
    if (lift && lift.text !== excludeText) return lift;
  }
  const section = pickFromSections(excludeText);
  if (section) return section;
  return pickCurated(excludeText);
}
