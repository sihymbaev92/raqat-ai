import AsyncStorage from "@react-native-async-storage/async-storage";
import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import { getOnboardingDone, setOnboardingDone } from "../../storage/prefs";

describe("first-launch language onboarding prefs", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setCurrentLocale("kk");
  });

  it("marks onboarding done only after explicit setOnboardingDone", async () => {
    expect(await getOnboardingDone()).toBe(false);
    await setCurrentLocale("ru");
    expect(kk.common.close).not.toMatch(/Жабу/);
    expect(await getOnboardingDone()).toBe(false);
    await setOnboardingDone();
    expect(await getOnboardingDone()).toBe(true);
  });
});
