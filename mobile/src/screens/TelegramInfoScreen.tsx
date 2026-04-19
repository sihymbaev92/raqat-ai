import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "TelegramInfo">;
};

const BOT = "https://t.me/my_islamic_ai_bot";

export function TelegramInfoScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Telegram бот</Text>
      <Text style={styles.p}>
        Құран іздеу, хадис, тәжуид, хатым, намаз бөлімі, дәрет, құбыла, тәсбих,
        дауыспен командалар және RAQAT AI көмекші — толық жинағы ботта.
      </Text>
      <Text style={styles.p}>
        Мобильді қосымша офлайн кеш, хабарламалар және Құран мәтінімен толықтырылады.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => Linking.openURL(BOT)}
      >
        <Text style={styles.btnText}>Ботты ашу</Text>
      </Pressable>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Артқа</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    h1: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 16 },
    p: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },
    btn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
    },
    btnPressed: { opacity: 0.9 },
    btnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
    back: { color: colors.accent, fontSize: 16, marginTop: 24 },
  });
}
