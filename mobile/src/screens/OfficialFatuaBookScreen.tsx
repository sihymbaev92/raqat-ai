import React, { useLayoutEffect, useMemo, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk, FATUA_KZ_LABEL_KK } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { EmbeddedSiteSheet } from "../components/EmbeddedSiteSheet";
import type { MoreStackParamList } from "../navigation/types";
import { getOfficialBookRecord } from "../content/officialBooksCatalog";
import { useAppLocale } from "../i18n/runtime";

type Props = NativeStackScreenProps<MoreStackParamList, "OfficialFatuaBook">;

export function OfficialFatuaBookScreen({ route, navigation }: Props) {
  useAppLocale();
  const { bookId } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const g = kk.features.officialFatuaBook;
  const book = getOfficialBookRecord("fatua", bookId);
  const [pdfOpen, setPdfOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: book?.title ?? g.screenTitle });
  }, [navigation, book?.title, g.screenTitle]);

  if (!book?.pdfUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{g.notFound}</Text>
        {book?.url ? (
          <Pressable
            oyuBackdrop={false}
            style={styles.linkBtn}
            onPress={() => void Linking.openURL(book.url)}
          >
            <Text style={styles.linkBtnTxt}>{FATUA_KZ_LABEL_KK}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const metaLine = [book.author, book.publishedYear].filter(Boolean).join(" · ");

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="contain" />
        ) : null}
        <Text style={styles.title}>{tr(book.title)}</Text>
        {book.category ? <Text style={styles.sub}>{tr(book.category)}</Text> : null}
        {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
        {book.about ? (
          <Text style={styles.about} selectable>
            {tr(book.about)}
          </Text>
        ) : (
          <Text style={styles.aboutMuted}>{tr(g.aboutFallback)}</Text>
        )}
        <Pressable
          oyuBackdrop={false}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
          onPress={() => setPdfOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={g.readPdfA11y}
        >
          <MaterialIcons name="menu-book" size={22} color="#fff" />
          <Text style={styles.primaryBtnTxt}>{tr(g.readPdfCta)}</Text>
        </Pressable>
        <Pressable
          oyuBackdrop={false}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92 }]}
          onPress={() => void Linking.openURL(book.url)}
          accessibilityRole="button"
          accessibilityLabel={g.openSiteA11y}
        >
          <Text style={styles.secondaryBtnTxt}>{tr(g.openSiteCta)}</Text>
          <MaterialIcons name="open-in-new" size={18} color={colors.accent} />
        </Pressable>
        <Text style={styles.source} selectable>
          {tr(g.sourceNote)}
        </Text>
        {translated ? (
          <Text style={styles.translateNote}>{kk.common.autoTranslateNotice}</Text>
        ) : null}
      </ScrollView>
      <EmbeddedSiteSheet
        visible={pdfOpen}
        url={book.pdfUrl}
        title={book.title}
        colors={colors}
        onClose={() => setPdfOpen(false)}
      />
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32, alignItems: "center" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    muted: { color: colors.muted, fontSize: 15, textAlign: "center" },
    cover: {
      width: "72%",
      maxWidth: 220,
      aspectRatio: 0.72,
      borderRadius: 12,
      marginBottom: 14,
      backgroundColor: colors.card,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 24,
    },
    sub: { color: colors.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
    meta: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 8 },
    about: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 14,
      alignSelf: "stretch",
    },
    aboutMuted: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 14,
      alignSelf: "stretch",
      textAlign: "center",
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      alignSelf: "stretch",
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accent,
    },
    primaryBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      alignSelf: "stretch",
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryBtnTxt: { color: colors.accent, fontSize: 14, fontWeight: "700" },
    source: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 16,
      textAlign: "center",
      alignSelf: "stretch",
    },
    translateNote: { color: colors.muted, fontSize: 11, marginTop: 10, textAlign: "center" },
    linkBtn: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    linkBtnTxt: { color: "#fff", fontWeight: "800" },
  });
}
