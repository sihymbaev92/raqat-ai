import type { TraditionAudioBlessing } from "./traditionContentTypes";

export type TraditionBataCategory =
  | "daily"
  | "family"
  | "child"
  | "wedding"
  | "travel"
  | "health"
  | "celebration"
  | "guest"
  | "work"
  | "faith"
  | "community";

export type TraditionBataEntry = TraditionAudioBlessing & {
  category: TraditionBataCategory;
  categoryLabel: string;
};

const RAW: Array<Omit<TraditionBataEntry, "duration"> & { duration?: string }> = [
  {
    "id": "bata-001",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Таңертеңгі бата",
    "text": "Бисмилләһир рахманир рахим.\n\nЖаңа күн берекелі болсын.\nНиетіңіз таза, ісіңіз оң болсын.\nАлла разы болсын. Әмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-002",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Кешкі бата",
    "text": "Бисмилләһир рахманир рахим.\n\nКешіңіз тыныш, үйіңіз аман болсын.\nЖүрегіңізге сабыр, отбасыңызға мейірім берсін.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-003",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Жұмысқа шығу батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nІсіңіз оң, табысыңыз берекелі болсын.\nАлла еңбегіңізге баракат берсін.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-004",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Оқуға бата",
    "text": "Бисмилләһир рахманир рахим.\n\nБіліміңіз нық, ақылыңыз ашық болсын.\nАлла ғылым мен иман жолына жетектесін.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-005",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Демалыс батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nДемалысыңыз тыныш, деніңіз жеңіл болсын.\nАлла жүрегіңізге шипа берсін.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-006",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Жаңа іске бата",
    "text": "Бисмилләһир рахманир рахим.\n\nЖаңа ісіңіз берекелі, ниетіңіз ақ болсын.\nАлла қадамыңызды нығайтсын.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-007",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Күн батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nБүгінгі күніңіз игілікпен аяқталсын.\nКешке есен жетіңіз.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-008",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Үйден шығу батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nЖолыңыз ашық, қайтуыңыз сәтті болсын.\nАлла сақтасын.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-009",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Үйге оралу батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nЕсен оралдыңыз, үйіңізге береке кірсін.\nАлла разы болсын.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-010",
    "category": "daily",
    "categoryLabel": "Күнделікті",
    "topicId": "bata-beru",
    "title": "Түнгі тыныштық батасы",
    "text": "Бисмилләһир рахманир рахим.\n\nҰйқыңыз тыныш, түсіңіз жақсы болсын.\nАлла отбасыңызды сақтасын.\nӘмин.",
    "sourceLabel": "Күнделікті батасы"
  },
  {
    "id": "bata-011",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Ата-анаға бата",
    "text": "Ата-аналарыңыз аман, жүрегі тыныш болсын.\nАлла оларға ұзақ өмір, сабыр берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-012",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Ұл-қызға бата",
    "text": "Ұрпағыңыз өнегелі, елге пайдалы болсын.\nАлла денсаулық пен иман берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-013",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Отбасы бірлігі батасы",
    "text": "Үйіңіз тату, сөзіңіз жылы болсын.\nАлла отбасыңызға мейірім берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-014",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Ағайын батасы",
    "text": "Ағайындарыңыз аман, байланысыңыз берекелі болсын.\nАлла туыстықты сақтасын.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-015",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Жас ұрпаққа бата",
    "text": "Жас ұрпақ ақылды, әдепті, білімді болсын.\nАлла жолыңызды ашық етсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-016",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Қарияға құрмет батасы",
    "text": "Қарияларыңыз аман, құрметіңіз артсын.\nАлла ұзақ өмір берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-017",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Отбасы тыныштығы батасы",
    "text": "Үйіңізде тыныштық, жүрегіңізде сабыр болсын.\nАлла береке берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-018",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Ұрпаққа бата",
    "text": "Ұрпағыңыз аман, ата-анаға құрметті болсын.\nАлла нәсібін игілікке берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-019",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Жаңа туғанға бата",
    "text": "Жаңа туған нәресте аман, ата-анаға қуаныш болсын.\nАлла денсаулық берсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-020",
    "category": "family",
    "categoryLabel": "Отбасы",
    "topicId": "ata-ana-qurmeti",
    "title": "Отбасы мейірім батасы",
    "text": "Жүрегіңізге мейірім, тіліңізге жылы сөз берсін.\nАлла отбасыңызды біріктірсін.",
    "sourceLabel": "Отбасы батасы"
  },
  {
    "id": "bata-021",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Бесік батасы",
    "text": "Бесігің берік, ұйқың тыныш болсын.\nАлла деніңе саулық, жүрегіңе иман берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-022",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Тұсаукесер батасы",
    "text": "Қадамың құтты, жолың ашық болсын.\nЖақсыға жақын, жаманнан алыс болып өс.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-023",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға ақыл батасы",
    "text": "Ақылың ашық, тілің игі болсын.\nАлла ғылым мен әдеп берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-024",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға сабыр батасы",
    "text": "Сабырың мықты, жүрегің тыныш болсын.\nАлла иманыңды нығайтсын.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-025",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға береке батасы",
    "text": "Өмірің берекелі, ниетің таза болсын.\nАлла ризығыңды кеңейтсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-026",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға қорған бата",
    "text": "Алла сені жамандықтан сақтасын.\nАлла жақсы ұстаздармен жолықтырсын.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-027",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға денсаулық батасы",
    "text": "Денің мықты, күшің нық болсын.\nАлла шипа мен қуат берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-028",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға иман батасы",
    "text": "Жүрегіңде иман, көзіңде нұр болсын.\nАлла тағдырыңды игілікке берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-029",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға өнер батасы",
    "text": "Қолың игі, өнерің көркем болсын.\nАлла еңбегіңе баракат берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-030",
    "category": "child",
    "categoryLabel": "Бала",
    "topicId": "besikke-salu",
    "title": "Балаға тәрбие батасы",
    "text": "Әдебің жоғары, сөзің жылы болсын.\nАлла ата-анаңа қуаныш берсін.",
    "sourceLabel": "Бала батасы"
  },
  {
    "id": "bata-031",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Неке батасы",
    "text": "Некеңіз берекелі, ерлі-зайыпты өмірлеріңіз тату болсын.\nАлла отбасыңызды аман ұстасын.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-032",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Жас жұбайға бата",
    "text": "Жүрегіңіз бір, ниетіңіз таза болсын.\nАлла мейірім берсін.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-033",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Құда түсу батасы",
    "text": "Құдалықтарыңыз берекелі, екі жақ разы болсын.\nАлла ниеттеріңізді игілікке жеткізсін.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-034",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Келінге бата",
    "text": "Жаңа шаңырағыңызға береке кірсін.\nАта-енеге ізет, үйге мейірім берсін.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-035",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Күйеуге бата",
    "text": "Жолың ашық, отбасың тату болсын.\nАлла жүгіңді жеңілдетсін.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-036",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Қыз ұзату батасы",
    "text": "Қадамың құтты, абыройың сақталсын.\nАлла жаңа өміріңе береке берсін.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-037",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Беташар батасы",
    "text": "Жаңа отбасыңызға қуаныш, құрмет берсін.\nАлла бірлікті нығайтсын.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-038",
    "category": "wedding",
    "categoryLabel": "Неке/үйлену",
    "topicId": "neke-qiyu",
    "title": "Үйлену тойы батасы",
    "text": "Тойыңыз ырысты, қонақтарыңыз разы болсын.\nАлла ұрпағыңызды аман ұстасын.",
    "sourceLabel": "Неке/үйлену батасы"
  },
  {
    "id": "bata-039",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Жол батасы",
    "text": "Жолыңыз ақ, қадамыңыз нық болсын.\nАлла сапарыңызды аман аяқтасын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-040",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Шетелге шығу батасы",
    "text": "Сапарыңыз аман, елдегі жанұяңыз аман болсын.\nАлла сақтасын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-041",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Қайту батасы",
    "text": "Қайтуыңыз сәтті, үйіңізге береке кірсін.\nАлла есен жеткізсін.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-042",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Көлікке отыру батасы",
    "text": "Жолыңыз қауіпсіз, ниетіңіз игі болсын.\nАлла қорғасын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-043",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Қонақүй батасы",
    "text": "Тұрағыңыз тыныш, демалысыңыз жеңіл болсын.\nАлла сақтасын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-044",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Сапар аяқтау батасы",
    "text": "Сапарыңыз игілікпен аяқталсын.\nАлла разы болсын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-045",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Жолдасқа бата",
    "text": "Жолдасыңыз игі, сапарыңыз берекелі болсын.\nАлла бірлікті сақтасын.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-046",
    "category": "travel",
    "categoryLabel": "Сапар",
    "topicId": "bata-beru",
    "title": "Қашық сапар батасы",
    "text": "Арақашықтық жүрек байланысын әлсіретпесін.\nАлла хабарласып тұруға береке берсін.",
    "sourceLabel": "Сапар батасы"
  },
  {
    "id": "bata-047",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Науқасқа бата",
    "text": "Алла шипа берсін, деніңіз қалпына келсін.\nСабыр мен тыныштық берсін.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-048",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Емге бата",
    "text": "Еміңіз пайдалы, дәрігердің қолы берекелі болсын.\nАлла сауықтырсын.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-049",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Аурудан айығу батасы",
    "text": "Алла дертіңізді жеңілдетсін.\nСауығып, игі іске оралыңыз.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-050",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Операция алдында бата",
    "text": "Алла қолды берекелі етсін.\nНиетіңіз таза, сабырыңыз мықты болсын.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-051",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Денсаулық батасы",
    "text": "Деніңіз мықты, күш-қуатыңыз артсын.\nАлла шипа берсін.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-052",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Қарияға бата",
    "text": "Жасыңыз ұзақ, деніңіз жеңіл болсын.\nАлла сабыр берсін.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-053",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Жарақатқа бата",
    "text": "Алла жараңызды тез жазсын.\nҚорғаныңызды күшейтсін.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-054",
    "category": "health",
    "categoryLabel": "Денсаулық",
    "topicId": "bata-beru",
    "title": "Психикалық тыныштық батасы",
    "text": "Жүрегіңізге тыныштық, ойыңызға анықтық берсін.\nАлла сабыр берсін.",
    "sourceLabel": "Денсаулық батасы"
  },
  {
    "id": "bata-055",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Той батасы",
    "text": "Қуанышыңыз ұзақ, берекеңіз мол болсын.\nАлла разылығын берсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-056",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Наурыз батасы",
    "text": "Жаңа көктем берекелі болсын, үйіңізге ырыс кірсін.\nАлла шүкірге жеткізсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-057",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Айт батасы",
    "text": "Айтыңыз мүбәрак, намазыңыз қабыл болсын.\nАлла береке берсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-058",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Туған күн батасы",
    "text": "Жаңа жасыңыз игілікпен өтсін.\nАлла денсаулық берсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-059",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Жеңіс/қуаныш батасы",
    "text": "Қуанышыңыз шүкірмен ұлассын.\nАлла ниетіңізді қабыл етсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-060",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Мерекелік ас батасы",
    "text": "Дастархан берекелі, жүрек жылы болсын.\nАлла разылық берсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-061",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Жаңа мамандық батасы",
    "text": "Жаңа белесте табысыңыз берекелі болсын.\nАлла жолыңызды ашық етсін.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-062",
    "category": "celebration",
    "categoryLabel": "Той/мереке",
    "topicId": "toy-madenieti",
    "title": "Үй тойы батасы",
    "text": "Шаңырағыңыз берекелі, қонақтарыңыз разы болсын.\nАлла отбасыңызды аман ұстасын.",
    "sourceLabel": "Той/мереке батасы"
  },
  {
    "id": "bata-063",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Ас батасы",
    "text": "Ас берекелі, дастархан ырысты болсын.\nАлла разы болсын.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-064",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Қонаққа бата",
    "text": "Қонақтарыңыз игі, үйіңізге береке кірсін.\nАлла мейірім берсін.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-065",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Дастарқан батасы",
    "text": "Дастарханға ырыс, жүрекке шуақ берсін.\nАлла сауап берсін.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-066",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Қонақжайлылық батасы",
    "text": "Қабылдауыңыз жылы, ниетіңіз таза болсын.\nАлла береке берсін.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-067",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Ас беру батасы",
    "text": "Берген асыңыз сауапты, қабылдаушы разы болсын.\nАлла еселеп берсін.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-068",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Қонақ кету батасы",
    "text": "Жолыңыз ашық, қайтуыңыз аман болсын.\nАлла сақтасын.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-069",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Ортақ ас батасы",
    "text": "Ортақ ас берекелі, бірлік нығайсын.\nАлла разы болсын.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-070",
    "category": "guest",
    "categoryLabel": "Қонақ/ас",
    "topicId": "qonaq-kutu",
    "title": "Қонақүй иесіне бата",
    "text": "Қонақжайлылығыңыз игілікке айналсын.\nАлла ризығыңызды кеңейтсін.",
    "sourceLabel": "Қонақ/ас батасы"
  },
  {
    "id": "bata-071",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Еңбек батасы",
    "text": "Еңбегіңіз берекелі, табысыңыз игі болсын.\nАлла баракат берсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-072",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Кәсіп батасы",
    "text": "Кәсібіңіз нық, клиенттеріңіз разы болсын.\nАлла ризығыңызды кеңейтсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-073",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Студентке бата",
    "text": "Емтиханыңыз оң, біліміңіз нық болсын.\nАлла ақылыңызды ашсын.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-074",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Мұғалімге бата",
    "text": "Еңбегіңіз сауапты, шәкірттеріңіз игі болсын.\nАлла береке берсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-075",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Дәрігерге бата",
    "text": "Қолыңыз шипалы, ниетіңіз таза болсын.\nАлла жәрдеміңізді қабыл етсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-076",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Фермерге бата",
    "text": "Егініңіз бітік, малыңыз аман болсын.\nАлла ризығын берекелі етсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-077",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Жаңа лауазым батасы",
    "text": "Жаңа лауазымда адал, пайдалы болыңыз.\nАлла жолыңызды ашық етсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-078",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Серіктестік батасы",
    "text": "Серіктестігіңіз берекелі, келісіміңіз нық болсын.\nАлла игілік берсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-079",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Шеберге бата",
    "text": "Қолыңыз игі, өніміңіз сапалы болсын.\nАлла еңбегіңізге баракат берсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-080",
    "category": "work",
    "categoryLabel": "Еңбек/білім",
    "topicId": "bata-beru",
    "title": "Жоба батасы",
    "text": "Жобаңыз сәтті, командаңыз бірлесіп жұмыс істесін.\nАлла нәтижеге жеткізсін.",
    "sourceLabel": "Еңбек/білім батасы"
  },
  {
    "id": "bata-081",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Рамазан батасы",
    "text": "Рамазаныңыз қабыл, оразаңыз берекелі болсын.\nАлла кешірім берсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-082",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Ораза ашу батасы",
    "text": "Ауыз ашқанда шүкір, дастархан берекелі болсын.\nАлла сауап берсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-083",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Жұма батасы",
    "text": "Жұмаңыз мүбәрак, намазыңыз қабыл болсын.\nАлла дұғаңызды қабыл етсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-084",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Құрбан айт батасы",
    "text": "Құрбан айтыңыз мүбәрак, ниетіңіз таза болсын.\nАлла разы болсын.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-085",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Мешітке бата",
    "text": "Қадамыңыз сауапты, жүрегіңіз тыныш болсын.\nАлла иманыңызды нығайтсын.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-086",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Қажылық батасы",
    "text": "Қажылығыңыз қабыл, сапарыңыз аман болсын.\nАлла разы болсын.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-087",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Тарауих батасы",
    "text": "Тарауихыңыз берекелі, Құран оқуыңыз игі болсын.\nАлла сауап берсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-088",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Зекет батасы",
    "text": "Зекетіңіз қабыл, ниетіңіз таза болсын.\nАлла еселеп берсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-089",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Дұға батасы",
    "text": "Дұғаңыз қабыл, жүрегіңіз тыныш болсын.\nАлла игілік берсін.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-090",
    "category": "faith",
    "categoryLabel": "Дін/ғибадат",
    "topicId": "bata-beru",
    "title": "Иман нығайту батасы",
    "text": "Иманыңыз нығая берсін, жүрегіңіз Аллаға жақын болсын.\nАлла разы болсын.",
    "sourceLabel": "Дін/ғибадат батасы"
  },
  {
    "id": "bata-091",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Бірлік батасы",
    "text": "Бірлігің бекем, тірлігің көркем болсын.\nЕл аман, жұрт тыныш болсын.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-092",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Асар батасы",
    "text": "Асарыңыз берекелі, қолғабысыңыз игі болсын.\nАлла сауап берсін.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-093",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Көрші батасы",
    "text": "Көршілігіңіз тыныш, мейірімді болсын.\nАлла бірлікті сақтасын.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-094",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Ел амандығы батасы",
    "text": "Еліміз аман, жұртымыз тыныш болсын.\nАлла бірлікті нығайтсын.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-095",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Жастарға бата",
    "text": "Жастар білімді, әдепті, отанына адал болсын.\nАлла жолдарыңызды ашық етсін.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-096",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Қарттарға бата",
    "text": "Қарттар аман, оларға деген құрмет артсын.\nАлла ұзақ өмір берсін.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-097",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Көмек батасы",
    "text": "Көмегіңіз игілікке айналсын.\nАлла еселеп берсін.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-098",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Жанжалдан сақтау батасы",
    "text": "Алла жүрегіңізге сабыр, тіліңізге игілік берсін.\nБірлік сақталсын.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-099",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Қала/ауыл батасы",
    "text": "Ауылыңыз аман, егініңіз бітік болсын.\nАлла ризығын берекелі етсін.",
    "sourceLabel": "Қоғам/ел батасы"
  },
  {
    "id": "bata-100",
    "category": "community",
    "categoryLabel": "Қоғам/ел",
    "topicId": "asar",
    "title": "Жаңа қоныс батасы",
    "text": "Жаңа қонысыңыз ырысты, көршілігіңіз берекелі болсын.\nАлла үйіңізді аман ұстасын.",
    "sourceLabel": "Қоғам/ел батасы"
  }
];

/** 100 дәстүрлі бата мәтіні — дінмен үйлесетін дұға форматында. */
export const TRADITION_BATA_CATALOG: TraditionBataEntry[] = RAW.map((b) => ({
  ...b,
  duration: b.duration ?? "01:00",
}));

export function getAllTraditionBatas(): TraditionBataEntry[] {
  return TRADITION_BATA_CATALOG;
}

export function getTraditionBataById(id: string): TraditionBataEntry | undefined {
  return TRADITION_BATA_CATALOG.find((b) => b.id === id);
}

export function getTraditionBatasByCategory(category: TraditionBataCategory): TraditionBataEntry[] {
  return TRADITION_BATA_CATALOG.filter((b) => b.category === category);
}

export function searchTraditionBatas(query: string): TraditionBataEntry[] {
  const q = query.trim().toLocaleLowerCase("kk-KZ");
  if (!q) return TRADITION_BATA_CATALOG;
  return TRADITION_BATA_CATALOG.filter((b) =>
    [b.title, b.text, b.categoryLabel, b.sourceLabel].join(" ").toLocaleLowerCase("kk-KZ").includes(q)
  );
}
