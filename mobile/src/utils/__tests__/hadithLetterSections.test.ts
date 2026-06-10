import type { SahihHadithEntry } from "../../storage/hadithCorpus";
import {
  buildHadithBookOrderSections,
  formatHadithChapterTitle,
  sortHadithRowsByReference,
} from "../hadithLetterSections";

function row(partial: Partial<SahihHadithEntry> & Pick<SahihHadithEntry, "id" | "reference">): SahihHadithEntry {
  return {
    collection: "bukhari",
    collectionNameKk: "Сахих әл-Бұхари",
    bookTitleKk: "",
    arabic: "",
    textKk: "",
    narratorKk: "",
    ...partial,
  };
}

describe("hadithLetterSections book order", () => {
  it("sortHadithRowsByReference orders by numeric reference", () => {
    const sorted = sortHadithRowsByReference([
      row({ id: "bukhari-3", reference: "3" }),
      row({ id: "bukhari-1", reference: "1" }),
      row({ id: "bukhari-10", reference: "10" }),
      row({ id: "bukhari-2", reference: "2" }),
    ]);
    expect(sorted.map((h) => h.reference)).toEqual(["1", "2", "3", "10"]);
  });

  it("formatHadithChapterTitle strips Chapter prefix", () => {
    expect(formatHadithChapterTitle("Chapter: Faith")).toBe("Faith");
    expect(formatHadithChapterTitle("")).toBe("");
  });

  it("buildHadithBookOrderSections groups by chapter in reference order", () => {
    const sections = buildHadithBookOrderSections([
      row({ id: "bukhari-2", reference: "2", chapterKk: "Chapter: B" }),
      row({ id: "bukhari-1", reference: "1", chapterKk: "Chapter: A" }),
      row({ id: "bukhari-3", reference: "3", chapterKk: "Chapter: B" }),
    ]);
    expect(sections.map((s) => s.title)).toEqual(["A", "B"]);
    expect(sections[0]?.data.map((h) => h.reference)).toEqual(["1"]);
    expect(sections[1]?.data.map((h) => h.reference)).toEqual(["2", "3"]);
  });
});
