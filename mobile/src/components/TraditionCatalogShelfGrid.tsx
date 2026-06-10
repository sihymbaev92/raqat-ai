import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../i18n/kk";
import type { FaithBookShelfId } from "../content/traditionBooksCatalog";
import {
  getFaithBooksByShelf,
  getTraditionGuideBooks,
} from "../content/traditionBooksCatalog";
import { TRADITION_TOPIC_BLOCK_COUNT } from "../content/kazakhTraditionTopicStats";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type ShelfLaunch = FaithBookShelfId | "tradition";

type Props = {
  palette: TraditionKazakhPalette;
  onOpenShelf: (shelf: ShelfLaunch) => void;
  onOpenAllBooks: () => void;
};

function shelfBookCount(id: ShelfLaunch): number {
  if (id === "tradition") return getTraditionGuideBooks().length;
  return getFaithBooksByShelf(id).length;
}

/**
 * Кітаптар — 2×2 категория карточкалары (mockup стилі).
 */
export function TraditionCatalogShelfGrid({ palette, onOpenShelf, onOpenAllBooks }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const tg = kk.features.traditionGuide;

  const rows = useMemo(
    () =>
      [
        {
          id: "ibada" as const,
          icon: "mosque" as const,
          title: tg.faithShelfIbada,
          hint: tg.faithShelfIbadaHint,
        },
        {
          id: "quran" as const,
          icon: "book-open-variant" as const,
          title: tg.faithShelfQuran,
          hint: tg.faithShelfQuranHint,
        },
        {
          id: "ilm" as const,
          icon: "school" as const,
          title: tg.faithShelfIlm,
          hint: tg.faithShelfIlmHint,
        },
        {
          id: "tradition" as const,
          icon: "account-group" as const,
          title: tg.traditionShelfGuides,
          hint: tg.traditionShelfGuidesHint,
        },
      ],
    [tg]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>{tg.catalogReadOrderTitle}</Text>
      <View style={styles.grid}>
        {rows.map((row) => {
          const n = shelfBookCount(row.id);
          const badge =
            row.id === "tradition"
              ? tg.topicsCount(TRADITION_TOPIC_BLOCK_COUNT)
              : tg.booksCount(n);
          return (
            <Pressable
              key={row.id}
              oyuBackdrop={false}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
              onPress={() => onOpenShelf(row.id)}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}. ${row.hint}`}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={row.icon} size={24} color={palette.gold} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {row.title}
              </Text>
              <Text style={styles.cardHint} numberOfLines={2}>
                {row.hint}
              </Text>
              <Text style={styles.badge}>{badge}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        oyuBackdrop={false}
        style={({ pressed }) => [styles.allBtn, pressed && { opacity: 0.92 }]}
        onPress={onOpenAllBooks}
        accessibilityRole="button"
        accessibilityLabel={tg.booksOpenAllCta}
      >
        <Text style={styles.allBtnTxt}>{tg.booksOpenAllCta}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: { gap: 10, marginBottom: 4 },
    head: {
      fontSize: 13,
      fontWeight: "800",
      color: p.goldMuted,
      marginBottom: 2,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    card: {
      width: "47%",
      flexGrow: 1,
      minWidth: 140,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      minHeight: 132,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: p.goldSurface,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    cardTitle: { fontSize: 14, fontWeight: "900", color: p.text, lineHeight: 18 },
    cardHint: { fontSize: 11, lineHeight: 16, color: p.muted, marginTop: 4, flex: 1 },
    badge: {
      marginTop: 8,
      fontSize: 10,
      fontWeight: "800",
      color: p.goldMuted,
    },
    allBtn: {
      marginTop: 4,
      alignSelf: "stretch",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: p.buttonGoldBg,
    },
    allBtnTxt: {
      fontSize: 14,
      fontWeight: "900",
      color: p.buttonGoldText,
    },
  });
}
