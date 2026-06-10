import React, { useCallback, useMemo, useState } from "react";

import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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

} from "../content/traditionBooksCatalog";

import { TraditionBookCard } from "../components/TraditionBookCard";
import { TraditionKazakhHeroBanner } from "../components/tradition/TraditionKazakhHeroBanner";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

import { openTraditionBook } from "../utils/openTraditionBook";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

import type { MoreStackParamList } from "../navigation/types";



type Props = NativeStackScreenProps<MoreStackParamList, "KazakhTraditionBooks">;

type Nav = NativeStackNavigationProp<MoreStackParamList>;



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

  const { isDark } = useAppTheme();

  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);

  const styles = useMemo(() => makeStyles(palette), [palette]);

  const tg = kk.features.traditionGuide;

  const { tr, translated } = useKkAutoTranslator();

  const stackNav = useNavigation<Nav>();

  const [bookQuery, setBookQuery] = useState("");

  const scope = route.params?.scope ?? "catalog";

  const shelfFilter = route.params?.shelf ?? "all";

  const isAitScope = scope === "ait";



  const catalogBooks = useMemo(

    () => (isAitScope ? getAitBooks() : getCatalogBooksForShelf(shelfFilter)),

    [isAitScope, shelfFilter]

  );



  const groupedSections = useMemo(() => {

    if (isAitScope || bookQuery.trim() || shelfFilter !== "all") return null;

    return getCatalogBookSections();

  }, [isAitScope, bookQuery, shelfFilter]);



  const filteredBooks = useMemo(() => {

    const q = bookQuery.trim().toLowerCase();

    if (!q) return catalogBooks;

    return catalogBooks.filter((b) => traditionBookSearchBlob(b).includes(q));

  }, [catalogBooks, bookQuery]);



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

    (book: (typeof catalogBooks)[number]) => {

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



  return (

    <ScrollView

      style={styles.root}

      contentContainerStyle={styles.content}

      keyboardShouldPersistTaps="handled"

      showsVerticalScrollIndicator

    >

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



      {filteredBooks.length === 0 ? (

        <Text style={styles.empty}>{tr(tg.booksSearchEmpty)}</Text>

      ) : groupedSections && !bookQuery.trim() ? (

        groupedSections.map((section) => (

          <View key={section.id} style={styles.sectionBlock}>

            <Text style={styles.sectionTitle} accessibilityRole="header">

              {tr(catalogSectionTitle(section.id))}

            </Text>

            <Text style={styles.sectionCount}>{tr(tg.booksCount(section.books.length))}</Text>

            {section.books.map((book) => (

              <TraditionBookCard key={book.id} palette={palette} book={book} onOpen={() => onOpenBook(book)} tr={tr} />

            ))}

          </View>

        ))

      ) : (

        filteredBooks.map((book) => (

          <TraditionBookCard key={book.id} palette={palette} book={book} onOpen={() => onOpenBook(book)} tr={tr} />

        ))

      )}

      {translated ? (
        <View style={styles.autoBanner}>
          <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
          <Text style={styles.autoBannerText}>{kk.common.autoTranslateNotice}</Text>
        </View>
      ) : null}

    </ScrollView>

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


