import { releaseAppHeavyMemory } from "../appMemoryRelease";

describe("releaseAppHeavyMemory", () => {
  it("resolves without throwing when caches are empty", async () => {
    await expect(releaseAppHeavyMemory()).resolves.toBeUndefined();
  });
});
