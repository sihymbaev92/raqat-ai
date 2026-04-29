import {
  findEcodesInText,
  formatEcodeAppendixForPrompt,
  halalEcodeEntriesSorted,
} from "../halalEcodeDb";

describe("findEcodesInText", () => {
  it("мәтіннен E-кодтарды табады және қайталануды алып тастайды", () => {
    const entries = findEcodesInText("Құрамы: E471, e-471, E120 және E330.");
    expect(entries.map((e) => e.code)).toEqual(["E471", "E120", "E330"]);
  });

  it("базада жоқ E-кодтарды өткізіп жібереді", () => {
    const entries = findEcodesInText("Құрамы: E7777, E1200.");
    expect(entries).toHaveLength(0);
  });

  it("әріп жалғанған E-кодты таниды (мыс: E150a)", () => {
    const entries = findEcodesInText("Құрамы: бояғыш E150a.");
    expect(entries.map((e) => e.code)).toEqual(["E150a"]);
  });
});

describe("formatEcodeAppendixForPrompt", () => {
  it("элемент жоқ болса бос жол қайтарады", () => {
    expect(formatEcodeAppendixForPrompt([])).toBe("");
  });

  it("элемент бар болса анықтама блогын құрастырады", () => {
    const entries = findEcodesInText("E120 және E441");
    const appendix = formatEcodeAppendixForPrompt(entries);
    expect(appendix).toContain("E120");
    expect(appendix).toContain("E441");
    expect(appendix).toContain("ақпараттық");
  });
});

describe("halalEcodeEntriesSorted", () => {
  it("тізім топ ретімен және кодпен сұрыпталады", () => {
    const sorted = halalEcodeEntriesSorted();
    const codes = sorted.map((e) => e.code);
    expect(codes.indexOf("E120")).toBeLessThan(codes.indexOf("E211"));
  });
});
