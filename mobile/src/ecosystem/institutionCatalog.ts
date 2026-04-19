import type { InstitutionSource } from "./types";

/**
 * Бірінші қадам: статикалық каталог (кейін API немесе JSON жүктеме).
 * Нақты әріптес қосылғанда жазбаларды ауыстыру немесе қосу жеткілікті.
 */
const SEED: InstitutionSource[] = [
  {
    id: "open-alquran-cloud",
    name: "Al Quran Cloud",
    country: "Ашық API · әлемдік",
    type: "open_data",
    websiteUrl: "https://alquran.cloud",
    descriptionKk:
      "Құран мәтіні, аудио және аудармалар үшін қоғамға ашық API. Қолданбадағы сүрелер тізімі осы көзден алынады.",
    provenance: {
      origin: "Al Quran Cloud (api.alquran.cloud)",
      recordedAt: "2026-04-12T00:00:00.000Z",
      licenseHint: "Сайттағы Terms / қолдану шарттары",
      evidenceKk:
        "Қолданба сүрелер тізімін https://api.alquran.cloud/v1/surah сұрауымен алады; дерек көзінің түпнұсқа JSON API осында. Құран мәтіні — ашық жария API.",
      evidenceUrl: "https://api.alquran.cloud/v1/surah",
    },
  },
  {
    id: "catalog-v0-format",
    name: "Institutional data format (RAQAT)",
    country: "—",
    type: "research",
    descriptionKk:
      "Институттық әріптестер жазбалары осы форматта көрсетіледі. Нақты келісім бойынша қосылады.",
    provenance: {
      origin: "RAQAT экожүйесі (ішкі схема)",
      recordedAt: "2026-04-12T00:00:00.000Z",
      evidenceKk:
        "Каталог жазбаларының құрылымы кодта institutionCatalog.ts және ecosystem/types.ts файлдарында анықталған; әр жазбада provenance өрістері міндетті.",
    },
  },
];

export function getInstitutionCatalog(): InstitutionSource[] {
  return SEED;
}
