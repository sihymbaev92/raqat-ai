import type { AppLocale } from "../i18n/runtime";

export type TalbiyahHeroCopy = {
  title: string;
  oqylyLabel: string;
  magynasyLabel: string;
  /** Арабша (декоратив, RTL) */
  arabic?: string;
  oqyly: string;
  magynasy: string;
};

const ARABIC =
  "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ\nإِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لَا شَرِيكَ لَكَ";

const KK_OQYLY =
  "«Ләббәйкә Аллаһумма ләббәйк.\nЛәббәйкә лә шәрикә ләкә ләббәйк.\nИннәл-хамда, уән-ниъмәтә, ләкә уәл-мүлк.\nЛә шәрикә ләк»";
const KK_MAGYNASY =
  "«Уа, Аллаһым! Міне, мен Сенің алдыңдамын.\nМіне, мен Сенің алдыңдамын.\nСенің ешбір серігің жоқ.\nМіне, мен Сенің алдыңдамын.\nРасында мадақ та, нығмет те, мүлік те Саған ғана тән.\nСенің серігің жоқ»";

const COPY: Partial<Record<AppLocale, TalbiyahHeroCopy>> & { kk: TalbiyahHeroCopy; en: TalbiyahHeroCopy } = {
  kk: {
    title: "Тәлбия",
    oqylyLabel: "Транскрипция",
    magynasyLabel: "Аудармасы",
    arabic: ARABIC,
    oqyly: KK_OQYLY,
    magynasy: KK_MAGYNASY,
  },
  ru: {
    title: "Тальбия",
    oqylyLabel: "Транскрипция",
    magynasyLabel: "Перевод",
    arabic: ARABIC,
    oqyly:
      "«Лаббайка, Аллахумма, лаббайк. Лаббайка ля шарика ляка лаббайк. Инналь-хамда ван-ниъмата ляка валь-мульк. Ля шарика ляк»",
    magynasy:
      "«Я у Тебя, о Аллах, я у Тебя. Я у Тебя, у Тебя нет сотоварища, я у Тебя. Поистине, вся хвала и блага, и власть — Твои. У Тебя нет сотоварища»",
  },
  en: {
    title: "Talbiyah",
    oqylyLabel: "Transcription",
    magynasyLabel: "Translation",
    arabic: ARABIC,
    oqyly:
      "“Labbayka Allahumma labbayk. Labbayka la sharika laka labbayk. Innal-hamda wan-ni’mata laka wal-mulk. La sharika lak.”",
    magynasy:
      "“Here I am at Your service, O Allah. Here I am. You have no partner; here I am. Truly all praise, blessings and sovereignty are Yours alone. You have no partner.”",
  },
  ar: {
    title: "التلبية",
    oqylyLabel: "النطق",
    magynasyLabel: "المعنى",
    arabic: ARABIC,
    oqyly: ARABIC,
    magynasy:
      "معناها: أنا مقيم على طاعتك يا الله، أجيب دعوتك، لا شريك لك. إن الحمد والنعمة والملك لك وحدك.",
  },
  ky: {
    title: "Талбия",
    oqylyLabel: "Транскрипция",
    magynasyLabel: "Котормосу",
    arabic: ARABIC,
    oqyly:
      "«Лаббайка, Аллахумма, лаббайк.\nЛаббайка ла шарика лака лаббайк.\nИннал-хамда, ван-ниъмата, лака вал-мулк.\nЛа шарика лак»",
    magynasy:
      "«Оо, Аллахым! Мына мен Сенин алдыңдамын.\nСенин шеригиң жок, мына мен Сенин алдыңдамын.\nЧындыгында мактоо да, немат да, мүлк да Сага гана таандык.\nСенин шеригиң жок»",
  },
  uz: {
    title: "Talbiya",
    oqylyLabel: "Transkripsiya",
    magynasyLabel: "Tarjimasi",
    arabic: ARABIC,
    oqyly:
      "«Labbayka, Allohumma, labbayk. Labbayka la sharika laka labbayk. Inna al-hamda va nni’mata laka va al-mulk. La sharika lak»",
    magynasy:
      "«Ey Alloh, Sening huzuringdaman. Sheriking yo‘q, Sening huzuringdaman. Haqiqatan hamdu sanolar, ne’matlar va mulk Seniki. Sheriking yo‘q»",
  },
  tr: {
    title: "Telbiye",
    oqylyLabel: "Transkripsiyon",
    magynasyLabel: "Çeviri",
    arabic: ARABIC,
    oqyly:
      "“Lebbeyke Allahümme lebbeyk. Lebbeyke la şerike leke lebbeyk. İnnel-hamde ven-ni’mete leke vel-mülk. La şerike lek.”",
    magynasy:
      "“Buyur Allah’ım, buyur. Senin ortağın yok, buyur. Hamd, nimet ve mülk yalnızca Senindir. Senin ortağın yoktur.”",
  },
};

export function getTalbiyahHeroCopy(locale: AppLocale): TalbiyahHeroCopy {
  return COPY[locale] ?? COPY.en;
}
