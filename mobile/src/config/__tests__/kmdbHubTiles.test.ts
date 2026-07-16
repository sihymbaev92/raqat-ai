import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../officialIslamicSources";
import { getKmdbHubTiles } from "../kmdbHubTiles";
import { officialIslamicSourceHomeUrl } from "../officialIslamicSources";

describe("kmdbHubTiles", () => {
  it("exposes AI and zakat hub tiles", () => {
    expect(getKmdbHubTiles().map((t) => t.key)).toEqual(["ai", "zakat"]);
    expect(officialIslamicSourceHomeUrl("fatua")).toBe(FATUA_KK_HOME_URL);
    expect(officialIslamicSourceHomeUrl("muftyat")).toBe(MUFTYAT_KK_HOME_URL);
  });
});
