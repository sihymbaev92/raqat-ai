#!/usr/bin/env node
/** dhikr-list.json: атау, транскрипция, мағына — түсінікті және дұрыс болуы үшін. */
const fs = require("fs");
const path = require("path");

/** Тізімдегі атау (textKk): қазақша түсінікті, «…» жоқ. */
const TEXTKK_BY_SLUG = {
  hasbunallah: "Хасбуна Аллаһу уә ни'ма уәл-уәкил",
  la_hawla: "Ла хаула уә ла қуввата илла билләһ",
  rabbana_atina: "Раббана әтина (дүние, ахирет, от)",
  allahumma_barik: "Мұхаммедке береке (барик)",
  la_hawla_quwwata: "Ла хаула ('алий 'азим)",
  "hasbunallahu_wa_ni'mal_wakil_full": "Хасбуна Аллаһу (толық нұсқа)",
  inna_lillahi: "Инна лиллаһи уә инна иләйһи ражи'ун",
  rabbanagh_fir: "Раббана, ғфир лана",
  allahumma_salim: "Салаамат сақта (саллимни)",
  allahumma_inni_asaluka: "Жәннәт сұрау",
  allahumma_atina: "Дүниеде жақсылық сұрау",
  ma_shaa_allah: "Ма шаАллаһ",
  rabbishrah: "Рабби, шраһ ли садри",
  wa_qul_rabb: "Уә қул: Рабби, зидни 'илман",
  allahumma_ghfir: "Кешірім мен мейірім сұрау",
  allahumma_inni_audhu: "Шайтаннан пана (дуа)",
  audhu_billahi: "А'узу билләһи минаш-шайтанир-раджим",
  allahumma_atini: "Зікір мен шүкірде көмек",
  allahumma_salli_full: "Пайғамбарға салли уә саллим",
  salawat_ibrahim_short: "Ибраһимия (бастауы)",
  allahumma_rabbana: "Раббана һаб лана (бастауы)",
  istighfar_sayyid: "Сәйидуль-истигфар (бастауы)",
  subhan_bi_hamd_subhan_azim: "СубханаЛлаһи уә бихамдиһи, СубханаЛлаһил-'азим",
  la_ilaha_full_tawhid: "Ла илаһа (толық тәухид)",
  allahumma_antarabbi: "Сәйидуль-истигфар (басы)",
  rabbi_ighfir_warham: "Рабби, ғфир уәрхам",
  allahumma_lakal_hamd: "Раббана ләкал хамд",
  allahumma_barik_rizq: "Ризықта береке",
  audhu_hamm_wal_hazan: "Қайғы мен мазасыздықтан пана",
  audhu_ajz_wal_kasal: "Әлсіздік пен жалқаулықтан пана",
  asaluka_ilman_nafia: "Пайдалы білім сұрау",
  asaluka_alhuda: "Хидаят сұрау",
  allahumma_afuww: "Кешірім дұғасы ('афув)",
  allahumma_nur_qalb: "Жүрекке нұр сал",
  allahumma_afwa_afiya: "Кешірім мен амандық",
  allahumma_hasib_yasir: "Жеңіл есеп сұрау",
  rabbana_la_tuzigh: "Раббана, лә тузиғ қулубана",
  allahumma_anta_salam: "Аллаһумма, антас-салам",
  allahumma_ftah_li: "Мейірім есіктерін аш",
  allahumma_inni_zalamtu: "Истигфар (заламту нафси)",
  allahumma_rzuqni: "Халал ризық сұрау",
  allahumma_qini_azab: "Азаптан сақта",
  wa_ila_rabbika_farghab: "Уә илә раббика фарғаб",
  allahumma_laka_sumtu: "Ораза ашар дұғасы",
  allahumma_salli_muhammadin: "Аллаһумма, салли 'алә Мұхаммад",
  allahumma_ghfir_muslimin: "Мұсылмандарды кешір",
  wala_taknatu: "Уә ла тай'асу мин рауһиллаһ",
  rabbi_ighfirli_108: "Рабби, ғфир ли",
  subhan_dhikr2: "Субхана зил-Жәләли уәл-икрам",
  dhikr_fabi_ayyi_2: "Табаракасму раббика зил-Жәләли",
  subhan_dhi_mulk: "Субхана зил-мулки уәл-малакут",
};

