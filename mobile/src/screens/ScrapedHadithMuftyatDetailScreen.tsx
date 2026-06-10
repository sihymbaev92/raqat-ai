import React, { useLayoutEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import {
  extractedHadithOpenOriginalLabel,
  extractedHadithSourceLabel,
  findExtractedHadithMuftyat,
  type ExtractedHadithMuftyatItem,
} from "../content/extractedHadithMuftyat";
import {
  findScrapedHadithMuftyat,
  scrapedHadithOpenOriginalLabel,
  scrapedHadithSourceLabel,
  type ScrapedHadithMuftyatItem,
} from "../content/scrapedHadithMuftyat";

type Props = NativeStackScreenProps<MoreStackParamList, "ScrapedHadithMuftyatDetail">;

export function ScrapedHadithMuftyatDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { colors } = useAppTheme();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const extractedItem = findExtractedHadithMuftyat(id);
  const item: ExtractedHadithMuftyatItem | ScrapedHadithMuftyatItem | undefined =
    extractedItem ?? findScrapedHadithMuftyat(id);

  useLayoutEffect(() => {
    if (item) {
      navigation.setOptions({ title: item.title.slice(0, 48) });
    }
  }, [navigation, item]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{tr(kk.hadith.notFound)}</Text>
      </View>
    );
  }

  const openSource = () => {
    void Linking.openURL(item.sourceUrl).catch(() => {});
  };
  const arabicText = "arabicText" in item ? item.arabicText : undefined;
  const meaningKk = "meaningKk" in item && item.meaningKk ? item.meaningKk : item.text;
  const sourceTitle = "sourceTitle" in item ? item.sourceTitle : undefined;
  const sourceName =
    extractedItem ? extractedHadithSourceLabel(item.sourceSite) : item.sourceSite === "fatua" ? "Fatua.kz" : "Muftyat.kz";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>
        {extractedItem ? extractedHadithSourceLabel(item.sourceSite) : scrapedHadithSourceLabel(item.sourceSite)}
      </Text>
      {sourceTitle ? <Text style={styles.sourceTitle}>{sourceTitle}</Text> : null}
      {item.collectionHint ? (
        <Text style={styles.meta}>{item.collectionHint}</Text>
      ) : null}
      {arabicText ? (
        <View style={styles.arabicCard}>
          <Text style={styles.arabicLabel}>{tr("Арабша түпнұсқа")}</Text>
          <Text style={styles.arabicBody} selectable>
            {arabicText}
          </Text>
        </View>
      ) : null}
      {item.narrator ? (
        <>
          <Text style={styles.section}>{tr(kk.hadith.narrator)}</Text>
          <Text style={styles.body}>{item.narrator}</Text>
        </>
      ) : null}
      <Text style={styles.section}>{tr("Қазақша мағынасы")}</Text>
      <Text style={styles.body} selectable textBreakStrategy="balanced">
        {meaningKk}
      </Text>
      <Text style={styles.note}>{tr(kk.hadith.muftyatExcerpts.disclaimer)}</Text>
      {item.sourceUrl ? (
        <Pressable
          onPress={openSource}
          style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.9 }]}
          accessibilityRole="link"
          accessibilityLabel={`${sourceName} — ${tr("ресми сайтта ашу")}`}
        >
          <MaterialIcons name="open-in-new" size={18} color="#4B5563" />
          <Text style={styles.linkTxt}>
            {extractedItem ? extractedHadithOpenOriginalLabel(item.sourceSite) : scrapedHadithOpenOriginalLabel(item.sourceSite)}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 18, paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    err: { color: colors.muted, fontSize: 15 },
    badge: {
      alignSelf: "flex-start",
      fontSize: 11,
      fontWeight: "800",
      color: muted,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 0,
      marginBottom: 10,
      overflow: "hidden",
    },
    sourceTitle: { fontSize: 18, lineHeight: 24, fontWeight: "900", color: text, marginBottom: 8 },
    meta: { fontSize: 13, color: muted, marginBottom: 8 },
    arabicCard: {
      borderWidth: 0,
      borderColor: "transparent",
      borderRadius: 0,
      backgroundColor: "transparent",
      padding: 0,
      marginTop: 8,
      marginBottom: 16,
    },
    arabicLabel: {
      color: muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 10,
    },
    section: {
      fontSize: 12,
      fontWeight: "800",
      color: muted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginTop: 14,
      marginBottom: 6,
    },
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: text,
      textAlign: "justify",
    },
    arabicBody: {
      fontSize: 25,
      lineHeight: 44,
      color: text,
      textAlign: "right",
      writingDirection: "rtl",
      fontFamily: "serif",
    },
    note: {
      fontSize: 12,
      lineHeight: 18,
      color: muted,
      marginTop: 16,
      fontStyle: "italic",
    },
    linkBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 10,
    },
    linkTxt: { fontSize: 14, fontWeight: "700", color: muted },
  });
}
