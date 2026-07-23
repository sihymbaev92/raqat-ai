import { APK_BUNDLED_JSON, REMOTE_BUNDLED_JSON } from "../bundledJsonTypes";
import { CONTENT_PACKS } from "../../config/contentPackManifest";
import { APK_SLIM_REMOTE_JSON } from "../../config/apkSlimRemoteJson";

describe("quran multi-lang APK bundle", () => {
  it("ships ru/en/tr/uz/ky editions in APK, not CDN-only", () => {
    expect(APK_BUNDLED_JSON).toContain("quran-translations-offline.json");
    expect(REMOTE_BUNDLED_JSON).not.toContain("quran-translations-offline.json");
    expect(APK_SLIM_REMOTE_JSON).not.toContain("quran-translations-offline.json");
    const pack = CONTENT_PACKS.find((p) => p.id === "quran-translations");
    expect(pack?.bundledInApk).toBe(true);
    expect(pack?.approxMb).toBeLessThanOrEqual(8);
  });

  it("ships great-words authors catalog in APK (offline)", () => {
    expect(APK_BUNDLED_JSON).toContain("great-words-catalog.json");
    expect(REMOTE_BUNDLED_JSON).not.toContain("great-words-catalog.json");
    expect(APK_SLIM_REMOTE_JSON).not.toContain("great-words-catalog.json");
  });

  it("offline JSON has five reading locales and no stub-lang fields", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundle = require("../../../assets/bundled/quran-translations-offline.json") as {
      locales?: string[];
      surahs?: Array<{ ayahs?: Array<Record<string, string | number>> }>;
    };
    expect(bundle.locales).toEqual(["ru", "en", "tr", "uz", "ky"]);
    expect(bundle.surahs?.length).toBe(114);
    const ayah = bundle.surahs?.[0]?.ayahs?.[0];
    expect(ayah).toBeTruthy();
    expect(String(ayah?.textRu ?? "").length).toBeGreaterThan(5);
    expect(String(ayah?.textEn ?? "").length).toBeGreaterThan(5);
    expect(ayah).not.toHaveProperty("textZh");
    expect(ayah).not.toHaveProperty("textFa");
    expect(ayah).not.toHaveProperty("textId");
  });
});
