import type { PlatformIslamicKbArticle } from "../services/platformApiClient";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";

/** Интернетсіз көрінетін бастапқы мақала үзінділері (толық мәтін — ресми сайтта). */
export const KB_ARTICLES_OFFLINE_SEED: PlatformIslamicKbArticle[] = [
  {
    document_id: 9001,
    site: "fatua",
    source_label: "Fatua.kz · ҚМДБ",
    title: "Зекет беру мерзімі мен мөлшері",
    excerpt:
      "Зекет — мусылманның міндеті. Нисаб, жыл толуы және 2,5% мөлшері жеке жағдайға байланысты. Нақты есеп пен үкім үшін ресми пәтуа мәтінін оқыңыз.",
    url: `${FATUA_KK_HOME_URL}search?q=${encodeURIComponent("зекет")}`,
    image_url: null,
  },
  {
    document_id: 9002,
    site: "muftyat",
    source_label: "Muftyat.kz · ҚМДБ",
    title: "Рамазан оразасы",
    excerpt:
      "Рамазан айы — ораза ұстау уақыты. Ниет, ауыз бекіту, ифтар сауабы туралы қысқаша түсінік. Толық нұсқаулық ресми мақалада.",
    url: `${MUFTYAT_KK_HOME_URL}search?q=${encodeURIComponent("ораза")}`,
    image_url: null,
  },
  {
    document_id: 9003,
    site: "fatua",
    source_label: "Fatua.kz · ҚМДБ",
    title: "Намаз уақыты мен қаза",
    excerpt:
      "Намаз — күн сайынғы ғибадат. Уақыт, дәрет, жамағат мәселелері фиқһ бойынша әртүрлі болуы мүмкін — ресми мәтінмен тексеріңіз.",
    url: `${FATUA_KK_HOME_URL}search?q=${encodeURIComponent("намаз")}`,
    image_url: null,
  },
  {
    document_id: 9004,
    site: "muftyat",
    source_label: "Muftyat.kz · ҚМДБ",
    title: "Неке мен отбасы",
    excerpt:
      "Неке — исламдағы отбасы негізі. Құжат, махр, неке шарты және отбасылық міндеттер туралы ресми материалдар.",
    url: `${MUFTYAT_KK_HOME_URL}search?q=${encodeURIComponent("неке")}`,
    image_url: null,
  },
  {
    document_id: 9005,
    site: "fatua",
    source_label: "Fatua.kz · ҚМДБ",
    title: "Құрбан айт",
    excerpt:
      "Құрбан шалу шарттары, уақыты және қаза туралы. Жеке жағдайда имам немесе Fatua.kz пәтуасына жүгініңіз.",
    url: `${FATUA_KK_HOME_URL}search?q=${encodeURIComponent("құрбан")}`,
    image_url: null,
  },
  {
    document_id: 9006,
    site: "muftyat",
    source_label: "Muftyat.kz · ҚМДБ",
    title: "Хадис пен сунна",
    excerpt:
      "Хадис — Пайғамбар ﷺ суннасы. Мақала үзінділері түсіндіру; ресми хадис аудармасы емес — дереккөзді тексеріңіз.",
    url: `${MUFTYAT_KK_HOME_URL}search?q=${encodeURIComponent("хадис")}`,
    image_url: null,
  },
];
