import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../officialIslamicSources";
import {
  getKmdbHubPrimaryRowKeys,
  getKmdbHubSecondaryTiles,
  getKmdbHubTiles,
} from "../kmdbHubTiles";
import { officialIslamicSourceHomeUrl } from "../officialIslamicSources";

describe("kmdbHubTiles", () => {
  it("exposes fatua, mosques and muftyat hub tabs", () => {
    expect(getKmdbHubPrimaryRowKeys()).toEqual(["fatua", "mosques", "muftyat"]);
    expect(getKmdbHubSecondaryTiles()).toEqual([]);
    expect(getKmdbHubTiles().map((t) => t.key)).toEqual(["ai", "zakat"]);
    expect(officialIslamicSourceHomeUrl("fatua")).toBe(FATUA_KK_HOME_URL);
    expect(officialIslamicSourceHomeUrl("muftyat")).toBe(MUFTYAT_KK_HOME_URL);
  });
});
