import { QURAN_KK_HALIFAH_ALTAI_EDITION, QURAN_RECITER_OPTIONS } from "../../config/quranReciters";
import { TOTAL_AYAHS } from "../../data/quranAyahCounts";
import {
  quranAudioDownloadReciterBlocks,
  quranAudioDownloadTaskAt,
  quranAudioDownloadTotalTasks,
} from "../quranAudioDownloadManifest";

describe("quranAudioDownloadManifest", () => {
  it("builds one 6236-ayah block for the selected reciter edition", () => {
    const blocks = quranAudioDownloadReciterBlocks(QURAN_KK_HALIFAH_ALTAI_EDITION).filter((b) => b.kind === "ayah");

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.edition).toBe(QURAN_KK_HALIFAH_ALTAI_EDITION);
    expect(blocks[0]?.count).toBe(TOTAL_AYAHS);
  });

  it("downloads Mahmud Al-Husary as full ayah audio instead of Mossad selected surahs", () => {
    const husaryBlock = quranAudioDownloadReciterBlocks("ar.husary").find((b) => b.edition === "ar.husary");
    expect(husaryBlock?.kind).toBe("ayah");
    expect(husaryBlock?.count).toBe(TOTAL_AYAHS);

    const firstHusary = husaryBlock ? quranAudioDownloadTaskAt(husaryBlock.start, "ar.husary") : null;
    expect(firstHusary?.kind).toBe("ayah");
    expect(firstHusary?.surah).toBe(1);
    expect(firstHusary?.ayah).toBe(1);
    expect(firstHusary?.uri).toBe("https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3");
  });

  it("keeps total task count to one reciter at a time", () => {
    expect(quranAudioDownloadTotalTasks(QURAN_KK_HALIFAH_ALTAI_EDITION)).toBe(TOTAL_AYAHS);
    expect(quranAudioDownloadTotalTasks()).toBe(TOTAL_AYAHS);
    expect(QURAN_RECITER_OPTIONS.length).toBeGreaterThan(4);
  });
});
