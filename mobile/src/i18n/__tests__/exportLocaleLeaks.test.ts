import fs from "node:fs";
import path from "node:path";
import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";
import { findKkLocaleLeaks } from "../localeLeakScan";

const OFFLINE_BUNDLE_PATH = path.join(
  __dirname,
  "../../../assets/bundled/offline-auto-translations-core.json"
);
const mockOfflineBundle = JSON.parse(fs.readFileSync(OFFLINE_BUNDLE_PATH, "utf8"));

jest.mock("../../utils/loadBundledJson", () => ({
  loadBundledJson: jest.fn(async (name: string) => {
    if (name === "offline-auto-translations-core.json") {
      return mockOfflineBundle;
    }
    return {};
  }),
  tryLoadBundledJson: jest.fn(async (name: string) => {
    if (name === "offline-auto-translations-core.json") {
      return mockOfflineBundle;
    }
    return null;
  }),
  releaseBundledJsonMemory: jest.fn(),
}));

const FULL_OFFLINE_LOCALES: AppLocale[] = ["ru", "en", "uz", "tr", "ar"];

describe("locale leak export guard", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("has no Kazakh letter leaks after offline bundle + manual patches", async () => {
    const byValue = new Map<string, { path: string; value: string }>();
    for (const locale of FULL_OFFLINE_LOCALES) {
      await setCurrentLocale(locale);
      for (const leak of findKkLocaleLeaks(kk)) {
        if (!byValue.has(leak.value)) byValue.set(leak.value, leak);
      }
    }
    const out = path.join(__dirname, "../../../tmp-locale-leaks.json");
    if (byValue.size > 0) {
      fs.writeFileSync(out, `${JSON.stringify([...byValue.values()], null, 2)}\n`, "utf8");
    } else if (fs.existsSync(out)) {
      fs.unlinkSync(out);
    }
    // eslint-disable-next-line no-console
    console.log(
      byValue.size > 0
        ? `Exported ${byValue.size} unique leak strings → ${out}`
        : "No Kazakh locale leaks — bundle is complete"
    );
    expect(byValue.size).toBe(0);
  });
});
