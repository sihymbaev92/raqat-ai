import { parseHalalVisionMachineLines } from "../halalVisionMachineLines";

describe("parseHalalVisionMachineLines", () => {
  it("extracts barcode and name without exposing protocol-only text", () => {
    const out = parseHalalVisionMachineLines("BARCODE: 4 870123456789\nNAME: Сүт 2.5%");

    expect(out.barcode).toBe("4870123456789");
    expect(out.name).toBe("Сүт 2.5%");
    expect(out.display).toBe("");
    expect(out.machineOnly).toBe(true);
  });

  it("keeps human prose while removing machine protocol lines", () => {
    const out = parseHalalVisionMachineLines(
      "Қаптамада сүт өнімі көрінеді.\nBARCODE: NONE\nNAME: Айран"
    );

    expect(out.display).toBe("Қаптамада сүт өнімі көрінеді.");
    expect(out.name).toBe("Айран");
    expect(out.machineOnly).toBe(false);
  });

  it("treats empty protocol values as no product signal", () => {
    const out = parseHalalVisionMachineLines("BARCODE: NONE\nNAME: NONE");

    expect(out.barcode).toBeNull();
    expect(out.name).toBeNull();
    expect(out.display).toBe("");
    expect(out.machineOnly).toBe(true);
  });
});
