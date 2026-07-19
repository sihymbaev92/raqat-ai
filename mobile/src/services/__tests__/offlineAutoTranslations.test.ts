import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  autoTranslateText,
  autoTranslationUnavailableText,
} from "../autoTranslate";
import {
  getOfflineAutoTranslation,
  hashAutoTranslateSource,
} from "../offlineAutoTranslations";
import { isUsableOfflineAutoTranslation } from "../offlineAutoTranslationSafety";

describe("offlineAutoTranslations", () => {
  it("uses stable source hashes for bundled dictionary lookup", () => {
    expect(hashAutoTranslateSource("Құран")).toBe("1fvitgj");
    expect(getOfflineAutoTranslation("Құран", "en")).toBe("Quran");
    expect(getOfflineAutoTranslation("Құран", "ru")).toBe("Коран");
  });

  it("lets autoTranslateText resolve bundled translations without network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    await expect(autoTranslateText("Басты бет", "en")).resolves.toBe("Home");
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("does not fetch runtime machine translations for missing bundled text", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const source = ["Бұл жаңа мәтін offline сөздікке әлі кірмеген", "987654321"].join(" ");

    await expect(autoTranslateText(source, "en")).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("does not tell users to connect to the internet for offline translation gaps", () => {
    const text = [
      autoTranslationUnavailableText("ru"),
      autoTranslationUnavailableText("en"),
      autoTranslationUnavailableText("tr"),
      autoTranslationUnavailableText("ky"),
      autoTranslationUnavailableText("uz"),
      autoTranslationUnavailableText("ar"),
    ].join("\n");

    expect(text).not.toMatch(/internet|интернет|offline|офлайн|çevrimdışı|离线|آفلاین|ऑफ़लाइन|ئینتەرنێت/i);
  });

  it("rejects corrupt generated translation fragments before they reach the UI", () => {
    expect(isUsableOfflineAutoTranslation("Quran")).toBe(true);
    expect(isUsableOfflineAutoTranslation("This text will be translated soon.")).toBe(false);
    expect(
      isUsableOfflineAutoTranslation(
        'It teaches to apply in life.", offlineSectionTitle: "Chevrimdışı okuma", sahihTab: "Sahih külliyat"'
      )
    ).toBe(false);
    expect(isUsableOfflineAutoTranslation("settings: { title: \"Settings\", languageSection: \"Language\" }")).toBe(false);
    expect(isUsableOfflineAutoTranslation("undefined")).toBe(false);
  });

  it("rejects corrupt cached translation fragments", async () => {
    const source = "Жаңа тест мәтіні";
    await AsyncStorage.setItem(
      `raqat_mt_v1_en_${hashAutoTranslateSource(source)}`,
      'settings: { title: "Settings", languageSection: "Language" }'
    );

    await expect(autoTranslateText(source, "en")).resolves.toBeNull();
  });
});
