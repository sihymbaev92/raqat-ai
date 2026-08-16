import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getHatimArabicScriptEdition,
  setHatimArabicScriptEdition,
} from "../hatimPrefs";

describe("hatimPrefs arabic script edition", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to madinah", async () => {
    expect(await getHatimArabicScriptEdition()).toBe("madinah");
  });

  it("persists turkish edition for hatim only", async () => {
    await setHatimArabicScriptEdition("turkish");
    expect(await getHatimArabicScriptEdition()).toBe("turkish");
  });
});
