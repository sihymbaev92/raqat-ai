import React, { useMemo } from "react";
import { ScrollView, Text, StyleSheet, View, Pressable, Image } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { DUA_CATEGORIES } from "../content/spiritualContent";
import type { DuaBlock } from "../content/duasCatalog";
import { kk } from "../i18n/kk";
import type { DuasStackParamList, MoreStackParamList } from "../navigation/types";
import { menuIconAssets } from "../theme/menuIconAssets";

/** Таб ішіндегі DuasStack және MoreStack-тегі «extra-duas» бір экран */
type Props =
  | NativeStackScreenProps<DuasStackParamList, "DuasHome">
  | NativeStackScreenProps<MoreStackParamList, "Duas">;

const ARABIC_TO_KK_CYR_MAP: Record<string, string> = {
  ا: "а",
  أ: "а",
  إ: "и",
  آ: "аа",
  ب: "б",
  ت: "т",
  ث: "с",
  ج: "ж",
  ح: "х",
  خ: "х",
  د: "д",
  ذ: "з",
  ر: "р",
  ز: "з",
  س: "с",
  ش: "ш",
  ص: "с",
  ض: "д",
  ط: "т",
  ظ: "з",
  ع: "ғ",
  غ: "ғ",
  ف: "ф",
  ق: "қ",
  ك: "к",
  ل: "л",
  م: "м",
  ن: "н",
  ه: "һ",
  ة: "а",
  و: "у",
  ي: "й",
  ى: "а",
  ء: "ъ",
  ئ: "й",
  ؤ: "у",
  لا: "лә",
  " ": " ",
};

/** Экранда тек көмек: каталогда translitKk жоқ eski сақталған кеңестер болса ғана. */
function arabicToKkCyrillicFallback(ar: string): string {
  const clean = ar
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .trim();
  if (!clean) return "";
  let out = "";
  for (let i = 0; i < clean.length; i += 1) {
    const pair = clean.slice(i, i + 2);
    if (ARABIC_TO_KK_CYR_MAP[pair]) {
      out += ARABIC_TO_KK_CYR_MAP[pair];
      i += 1;
      continue;
    }
    out += ARABIC_TO_KK_CYR_MAP[clean[i]] ?? clean[i];
  }
  return out.replace(/\s+/g, " ").trim();
}

export function DuasScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const openCommunityDua = () => {
    (navigation as { navigate: (name: "CommunityDua") => void }).navigate("CommunityDua");
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable
        style={({ pressed }) => [styles.communityCta, pressed && { opacity: 0.92 }]}
        onPress={openCommunityDua}
        accessibilityRole="button"
        accessibilityLabel={`${kk.communityDua.screenTitle}. ${kk.duas.communityDuaHint}`}
      >
        <Image
          source={menuIconAssets.tileCommunity}
          style={styles.communityThumb}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.communityTextCol}>
          <Text style={styles.communityTitle}>{kk.communityDua.screenTitle}</Text>
          <Text style={styles.communitySub} numberOfLines={2}>
            {kk.duas.communityDuaHint}
          </Text>
        </View>
        <Text style={styles.communityChev}>›</Text>
      </Pressable>

      <Text style={styles.intro}>{kk.duas.intro}</Text>
      {DUA_CATEGORIES.map((cat) => (
        <View key={cat.title} style={styles.category}>
          <Text style={styles.catTitle}>{cat.title}</Text>
          {cat.blocks.map((b: DuaBlock) => (
            <View key={`${cat.title}::${b.title}`} style={styles.card}>
              <Text style={styles.cardTitle}>{b.title}</Text>
              <Text style={styles.ar}>{b.ar}</Text>
              <Text style={styles.caption}>{kk.duas.translitCaption}</Text>
              <Text style={styles.kiril}>
                {b.translitKk?.trim() ? b.translitKk : arabicToKkCyrillicFallback(b.ar)}
              </Text>
              <Text style={styles.caption}>{kk.duas.meaningCaption}</Text>
              <Text style={styles.kk}>{b.meaningKk}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    communityCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    communityThumb: { width: 48, height: 48, borderRadius: 12 },
    communityTextCol: { flex: 1, minWidth: 0 },
    communityTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 4,
    },
    communitySub: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    communityChev: {
      color: colors.muted,
      fontSize: 22,
      fontWeight: "700",
      paddingLeft: 4,
    },
    intro: { color: colors.muted, marginBottom: 16, lineHeight: 20, fontSize: 13 },
    category: { marginBottom: 8 },
    catTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 12,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { color: colors.accent, fontWeight: "700", marginBottom: 8 },
    caption: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "800",
      color: colors.muted,
      letterSpacing: 0.2,
    },
    ar: {
      color: colors.scriptureArabic,
      fontSize: 18,
      lineHeight: 30,
      writingDirection: "rtl",
      textAlign: "right",
    },
    kiril: {
      color: colors.scriptureTranslit,
      marginTop: 8,
      lineHeight: 21,
      fontSize: 14,
      fontWeight: "600",
    },
    kk: { color: colors.scriptureMeaningKk, marginTop: 10, lineHeight: 22, fontSize: 15, fontWeight: "500" },
  });
}