const TRANSLIT_BY_SLUG = {
  "hasbunallahu_wa_ni'mal_wakil_full":
    "Хасбуна Аллаһу уә ни'ма уәл-уәкил, ни'ма әл-маула уә ни'ма ән-наасыр",
  subhan_dhikr2: "Субхана зил-Жәләли уәл-икрам",
  dhikr_fabi_ayyi_2: "Табаракасму раббика зил-Жәләли уәл-икрам",
  subhan_dhi_mulk: "Субхана зил-мулки уәл-малакут",
  allahumma_ftah_li: "Аллаһумма, фтәх ли әбуәба рахматик",
};

const MEANING_FIXES = [
  [/Бізге Аллаһ жеткілікті — ең жақсы қорғаушы\./g, "Бізге Аллаһ жеткілікті — Ол ең жақсы Мәулә және Насир."],
  [/Раббым, кеудемді жайғастыр \(20:25\)\./g, "Раббым, кеудемді жайластыр (20:25)."],
  [/Айт: Таң Раббысынан пана тілеймін \(Фалақ бастауы\)\./g, "Айт: Таң Раббысынан пана тілеймін («Әл-Фалақ» сүресінің бастауы)."],
  [/Айт: Адамдар Раббысынан пана тілеймін \(Нас бастауы\)\./g, "Айт: Адамдар Раббысынан пана тілеймін («Ән-Нас» сүресінің бастауы)."],
  [/Ибраһимия \(бастапқы\)/g, "Ибраһимия (бастауы)"],
  [/Раббана һаб лана \(бастапқы\)/g, "Раббана һаб лана (бастауы)"],
  [/Сәййидül-истигфар \(бастапқы\)/g, "Сәйидуль-истигфар (бастауы)"],
  [/Уа, көмек беруші/g, "Уа көмек беруші"],
];

function applyMeaningFixes(raw) {
  let t = raw;
  for (const [re, rep] of MEANING_FIXES) t = t.replace(re, rep);
  return t;
}

function fixTextKkGlobal(raw) {
  return raw
    .replace(/ уа /g, " уә ")
    .replace(/^Уа /g, "Уә ")
    .replace(/Мухаммад/g, "Мұхаммад")
    .replace(/биллаһ([^и' ])/g, "билләһ$1")
    .replace(/бастапқы/g, "бастауы")
    .replace(/…/g, "")
    .replace(/Раббишрах/g, "Рабби, шраһ")
    .replace(/Раббанағфир/g, "Раббана, ғфир")
    .replace(/Раббиғфир/g, "Рабби, ғфир")
    .replace(/уарҳам/g, "уәрхам")
    .replace(/уархам/g, "уәрхам")
    .replace(/,\s*$/g, "")
    .trim();
}

const jsonPath = path.join(__dirname, "../assets/bundled/dhikr-list.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
let textChanged = 0;
let translitChanged = 0;
let meaningChanged = 0;

for (const item of data.items ?? []) {
  if (TEXTKK_BY_SLUG[item.slug]) {
    const next = TEXTKK_BY_SLUG[item.slug];
    if (item.textKk !== next) {
      item.textKk = next;
      textChanged += 1;
    }
  } else {
    const next = fixTextKkGlobal(item.textKk);
    if (next !== item.textKk) {
      item.textKk = next;
      textChanged += 1;
    }
  }

  if (TRANSLIT_BY_SLUG[item.slug] && item.translitKk !== TRANSLIT_BY_SLUG[item.slug]) {
    item.translitKk = TRANSLIT_BY_SLUG[item.slug];
    translitChanged += 1;
  }

  if (item.meaningKk) {
    const next = applyMeaningFixes(item.meaningKk);
    if (next !== item.meaningKk) {
      item.meaningKk = next;
      meaningChanged += 1;
    }
  }
}

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(
  `dhikr clarity: ${textChanged} textKk, ${translitChanged} translitKk, ${meaningChanged} meaningKk`
);
