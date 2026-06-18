import {
  cdnAyahBitrateKbps,
  quranAyahMp3Url,
  quranReciterHasAudioForGlobalAyah,
  quranReciterSupportsArabicKaraoke,
  quranReciterUsesAyahAudio,
} from "../quranSudaisAudio";
import {
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
  QURAN_ALAFASY_EDITION,
  QURAN_HUSARY_EDITION,
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

  it("Судәис үшін Quran.com timing-пен сәйкес MP3 source қолданады", () => {
    const u = quranAyahMp3Url(1, "ar.abdurrahmaansudais");
    expect(u).toBe("https://verses.quran.com/Sudais/mp3/001001.mp3");
    expect(quranAyahMp3Url(8, "ar.abdurrahmaansudais")).toBe(
      "https://verses.quran.com/Sudais/mp3/002001.mp3"
    );
  });

  it("Әл-Афаси үшін Quran.com timing-пен сәйкес MP3 source қолданады", () => {
    const u = quranAyahMp3Url(1, QURAN_ALAFASY_EDITION);
    expect(u).toBe("https://verses.quran.com/Alafasy/mp3/001001.mp3");
  });

  it("Mahmud Al-Husary үшін Quran.com segment timing source-ымен бірдей audio қайтарады", () => {
    const u = quranAyahMp3Url(1, QURAN_HUSARY_EDITION);
    expect(u).toBe("https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3");
    expect(quranReciterUsesAyahAudio(QURAN_HUSARY_EDITION)).toBe(true);
    expect(quranReciterHasAudioForGlobalAyah(1, QURAN_HUSARY_EDITION)).toBe(true);
  });

  it("ескі Mossad preference-ін Husary URL-ына көшіреді", () => {
    expect(quranReciterHasAudioForGlobalAyah(1, QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(true);
    expect(quranAyahMp3Url(1, QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(
      "https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3"
    );
  });
});

describe("quranReciterSupportsArabicKaraoke", () => {
  it("enables Arabic word karaoke only for reciters with exact Quran.com timing", () => {
    expect(quranReciterSupportsArabicKaraoke("ar.abdurrahmaansudais")).toBe(true);
    expect(quranReciterSupportsArabicKaraoke(QURAN_HUSARY_EDITION)).toBe(true);
    expect(quranReciterSupportsArabicKaraoke(QURAN_ALAFASY_EDITION)).toBe(true);
    expect(quranReciterSupportsArabicKaraoke(QURAN_ABDULRAHMAN_MOSSAD_EDITION)).toBe(true);
    expect(quranReciterSupportsArabicKaraoke("ar.mahermuaiqly")).toBe(false);
    expect(quranReciterSupportsArabicKaraoke(QURAN_KK_HALIFAH_ALTAI_EDITION)).toBe(false);
    expect(quranReciterSupportsArabicKaraoke(QURAN_RU_KULIEV_EDITION)).toBe(false);
  });
});
