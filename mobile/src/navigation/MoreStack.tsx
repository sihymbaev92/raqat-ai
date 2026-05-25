import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SeerahScreen } from "../screens/SeerahScreen";
import { QuranListScreen } from "../screens/QuranListScreen";
import { QuranSurahScreen } from "../screens/QuranSurahScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { TelegramInfoScreen } from "../screens/TelegramInfoScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PrayerSettingsScreen } from "../screens/PrayerSettingsScreen";
import { QuranSettingsScreen } from "../screens/QuranSettingsScreen";
import { SiriShortcutHelpScreen } from "../screens/SiriShortcutHelpScreen";
import { HajjScreen } from "../screens/FeaturePlaceholderScreens";
import { HatimScreen } from "../screens/HatimScreen";
import { HatimSettingsScreen } from "../screens/HatimSettingsScreen";
import { QuranMushafBookScreen } from "../screens/QuranMushafBookScreen";
import { CommunityDuaScreen } from "../screens/CommunityDuaScreen";
import { NamazGuideScreen } from "../screens/ContentGuideScreens";
import { TajweedGuideScreen } from "../screens/TajweedGuideScreen";
import { HalalScreen } from "../screens/HalalScreen";
import { RaqatAIChatScreen } from "../screens/RaqatAIChatScreen";
import { IslamicKbSearchScreen } from "../screens/IslamicKbSearchScreen";
import { OfficialKnowledgePortalScreen } from "../screens/OfficialKnowledgePortalScreen";
import { EcosystemScreen } from "../screens/EcosystemScreen";
import { HadithHubScreen } from "../screens/HadithHubScreen";
import { HadithListScreen } from "../screens/HadithListScreen";
import { ScrapedHadithMuftyatListScreen } from "../screens/ScrapedHadithMuftyatListScreen";
import { ScrapedHadithMuftyatDetailScreen } from "../screens/ScrapedHadithMuftyatDetailScreen";
import { HadithDetailScreen } from "../screens/HadithDetailScreen";
import { ContentHubScreen } from "../screens/ContentHubScreen";
import { GenealogyClansScreen } from "../screens/GenealogyClansScreen";
import { FamilyTreeScreen } from "../screens/FamilyTreeScreen";
import { KazakhTraditionScreen } from "../screens/KazakhTraditionScreen";
import { KurbanAitScreen } from "../screens/KurbanAitScreen";
import { KazakhTraditionBooksScreen } from "../screens/KazakhTraditionBooksScreen";
import { KazakhGreatWordsScreen } from "../screens/KazakhGreatWordsScreen";
import { KazakhGreatWordsAuthorScreen } from "../screens/KazakhGreatWordsAuthorScreen";
import { KazakhGreatWordsEntryScreen } from "../screens/KazakhGreatWordsEntryScreen";
import { useAppTheme } from "../theme/ThemeContext";
import { navigationHeaderTitleStyle, uiText } from "../theme/typography";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "./types";
import { moreStackScreenBackListeners } from "./useMoreStackHardwareBack";
const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  const { colors, isDark } = useAppTheme();

  const screenOptions = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerTitleStyle: navigationHeaderTitleStyle,
    contentStyle: { backgroundColor: colors.bg },
  };

  return (
    <Stack.Navigator
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
        name="CommunityDua"
        component={CommunityDuaScreen}
        options={{ title: kk.communityDua.screenTitle }}
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
        name="Halal"
        component={HalalScreen}
        options={{
          title: kk.features.halalTitle,
          headerTitleAlign: "left",
          headerTitleStyle: uiText("header", "semibold"),
        }}
      />
      <Stack.Screen
        name="ImamAI"
        component={RaqatAIChatScreen}
        options={{
          title: kk.features.raqatAiTitle,
          headerTitleAlign: "left",
          headerTitleStyle: uiText("header", "semibold"),
        }}
      />
      <Stack.Screen
        name="OfficialKnowledgePortal"
        component={OfficialKnowledgePortalScreen}
        options={{
          title: kk.knowledgePortal.screenTitle,
          headerTitleStyle: uiText("header", "semibold"),
        }}
      />
      <Stack.Screen
        name="IslamicKbSearch"
        component={IslamicKbSearchScreen}
        options={{
          title: kk.aiChat.kbSearchTitle,
          headerTitleStyle: uiText("header", "semibold"),
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
