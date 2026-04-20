/**
 * E-code reference for in-app halal helper (not fiqh ruling).
 */

export type HalalEcodeEntry = {
  code: string;
  titleKk: string;
  noteKk: string;
  group: "colors" | "preservatives" | "antioxidants" | "thickeners" | "other";
};

const GROUP_ORDER: Record<HalalEcodeEntry["group"], number> = {
  colors: 0,
  preservatives: 1,
  antioxidants: 2,
  thickeners: 3,
  other: 4,
};

export const HALAL_ECODE_ENTRIES: HalalEcodeEntry[] = [
  { code: "E100", titleKk: "Куркумин (сары түс)", noteKk: "Өсімдік шығулы түс бергіш.", group: "colors" },
  {
    code: "E120",
    titleKk: "Кармин / кошениль",
    noteKk: "Қызыл түс — жәндік шығулы; мәзһабқа байланысты талқылау болуы мүмкін.",
    group: "colors",
  },
  { code: "E200", titleKk: "Сорбин қышқылы", noteKk: "Консервант; рұқсат концентрацияда.", group: "preservatives" },
  { code: "E211", titleKk: "Натрий бензоаты", noteKk: "Сусын, тұздықтарда консервант.", group: "preservatives" },
  { code: "E250", titleKk: "Натрий нитриті", noteKk: "Ет өнімдерінде консервант.", group: "preservatives" },
  { code: "E300", titleKk: "Аскорбин қышқылы (С)", noteKk: "Антиоксидант; көбінесе өсімдік синтезі.", group: "antioxidants" },
  { code: "E320", titleKk: "BHA", noteKk: "Майдағы антиоксидант.", group: "antioxidants" },
  { code: "E321", titleKk: "BHT", noteKk: "Майдағы антиоксидант.", group: "antioxidants" },
  {
    code: "E322",
    titleKk: "Лецитин",
    noteKk: "Соя, жұмыртқа немесе күнжүт — аллерген және қайнар маңызды.",
    group: "thickeners",
  },
  { code: "E330", titleKk: "Лимон қышқылы", noteKk: "Қышқылдық реттегіш.", group: "other" },
  { code: "E407", titleKk: "Каррагинан", noteKk: "Теңіз балдырынан тұрақтандырғыш.", group: "thickeners" },
  { code: "E410", titleKk: "Локуст бұршығы", noteKk: "Өсімдік тұрақтандырғышы.", group: "thickeners" },
  { code: "E412", titleKk: "Гуар бұршығы", noteKk: "Өсімдік тұрақтандырғышы.", group: "thickeners" },
  { code: "E414", titleKk: "Арабик шайыры", noteKk: "Акация шайыры — эмульгатор.", group: "thickeners" },
  { code: "E415", titleKk: "Ксантан шайыры", noteKk: "Ферментациялық тұрақтандырғыш.", group: "thickeners" },
  { code: "E420", titleKk: "Сорбитол", noteKk: "Тәттілendirгіш пен ылғал сақтағыш.", group: "other" },
  {
    code: "E422",
    titleKk: "Глицерин",
    noteKk: "Өсімдік немесе мал шығыны болуы мүмкін — күмәнде өндірушіге сұрақ.",
    group: "other",
  },
  { code: "E440", titleKk: "Пектин", noteKk: "Жеміс тұрақтандырғышы; әдетте халал.", group: "thickeners" },
  {
    code: "E441",
    titleKk: "Желатин",
    noteKk: "Көбінесе мал терісі/сүйегі — мәзһаб пен қайнарға байланысты күмәнді; қайнарды раста.",
    group: "other",
  },
  { code: "E450", titleKk: "Полифосфаттар", noteKk: "Ет өнімдерінде ылғал сақтау.", group: "other" },
  {
    code: "E471",
    titleKk: "Май қышқылдарының моно- және диглицеридтері",
    noteKk: "Эмульгатор; өсімдік немесе мал майы — сертификат пен өндірушіге қара.",
    group: "thickeners",
  },
  { code: "E500", titleKk: "Сода (натрий карбонаттары)", noteKk: "Қопсытқыш / pH.", group: "other" },
  { code: "E621", titleKk: "Глутамат натрий (MSG)", noteKk: "Дәм күшейткіші.", group: "other" },
  { code: "E903", titleKk: "Карнауба воғы", noteKk: "Өсімдік воғы — жапсырма жлындығы.", group: "other" },
];

const byNorm = new Map<string, HalalEcodeEntry>();
for (const e of HALAL_ECODE_ENTRIES) {
  byNorm.set(e.code.replace(/\s/g, "").toUpperCase(), e);
}

export function findEcodesInText(text: string): HalalEcodeEntry[] {
  const re = /\bE\s*(\d{3,4})\b/gi;
  const seen = new Set<string>();
  const out: HalalEcodeEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = `E${m[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = byNorm.get(key);
    if (row) out.push(row);
  }
  return out;
}

export function formatEcodeAppendixForPrompt(entries: HalalEcodeEntry[]): string {
  if (!entries.length) return "";
  const lines = entries.slice(0, 24).map((e) => `— ${e.code}: ${e.titleKk}. ${e.noteKk}`);
  return [
    "=== Қолданба ішіндегі E-код анықтамалары (ақпараттық, фиқһ емес) ===",
    ...lines,
    "Құраммен салыстыр; нақты үкім үшін ұстаз немесе ресми халал ұйымы.",
  ].join("\n");
}

export function halalEcodeEntriesSorted(): HalalEcodeEntry[] {
  return [...HALAL_ECODE_ENTRIES].sort(
    (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || a.code.localeCompare(b.code)
  );
}
