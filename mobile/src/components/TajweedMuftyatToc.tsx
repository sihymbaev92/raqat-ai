import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import {
  TAJWEED_APP_SECTIONS,
  buildTajweedTocGroups,
  type TajweedTocGroup,
} from "../content/tajweedMuftyatScope";
import type { TajweedMuftyatSection } from "../content/tajweedMuftyatCatalog";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  onPickPage: (page: number) => void;
  /** Басты экранда — ScrollView ішінде */
  embedded?: boolean;
};

function groupTitle(group: TajweedTocGroup): string {
  if (group.part) return group.part.title;
  return kk.tajweedGuide.tocGroupPreface;
}

function groupPageRange(group: TajweedTocGroup): string {
  const chapters = group.chapters;
  if (chapters.length === 0) return "";
  const start = chapters[0].startPage;
  const end = chapters[chapters.length - 1].endPage;
  if (start === end) return `${start}`;
  return `${start}–${end}`;
}

function ChapterRow({
  sec,
  onPickPage,
  styles,
  colors,
}: {
  sec: TajweedMuftyatSection;
  onPickPage: (page: number) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chapterRow, pressed && { opacity: 0.9 }]}
      onPress={() => onPickPage(sec.startPage)}
      accessibilityRole="button"
      accessibilityLabel={`${sec.title}, ${sec.startPage}`}
    >
      <View style={styles.chapterText}>
        <Text style={styles.chapterTitle} numberOfLines={3}>
          {sec.title}
        </Text>
        <Text style={styles.chapterPages}>
          {sec.startPage}
          {sec.endPage > sec.startPage ? ` – ${sec.endPage}` : ""}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

export function TajweedMuftyatToc({ onPickPage, embedded = false }: Props) {
  useAppLocale();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const groups = useMemo(() => buildTajweedTocGroups(TAJWEED_APP_SECTIONS), []);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) {
      init[g.id] = g.part?.id === "part1";
    }
    return init;
  });

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((o) => ({ ...o, [id]: !o[id] }));
  }, []);

  const rows = (
    <>
      {groups.map((group) => {
        const open = !!openGroups[group.id];
        const range = groupPageRange(group);
        return (
          <View key={group.id} style={styles.groupWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.groupHead,
                group.part && styles.groupHeadPart,
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => toggleGroup(group.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${groupTitle(group)}${range ? `, ${range}` : ""}`}
            >
              <View style={styles.groupHeadText}>
                <Text style={[styles.groupTitle, group.part && styles.groupTitlePart]} numberOfLines={2}>
                  {groupTitle(group)}
                </Text>
                {range ? <Text style={styles.groupRange}>{range}</Text> : null}
              </View>
              <View style={styles.groupChevronBox}>
                <MaterialIcons
                  name={open ? "expand-less" : "expand-more"}
                  size={22}
                  color={colors.accent}
                />
              </View>
            </Pressable>
            {open ? (
              <View style={styles.groupBody}>
                {group.chapters.map((sec) => (
                  <ChapterRow
                    key={sec.id}
                    sec={sec}
                    onPickPage={onPickPage}
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      <Text style={styles.footHint}>{kk.tajweedGuide.tocJumpHint}</Text>
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{rows}</View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {rows}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 14, paddingBottom: 32, paddingTop: 4, gap: 8 },
    embedded: { gap: 8 },
    groupWrap: { gap: 6 },
    groupHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    groupHeadPart: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    groupHeadText: { flex: 1, minWidth: 0 },
    groupTitle: { color: colors.text, fontWeight: "800", fontSize: 14, lineHeight: 20 },
    groupTitlePart: { color: colors.accent },
    groupRange: { color: colors.muted, fontSize: 12, marginTop: 3, fontWeight: "600" },
    groupChevronBox: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    groupBody: { gap: 6, paddingLeft: 8 },
    chapterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    chapterText: { flex: 1, minWidth: 0 },
    chapterTitle: { color: colors.text, fontWeight: "600", fontSize: 13, lineHeight: 19 },
    chapterPages: { color: colors.muted, fontSize: 11, marginTop: 3, fontWeight: "600" },
    footHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      paddingHorizontal: 2,
    },
  });
}
