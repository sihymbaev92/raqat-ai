import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";

describe("runtime offline locale patches", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("translates direct kk string lookups through the offline bundle for full offline locales", async () => {
    await setCurrentLocale("ky");

    expect(kk.common.close).toBe("Жабуу");
    expect(kk.tabs.home).toBe("Башкы");
  });

  it("keeps manual locale patches above generated offline patches", async () => {
    await setCurrentLocale("ru");

    expect(kk.common.close).toBe("Закрыть");
    expect(kk.tabs.home).toBe("Главная");
  });
});
