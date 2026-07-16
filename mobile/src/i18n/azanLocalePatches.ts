/** Namaz azan screen copy — ky/uz/tr/ar LOCALE_PATCHES prayer кеңейтулері. */

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
      "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Аллахумма рабба хазихи-д-да'вати-т-таммати ва-с-саляти-ль-ка'имати, ати Мухаммадан аль-василата ва-ль-фадилата вад-даражатар-рафи'а. Ваб'асху макамам-махмуданил-лязи ва'адтах. Иннака ля тухлифул-ми'ад.",
    meaning:
      "Аллахым, бул толук азан жана окулуучу намаздын Раббы! Мухаммадга васила, артыкчылык жана жогорку даража бер! Аны убада кылган «Махмуд» ордуна жеткир. Сен убадаңды бузбайсың.",
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
      "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Allohumma rabba hazihid-da'vatit-tammati vas-salotil-qoimati, ati Muhammadan al-vasilata val-fadilata vad-darajatar-rafi'a. Vab'ashu maqoman mahmudanil-laziy va'dtah. Innaka la tukhliful-mi'ad.",
    meaning:
      "Ey Alloh, bu to'liq azon va o'qiladigan namozning Robbi! Muhammadga vasila, fazilat va yuksak daraja ber! Uni va'da qilgan «Mahmud» maqomiga yetkaz. Sen va'dangni buzmaysan.",
  },
} as const;

export const PRAYER_AZAN_PATCH_TR = {
  azanScreenKicker: "Namaz vakti girdi",
  azanScreenDefaultLabel: "Namaz",
  azanScreenBody:
    "Ezan tam okunur. Gerekirse aşağıdaki düğmeyle durdurabilirsiniz.",
  azanTextPanelTitle: "Ezan metni",
  azanScreenStop: "Ezanı durdur",
  azanScreenStopped: "Ezan durduruldu",
  azanTextBlocks: [
    {
      id: "takbir-open",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allahu ekber",
      meaning: "Allah en büyüktür.",
      repeat: "4 kez",
    },
    {
      id: "shahada-tawhid",
      arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Eşhedü en lâ ilâhe illallah",
      meaning: "Şahitlik ederim ki Allah'tan başka ibadete layık ilah yoktur.",
      repeat: "2 kez",
    },
    {
      id: "shahada-risala",
      arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
      translit: "Eşhedü enne Muhammeden rasûlullah",
      meaning: "Şahitlik ederim ki Muhammed Allah'ın elçisidir.",
      repeat: "2 kez",
    },
    {
      id: "hayya-salah",
      arabic: "حَيَّ عَلَى الصَّلَاةِ",
      translit: "Hayye ale's-salâh",
      meaning: "Namaz'a koşun.",
      repeat: "2 kez",
    },
    {
      id: "hayya-falah",
      arabic: "حَيَّ عَلَى الْفَلَاحِ",
      translit: "Hayye ale'l-felâh",
      meaning: "Kurtuluşa koşun.",
      repeat: "2 kez",
    },
    {
      id: "takbir-close",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allahu ekber",
      meaning: "Allah en büyüktür.",
      repeat: "2 kez",
    },
    {
      id: "tahlil",
      arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Lâ ilâhe illallah",
      meaning: "Allah'tan başka ibadete layık ilah yoktur.",
    },
  ],
  fajrAzanTextBlock: {
    id: "fajr-extra",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    translit: "Es-salâtü hayrun mine'n-nevm",
    meaning: "Namaz uykudan hayırlıdır.",
    repeat: "2 kez",
  },
  azanDuaTextBlock: {
    id: "azan-dua",
    arabic:
      "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Allahümme rabbe hâzihi'd-da'veti't-tâmme ve's-salâti'l-kâime, âti Muhammedeni'l-vesîlete ve'l-fazîleh ve'd-derecete'r-rafî'a. Veb'ashü makâmen mahmûdeni'llezî vaadtah. İnneke lâ tuhlifu'l-mîâd.",
    meaning:
      "Allah'ım, bu eksiksiz ezanın ve kılınan namazın Rabbi! Muhammed'e vesile, fazilet ve yüce derece ver! Onu vaat ettiğin «Mahmud» makamına yükselt. Sen vaadini bozmazsın.",
  },
} as const;

export const PRAYER_AZAN_PATCH_AR = {
  azanScreenKicker: "دخل وقت الصلاة",
  azanScreenDefaultLabel: "صلاة",
  azanScreenBody:
    "يُقرأ الأذان كاملاً. يمكنك إيقافه بالزر أدناه عند الحاجة.",
  azanTextPanelTitle: "نص الأذان",
  azanScreenStop: "إيقاف الأذان",
  azanScreenStopped: "تم إيقاف الأذان",
  azanTextBlocks: [
    {
      id: "takbir-open",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allāhu akbar",
      meaning: "الله أكبر.",
      repeat: "4 مرات",
    },
    {
      id: "shahada-tawhid",
      arabic: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Ashhadu allā ilāha illā Allāh",
      meaning: "أشهد أن لا إله إلا الله.",
      repeat: "مرتين",
    },
    {
      id: "shahada-risala",
      arabic: "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ",
      translit: "Ashhadu anna Muḥammadan rasūl Allāh",
      meaning: "أشهد أن محمدًا رسول الله.",
      repeat: "مرتين",
    },
    {
      id: "hayya-salah",
      arabic: "حَيَّ عَلَى الصَّلَاةِ",
      translit: "Ḥayya ʿalā aṣ-ṣalāh",
      meaning: "حيّ على الصلاة.",
      repeat: "مرتين",
    },
    {
      id: "hayya-falah",
      arabic: "حَيَّ عَلَى الْفَلَاحِ",
      translit: "Ḥayya ʿalā al-falāḥ",
      meaning: "حيّ على الفلاح.",
      repeat: "مرتين",
    },
    {
      id: "takbir-close",
      arabic: "اللَّهُ أَكْبَرُ",
      translit: "Allāhu akbar",
      meaning: "الله أكبر.",
      repeat: "مرتين",
    },
    {
      id: "tahlil",
      arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
      translit: "Lā ilāha illā Allāh",
      meaning: "لا إله إلا الله.",
    },
  ],
  fajrAzanTextBlock: {
    id: "fajr-extra",
    arabic: "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ",
    translit: "Aṣ-ṣalātu khayrun mina n-nawm",
    meaning: "الصلاة خير من النوم.",
    repeat: "مرتين",
  },
  azanDuaTextBlock: {
    id: "azan-dua",
    arabic:
      "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    translit:
      "Allāhumma rabba hādhihi d-daʿwati t-tāmmati waṣ-ṣalāti l-qāʾimah, āti Muḥammadan al-wasīlata wa l-faḍīlata wa d-darajata r-rafīʿah. Wabʿathhu maqāman maḥmūdan alladhī waʿadtah. Innaka lā tukhlifu l-mīʿād.",
    meaning:
      "اللهم رب هذا الأذان التام والصلاة القائمة، آت محمدًا الوسيلة والفضيلة والدرجة الرفيعة، وابعثه مقامًا محمودًا الذي وعدته، إنك لا تخلف الميعاد.",
  },
} as const;
