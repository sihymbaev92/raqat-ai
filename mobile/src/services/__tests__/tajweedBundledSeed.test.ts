import fs from "fs";
import path from "path";

const seedPath = path.join(__dirname, "../../../assets/bundled/quran-tajweed-offline.json");

describe("quran-tajweed-offline bundled seed", () => {
  it("exists with 114 surahs", () => {
    expect(fs.existsSync(seedPath)).toBe(true);
    const raw = fs.readFileSync(seedPath, "utf8");
    const body = JSON.parse(raw) as { version?: number; surahs?: Record<string, unknown> };
    expect(body.version).toBe(1);
    expect(Object.keys(body.surahs ?? {}).length).toBe(114);
    const s1 = body.surahs?.["1"] as Record<string, string> | undefined;
    expect(s1?.["1"] ?? "").toContain("[");
  });
});
