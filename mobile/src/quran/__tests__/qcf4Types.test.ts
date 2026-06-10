import { parseVerseKey } from "../qcf4Types";

describe("qcf4Types", () => {
  it("parseVerseKey", () => {
    expect(parseVerseKey("2:255")).toEqual({ surah: 2, ayah: 255 });
    expect(parseVerseKey("bad")).toBeNull();
  });
});
