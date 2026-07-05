import React, { memo, useCallback, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DIN_MEN_DASTUR_QUICK_GUIDE,
  type DinMenDasturQuickItem,
} from "../../content/dinMenDasturQuickGuide";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { modalSheetBottomPadding } from "../../utils/modalSheetInsets";

type Props = {
  palette: TraditionKazakhPalette;
  tr: (text: string) => string;
  onOpenFullTopic?: (topicId: string) => void;
};

function DetailSheet({
  item,
  visible,
  palette,
  tr,
  onClose,
  onOpenFullTopic,
}: {
  item: DinMenDasturQuickItem | null;
  visible: boolean;
  palette: TraditionKazakhPalette;
  tr: (text: string) => string;
  onClose: () => void;
  onOpenFullTopic?: (topicId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeSheetStyles(palette), [palette]);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={tr("Жабу")}>
        <Pressable style={[styles.sheet, { paddingBottom: modalSheetBottomPadding(insets) }]} onPress={() => {}}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{tr(item.title)}</Text>
            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>{tr("🔍 Шығу тарихы:")}</Text>
            <Text style={styles.body}>{tr(item.history)}</Text>

            <Text style={[styles.sectionLabel, styles.sectionGap]}>{tr("⚖️ Шариғаттағы үкімі:")}</Text>
            <Text style={styles.shariat}>{tr(item.shariat)}</Text>

            <Text style={[styles.sectionLabel, styles.sectionGap]}>{tr("📖 Дінмен ұштасуы (Дәлел):")}</Text>
            <Text style={styles.body}>{tr(item.detail)}</Text>

            {onOpenFullTopic ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => {
                  onClose();
                  onOpenFullTopic(item.topicId);
                }}
                style={({ pressed }) => [styles.fullBtn, pressed && { opacity: 0.92 }]}
                accessibilityRole="button"
                accessibilityLabel={tr("Толық мазмұнды оқу")}
              >
                <Text style={styles.fullBtnTxt}>{tr("Толық мазмұнды оқу")}</Text>
                <MaterialIcons name="chevron-right" size={20} color={palette.buttonGoldText} />
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const DinMenDasturQuickList = memo(function DinMenDasturQuickList({
  palette,
  tr,
  onOpenFullTopic,
}: Props) {
  const styles = useMemo(() => makeListStyles(palette), [palette]);
  const [selected, setSelected] = useState<DinMenDasturQuickItem | null>(null);

  const openSheet = useCallback((item: DinMenDasturQuickItem) => setSelected(item), []);
  const closeSheet = useCallback(() => setSelected(null), []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{tr("Шайналған түсіндіру")}</Text>
      <Text style={styles.lead}>{tr("Негізгі 4 дәстүр — тарихы, шариғат үкімі және дінмен байланысы.")}</Text>

      {DIN_MEN_DASTUR_QUICK_GUIDE.map((item) => (
        <Pressable
          key={item.id}
          oyuBackdrop={false}
          onPress={() => openSheet(item)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
          accessibilityRole="button"
          accessibilityLabel={tr(item.title)}
        >
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{tr(item.title)}</Text>
            <Text style={styles.cardHistory} numberOfLines={1}>
              {tr(item.history)}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={16} color={palette.brownSoft} />
        </Pressable>
      ))}

      <DetailSheet
        item={selected}
        visible={selected != null}
        palette={palette}
        tr={tr}
        onClose={closeSheet}
        onOpenFullTopic={onOpenFullTopic}
      />
    </View>
  );
});

function makeListStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: { marginBottom: 8 },
    heading: {
      color: p.text,
      fontSize: 17,
      fontWeight: "900",
      marginBottom: 4,
    },
    lead: {
      color: p.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.cardElevated,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: p.border,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    cardBody: { flex: 1, minWidth: 0, paddingRight: 8 },
    cardTitle: {
      color: p.text,
      fontSize: 16,
      fontWeight: "800",
    },
    cardHistory: {
      marginTop: 8,
      color: p.muted,
      fontSize: 13,
    },
  });
}

function makeSheetStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.42)",
    },
    sheet: {
      maxHeight: "88%",
      backgroundColor: p.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: p.border,
      marginBottom: 16,
    },
    sheetTitle: {
      color: p.text,
      fontSize: 20,
      fontWeight: "900",
      lineHeight: 26,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.border,
      marginVertical: 16,
    },
    sectionLabel: {
      color: p.brownSoft,
      fontSize: 14,
      fontWeight: "800",
    },
    sectionGap: { marginTop: 16 },
    body: {
      marginTop: 4,
      color: p.text,
      fontSize: 15,
      lineHeight: 22,
    },
    shariat: {
      marginTop: 4,
      color: "#2E7D32",
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 22,
    },
    fullBtn: {
      marginTop: 20,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: p.buttonGoldBg,
      borderRadius: 999,
      paddingVertical: 13,
      paddingHorizontal: 18,
    },
    fullBtnTxt: {
      color: p.buttonGoldText,
      fontSize: 14,
      fontWeight: "900",
    },
  });
}
