import {
  buildHalalLookupCacheKey,
  readHalalLookupCache,
  writeHalalLookupCache,
} from "../halalLookupCache";

describe("halalLookupCache", () => {
  it("stores and reads lookup snapshot by query + status", () => {
    const key = buildHalalLookupCacheKey("E471", "halal");
    expect(readHalalLookupCache(key)).toBeNull();
    writeHalalLookupCache(key, { products: [], additives: [], companies: [] });
    expect(readHalalLookupCache(key)).toEqual({ products: [], additives: [], companies: [] });
  });
});
