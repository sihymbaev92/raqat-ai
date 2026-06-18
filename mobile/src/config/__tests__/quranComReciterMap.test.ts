import { quranComReciterIdForEdition, quranComTimedAudioUrlForEdition } from "../quranComReciterMap";

describe("quranComReciterMap", () => {
  it("maps Sudais edition to Quran.com audio id", () => {
    expect(quranComReciterIdForEdition("ar.abdurrahmaansudais")).toBe(3);
  });

  it("returns null for non-timestamped editions", () => {
    expect(quranComReciterIdForEdition("kk.khalifahaltai-audio")).toBeNull();
    expect(quranComReciterIdForEdition("ar.mahermuaiqly")).toBeNull();
  });

  it("maps Alafasy to Quran.com id 7 and matching MP3 source", () => {
    expect(quranComReciterIdForEdition("ar.alafasy")).toBe(7);
    expect(quranComTimedAudioUrlForEdition("ar.alafasy", "001001")).toBe(
      "https://verses.quran.com/Alafasy/mp3/001001.mp3"
    );
  });

  it("binds legacy Mossad preference to Husary timing instead of losing karaoke", () => {
    expect(quranComReciterIdForEdition("archive.abdulrahman-mossad-selected")).toBe(6);
    expect(quranComTimedAudioUrlForEdition("archive.abdulrahman-mossad-selected", "001001")).toBe(
      "https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3"
    );
  });
});
