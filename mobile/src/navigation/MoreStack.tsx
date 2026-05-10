import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SeerahScreen } from "../screens/SeerahScreen";
import { QuranListScreen } from "../screens/QuranListScreen";
import { QuranSurahScreen } from "../screens/QuranSurahScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { TelegramInfoScreen } from "../screens/TelegramInfoScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SiriShortcutHelpScreen } from "../screens/SiriShortcutHelpScreen";
import { HajjScreen } from "../screens/FeaturePlaceholderScreens";
import { HatimScreen } from "../screens/HatimScreen";
import { CommunityDuaScreen } from "../screens/CommunityDuaScreen";
import { NamazGuideScreen, TajweedGuideScreen } from "../screens/ContentGuideScreens";
import { HalalScreen } from "../screens/HalalScreen";
import { RaqatAIChatScreen } from "../screens/RaqatAIChatScreen";
import { EcosystemScreen } from "../screens/EcosystemScreen";
import { HadithListScreen } from "../screens/HadithListScreen";
import { HadithDetailScreen } from "../screens/HadithDetailScreen";
import { ContentHubScreen } from "../screens/ContentHubScreen";
import { KazakhTraditionScreen } from "../screens/KazakhTraditionScreen";
import { VoiceAssistantHeaderButton } from "../components/voice/VoiceAssistantHeaderButton";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

/** Хатым — мұсаф кітап хромымен үздіксіз (QuranSurah mushafLayout). */
const HATIM_BOOK_DESK_LIGHT = "#EBE4D4";
const HATIM_BOOK_INK_LIGHT = "#5C4D3D";

export function MoreNavigator() {
  const { colors, isDark } = useAppTheme();

  const screenOptions = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: "700" as const },
    contentStyle: { backgroundColor: colors.bg },
  };

  return (
    <Stack.Navigator initialRouteName="ContentHub" screenOptions={screenOptions}>
      <Stack.Screen
        name="ContentHub"
        component={ContentHubScreen}
        options={{
          title: kk.navigation.contentHubTitle,
          headerRight: () => <VoiceAssistantHeaderButton />,
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
        name="SiriShortcutHelp"
        component={SiriShortcutHelpScreen}
        options={{ title: kk.navigation.siriShortcutHelpTitle }}
      />
      <Stack.Screen
        name="Hatim"
        component={HatimScreen}
        options={{
          title: kk.features.hatimTitle,
          headerStyle: { backgroundColor: isDark ? colors.bg : HATIM_BOOK_DESK_LIGHT },
          headerTintColor: isDark ? colors.text : HATIM_BOOK_INK_LIGHT,
          headerTitleStyle: { fontWeight: "700" as const, color: isDark ? colors.text : HATIM_BOOK_INK_LIGHT },
          contentStyle: { backgroundColor: isDark ? colors.bg : HATIM_BOOK_DESK_LIGHT },
        }}
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
      <Stack.Screen name="Hajj" component={HajjScreen} options={{ title: kk.features.hajjTitle }} />
      <Stack.Screen
        name="Halal"
        component={HalalScreen}
        options={{ title: kk.features.halalTitle, headerTitleStyle: { fontSize: 16, fontWeight: "700" } }}
      />
      <Stack.Screen
        name="ImamAI"
        component={RaqatAIChatScreen}
        options={{
          title: kk.features.imamAiTitle,
          headerTitleStyle: { fontSize: 15, fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="Ecosystem"
        component={EcosystemScreen}
        options={{ title: kk.ecosystem.cardTitle }}
      />
      <Stack.Screen name="HadithList" component={HadithListScreen} options={{ title: kk.hadith.title }} />
      <Stack.Screen name="HadithDetail" component={HadithDetailScreen} options={{ title: kk.hadith.detailTitle }} />
    </Stack.Navigator>
  );
}
