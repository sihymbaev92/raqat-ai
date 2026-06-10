import {
  buildFamilyTreeLineagePlan,
  buildPaternalLine,
  getNextPaternalMissingSlot,
} from "../familyTreeLineage";
import { addPersonToTree, emptyFamilyTree, setSelfPerson } from "../familyTreeLocal";

describe("familyTreeLineage", () => {
  it("tracks paternal 7-ata progress and next missing father", () => {
    let tree = setSelfPerson(emptyFamilyTree(), {
      name: "Нұрлан",
      gender: "male",
      birthYear: 1990,
    });
    const selfId = tree.selfId!;
    tree = addPersonToTree(tree, { name: "Әкесі", gender: "male" }, "father", selfId);
    const fatherId = tree.persons.find((p) => p.name === "Әкесі")!.id;
    tree = addPersonToTree(tree, { name: "Атасы", gender: "male" }, "father", fatherId);

    const plan = buildFamilyTreeLineagePlan(tree);

    expect(buildPaternalLine(tree).map((p) => p.name)).toEqual(["Әкесі", "Атасы"]);
    expect(plan.paternalDepth).toBe(2);
    expect(plan.targetPaternalDepth).toBe(7);
    expect(plan.knownAncestorCount).toBe(2);
    expect(getNextPaternalMissingSlot(tree)?.label).toContain("Атасы");
  });

  it("reports current-day descendants and missing parent slots", () => {
    let tree = setSelfPerson(emptyFamilyTree(), {
      name: "Ата-ана",
      gender: "female",
    });
    tree = addPersonToTree(tree, { name: "Бала", gender: "male" }, "child", tree.selfId!);

    const plan = buildFamilyTreeLineagePlan(tree);

    expect(plan.totalPersons).toBe(2);
    expect(plan.descendantDepth).toBe(1);
    expect(plan.missingSlots.some((slot) => slot.relation === "father")).toBe(true);
    expect(plan.missingSlots.some((slot) => slot.relation === "mother")).toBe(true);
  });
});
