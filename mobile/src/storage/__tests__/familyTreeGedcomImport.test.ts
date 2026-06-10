import { parseFamilyTreeGedcom } from "../familyTreeGedcomImport";

const SAMPLE = `0 HEAD
1 GEDC
0 @I1@ INDI
1 NAME Асан /Қасымов/
1 SEX M
0 @I2@ INDI
1 NAME Айгүл /Қасымова/
1 SEX F
0 @I3@ INDI
1 NAME Нұрлан /Қасымов/
1 SEX M
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
`;

describe("parseFamilyTreeGedcom", () => {
  it("parses INDI and FAM parent links", () => {
    const { tree, error } = parseFamilyTreeGedcom(SAMPLE);
    expect(error).toBeUndefined();
    expect(tree?.persons).toHaveLength(3);
    const child = tree?.persons.find((p) => p.name.includes("Нұрлан"));
    expect(child?.fatherId).toBeTruthy();
    expect(child?.motherId).toBeTruthy();
  });
});
