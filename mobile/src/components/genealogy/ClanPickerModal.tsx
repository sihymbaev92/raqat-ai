import React, { useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import bundled from "../../../assets/bundled/genealogy-p0.json";
import { useAppTheme } from "../../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { kk } from "../../i18n/kk";

type ClanNode = {
  slug: string;
  name_kk: string;
  name_kk_alt?: string | null;
  level: number;
  sort_order?: number;
  breadcrumbs?: string[];
};

const NODES: ClanNode[] = ((bundled as { nodes?: ClanNode[] }).nodes ?? []).slice();

function childrenOf(parentSlug: string | null): ClanNode[] {
  const rows = parentSlug
    ? NODES.filter((n) => {
        const c = n.breadcrumbs ?? [];
        return c.length >= 2 && c[c.length - 2] === parentSlug;
      })
    : NODES.filter((n) => n.level === 1);
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_kk.localeCompare(b.name_kk, "kk"));
}

function hasChildren(slug: string): boolean {
  return NODES.some((n) => {
    const c = n.breadcrumbs ?? [];
    return c.length >= 2 && c[c.length - 2] === slug;
  });
}

function labelFor(slug: string): string {
  return NODES.find((n) => n.slug === slug)?.name_kk ?? slug;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (clan: { slug: string; label: string }) => void;
};

export function ClanPickerModal({ visible, onClose, onSelect }: Props) {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const [stack, setStack] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const s = useMemo(() => makeStyles(palette), [palette]);

  const parentSlug = stack.length ? stack[stack.length - 1] : null;
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const rows = useMemo(() => {
    if (searching) {
      return NODES.filter((n) =>
        [n.name_kk, n.name_kk_alt, n.slug].filter(Boolean).join(" ").toLowerCase().includes(q)
      ).slice(0, 60);
    }
    return childrenOf(parentSlug);
  }, [searching, q, parentSlug]);

  const reset = () => {
    setStack([]);
    setQuery("");
  };

  const pick = (node: ClanNode) => {
    onSelect({ slug: node.slug, label: node.name_kk });
    reset();
    onClose();
  };

  const drill = (node: ClanNode) => {
    if (searching) {
      // Іздеуден таңдаса — сол түйінге дейінгі жолды ашамыз
      setQuery("");
      setStack(node.breadcrumbs ?? [node.slug]);
      return;
    }
    setStack((prev) => [...prev, node.slug]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: colors.bg }]}>
          <View style={s.handle} />
          <Text style={[s.title, { color: colors.text }]}>{kk.features.familyClanPickTitle}</Text>

          <TextInput
            style={[s.search, { color: colors.text, borderColor: palette.border, backgroundColor: palette.cardBg }]}
            placeholder={kk.features.familyClanSearchPlaceholder}
            placeholderTextColor={palette.muted}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />

          {!searching && stack.length > 0 ? (
            <View style={s.crumbRow}>
              <Pressable onPress={reset} hitSlop={8} style={s.crumbBtn}>
                <MaterialIcons name="home" size={16} color={palette.gold} />
              </Pressable>
              {stack.map((slug, i) => (
                <Pressable
                  key={slug}
                  onPress={() => setStack(stack.slice(0, i + 1))}
                  hitSlop={6}
                  style={s.crumbBtn}
                >
                  <MaterialIcons name="chevron-right" size={14} color={palette.muted} />
                  <Text style={[s.crumbTxt, { color: i === stack.length - 1 ? palette.gold : palette.muted }]}>
                    {labelFor(slug)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <FlatList
            data={rows}
            keyExtractor={(n) => n.slug}
            keyboardShouldPersistTaps="handled"
            style={s.list}
            ListEmptyComponent={<Text style={[s.empty, { color: palette.muted }]}>{kk.features.genealogySearchEmpty}</Text>}
            renderItem={({ item }) => {
              const drillable = searching || hasChildren(item.slug);
              return (
                <View style={[s.row, { borderColor: palette.border }]}>
                  <Pressable style={s.rowMain} onPress={() => pick(item)}>
                    <Text style={[s.rowName, { color: colors.text }]}>{item.name_kk}</Text>
                    {item.name_kk_alt ? (
                      <Text style={[s.rowAlt, { color: palette.muted }]}>{item.name_kk_alt}</Text>
                    ) : null}
                  </Pressable>
                  <Pressable style={s.pickBtn} onPress={() => pick(item)} hitSlop={6}>
                    <Text style={[s.pickTxt, { color: palette.gold }]}>{kk.features.familyClanPick}</Text>
                  </Pressable>
                  {drillable ? (
                    <Pressable style={s.drillBtn} onPress={() => drill(item)} hitSlop={6}>
                      <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />

          <Pressable style={[s.closeBtn, { borderColor: palette.border }]} onPress={onClose}>
            <Text style={[s.closeTxt, { color: colors.text }]}>{kk.features.familyTreeCancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(palette: ReturnType<typeof getTraditionKazakhPalette>) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
    backdrop: { ...StyleSheet.absoluteFillObject },
    sheet: {
      maxHeight: "82%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 24,
    },
    handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, marginBottom: 12 },
    title: { fontSize: 17, fontWeight: "800", marginBottom: 10 },
    search: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 10,
    },
    crumbRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 8 },
    crumbBtn: { flexDirection: "row", alignItems: "center" },
    crumbTxt: { fontSize: 13, fontWeight: "600" },
    list: { flexGrow: 0 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: 12,
      gap: 8,
    },
    rowMain: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: "600" },
    rowAlt: { fontSize: 12, marginTop: 2 },
    pickBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    pickTxt: { fontSize: 13, fontWeight: "800" },
    drillBtn: { paddingLeft: 2 },
    empty: { textAlign: "center", paddingVertical: 24 },
    closeBtn: { marginTop: 12, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    closeTxt: { fontSize: 15, fontWeight: "700" },
  });
}
