import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import {
  TRADITION_BOOK_CATALOG_GROUPS,
  TRADITION_BOOK_GROUPS,
  getTraditionBooksByGroup,
  type TraditionBookGroup,
} from "../content/traditionBooksCatalog";

type Labels = {
  title: string;
  howTo: string;
  bookCount: (n: number) => string;
};

const GROUP_ICON: Record<TraditionBookGroup, keyof typeof MaterialIcons.glyphMap> = {
  faith: "menu-book",
  ait: "celebration",
  wisdom: "auto-stories",
  tradition: "groups",
};

type Props = {
  colors: ThemeColors;
  labels: Labels;
  /** Әдепкі: кітаптар каталогы (бабалар сөзі топысыз). `all` — барлық 4 топ. */
  mode?: "catalog" | "all";
};

export function TraditionCollectionsOverview({ colors, labels, mode = "catalog" }: Props) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const groups = mode === "all" ? TRADITION_BOOK_GROUPS : TRADITION_BOOK_CATALOG_GROUPS;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {labels.title}
      </Text>
      <Text style={styles.howTo} selectable>
        {labels.howTo}
      </Text>
      {groups.map((grp, index) => {
        const count = getTraditionBooksByGroup(grp.id).length;
        return (
          <View key={grp.id} style={styles.row}>
            <View style={styles.numBadge}>
              <Text style={styles.numTxt}>{index + 1}</Text>
            </View>
            <MaterialIcons name={GROUP_ICON[grp.id]} size={22} color={colors.accent} />
            <View style={styles.rowText}>
              <View style={styles.rowHead}>
                <Text style={styles.rowTitle}>{grp.label}</Text>
                <Text style={styles.rowCount}>{labels.bookCount(count)}</Text>
              </View>
              <Text style={styles.rowHint} selectable>
                {grp.hint}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 14,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 6,
    },
    howTo: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 10,
    },
    numBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    numTxt: { fontSize: 11, fontWeight: "900", color: colors.accent },
    rowText: { flex: 1, minWidth: 0 },
    rowHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
    },
    rowTitle: { fontSize: 14, fontWeight: "900", color: colors.text, flexShrink: 1 },
    rowCount: { fontSize: 11, fontWeight: "800", color: colors.accent },
    rowHint: { fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 2 },
  });
}
