import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { navigationHeaderTitleStyle } from "../theme/typography";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import type { MoreStackParamList } from "./types";
import { moreStackScreenBackListeners } from "./useMoreStackHardwareBack";
import { hiddenStackHeaderOptions } from "./hiddenStackHeader";
import { lazyScreen } from "./lazyScreen";
const Stack = createNativeStackNavigator<MoreStackParamList>();
const MORE_STACK_WEB_CACHE_VERSION = "more-stack-cache-bust-2026-06-07";

const ContentHubScreen = lazyScreen(() => import("../screens/ContentHubScreen").then((m) => ({ default: m.ContentHubScreen })));
const KmdbHubScreen = lazyScreen(() => import("../screens/KmdbHubScreen").then((m) => ({ default: m.KmdbHubScreen })));
const QuranListScreen = lazyScreen(() => import("../screens/QuranListScreen").then((m) => ({ default: m.QuranListScreen })));
const QuranSurahScreen = lazyScreen(() => import("../screens/QuranSurahScreen").then((m) => ({ default: m.QuranSurahScreen })));
const SeerahScreen = lazyScreen(() => import("../screens/SeerahScreen").then((m) => ({ default: m.SeerahScreen })));
const DuasScreen = lazyScreen(() => import("../screens/DuasScreen").then((m) => ({ default: m.DuasScreen })));
const TelegramInfoScreen = lazyScreen(() => import("../screens/TelegramInfoScreen").then((m) => ({ default: m.TelegramInfoScreen })));
const SettingsScreen = lazyScreen(() => import("../screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const PrayerSettingsScreen = lazyScreen(() => import("../screens/PrayerSettingsScreen").then((m) => ({ default: m.PrayerSettingsScreen })));
const QuranSettingsScreen = lazyScreen(() => import("../screens/QuranSettingsScreen").then((m) => ({ default: m.QuranSettingsScreen })));
const SiriShortcutHelpScreen = lazyScreen(() => import("../screens/SiriShortcutHelpScreen").then((m) => ({ default: m.SiriShortcutHelpScreen })));
const HatimScreen = lazyScreen(() => import("../screens/HatimScreen").then((m) => ({ default: m.HatimScreen })));
const HatimSettingsScreen = lazyScreen(() => import("../screens/HatimSettingsScreen").then((m) => ({ default: m.HatimSettingsScreen })));
const QuranMushafBookScreen = lazyScreen(() => import("../screens/QuranMushafBookScreen").then((m) => ({ default: m.QuranMushafBookScreen })));
const NamazGuideScreen = lazyScreen(() => import("../screens/ContentGuideScreens").then((m) => ({ default: m.NamazGuideScreen })));
const TajweedGuideScreen = lazyScreen(() => import("../screens/TajweedGuideScreen").then((m) => ({ default: m.TajweedGuideScreen })));
const KazakhTraditionScreen = lazyScreen(() => import("../screens/KazakhTraditionScreen").then((m) => ({ default: m.KazakhTraditionScreen })));
const KazakhTraditionTopicDetailScreen = lazyScreen(() => import("../screens/KazakhTraditionTopicDetailScreen").then((m) => ({ default: m.KazakhTraditionTopicDetailScreen })));
const KazakhTraditionArticlesScreen = lazyScreen(() => import("../screens/KazakhTraditionArticlesScreen").then((m) => ({ default: m.KazakhTraditionArticlesScreen })));
const KazakhTraditionFavoritesScreen = lazyScreen(() => import("../screens/KazakhTraditionFavoritesScreen").then((m) => ({ default: m.KazakhTraditionFavoritesScreen })));
const GenealogyClansScreen = lazyScreen(() => import("../screens/GenealogyClansScreen").then((m) => ({ default: m.GenealogyClansScreen })));
const FamilyTreeScreen = lazyScreen(() => import("../screens/FamilyTreeScreen").then((m) => ({ default: m.FamilyTreeScreen })));
const KurbanAitScreen = lazyScreen(() => import("../screens/KurbanAitScreen").then((m) => ({ default: m.KurbanAitScreen })));
const KazakhTraditionBooksScreen = lazyScreen(() => import("../screens/KazakhTraditionBooksScreen").then((m) => ({ default: m.KazakhTraditionBooksScreen })));
const OfficialFatuaBookScreen = lazyScreen(() => import("../screens/OfficialFatuaBookScreen").then((m) => ({ default: m.OfficialFatuaBookScreen })));
const KazakhGreatWordsScreen = lazyScreen(() => import("../screens/KazakhGreatWordsScreen").then((m) => ({ default: m.KazakhGreatWordsScreen })));
const KazakhGreatWordsAuthorScreen = lazyScreen(() => import("../screens/KazakhGreatWordsAuthorScreen").then((m) => ({ default: m.KazakhGreatWordsAuthorScreen })));
const KazakhGreatWordsEntryScreen = lazyScreen(() => import("../screens/KazakhGreatWordsEntryScreen").then((m) => ({ default: m.KazakhGreatWordsEntryScreen })));
const HajjScreen = lazyScreen(() => import("../screens/FeaturePlaceholderScreens").then((m) => ({ default: m.HajjScreen })));
const ZakatCalculatorScreen = lazyScreen(() => import("../screens/ZakatCalculatorScreen").then((m) => ({ default: m.ZakatCalculatorScreen })));
const HalalScreen = lazyScreen(() => import("../screens/HalalScreen").then((m) => ({ default: m.HalalScreen })));
const RaqatAIChatScreen = lazyScreen(() => import("../screens/RaqatAIChatScreen").then((m) => ({ default: m.RaqatAIChatScreen })));
const OfficialKnowledgePortalScreen = lazyScreen(() => import("../screens/OfficialKnowledgePortalScreen").then((m) => ({ default: m.OfficialKnowledgePortalScreen })));
const IslamicKbSearchScreen = lazyScreen(() => import("../screens/IslamicKbSearchScreen").then((m) => ({ default: m.IslamicKbSearchScreen })));
const EcosystemScreen = lazyScreen(() => import("../screens/EcosystemScreen").then((m) => ({ default: m.EcosystemScreen })));
const HadithHubScreen = lazyScreen(() => import("../screens/HadithHubScreen").then((m) => ({ default: m.HadithHubScreen })));
const ScrapedHadithMuftyatListScreen = lazyScreen(() => import("../screens/ScrapedHadithMuftyatListScreen").then((m) => ({ default: m.ScrapedHadithMuftyatListScreen })));
const ScrapedHadithMuftyatDetailScreen = lazyScreen(() => import("../screens/ScrapedHadithMuftyatDetailScreen").then((m) => ({ default: m.ScrapedHadithMuftyatDetailScreen })));
const HadithListScreen = lazyScreen(() => import("../screens/HadithListScreen").then((m) => ({ default: m.HadithListScreen })));
const HadithDetailScreen = lazyScreen(() => import("../screens/HadithDetailScreen").then((m) => ({ default: m.HadithDetailScreen })));

export function MoreNavigator() {
  const { colors, isDark } = useAppTheme();
  useAppLocale();

  const screenOptions = {
    ...hiddenStackHeaderOptions,
    contentStyle: { backgroundColor: colors.bg },
  };

  return (
    <Stack.Navigator
      key={MORE_STACK_WEB_CACHE_VERSION}
      initialRouteName="ContentHub"
      screenOptions={screenOptions}
      screenListeners={moreStackScreenBackListeners}
    >
      <Stack.Screen
        name="ContentHub"
        component={ContentHubScreen}
        options={{
          title: kk.navigation.contentHubTitle,
        }}
      />
      <Stack.Screen
        name="KmdbHub"
        component={KmdbHubScreen}
        options={{
          title: kk.kmdbHub.title,
          headerTitleAlign: "left",
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="QuranList"
        component={QuranListScreen}
        options={{ title: kk.quran.listTitle }}
      />
      <Stack.Screen
        name="QuranSurah"
        component={QuranSurahScreen}
        options={{ title: kk.navigation.surahTitle }}
      />
      <Stack.Screen name="Seerah" component={SeerahScreen} options={{ title: kk.seerah.title }} />
      <Stack.Screen name="Duas" component={DuasScreen} options={{ title: kk.navigation.duasTitle }} />
      <Stack.Screen
        name="TelegramInfo"
        component={TelegramInfoScreen}
        options={{ title: kk.navigation.telegramTitle }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: kk.settings.title }}
      />
      <Stack.Screen
        name="PrayerSettings"
        component={PrayerSettingsScreen}
        options={{ title: kk.settings.prayerSettingsTitle }}
      />
      <Stack.Screen
        name="QuranSettings"
        component={QuranSettingsScreen}
        options={{ title: kk.settings.quranSettingsTitle }}
      />
      <Stack.Screen
        name="SiriShortcutHelp"
        component={SiriShortcutHelpScreen}
        options={{ title: kk.navigation.siriShortcutHelpTitle }}
      />
      <Stack.Screen
        name="Hatim"
        component={HatimScreen}
        options={{ title: kk.features.hatimTitle }}
      />
      <Stack.Screen
        name="HatimSettings"
        component={HatimSettingsScreen}
        options={{ title: kk.hatim.settingsTitle }}
      />
      <Stack.Screen
        name="QuranMushafBook"
        component={QuranMushafBookScreen}
        options={{ title: kk.features.hatimTitle }}
      />
      <Stack.Screen
        name="NamazGuide"
        component={NamazGuideScreen}
        options={{ title: kk.namazGuide.screenTitle }}
      />
      <Stack.Screen
        name="TajweedGuide"
        component={TajweedGuideScreen}
        options={{ title: kk.tajweedGuide.screenTitle }}
      />
      <Stack.Screen
        name="KazakhTradition"
        component={KazakhTraditionScreen}
        options={{ title: kk.features.traditionTitle }}
      />
      <Stack.Screen
        name="KazakhTraditionTopicDetail"
        component={KazakhTraditionTopicDetailScreen}
        options={{ title: kk.features.traditionTitle }}
      />
      <Stack.Screen
        name="KazakhTraditionArticles"
        component={KazakhTraditionArticlesScreen}
        options={{ title: "Мақалалар" }}
      />
      <Stack.Screen
        name="KazakhTraditionFavorites"
        component={KazakhTraditionFavoritesScreen}
        options={{ title: "Таңдаулылар" }}
      />
      <Stack.Screen
        name="GenealogyClans"
        component={GenealogyClansScreen}
        options={{ title: kk.features.genealogyTitle }}
      />
      <Stack.Screen
        name="FamilyTree"
        component={FamilyTreeScreen}
        options={{ title: kk.features.familyTreeTitle }}
      />
      <Stack.Screen
        name="KurbanAit"
        component={KurbanAitScreen}
        options={{ title: kk.features.kurbanAitTitle }}
      />
      <Stack.Screen
        name="KazakhTraditionBooks"
        component={KazakhTraditionBooksScreen}
        options={{ title: kk.features.traditionGuide.sectionBooksTitle }}
      />
      <Stack.Screen
        name="OfficialFatuaBook"
        component={OfficialFatuaBookScreen}
        options={{ title: kk.features.officialFatuaBook.screenTitle }}
      />
      <Stack.Screen
        name="KazakhGreatWords"
        component={KazakhGreatWordsScreen}
        options={{ title: kk.features.greatWordsGuide.screenTitle }}
      />
      <Stack.Screen
        name="KazakhGreatWordsAuthor"
        component={KazakhGreatWordsAuthorScreen}
        options={{ title: kk.features.greatWordsGuide.authorWorksTitle }}
      />
      <Stack.Screen
        name="KazakhGreatWordsEntry"
        component={KazakhGreatWordsEntryScreen}
        options={{ title: kk.features.greatWordsGuide.entryScreenTitle }}
      />
      <Stack.Screen name="Hajj" component={HajjScreen} options={{ title: kk.features.hajjTitle }} />
      <Stack.Screen
        name="ZakatCalculator"
        component={ZakatCalculatorScreen}
        options={{
          title: kk.zakatCalculator.title,
          headerTitleAlign: "left",
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="Halal"
        component={HalalScreen}
        options={{
          title: kk.features.halalTitle,
          headerTitleAlign: "left",
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="ImamAI"
        component={RaqatAIChatScreen}
        options={{
          title: kk.features.raqatAiTitle,
          headerTitleAlign: "left",
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="OfficialKnowledgePortal"
        component={OfficialKnowledgePortalScreen}
        options={{
          title: kk.knowledgePortal.screenTitle,
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="IslamicKbSearch"
        component={IslamicKbSearchScreen}
        options={{
          title: kk.aiChat.kbSearchTitle,
          headerTitleStyle: navigationHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="Ecosystem"
        component={EcosystemScreen}
        options={{ title: kk.ecosystem.cardTitle }}
      />
      <Stack.Screen name="HadithHub" component={HadithHubScreen} options={{ title: kk.hadith.hub.screenTitle }} />
      <Stack.Screen
        name="ScrapedHadithMuftyatList"
        component={ScrapedHadithMuftyatListScreen}
        options={{ title: kk.hadith.muftyatExcerpts.screenTitle }}
      />
      <Stack.Screen
        name="ScrapedHadithMuftyatDetail"
        component={ScrapedHadithMuftyatDetailScreen}
        options={{ title: kk.hadith.detailTitle }}
      />
      <Stack.Screen name="HadithList" component={HadithListScreen} options={{ title: kk.hadith.title }} />
      <Stack.Screen name="HadithDetail" component={HadithDetailScreen} options={{ title: kk.hadith.detailTitle }} />
    </Stack.Navigator>
  );
}
