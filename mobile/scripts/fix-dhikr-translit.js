#!/usr/bin/env node
/** dhikr-list.json: translitKk және textKk транскрипцияларын түзету. */
const fs = require("fs");
const path = require("path");

/** slug бойынша толық/дәл транскрипция (арабша мәтінге сәйкес). */
const SLUG_OVERRIDES = {
  subhan_wa_bihamdihi: "СубханаЛлаһи уә бихамдиһи",
  la_hawla: "Ла хаула уә ла қуввата илла билләһ",
  salawat_short: "Аллаһумма, салли 'алә Мұхаммадин уә 'алә әли Мұхаммад",
  rabbana_atina:
    "Раббана әтина фид-дунья хасанатан уә фил-ахирати хасанатан уә қина 'азабан-наар",
  allahumma_barik: "Аллаһумма, барик 'алә Мұхаммадин уә 'алә әли Мұхаммад",
  la_hawla_quwwata: "Ла хаула уә ла қуввата илла билләһил-'алиййил-'азим",
  subhan_wa_bihamdihi_kathir: "СубханаЛлаһи уә бихамдиһи, астағфируллаһ",
  raditu_billahi: "Родийту билләһи раббан уә бил-ислами дина",
  allahumma_salli_ala: "Саллаллаһу 'алә Мұхаммад",
  innahu_man: "Иннаһу ман йаттақи уә йасбир",
  inna_lillahi: "Инна лиллаһи уә инна иләйһи ражи'ун",
  hasbunallah: "Хасбуна Аллаһу уә ни'ма уәл-уәкил",
  hasbunallahu_wa_ni_mal_wakil_full:
    "Хасбуна Аллаһу уә ни'ма уәл-уәкил, ни'ма әл-маула уә ни'ма ән-наасыр",
  "hasbunallahu_wa_ni'mal_wakil_full":
    "Хасбуна Аллаһу уә ни'ма уәл-уәкил, ни'ма әл-маула уә ни'ма ән-наасыр",
  allahumma_bismika: "Аллаһумма, бисмика амуту уә ахйа",
  audhu_billahi: "А'узу билләһи минаш-шайтанир-раджим",
  allahumma_atini: "Аллаһумма, а'инни 'алә зикрика уә шукрик",
  subhan_fatimi: "СубханаЛлаһи уә бихамдиһи, 'адада халқиһи",
  la_ilaha_illallah_muhammad: "Мұхаммадур расулуллаһ",
  allahumma_salli_full: "Аллаһумма, салли уә саллим 'алә набийина Мұхаммад",
  salawat_ibrahim_short:
    "Аллаһумма, салли 'алә Мұхаммадин уә 'алә әли Мұхаммад, кәма салләйта 'алә Ибраһима уә 'алә әли Ибраһима",
  subhan_bi_hamd_subhan_azim: "СубханаЛлаһи уә бихамдиһи, СубханаЛлаһил-'азим",
  la_ilaha_full_tawhid:
    "Ла илаһа иллаллаһу уахдаһу ла шарика ләһу, ләһул-мулку уә ләһул-хамд, уә һуа 'алә күлли шәй'ин қадир",
  allahumma_antarabbi: "Аллаһумма, анта рабби ла илаһа илла анта, халақтани уә ана 'абдука",
  rabbishrah: "Рабби, шраһ ли садри",
  rabbana_la_tuzigh: "Раббана, лә тузиғ қулубана ба'да из һадайтана",
  wa_ma_tawfiqi: "Уә ма тәуфиқи илла билләһ",
  hasbi_tawakkul_full:
    "Һасбийаллаһу ла илаһа илла һуа, 'аләйһи тәуаккалту уә һуа раббул-'аршил-'азим",
  allahumma_anta_salam: "Аллаһумма, антас-саламу уә минкас-салам",
  la_mani_atayta: "Ла мани лима а'тайта уә ла му'ти лима мана'та",
  wallahu_khairul_hafizin: "УалЛлаһу хайрун һафиза уә һуа арҳамур-рахимин",
  sallallahu_alayhi_wa_sallam_short: "Саллаллаһу 'аләйһи уә саллам",
  allahumma_salli_muhammadin: "Аллаһумма, салли 'алә Мұхаммад",
  astaghfirullah_wa_atubu_212: "Астағфируллаһ уә әтубу илайһ",
};

