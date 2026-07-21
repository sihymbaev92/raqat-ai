import { resolveKkAutoTranslationText } from "../useKkAutoTranslator";

describe("resolveKkAutoTranslationText", () => {
  it("uses bundled offline translations before any network request", () => {
    expect(resolveKkAutoTranslationText("Басты бет", "en", {})).toBe("Home");
    expect(resolveKkAutoTranslationText("Құран", "ru", {})).toBe("Коран");
  });

  it("hides untranslated Kazakh-letter text instead of leaking Kazakh UI", () => {
    const source = ["Бұл жаңа мәтін offline сөздікке әлі кірмеген", "987654321"].join(" ");

    expect(resolveKkAutoTranslationText(source, "ru", {})).toBe("…");
    expect(resolveKkAutoTranslationText(source, "en", {})).toBe("…");
  });

  it("uses cached translations when available", () => {
    expect(resolveKkAutoTranslationText("Жаңа мәтін", "ru", { "Жаңа мәтін": "Новый текст" })).toBe(
      "Новый текст"
    );
  });
});
