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
    title: "Тәлбия – дұғасы",
    oqylyLabel: "Оқылуы",
    magynasyLabel: "Мағынасы",
    arabic: ARABIC,
    oqyly: KK_OQYLY,
    magynasy: KK_MAGYNASY,
  },
  ru: {
    title: "Тальбия — молитва принятия",
    oqylyLabel: "Произношение",
    magynasyLabel: "Смысл",
    arabic: ARABIC,
    oqyly:
      "«Лаббайка, Аллахумма, лаббайк. Лаббайка ля шарика ляка лаббайк. Инналь-хамда ван-ниъмата ляка валь-мульк. Ля шарика ляк»",
    magynasy:
      "«Я у Тебя, о Аллах, я у Тебя. Я у Тебя, у Тебя нет сотоварища, я у Тебя. Поистине, вся хвала и блага, и власть — Твои. У Тебя нет сотоварища»",
  },
  en: {
    title: "Talbiyah — prayer of response",
    oqylyLabel: "Recitation",
    magynasyLabel: "Meaning",
    arabic: ARABIC,
    oqyly:
      "“Labbayka Allahumma labbayk. Labbayka la sharika laka labbayk. Innal-hamda wan-ni’mata laka wal-mulk. La sharika lak.”",
    magynasy:
      "“Here I am at Your service, O Allah. Here I am. You have no partner; here I am. Truly all praise, blessings and sovereignty are Yours alone. You have no partner.”",
  },
  ar: {
    title: "التلبية — دعاء الإجابة",
    oqylyLabel: "التلاوة",
    magynasyLabel: "المعنى",
    arabic: ARABIC,
    oqyly: ARABIC,
    magynasy:
      "لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك.",
  },
  ky: {
    title: "Талбия — кабыл алуу дубасы",
    oqylyLabel: "Окулушу",
    magynasyLabel: "Маанисы",
    arabic: ARABIC,
    oqyly: KK_OQYLY,
    magynasy: KK_MAGYNASY,
  },
  uz: {
    title: "Talbiya — qabul duosi",
    oqylyLabel: "O‘qilishi",
    magynasyLabel: "Ma’nosi",
    arabic: ARABIC,
    oqyly:
      "«Labbayka, Allohumma, labbayk. Labbayka la sharika laka labbayk. Inna al-hamda va nni’mata laka va al-mulk. La sharika lak»",
    magynasy:
      "«Ey Alloh, Sening huzuringdaman. Sheriking yo‘q, Sening huzuringdaman. Haqiqatan hamdu sanolar, ne’matlar va mulk Seniki. Sheriking yo‘q»",
  },
  tr: {
    title: "Telbiye — kabul duası",
    oqylyLabel: "Okunuşu",
    magynasyLabel: "Anlamı",
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
