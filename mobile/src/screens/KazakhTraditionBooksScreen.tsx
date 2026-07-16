import React, { useCallback, useDeferredValue, useMemo, useState } from "react";

import { FlatList, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Pressable } from "@/ui/Pressable";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useNavigation } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAppTheme } from "../theme/ThemeContext";

import { kk } from "../i18n/kk";

import {

  getAitBooks,

  getCatalogBookSections,

  getCatalogBooksForShelf,

  traditionBookSearchBlob,

  type CatalogBookSectionId,
  type TraditionBookEntry,

} from "../content/traditionBooksCatalog";

import { TraditionBookCard } from "../components/TraditionBookCard";
import { TraditionKazakhHeroBanner } from "../components/tradition/TraditionKazakhHeroBanner";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

import { openTraditionBook } from "../utils/openTraditionBook";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

import type { MoreStackParamList } from "../navigation/types";
import { useAppLocale } from "../i18n/runtime";



type Props = NativeStackScreenProps<MoreStackParamList, "KazakhTraditionBooks">;

type Nav = NativeStackNavigationProp<MoreStackParamList>;

type BookListItem =
  | { kind: "section"; id: CatalogBookSectionId; count: number }
  | { kind: "book"; book: TraditionBookEntry }
  | { kind: "empty" };



function catalogSectionTitle(id: CatalogBookSectionId): string {

  const tg = kk.features.traditionGuide;

  switch (id) {

    case "faith-ibada":

      return tg.catalogSectionFaithIbada;

    case "faith-quran":

      return tg.catalogSectionFaithQuran;

    case "faith-ilm":

      return tg.catalogSectionFaithIlm;

    case "faith-tools":

      return tg.catalogSectionFaithTools;

    case "official-fatua":

      return tg.catalogSectionOfficialFatua;

    case "official-muftyat":

      return tg.catalogSectionOfficialMuftyat;

    default:

      return tg.catalogSectionTradition;

  }

}