/** Араб мәтіні бойынша каноникалық транскрипция (дубликаттарға тарату). */
const AR_OVERRIDES = {
  "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ": "Хасбуна Аллаһу уә ни'ма уәл-уәкил",
  "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ": "Ла хаула уә ла қуввата илла билләһ",
  "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ": "Аллаһумма, салли 'алә Мұхаммад",
  "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ": "Астағфируллаһ уә әтубу илайһ",
  "رَبِّ اشْرَحْ لِي صَدْرِي": "Рабби, шраһ ли садри",
  "رَبِّ اغْفِرْ لِي": "Рабби, ғфир ли",
  "رَبِّ يَسِّرْ": "Рабби, яссир",
  "سُبْحَانَ اللَّهِ": "СубханаЛлаһ",
  "الْحَمْدُ لِلَّهِ": "Әлхамдулиллаһ",
  "اللَّهُ أَكْبَرُ": "Аллаһу акбар",
  "لَا إِلَٰهَ إِلَّا اللَّهُ": "Ла илаһа иллаллаһ",
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ": "СубханаЛлаһи уә бихамдиһи",
  "رَبِّ اغْفِرْ وَارْحَمْ": "Рабби, ғфир уәрхам",
};

const TEXTKK_FIXES = [
  [/Мухаммадур расулullah/g, "Мұхаммадур расулуллаһ"],
  [/Раббана ла tuzиғ/g, "Раббана лә тузиғ"],
  [/Ниғмал мaula уа ниғман насир/g, "Ниғмал маула уә ниғман насир"],
  [/Инналлаһа юһиббут-таwабин/g, "Инналлаһа юхиббут-тәууабин"],
  [/Ла хаула уа ла қуввата илла билләһ/g, "Ла хаула уә ла қуввата илла билләһ"],
  [/Аллаһ тағалам, салли аля Мухаммад/g, "Аллаһ тағалам, салли 'алә Мұхаммад"],
  [/СубханаЛлаһи уа биҳамдиһи/g, "СубханаЛлаһи уә бихамдиһи"],
  [/Астағфируллаһ уа әтубу илайһ/g, "Астағфируллаһ уә әтубу илайһ"],
  [/Саллаллаһу 'аләйһи уа саллам/g, "Саллаллаһу 'аләйһи уә саллам"],
  [/СубханаЛлаһи уа биҳамдиһи астағфируллаһ/g, "СубханаЛлаһи уә бихамдиһи, астағфируллаһ"],
  [/Аллаһ тағалам, салли 'алә Мухаммад/g, "Аллаһ тағалам, салли 'алә Мұхаммад"],
  [/Саллаллаһу 'алә Мухаммад/g, "Саллаллаһу 'алә Мұхаммад"],
  [/СубханаЛлаһи уа биҳамдиһи…/g, "СубханаЛлаһи уә бихамдиһи…"],
  [/Уа ма тәуфиқи илла биллаһ/g, "Уә ма тәуфиқи илла билләһ"],
  [/Раддиту биллаһи рабба/g, "Родийту билләһи раббан"],
  [/Аллаһ тағалам, бисмика амуту уа ахйа/g, "Аллаһ тағалам, бисмика амуту уә ахйа"],
  [/Аллаһ тағалам, салли уа саллим/g, "Аллаһ тағалам, салли уә саллим"],
];

function fixTranslitKk(raw) {
  if (!raw || typeof raw !== "string") return raw;
  let t = raw
    .replace(/^Аллаһ тағалам,\s*/u, "Аллаһумма, ")
    .replace(/^Аллаһ тағалам\s+/u, "Аллаһумма, ");

  // وَ → уә (арабша «уа» жалғауы)
  t = t.replace(/ уа /g, " уә ");
  t = t.replace(/ уа'/g, " уә'");
  t = t.replace(/^Уа /g, "Уә ");

  // بِاللَّهِ → билләһ
  t = t.replace(/илла биллаһ/g, "илла билләһ");
  t = t.replace(/А'узу биллаһи/g, "А'узу билләһи");
  t = t.replace(/Раддиту биллаһи/g, "Родийту билләһи");
  t = t.replace(/Родийту биллаһи/g, "Родийту билләһи");

  // قُوَّةَ → қуввата
  t = t.replace(/қувватта/g, "қуввата");

  // Мұхаммед аты
  t = t.replace(/салли аля Мухаммад/g, "салли 'алә Мұхаммад");
  t = t.replace(/салли аля/g, "салли 'алә");
  t = t.replace(/Мухаммад/g, "Мұхаммад");

  // Хасбуна стилі
  t = t.replace(/ҲасбунаЛлаһу уә ниғмал уәкил/g, "Хасбуна Аллаһу уә ни'ма уәл-уәкил");
  t = t.replace(/ҺасбунаЛлаһу уә ниғмал уәкил/g, "Хасбуна Аллаһу уә ни'ма уәл-уәкил");

  return t;
}

function fixTextKk(raw) {
  if (!raw || typeof raw !== "string") return raw;
  let t = raw;
  for (const [re, rep] of TEXTKK_FIXES) {
    t = t.replace(re, rep);
  }
  return t;
}

const jsonPath = path.join(__dirname, "../assets/bundled/dhikr-list.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
let translitChanged = 0;
let textKkChanged = 0;

for (const item of data.items ?? []) {
  const slugKey = item.slug?.replace(/_\d+$/, "") ?? item.slug;
  const baseSlug = item.slug?.replace(/_\d{2,3}$/, "") ?? item.slug;

  let translit =
    SLUG_OVERRIDES[item.slug] ??
    SLUG_OVERRIDES[baseSlug] ??
    AR_OVERRIDES[item.textAr] ??
    fixTranslitKk(item.translitKk);

  if (translit !== item.translitKk) {
    item.translitKk = translit;
    translitChanged += 1;
  }

  const textKk = fixTextKk(item.textKk);
  if (textKk !== item.textKk) {
    item.textKk = textKk;
    textKkChanged += 1;
  }
}

// Дубликат араб мәтіндеріне ең жақсы translit тарату
const bestByAr = new Map();
for (const item of data.items) {
  const cur = bestByAr.get(item.textAr);
  if (!cur || item.translitKk.length > cur.translitKk.length) {
    bestByAr.set(item.textAr, item);
  }
}
for (const item of data.items) {
  const best = bestByAr.get(item.textAr);
  if (best && item.translitKk !== best.translitKk && !item.translitKk.includes("…")) {
    const canonical = AR_OVERRIDES[item.textAr];
    if (canonical) {
      if (item.translitKk !== canonical) {
        item.translitKk = canonical;
        translitChanged += 1;
      }
    } else if (item.id >= 100 && item.translitKk === item.textKk && best.translitKk !== item.textKk) {
      item.translitKk = best.translitKk;
      translitChanged += 1;
    }
  }
}

// Bulk hasbunallah: translit ≠ label
for (const item of data.items) {
  if (item.textAr === "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ" && item.translitKk === "Хасбуналлаһ") {
    item.translitKk = "Хасбуна Аллаһу уә ни'ма уәл-уәкил";
    translitChanged += 1;
  }
}

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`dhikr-list.json: fixed ${translitChanged} translitKk, ${textKkChanged} textKk entries`);
