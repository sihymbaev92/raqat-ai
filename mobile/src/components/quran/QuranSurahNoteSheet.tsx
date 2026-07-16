import React from "react";
import { View, Text, Modal, StyleSheet, TextInput } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import type { CachedAyah } from "../../storage/quranSurahCache";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type QuranSurahNoteSheetProps = {
  visible: boolean;
  item: CachedAyah | null;
  surahNumber: number;
  noteDraft: string;
  onChangeNoteDraft: (text: string) => void;
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
};

export function QuranSurahNoteSheet({
  visible,
  item,
  surahNumber,
  noteDraft,
  onChangeNoteDraft,
  styles,
  colors,
  onCancel,
  onSave,
}: QuranSurahNoteSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.readerSettingsRoot}>
        <Pressable style={styles.readerSettingsBackdrop} onPress={onCancel} />
        <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <View style={styles.readerSettingsHandle} />
          {item ? (
            <>
              <Text style={styles.readerSettingsTitle}>
                {kk.quran.ayahMenuTitle(surahNumber, item.numberInSurah)}
              </Text>
              <TextInput
                value={noteDraft}
                onChangeText={onChangeNoteDraft}
                placeholder={kk.quran.ayahMenuNotePlaceholder}
                placeholderTextColor={colors.muted}
                multiline
                style={{
                  minHeight: 100,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.text,
                  marginHorizontal: 4,
                  marginTop: 8,
                  textAlignVertical: "top",
                }}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14, paddingHorizontal: 4 }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.readerSettingsDoneBtn,
                    { flex: 1, alignItems: "center" },
                    pressed && { opacity: 0.92 },
                  ]}
                  onPress={onCancel}
                >
                  <Text style={styles.readerSettingsDoneTxt}>{kk.quran.ayahMenuCancel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.readerSettingsDoneBtn,
                    { flex: 1, alignItems: "center" },
                    pressed && { opacity: 0.92 },
                  ]}
                  onPress={() => void onSave()}
                >
                  <Text style={styles.readerSettingsDoneTxt}>{kk.quran.ayahMenuSaveNote}</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
