import { quranComReciterIdForEdition } from "../quranComReciterMap";

describe("quranComReciterMap", () => {
  it("maps Sudais edition to Quran.com audio id", () => {
    expect(quranComReciterIdForEdition("ar.abdurrahmaansudais")).toBe(3);
  });

  it("returns null for non-timestamped editions", () => {
    expect(quranComReciterIdForEdition("kk.khalifahaltai-audio")).toBeNull();
    expect(quranComReciterIdForEdition("archive.abdulrahman-mossad-selected")).toBeNull();
  });
});
