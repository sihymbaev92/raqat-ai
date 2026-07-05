/**
 * Сира — офлайн оқу бағдарламасы (38 сабақ, 7 кезең).
 * Мәтін қолданбаға кірген; бейне — опциялық YouTube сілтемесі.
 */
import type { ComponentProps } from "react";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type SeerahPhaseIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SeerahPhase = {
  id: string;
  titleKk: string;
  subtitleKk: string;
  introKk: string;
  icon: SeerahPhaseIcon;
};

export type SeerahLessonEntry = {
  n: number;
  phaseId: string;
  titleKk: string;
  summaryKk: string;
  focusKk: string;
};

export const SEERAH_PHASES: SeerahPhase[] = [
  {
    id: "pre",
    titleKk: "1. Арабия мен Мекке алдындағы дүние",
    subtitleKk: "сабақ 1–4",
    introKk:
      "Пайғамбар ﷺ дүниеге келгенге дейінгі Арабия мен Меккенің қоғамдық, экономикалық және рухани ортасы.",
    icon: "public",
  },
  {
    id: "childhood",
    titleKk: "2. Балажандық · жастық",
    subtitleKk: "сабақ 5–9",
    introKk: "Туылу, Халима, атасы мен шешесінің қайтыс болуы, Шам сапары, Зиджара және «ас-Садик» атануы.",
    icon: "child-care",
  },
  {
    id: "before",
    titleKk: "3. Пайғамбарлик алдындағы өмір",
    subtitleKk: "сабақ 10–14",
    introKk: "Хадиджа ﷼мен неке, Хира үңgірі, алғашқы уаһи, алғашқы мусылмандар мен ашық дауа.",
    icon: "mosque",
  },
  {
    id: "mekka",
    titleKk: "4. Меккедегі дауа · қуғын",
    subtitleKk: "сабақ 15–22",
    introKk: "Құрайш қысымы, Хабаш сапары, Шәб-i Абу Талиб, Таиф, Исра мен Миғраж, алғашқы бай'ат.",
    icon: "warning",
  },
  {
    id: "hijra",
    titleKk: "5. Хиджра · Мединаға қоныс",
    subtitleKk: "сабақ 23–27",
    introKk: "Хиджра жоспары, Мединаға көшу, ансар мен көшкендер бірлігі, Масжид ан-Нabawi.",
    icon: "flight-takeoff",
  },
  {
    id: "medina",
    titleKk: "6. Медина · мемлекет · соғыс",
    subtitleKk: "сабақ 28–34",
    introKk: "Бадр, Ухуд, Хандақ, Худейбия, Фатх Мекке, Табук — иман мен бірлік сынақтары.",
    icon: "home",
  },
  {
    id: "farewell",
    titleKk: "7. Прощание · мұра",
    subtitleKk: "сабақ 35–38",
    introKk: "Қоштасу қажылығы, Прощание хутбасы, Құран толықты, Пайғамбар ﷺ өмірден қайтысы.",
    icon: "star",
  },
];