export function KazakhTraditionBooksScreen({ route }: Props) {
  useAppLocale();
  const { isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const tg = kk.features.traditionGuide;
  const { tr, translated } = useKkAutoTranslator();
  const stackNav = useNavigation<Nav>();
  const [bookQuery, setBookQuery] = useState("");
  const deferredBookQuery = useDeferredValue(bookQuery);
  const scope = route.params?.scope ?? "catalog";
  const shelfFilter = route.params?.shelf ?? "all";
  const isAitScope = scope === "ait";

  const catalogBooks = useMemo(
    () => (isAitScope ? getAitBooks() : getCatalogBooksForShelf(shelfFilter)),
    [isAitScope, shelfFilter]
  );

  const groupedSections = useMemo(() => {
    if (isAitScope || deferredBookQuery.trim() || shelfFilter !== "all") return null;
    return getCatalogBookSections();
  }, [isAitScope, deferredBookQuery, shelfFilter]);

  const filteredBooks = useMemo(() => {
    const q = deferredBookQuery.trim().toLowerCase();
    if (!q) return catalogBooks;
    return catalogBooks.filter((b) => traditionBookSearchBlob(b).includes(q));
  }, [catalogBooks, deferredBookQuery]);

  const scrollToTraditionBlock = useCallback(
    (blockTitle: string) => {
      stackNav.navigate("KazakhTradition", { scrollToBlockTitle: blockTitle });
    },
    [stackNav]
  );

  const scrollToTraditionTopics = useCallback(() => {
    stackNav.navigate("KazakhTradition");
  }, [stackNav]);

  const scrollToTraditionTopicsCategory = useCallback(
    (category: "family" | "social" | "ceremony" | "faith") => {
      stackNav.navigate("KazakhTradition", { scrollToCategory: category });
    },
    [stackNav]
  );

  const onOpenBook = useCallback(
    (book: TraditionBookEntry) => {
      openTraditionBook(stackNav, book, {
        scrollToBlockTitle: scrollToTraditionBlock,
        scrollToTopics: scrollToTraditionTopics,
        scrollToTopicsCategory: scrollToTraditionTopicsCategory,
      });
    },
    [stackNav, scrollToTraditionBlock, scrollToTraditionTopics, scrollToTraditionTopicsCategory]
  );

  const screenTitle = useMemo(() => {
    if (isAitScope) return tg.bookGroupAit;
    if (shelfFilter === "ibada") return tg.faithShelfIbada;
    if (shelfFilter === "quran") return tg.faithShelfQuran;
    if (shelfFilter === "ilm") return tg.faithShelfIlm;
    if (shelfFilter === "tools") return tg.faithShelfTools;
    if (shelfFilter === "tradition") return tg.traditionShelfGuides;
    return tg.sectionBooksTitle;
  }, [isAitScope, shelfFilter, tg]);

  const listData = useMemo<BookListItem[]>(() => {
    if (!filteredBooks.length) return [{ kind: "empty" }];
    if (groupedSections && !deferredBookQuery.trim()) {
      return groupedSections.flatMap((section): BookListItem[] => [
        { kind: "section", id: section.id, count: section.books.length },
        ...section.books.map((book) => ({ kind: "book" as const, book })),
      ]);
    }
    return filteredBooks.map((book) => ({ kind: "book", book }));
  }, [deferredBookQuery, filteredBooks, groupedSections]);

  const renderItem = useCallback(
    ({ item }: { item: BookListItem }) => {
      if (item.kind === "section") {
        return (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {tr(catalogSectionTitle(item.id))}
            </Text>
            <Text style={styles.sectionCount}>{tr(tg.booksCount(item.count))}</Text>
          </View>
        );
      }
      if (item.kind === "empty") {
        return <Text style={styles.empty}>{tr(tg.booksSearchEmpty)}</Text>;
      }
      return <TraditionBookCard palette={palette} book={item.book} onOpen={() => onOpenBook(item.book)} tr={tr} />;
    },
    [onOpenBook, palette, styles, tg, tr]
  );

  return (
    <FlatList
      style={styles.root}
      data={listData}
      keyExtractor={(item, index) =>
        item.kind === "section" ? `section-${item.id}` : item.kind === "book" ? item.book.id : `empty-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews={Platform.OS === "android"}
      ListHeaderComponent={
        <View>
          <TraditionKazakhHeroBanner
            palette={palette}
            title={tr(screenTitle)}
            subtitle={tr(isAitScope ? tg.aitLaunchSub : tg.sectionBooksSubtitle)}
            tagline={tr(tg.kazakhHeroTagline)}
          />
          {!isAitScope && shelfFilter === "all" ? <Text style={styles.intro}>{tr(tg.sectionBooksIntro)}</Text> : null}
          <Text style={styles.count}>{tr(tg.booksCount(catalogBooks.length))}</Text>
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={20} color={palette.muted} />
            <TextInput
              value={bookQuery}
              onChangeText={setBookQuery}
              placeholder={tr(tg.sectionBooksSearchPlaceholder)}
              placeholderTextColor={palette.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={tr(tg.sectionBooksSearchPlaceholder)}
            />
            {bookQuery.trim().length > 0 ? (
              <Pressable
                onPress={() => setBookQuery("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalHubClearSearch}
              >
                <MaterialIcons name="close" size={20} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      }
      ListFooterComponent={
        translated ? (
          <View style={styles.autoBanner}>
            <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
            <Text style={styles.autoBannerText}>{kk.common.autoTranslateNotice}</Text>
          </View>
        ) : null
      }
    />
  );
}



function makeStyles(p: TraditionKazakhPalette) {

  return StyleSheet.create({

    root: { flex: 1, backgroundColor: p.screenBg },

    content: { padding: 14, paddingBottom: 28 },

    intro: {

      fontSize: 14,

      lineHeight: 21,

      color: p.muted,

      marginBottom: 6,

    },

    count: {

      fontSize: 12,

      fontWeight: "800",

      color: p.text,

      marginBottom: 14,

    },

    searchRow: {

      flexDirection: "row",

      alignItems: "center",

      gap: 8,

      borderWidth: 1,

      borderColor: p.border,

      borderRadius: 12,

      backgroundColor: p.cardBg,

      paddingHorizontal: 12,

      paddingVertical: Platform.OS === "ios" ? 10 : 6,

      marginBottom: 14,

    },

    searchInput: {

      flex: 1,

      fontSize: 15,

      paddingVertical: 4,

      color: p.text,

    },

    empty: {

      fontSize: 13,

      color: p.muted,

    },

    sectionBlock: {

      marginBottom: 18,

    },

    sectionTitle: {

      fontSize: 15,

      fontWeight: "900",

      color: p.goldMuted,

      marginBottom: 2,

    },

    sectionCount: {

      fontSize: 11,

      fontWeight: "700",

      color: p.muted,

      marginBottom: 10,

    },

    autoBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginTop: 4,
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },

    autoBannerText: { flex: 1, color: p.muted, fontSize: 11, fontWeight: "600" },

  });

}


