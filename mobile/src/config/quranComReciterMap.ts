/**
 * islamic.network edition → Quran.com API v4 `audio` reciter id (Murattal).
 * Timestamp segments тек осы қариларда қолжетімді.
 */
export const QURAN_COM_AUDIO_RECITER_ID: Partial<Record<string, number>> = {
  "ar.abdurrahmaansudais": 3,
  "ar.abdulbasitmurattal": 2,
  "ar.husary": 6,
  "ar.mahermuaiqly": 7,
};

export function quranComReciterIdForEdition(edition: string): number | null {
  const id = QURAN_COM_AUDIO_RECITER_ID[edition.trim().toLowerCase()];
  return typeof id === "number" && id > 0 ? id : null;
}
