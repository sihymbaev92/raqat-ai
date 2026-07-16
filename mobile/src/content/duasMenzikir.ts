import type { DuaCategory } from "./duasTypes";
import {
  DUA_EXTRA_DAILY,
  DUA_EXTRA_HEALTH,
  DUA_EXTRA_STUDY,
  DUA_EXTRA_TRAVEL,
  DUA_EXTRA_ZIKR,
} from "./duasMergedExtras";

/** Бөлімдер: экрандағы бөлім реті мен қысқа түсініктеме */
export type DuasMenzikirSection = {
  /** DUA_CATEGORIES ішіндегі title кілті */
  categoryTitle: string;
  /** UI тақырыбы (нөмірленген) */
  label: string;
  hint: string;
};

export const DUAS_MENZIKIR: DuasMenzikirSection[] = [
  {
    categoryTitle: "I. Күнделікті және үй",
    label: "I. Күнделікті және үй",
    hint: "Тамақ, ұйқы, киім, үйге кіру/шығу",
  },
  {
    categoryTitle: "II. Дәрет дұғалары",
    label: "II. Дәрет",
    hint: "Туалет, тазарту, шахада",
  },
  {
    categoryTitle: "III. Денсаулық және рухани қиындық",
    label: "III. Денсаулық",
    hint: "Ауру, қорқыныш, уайым, қайғы",
  },
  {
    categoryTitle: "IV. Көлік, саяхат, базар",
    label: "IV. Саяхат",
    hint: "Көлік, жол, базар, қайту",
  },
  {
    categoryTitle: "V. Зікір, тәубе және салауат",
    label: "V. Зікір және тәубе",
    hint: "Истигфар, ризалық, кешірім, сәләуәт",
  },
  {
    categoryTitle: "VI. Қажылық, умра және Қағба",
    label: "VI. Қажылық",
    hint: "Тәлбия, сафа-марва, Арафа",
  },
  {
    categoryTitle: "VII. Білім, емтихан және ризық",
    label: "VII. Білім және ризық",
    hint: "Оқу, жұмыс, халал ризық",
  },
  {
    categoryTitle: "VIII. Жиі оқылатын 10 қысқа дұға",
    label: "VIII. 10 қысқа дұға",
    hint: "Күнделікті зікір — қайталап оқуға",
  },
];

function mergeExtras(cat: DuaCategory): DuaCategory {
  if (cat.title.startsWith("I.")) {
    return { ...cat, blocks: [...cat.blocks, ...DUA_EXTRA_DAILY] };
  }
  if (cat.title.startsWith("III.")) {
    return { ...cat, blocks: [...cat.blocks, ...DUA_EXTRA_HEALTH] };
  }
  if (cat.title.startsWith("IV.")) {
    return { ...cat, blocks: [...cat.blocks, ...DUA_EXTRA_TRAVEL] };
  }
  if (cat.title.startsWith("V.")) {
    return { ...cat, blocks: [...cat.blocks, ...DUA_EXTRA_ZIKR] };
  }
  if (cat.title.startsWith("VII.")) {
    return { ...cat, blocks: [...cat.blocks, ...DUA_EXTRA_STUDY] };
  }
  return cat;
}

/** Бөлімдер реті бойынша каталогты қайта құрады; бірегей дұғаларды бөлімге қосады */
export function orderDuaCategories(categories: DuaCategory[]): DuaCategory[] {
  const enriched = categories.map(mergeExtras);
  const byTitle = new Map(enriched.map((c) => [c.title, c]));
  const ordered: DuaCategory[] = [];
  for (const m of DUAS_MENZIKIR) {
    const cat = byTitle.get(m.categoryTitle);
    if (cat) ordered.push(cat);
  }
  for (const cat of enriched) {
    if (!ordered.some((o) => o.title === cat.title)) ordered.push(cat);
  }
  return ordered;
}

export function countDuasInCatalog(categories: DuaCategory[]): number {
  return categories.reduce((n, c) => n + c.blocks.length, 0);
}
