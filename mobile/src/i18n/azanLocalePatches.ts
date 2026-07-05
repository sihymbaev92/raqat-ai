/** Namaz azan screen copy — ky/uz LOCALE_PATCHES prayer кеңейтулері. */

export const PRAYER_AZAN_PATCH_KY = {
  azanScreenKicker: "Намаз убактысы башталды",
  azanScreenDefaultLabel: "Намаз",
  azanScreenBody:
    "Азан толук окулат. Керек болсо, төмөнкү баскыч менен токтотуп койсоңуз болот.",
  azanTextPanelTitle: "Азан тексти",
  azanScreenStop: "Азанды токтотуу",
  azanScreenStopped: "Азан токтотулду",
  azanTextBlocks: [
    {
      id: "takbir-open",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Аллаху акбар",
      meaning: "Аллах улуу.",
      repeat: "4 жолу",
    },
    {
      id: "shahada-tawhid",
      arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Ашхаду алля иляха илля-Ллах",
      meaning: "Аллахтан башка сыйынууга татыктуу кудай жок экенине күбөлүк берем.",
      repeat: "2 жолу",
    },
    {
      id: "shahada-risala",
      arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
      translit: "Ашхаду анна Мухаммадан расулю-Ллах",
      meaning: "Мухаммад — Аллахтын элчиси экенине күбөлүк берем.",
      repeat: "2 жолу",
    },
    {
      id: "hayya-salah",
      arabic: "حَيَّ عَلَى الصَّلَاةِ",
      translit: "Хайя 'аля-с-салях",
      meaning: "Намазга шашыңыз.",
      repeat: "2 жолу",
    },
    {
      id: "hayya-falah",
      arabic: "حَيَّ عَلَى الْفَلَاحِ",
      translit: "Хайя 'аля-ль-фалях",
      meaning: "Жетишкендикке шашыңыз.",
      repeat: "2 жолу",
    },
    {
      id: "takbir-close",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Аллаху акбар",
      meaning: "Аллах улуу.",
      repeat: "2 жолу",
    },
    {
      id: "tahlil",
      arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Ля иляха илля-Ллах",
      meaning: "Аллахтан башка сыйынууга татыктуу кудай жок.",
    },
  ],
  fajrAzanTextBlock: {
    id: "fajr-extra",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    translit: "Ас-саляту хайрум-минан-наум",
    meaning: "Намаз уктоодон жакшы.",
    repeat: "2 жолу",
  },
  azanDuaTextBlock: {
    id: "azan-dua",
    arabic:
      "اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Аллахумма рабба хазихи-д-да'вати-т-таммати ва-с-саляти-ль-ка'имати, ати Мухаммадан аль-василата ва-ль-фадилата, ваб'асху макамам-махмуданил-лязи ва'адтах, иннака ля тухлифу-ль-ми'ад.",
    meaning:
      "Аллахым, бул толук чакыруу жана турган намаздын Раббы! Мухаммадыга васила менен артыкчылык бер, ал уадаган мактоолуу ордуна көтөр. Чындыгында, Сен уададыңды бузбайсың.",
  },
} as const;

export const PRAYER_AZAN_PATCH_UZ = {
  azanScreenKicker: "Namoz vaqti boshlandi",
  azanScreenDefaultLabel: "Namoz",
  azanScreenBody:
    "Azon to'liq o'qiladi. Kerak bo'lsa, quyidagi tugma bilan to'xtating.",
  azanTextPanelTitle: "Azon matni",
  azanScreenStop: "Azonni to'xtatish",
  azanScreenStopped: "Azon to'xtatildi",
  azanTextBlocks: [
    {
      id: "takbir-open",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allohu akbar",
      meaning: "Alloh buyukdir.",
      repeat: "4 marta",
    },
    {
      id: "shahada-tawhid",
      arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Ashhadu alla ilaha illalloh",
      meaning: "Guvohlik beramanki, Allohdan boshqa ibodatga loyiq xudo yo'q.",
      repeat: "2 marta",
    },
    {
      id: "shahada-risala",
      arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
      translit: "Ashhadu anna Muhammadan rasululloh",
      meaning: "Guvohlik beramanki, Muhammad Allohning elchisidir.",
      repeat: "2 marta",
    },
    {
      id: "hayya-salah",
      arabic: "حَيَّ عَلَى الصَّلَاةِ",
      translit: "Hayya 'ala-s-saloh",
      meaning: "Namozga shoshiling.",
      repeat: "2 marta",
    },
    {
      id: "hayya-falah",
      arabic: "حَيَّ عَلَى الْفَلَاحِ",
      translit: "Hayya 'ala-l-faloh",
      meaning: "Felohga shoshiling.",
      repeat: "2 marta",
    },
    {
      id: "takbir-close",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allohu akbar",
      meaning: "Alloh buyukdir.",
      repeat: "2 marta",
    },
    {
      id: "tahlil",
      arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "La ilaha illalloh",
      meaning: "Allohdan boshqa ibodatga loyiq xudo yo'q.",
    },
  ],
  fajrAzanTextBlock: {
    id: "fajr-extra",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    translit: "As-salotu hayrun minan-nawm",
    meaning: "Namoz uyqudan yaxshidir.",
    repeat: "2 marta",
  },
  azanDuaTextBlock: {
    id: "azan-dua",
    arabic:
      "اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Allohumma rabba hazihid-da'vatit-tammati vas-salotil-qoimati, ati Muhammadan al-vasilata val-fadilata, vab'ashu maqoman mahmudanil-laziy va'dtah, innaka la tuhliful-mi'od.",
    meaning:
      "Ey Alloh, bu to'liq chaqiriq va o'qiladigan namozning Robbi! Muhammadga vasila va fazilat ber, va va'da qilgan maqtovli maqomga ko'tar. Albatta, Sen va'dangdan qaytmaysan.",
  },
} as const;
