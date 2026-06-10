import { parseHajjMuftyatDisplaySegments } from "../hajjMuftyatDisplay";

describe("parseHajjMuftyatDisplaySegments", () => {
  it("pairs Оқылуы and Мағынасы into dua row", () => {
    const text = [
      "Оқылуы:",
      "Ләббәйкә аллаһумма ләббәйк",
      "Мағынасы:",
      "Алла, мен саған келдім",
    ].join("\n\n");

    const segs = parseHajjMuftyatDisplaySegments(text);
    expect(segs).toEqual([
      {
        kind: "dua",
        oqyly: "Ләббәйкә аллаһумма ләббәйк",
        magynasy: "Алла, мен саған келдім",
      },
    ]);
  });

  it("keeps rotation title on dua block", () => {
    const text = ["Бірінші айналым", "Оқылуы:", "Subhanallah", "Мағынасы:", "Аллаға пак"].join(
      "\n\n",
    );

    const segs = parseHajjMuftyatDisplaySegments(text);
    expect(segs[0]).toMatchObject({
      kind: "dua",
      title: "Бірінші айналым",
      oqyly: "Subhanallah",
      magynasy: "Аллаға пак",
    });
  });

  it("classifies Kazakh prose as left column", () => {
    const text = "Қажылық — бұл Ибадат.";
    const segs = parseHajjMuftyatDisplaySegments(text);
    expect(segs).toEqual([{ kind: "prose", text, align: "kk" }]);
  });

  it("classifies Arabic script as right column", () => {
    const text = "مناسك الحج";
    const segs = parseHajjMuftyatDisplaySegments(text);
    expect(segs).toEqual([{ kind: "prose", text, align: "ar" }]);
  });

  it("handles inline Оқылуы: prefix", () => {
    const text = ["Оқылуы: Бисмилла", "Мағынасы: Алла атынан"].join("\n\n");
    const segs = parseHajjMuftyatDisplaySegments(text);
    expect(segs[0]).toMatchObject({
      kind: "dua",
      oqyly: "Бисмилла",
      magynasy: "Алла атынан",
    });
  });
});
