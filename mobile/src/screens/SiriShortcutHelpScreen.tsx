import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Linking } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "SiriShortcutHelp">;

export function SiriShortcutHelpScreen(_props: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { tr, translated } = useKkAutoTranslator();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.lead}>
        {tr(Platform.OS === "ios" ? kk.settings.siriShortcutsHint : kk.settings.siriShortcutsAndroidNote)}
      </Text>
      {Platform.OS === "ios" ? (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
            onPress={() => void Linking.openURL("shortcuts://").catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel={kk.settings.siriShortcutsOpen}
          >
            <Text style={styles.btnPrimaryTxt}>{tr(kk.settings.siriShortcutsOpen)}</Text>
          </Pressable>
        </View>
      ) : null}
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    lead: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.text,
      marginBottom: 18,
    },
    actions: { gap: 10 },
    btnPrimary: {
      alignSelf: "flex-start",
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.25 : 0.12,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    btnPrimaryTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
}
