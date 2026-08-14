import { normalizeMuftyatKkPageText, normalizeMuftyatKkText } from "../muftyatKkTextNormalize";
import hajjMuftyatPageText from "../hajjMuftyatPageText.json";
import { TAJWEED_MUFTYAT_PAGE_TEXT } from "../tajweedMuftyatPageText";
import { sanitizeHajjMuftyatPageText } from "../hajjMuftyatTextSanitize";

const HYPHEN_BREAK =
  /(?:[а-яёәіңғүұқөһ]-\n[а-яёәіңғүұқөһ]|\d-\n[а-яёәіңғүұқөһ])/gi;
const HYPHEN_DOT = /[а-яёәіңғүұқөһ]-+\.\s*[а-яёәіңғүұқөһ]/gi;
const LETTER_SPACED =
  /[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ](?:[ \t]+[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ]){2,}/g;

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

describe("muftyat OCR corpus quality", () => {
  it("tajweed displayText has no hyphen line breaks after revision", () => {
    const all = TAJWEED_MUFTYAT_PAGE_TEXT.map((p) => p.displayText).join("\n");
    expect(countMatches(all, HYPHEN_BREAK)).toBe(0);
  });

  it("tajweed displayText has no letter-spaced Kazakh words", () => {
    const all = TAJWEED_MUFTYAT_PAGE_TEXT.map((p) => p.displayText).join("\n");
    expect(countMatches(all, LETTER_SPACED)).toBe(0);
  });

  it("tajweed TTS text has no hyphen-dot OCR splits", () => {
    const all = TAJWEED_MUFTYAT_PAGE_TEXT.map((p) => p.text).join(" ");
    expect(countMatches(all, HYPHEN_DOT)).toBe(0);
  });

  it("hajj sanitized pages have no hyphen line breaks", () => {
    for (const row of hajjMuftyatPageText) {
      const cleaned = sanitizeHajjMuftyatPageText(row.text);
      expect(countMatches(cleaned, HYPHEN_BREAK)).toBe(0);
    }
  });

  it("normalize fixes known OCR typos", () => {
    expect(normalizeMuftyatKkText("Тиләует кажет")).toBe("Тіләуат қажет");
    expect(normalizeMuftyatKkPageText("Мек-\nке\n\nСондай - ақ")).toContain("Мекке");
    expect(normalizeMuftyatKkPageText("Мек-\nке\n\nСондай - ақ")).toContain("Сондай-ақ");
  });
});