export const SEERAH_LESSONS: SeerahLessonEntry[] = [
  { n: 1, phaseId: "pre", titleKk: "Арабия мен дүние", summaryKk: "VI ғасырдағы Арабия политикасы, сауда жолдары және рухани орта. Пайғамбар ﷺ дүниеге келгенге дейінгі әлемдік контекст.", focusKk: "Контекст" },
  { n: 2, phaseId: "pre", titleKk: "Мекке · Каaba", summaryKk: "Меккенің қасиеті, Каaba орталығы, Құрайш руы және қала экономикасы. Мекке — сауда мен діннің қиылысқан орны.", focusKk: "Мекке" },
  { n: 3, phaseId: "pre", titleKk: "Амин · Абдулла", summaryKk: "Пайғамбар ﷺ отбасы шежіресі: Бani Hashim, Абdulла мен Аминаның некесі. Нұрлы шежіре мен сенімді ру.", focusKk: "Шежіре" },
  { n: 4, phaseId: "pre", titleKk: "Туылу алдындағы белгілер", summaryKk: "Уаһи алдындағы рухани дайындық пен Меккедегі күтулер. Алла Тағала Пайғамбар ﷺ келуін дайындаған.", focusKk: "Белгілер" },
  { n: 5, phaseId: "childhood", titleKk: "Туылу · Халима", summaryKk: "571 жылы туылу, Халима бinti Abd al-Uzza қамқорлығы, сüt emу дәстүрі. Бalaжандықтағы бақыт пен табиғат.", focusKk: "Туылу" },
  { n: 6, phaseId: "childhood", titleKk: "Шам сапары · Бaħira", summaryKk: "Сапар барысында монах Бaħiraмен кездесу, керемет белгілер. Жастық шaқтағы алғашқы рухани ілтипат.", focusKk: "Сапар" },
  { n: 7, phaseId: "childhood", titleKk: "Ата-ана қайтыс болуы", summaryKk: "Абdulла мен Аминаның ерте қайтыс болуы; Абdul-Muttalib қамқорлығы. Жетімдік — sabir пен мейірім сабағы.", focusKk: "Жетімдік" },
  { n: 8, phaseId: "childhood", titleKk: "Зиджара · «ас-Садик»", summaryKk: "Жастықтағы адалдық, «Шыншыл» атануы, сенімділік. Меккеде Пайғамбар ﷺ әділдікпен tanilgan.", focusKk: "Адалдық" },
  { n: 9, phaseId: "childhood", titleKk: "Хилф әл-Фудул", summaryKk: "Зulmге қарсы біріккен kelisim — әділдікке берік тұру. Жастықта zulmge qarsy birlik.", focusKk: "Әділдік" },
  { n: 10, phaseId: "before", titleKk: "Хадиджа ﷼мен неке", summaryKk: "25 жасында неке, отбасы мейірімі, саудадағы сенім. Хадиджа ﷼ — алғашқы iman qolдаушы.", focusKk: "Неке" },
  { n: 11, phaseId: "before", titleKk: "Хира үңgірі", summaryKk: "Тanha ibadat, ойlanu, ruhani dayindiq. Хира — алғашқы уaһi alдындағы tynshilik орны.", focusKk: "Иbadat" },
  { n: 12, phaseId: "before", titleKk: "Алғашқы уaһi", summaryKk: "40 жасында Jibril ﷺ, «Oqi!» ayaty, Khadija ﷼ qoldauy. Payg'ambardyq baslanuy.", focusKk: "Уaһi" },
  { n: 13, phaseId: "before", titleKk: "Алғашқы мусылмандар", summaryKk: "Khadija, Ali, Zayd, Abu Bakr — alғashqy iman. Birinshi jamaat — otbasydan bastaldy.", focusKk: "Sahaba" },
  { n: 14, phaseId: "before", titleKk: "Ашық дауa", summaryKk: "As-Safa tausy, Quraysh qarsylygy baslanady. Ashyq da'wat — birlik pen sabir synamasy.", focusKk: "Da'wat" },
  { n: 15, phaseId: "mekka", titleKk: "Quraysh qysymy", summaryKk: "Musylmandarga qiyys, boykot, azap. Iman — qiyynshilyqta musteqim turu.", focusKk: "Qiyys" },
  { n: 16, phaseId: "mekka", titleKk: "Habash sapyry", summaryKk: "Negizgi musylmandar Najashi qorgauynda. Birinshi hijra — Habash zheli.", focusKk: "Habash" },
  { n: 17, phaseId: "mekka", titleKk: "Shäb-i Abu Talib", summaryKk: "Ushaq boykot, açlyq zhyldary. Birlik — qiyyn zhyldarda qorgau.", focusKk: "Boykot" },
  { n: 18, phaseId: "mekka", titleKk: "«Hüzün» zhyly", summaryKk: "Abu Talib pen Khadija qaytys bolu — qaygy zhyly. Sabir men tawakkal.", focusKk: "Qaygy" },
  { n: 19, phaseId: "mekka", titleKk: "Taif sapyry", summaryKk: "Taif qabylamady, biraq jannat perishteleri komektesedi. Qaytaru — da'wat zhanashyry.", focusKk: "Taif" },
  { n: 20, phaseId: "mekka", titleKk: "Isra uä Mi'raj", summaryKk: "Tun kiyiminde Qudsi ziyarat, bes namaz. Mi'raj — imannyn künalik timiri.", focusKk: "Mi'raj" },
  { n: 21, phaseId: "mekka", titleKk: "Bes namaz", summaryKk: "Namaz — imannyn künalik timiri. Mi'rajdan keiin namaz — musylman omirinin negizi.", focusKk: "Namaz" },
  { n: 22, phaseId: "mekka", titleKk: "Birinshi bay'at", summaryKk: "Medina azamattarymen kelisim. Aqaba bay'aty — Medinaga dayindiq.", focusKk: "Bay'at" },
  { n: 23, phaseId: "hijra", titleKk: "Hidjra zhosparlau", summaryKk: "Quraysh qudalygy, musylmandar Medinaga köshedi. Hidjra — zhana basy.", focusKk: "Hidjra" },
  { n: 24, phaseId: "hijra", titleKk: "Safa-Marwa", summaryKk: "Abu Bakr men Ali qalyp, Payg'ambardyn köshui. Hidjra — iman zhane birlik.", focusKk: "Kösh" },
  { n: 25, phaseId: "hijra", titleKk: "Medina qabyl auasy", summaryKk: "Ansar men muhajirler birligi. Medina — musylman qalasy.", focusKk: "Ansar" },
  { n: 26, phaseId: "hijra", titleKk: "Masjid an-Nabawi", summaryKk: "Meshit — birlik pen biliм ortalygy. Medinada birinshi jamaat ortalygy.", focusKk: "Meshit" },
  { n: 27, phaseId: "hijra", titleKk: "Muahat", summaryKk: "Brattyq shart — ansar men muhajirler. Birlik — Medina qalasyndagy negiz.", focusKk: "Brattyq" },
  { n: 28, phaseId: "medina", titleKk: "Badr oiasy", summaryKk: "624 zh. — imannyn zhauyngeriligi. Badr — birinshi ulken zhenis.", focusKk: "Badr" },
  { n: 29, phaseId: "medina", titleKk: "Uhud", summaryKk: "Sabir synamasy, Hamza ﷼ shahed. Uhud — sabir pen tawba sabagy.", focusKk: "Uhud" },
  { n: 30, phaseId: "medina", titleKk: "Handak", summaryKk: "Qala qorgauy, Salman Farsi ideyasy. Birlik — qala qorgauynda zhauapkershilik.", focusKk: "Handak" },
  { n: 31, phaseId: "medina", titleKk: "Hudeybiya", summaryKk: "Tinish sharty — strategiyalyq zhenis. Sabir — uzak merzimdi payda.", focusKk: "Hudeybiya" },
  { n: 32, phaseId: "medina", titleKk: "Fath Mekke", summaryKk: "630 zh. — keshirim men azat etu. Fath — keshirim men adildik.", focusKk: "Fath" },
  { n: 33, phaseId: "medina", titleKk: "Tabuk", summaryKk: "Sońgy ulken sapyr, sabir. Tabuk — iman pen zhauapkershilik.", focusKk: "Tabuk" },
  { n: 34, phaseId: "medina", titleKk: "Hajj oqytu", summaryKk: "Namaz, zaket, hajj — tolyq din. Din — kundelikti omirge enu.", focusKk: "Hajj" },
  { n: 35, phaseId: "farewell", titleKk: "Qosh tas hajj", summaryKk: "632 zh. — sońgy qajylyq. Qosh tas hajj — musylmandarga sońgy nasihat.", focusKk: "Qosh tas" },
  { n: 36, phaseId: "farewell", titleKk: "Proshanie hutbasy", summaryKk: "Adamdar teng, qan ustinde qan joq. Hutba — adildik pen birlik.", focusKk: "Hutba" },
  { n: 37, phaseId: "farewell", titleKk: "Qur'an tolqyndy", summaryKk: "Din tolqyndy — saqtaudy unyatpa. Qur'an — musylmandarga mura.", focusKk: "Qur'an" },
  { n: 38, phaseId: "farewell", titleKk: "Payg'ambardyn vafaty", summaryKk: "632 zh. 12 Rabi al-awwal — musylmandarga mura. Payg'ambar ﷺ — barsha ummetke ulgi.", focusKk: "Mura" },
];

export function getSeerahLessonsForPhase(phaseId: string): SeerahLessonEntry[] {
  return SEERAH_LESSONS.filter((l) => l.phaseId === phaseId);
}

export function getSeerahLesson(n: number): SeerahLessonEntry | undefined {
  return SEERAH_LESSONS.find((l) => l.n === n);
}

export function seerahOfflineCharCount(): number {
  return (
    SEERAH_PHASES.reduce((s, p) => s + p.introKk.length, 0) +
    SEERAH_LESSONS.reduce((s, l) => s + l.titleKk.length + l.summaryKk.length + l.focusKk.length, 0)
  );
}
