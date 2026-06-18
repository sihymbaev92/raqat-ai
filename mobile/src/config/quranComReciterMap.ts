/** Quran.com API reciter id + дәл сол timestamp metadata-ға сәйкес MP3 source. */
export type QuranComTimedAudioBinding = {
  reciterId: number;
  audioUrlForPaddedAyahKey: (paddedAyahKey: string) => string;
};

const LEGACY_MOSSAD_SELECTED_EDITION = "archive.abdulrahman-mossad-selected";

function normalizeQuranComTimedEdition(edition: string): string {
  const e = edition.trim().toLowerCase();
  return e === LEGACY_MOSSAD_SELECTED_EDITION ? "ar.husary" : e;
}

/**
 * islamic.network edition → Quran.com API v4 `audio` reciter id + matching MP3.
 * Timestamp segments тек осы қариларда қолжетімді; басқа қариларға жалған binding жасамаймыз.
 */
export const QURAN_COM_TIMED_AUDIO_BINDINGS: Partial<Record<string, QuranComTimedAudioBinding>> = {
  "ar.abdurrahmaansudais": {
    reciterId: 3,
    audioUrlForPaddedAyahKey: (key) => `https://verses.quran.com/Sudais/mp3/${key}.mp3`,
  },
  "ar.abdulbasitmurattal": {
    reciterId: 2,
    audioUrlForPaddedAyahKey: (key) => `https://verses.quran.com/AbdulBaset/Murattal/mp3/${key}.mp3`,
  },
  "ar.husary": {
    reciterId: 6,
    audioUrlForPaddedAyahKey: (key) => `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/${key}.mp3`,
  },
  "ar.alafasy": {
    reciterId: 7,
    audioUrlForPaddedAyahKey: (key) => `https://verses.quran.com/Alafasy/mp3/${key}.mp3`,
  },
};

export function quranComTimedAudioBindingForEdition(edition: string): QuranComTimedAudioBinding | null {
  return QURAN_COM_TIMED_AUDIO_BINDINGS[normalizeQuranComTimedEdition(edition)] ?? null;
}

export function quranComReciterIdForEdition(edition: string): number | null {
  return quranComTimedAudioBindingForEdition(edition)?.reciterId ?? null;
}

export function quranComTimedAudioUrlForEdition(edition: string, paddedAyahKey: string): string | null {
  return quranComTimedAudioBindingForEdition(edition)?.audioUrlForPaddedAyahKey(paddedAyahKey) ?? null;
}
