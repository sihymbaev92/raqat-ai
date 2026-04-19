import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DailyAyahScreen } from "../screens/DailyAyahScreen";
import { QuranListScreen } from "../screens/QuranListScreen";
import { QuranSurahScreen } from "../screens/QuranSurahScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { TelegramInfoScreen } from "../screens/TelegramInfoScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
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
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  const { colors } = useAppTheme();

  const screenOptions = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: "600" as const },
    contentStyle: { backgroundColor: colors.bg },
  };

  return (
    <Stack.Navigator initialRouteName="ContentHub" screenOptions={screenOptions}>
      <Stack.Screen
        name="ContentHub"
        component={ContentHubScreen}
        options={{ title: kk.navigation.contentHubTitle }}
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
      <Stack.Screen
        name="DailyAyah"
        component={DailyAyahScreen}
        options={{ title: kk.dailyAyah.title }}
      />
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
      <Stack.Screen name="Hatim" component={HatimScreen} options={{ title: kk.features.hatimTitle }} />
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
      <Stack.Screen name="Hajj" component={HajjScreen} options={{ title: kk.features.hajjTitle }} />
      <Stack.Screen name="Halal" component={HalalScreen} options={{ title: kk.features.halalTitle }} />
      <Stack.Screen
        name="RaqatAI"
        component={RaqatAIChatScreen}
        options={{ title: kk.features.raqatAiTitle }}
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
