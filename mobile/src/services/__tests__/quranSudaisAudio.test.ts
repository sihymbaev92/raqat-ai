import {
  cdnAyahBitrateKbps,
  quranAyahMp3Url,
  quranReciterHasAudioForGlobalAyah,
  quranReciterUsesAyahAudio,
} from "../quranSudaisAudio";
import {
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
  QURAN_KK_HALIFAH_ALTAI_EDITION,
  QURAN_RU_KULIEV_EDITION,
} from "../../config/quranReciters";

describe("cdnAyahBitrateKbps", () => {
  it("қазақ және орыс редакциялары 128", () => {
    expect(cdnAyahBitrateKbps(QURAN_KK_HALIFAH_ALTAI_EDITION)).toBe(128);
    expect(cdnAyahBitrateKbps(QURAN_RU_KULIEV_EDITION)).toBe(128);
  });

  it("Судәис сияқты кейбір араб қарилары 192", () => {
    expect(cdnAyahBitrateKbps("ar.abdurrahmaansudais")).toBe(192);
  });

  it("Әл-Афаси сияқты кейбір араб қарилары 128", () => {
    expect(cdnAyahBitrateKbps("ar.alafasy")).toBe(128);
  });
});

describe("quranAyahMp3Url", () => {
  it("қазақ редакциясы үшін CDN 128 kbps жолын қолданады", () => {
    const u = quranAyahMp3Url(1, QURAN_KK_HALIFAH_ALTAI_EDITION);
    expect(u).toContain("/quran/audio/128/");
    expect(u).toContain(`/${QURAN_KK_HALIFAH_ALTAI_EDITION}/1.mp3`);
  });

  it("орыс (Кулиев) редакциясы үшін CDN 128 kbps", () => {
    const u = quranAyahMp3Url(42, QURAN_RU_KULIEV_EDITION);
    expect(u).toBe(
      `https://cdn.islamic.network/quran/audio/128/${QURAN_RU_KULIEV_EDITION}/42.mp3`,
    );
  });

  it("араб қарилары үшін әдепті 192 kbps (Судәис)", () => {
    const u = quranAyahMp3Url(1, "ar.abdurrahmaansudais");
    expect(u).toContain("/quran/audio/192/");
  });

  it("Әл-Афаси үшін 128 kbps", () => {
    const u = quranAyahMp3Url(5, "ar.alafasy");
    expect(u).toContain("/quran/audio/128/ar.alafasy/5.mp3");
  });

  it("Абдурахман Моссад үшін бар таңдаулы сүреге archive mp3 қайтарады", () => {
    const u = quranAyahMp3Url(1365, QURAN_ABDULRAHMAN_MOSSAD_EDITION);
    expect(u).toBe("https://ia904706.us.archive.org/13/items/010_20221110/010.mp3");
    expect(quranReciterUsesAyahAudio(QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(false);
  });

  it("Абдурахман Моссад source-та жоқ сүреге қате береді", () => {
    expect(quranReciterHasAudioForGlobalAyah(1, QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(false);
    expect(() => quranAyahMp3Url(1, QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toThrow();
  });
});
