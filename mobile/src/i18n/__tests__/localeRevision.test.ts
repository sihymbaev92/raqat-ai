import { setCurrentLocale, getCurrentLocale, getLocaleRevision } from "../runtime";
import { useI18n } from "../useI18n";

/**
 * Runtime smoke: revision bumps on locale apply so UI can remount/re-render.
 * (Hook itself is covered indirectly via leak tests.)
 */
describe("localeRevision", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("increments revision when locale changes", async () => {
    await setCurrentLocale("kk");
    const r0 = getLocaleRevision();
    await setCurrentLocale("ru");
    expect(getCurrentLocale()).toBe("ru");
    expect(getLocaleRevision()).toBeGreaterThan(r0);
    const r1 = getLocaleRevision();
    await setCurrentLocale("en");
    expect(getLocaleRevision()).toBeGreaterThan(r1);
  });
});
