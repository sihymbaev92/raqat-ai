/**
 * Қазақша кирилл фонетикалық транскрипцияны латынға айналдырады
 * (оқылу көрсету үшін; ресми орфография емес).
 */
const MAP: Record<string, string> = {
  а: "a",
  ә: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "gh",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  ң: "ng",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ұ: "u",
  ү: "u",
  ф: "f",
  х: "h",
  һ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  і: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function kkCyrillicPhoneticToLatin(input: string): string {
  const src = (input ?? "").trim();
  if (!src) return "";
  let out = "";
  for (const ch of src) {
    const lower = ch.toLowerCase();
    const mapped = MAP[lower];
    if (mapped == null) {
      out += ch;
      continue;
    }
    if (ch !== lower && mapped.length > 0) {
      out += mapped[0]!.toUpperCase() + mapped.slice(1);
    } else {
      out += mapped;
    }
  }
  return out;
}
