import { QURAN_RECITER_OPTIONS } from "../../config/quranReciters";
import { TOTAL_AYAHS } from "../../data/quranAyahCounts";
import {
  quranAudioDownloadReciterBlocks,
  quranAudioDownloadTaskAt,
  quranAudioDownloadTotalTasks,
} from "../quranAudioDownloadManifest";

describe("quranAudioDownloadManifest", () => {
  it("builds one full 6236-ayah block for every configured reciter", () => {
    const blocks = quranAudioDownloadReciterBlocks().filter((b) => b.kind === "ayah");

    expect(blocks).toHaveLength(QURAN_RECITER_OPTIONS.length);
    expect(blocks.every((b) => b.count === TOTAL_AYAHS)).toBe(true);
  });

  it("downloads Mahmud Al-Husary as full ayah audio instead of Mossad selected surahs", () => {
    const husaryBlock = quranAudioDownloadReciterBlocks().find((b) => b.edition === "ar.husary");
    expect(husaryBlock?.kind).toBe("ayah");
    expect(husaryBlock?.count).toBe(TOTAL_AYAHS);

    const firstHusary = husaryBlock ? quranAudioDownloadTaskAt(husaryBlock.start) : null;
    expect(firstHusary?.kind).toBe("ayah");
    expect(firstHusary?.surah).toBe(1);
    expect(firstHusary?.ayah).toBe(1);
    expect(firstHusary?.uri).toBe("https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001001.mp3");
  });

  it("keeps total task count deterministic for all configured reciters", () => {
    expect(quranAudioDownloadTotalTasks()).toBe(QURAN_RECITER_OPTIONS.length * TOTAL_AYAHS);
  });
});
