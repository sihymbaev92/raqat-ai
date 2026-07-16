/**
 * Verify critical chrome keys are non-KK for all 6 locales after applyLocale.
 */
const { setCurrentLocale } = require("../src/i18n/runtime");
const { kk } = require("../src/i18n/kk");

const LOCALES = ["ru", "en", "ky", "uz", "tr", "ar"];
const KK_MARKERS = [/Әзірге сақталған/, /Хатымды ашу/, /Қажылық жол картасы/, /Мақалалар/, /Оқу картасы/, /Ботты ашу/];

async function main() {
  const fails = [];
  for (const loc of LOCALES) {
    await setCurrentLocale(loc);
    const samples = [
      kk.navigation.savedTab.open,
      kk.navigation.savedTab.emptyTitle,
      kk.navigation.telegramInfo.openBot,
      kk.features.traditionGuide.articlesTitle,
      kk.features.hajjRoadmapTitle,
      kk.features.kaabaLiveTitle,
      kk.namazGuide.studyMapTitle,
      kk.namazGuide.fivePrayersTitle,
      kk.hadith.hub.searchPlaceholderExamples,
      kk.hadith.hub.emptySearch,
      kk.tajweedGuide.chaptersTitle,
      kk.seerah.lastLessonLabel,
    ];
    for (const s of samples) {
      if (!s || !String(s).trim()) fails.push(`${loc}: empty`);
      for (const re of KK_MARKERS) {
        if (re.test(s)) fails.push(`${loc}: KK leak «${s.slice(0, 40)}» ~ ${re}`);
      }
    }
    console.log(loc, "OK", samples[0], "|", samples[3], "|", samples[4]);
  }
  await setCurrentLocale("kk");
  if (fails.length) {
    console.error("FAILS", fails);
    process.exit(1);
  }
  console.log("all locales chrome patches OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
