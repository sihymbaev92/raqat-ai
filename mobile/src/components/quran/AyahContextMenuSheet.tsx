import React, { useMemo, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import type { ThemeColors } from "../../theme/colors";
import type { CachedAyah } from "../../storage/quranSurahCache";
import { AYAH_MARKER_COLOR_HEX, type AyahMarkerColorId } from "../../storage/quranAyahMarkers";
import {
  QURAN_RECITER_GROUP_ORDER,
  QURAN_RECITER_OPTIONS,
  quranReciterGroupLabelKk,
} from "../../config/quranReciters";
import {
  HatimReaderSettingsMenuSection,
  type HatimReaderSettingsHandlers,
  type HatimReaderSettingsSnapshot,
} from "./HatimReaderSettingsMenuSection";
import type { HatimAudioPlayUntil } from "../../storage/hatimPrefs";

const AYAH_MARKER_COLOR_IDS = Object.keys(AYAH_MARKER_COLOR_HEX) as AyahMarkerColorId[];
const QUICK_HIGHLIGHT_COLOR: AyahMarkerColorId = "rose";

function playUntilMenuHint(scope: HatimAudioPlayUntil): string {
  if (scope === "surah") return `${kk.hatim.settingsPlayUntilSurah} соңына дейін`;
  if (scope === "ayah") return kk.quran.ayahMenuPlaySelectedHint;
  return kk.quran.ayahMenuPlayUntilJuzHint;
}

export type AyahContextMenuSheetStyles = Record<string, never>;

type Props = {
  visible: boolean;
  ayahMenuItem: CachedAyah | null;
  surahNumber: number;
  windowHeight: number;
  windowWidth: number;
  paddingBottom: number;
  colors: ThemeColors;
  isDark: boolean;
  styles?: AyahContextMenuSheetStyles;
  onClose: () => void;
  onPlaySelected: (ayahInSurah: number) => void;
  onPlayUntilJuz: (ayahInSurah: number) => void;
  onPlayRepeat: (ayahInSurah: number) => void;
  reciterEdition: string;
  onPickReciter: (edition: string) => void;
  onCopy: (item: CachedAyah) => void;
  onShare: (item: CachedAyah) => void;
  onOpenTranslation: (item: CachedAyah) => void;
  onPickMarkerColor: (item: CachedAyah, colorId: AyahMarkerColorId) => void;
  onRemoveMarker: (item: CachedAyah) => void;
  hasMarkerForAyah: boolean;
  /** Хатым: оқу баптаулары (толық HatimSettings экранымен қайталанбайды). */
  hatimReaderSettings?: {
    values: HatimReaderSettingsSnapshot;
    handlers: HatimReaderSettingsHandlers;
  };
  /** Хатым: «Ойнату … дейін» жолы playUntil баптауымен сәйкес. */
  playUntilScope?: HatimAudioPlayUntil;
};

type MenuStyles = {
  backdrop: ViewStyle;
  host: ViewStyle;
  popover: ViewStyle;
  scroll: ViewStyle;
  row: ViewStyle;
  rowPressed: ViewStyle;
  iconSlot: ViewStyle;
  rowTextCol: ViewStyle;
  rowTitle: TextStyle;
  rowTitleInline: TextStyle;
  rowSubtitle: TextStyle;
  rowSubtitleInline: TextStyle;
  colorGrid: ViewStyle;
  colorSwatch: ViewStyle;
  reciterWrap: ViewStyle;
  reciterTitle: TextStyle;
  reciterGroup: TextStyle;
  reciterOption: ViewStyle;
  reciterOptionSelected: ViewStyle;
  reciterOptionText: TextStyle;
  reciterOptionTextSelected: TextStyle;
  divider: ViewStyle;
};

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  a11y,
  s,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  a11y: string;
  s: MenuStyles;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      oyuBackdrop={false}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <View style={s.iconSlot}>{icon}</View>
      <View style={s.rowTextCol}>
        {subtitle ? (
          <Text style={s.rowTitleInline} numberOfLines={2}>
            <Text style={s.rowTitle}>{title}</Text>
            <Text style={s.rowSubtitleInline}> {subtitle}</Text>
          </Text>
        ) : (
          <Text style={s.rowTitle} numberOfLines={2}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** Аятқа ұстау: ортада контекст мәзірі (Quran.com стилі). */
export function AyahContextMenuSheet({
  visible,
  ayahMenuItem,
  surahNumber,
  windowHeight,
  windowWidth,
  colors,
  isDark,
  onClose,
  onPlaySelected,
  onPlayUntilJuz,
  onPlayRepeat,
  reciterEdition,
  onPickReciter,
  onCopy,
  onShare,
  onOpenTranslation,
  onPickMarkerColor,
  onRemoveMarker,
  hasMarkerForAyah,
  hatimReaderSettings,
  playUntilScope = "juz",
}: Props) {
  useAppLocale();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [reciterOpen, setReciterOpen] = useState(false);
  const { tr } = useKkAutoTranslator();

  const s = useMemo(() => makeMenuStyles(colors, isDark, windowWidth), [colors, isDark, windowWidth]);
  const playUntilHint = playUntilMenuHint(playUntilScope);
  const selectedReciterLabel = useMemo(
    () => QURAN_RECITER_OPTIONS.find((r) => r.edition === reciterEdition)?.labelKk ?? kk.quran.readerReciterTitle,
    [reciterEdition]
  );

  const closeAll = () => {
    setColorPickerOpen(false);
    setReciterOpen(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAll}>
      {ayahMenuItem ? (
        <View style={s.host}>
          <Pressable oyuBackdrop={false} style={s.backdrop} onPress={closeAll} accessibilityLabel={kk.common.close} />
          <View
            style={[
              s.popover,
              { maxHeight: Math.min(windowHeight * 0.82, hatimReaderSettings ? 560 : 520) },
            ]}
          >
            <ScrollView
              style={s.scroll}
              contentContainerStyle={{ paddingVertical: 6 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialIcons name="play-circle-outline" size={22} color={colors.text} />}
                title={tr(kk.quran.ayahMenuPlaySelected)}
                subtitle={tr(kk.quran.ayahMenuPlaySelectedHint)}
                a11y={`${kk.quran.ayahMenuPlaySelected} ${kk.quran.ayahMenuPlaySelectedHint}`}
                onPress={() => {
                  onPlaySelected(ayahMenuItem.numberInSurah);
                  closeAll();
                }}
              />
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialIcons name="play-arrow" size={22} color={colors.text} />}
                title={tr(kk.quran.ayahMenuPlayUntilJuz)}
                subtitle={tr(playUntilHint)}
                a11y={`${kk.quran.ayahMenuPlayUntilJuz} ${playUntilHint}`}
                onPress={() => {
                  onPlayUntilJuz(ayahMenuItem.numberInSurah);
                  closeAll();
                }}
              />
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialCommunityIcons name="repeat" size={21} color={colors.text} />}
                title={tr(kk.quran.ayahMenuRepeat)}
                subtitle={tr(kk.quran.ayahMenuRepeatHint)}
                a11y={kk.quran.ayahMenuRepeat}
                onPress={() => {
                  onPlayRepeat(ayahMenuItem.numberInSurah);
                  closeAll();
                }}
              />
              <View style={s.divider} />
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialIcons name="record-voice-over" size={21} color={colors.text} />}
                title={tr(kk.quran.readerReciterTitle)}
                subtitle={selectedReciterLabel}
                a11y={kk.quran.readerReciterTitle}
                onPress={() => setReciterOpen((v) => !v)}
              />
              {reciterOpen ? (
                <View style={s.reciterWrap}>
                  {QURAN_RECITER_GROUP_ORDER.map((group) => {
                    const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
                    if (!items.length) return null;
                    return (
                      <View key={group}>
                        <Text style={s.reciterGroup}>{tr(quranReciterGroupLabelKk(group))}</Text>
                        {items.map((r) => {
                          const available = r.audioAvailable !== false;
                          const selected = reciterEdition === r.edition;
                          const label = available
                            ? r.labelKk
                            : `${r.labelKk} (${kk.quran.readerReciterSoon})`;
                          return (
                            <Pressable
                              key={r.edition}
                              oyuBackdrop={false}
                              onPress={() => {
                                if (!available) return;
                                onPickReciter(r.edition);
                              }}
                              disabled={!available}
                              accessibilityRole="button"
                              accessibilityState={{ selected, disabled: !available }}
                              accessibilityLabel={
                                available ? label : kk.quran.readerReciterUnavailableA11y(r.labelKk)
                              }
                              style={({ pressed }) => [
                                s.reciterOption,
                                selected && s.reciterOptionSelected,
                                pressed && available && { opacity: 0.88 },
                                !available && { opacity: 0.55 },
                              ]}
                            >
                              <MaterialIcons
                                name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                                size={18}
                                color={selected ? colors.accent : colors.muted}
                              />
                              <Text
                                style={[s.reciterOptionText, selected && s.reciterOptionTextSelected]}
                                numberOfLines={2}
                              >
                                {label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <View style={s.divider} />
              <MenuRow
                s={s}
                colors={colors}
                icon={
                  <View
                    style={[
                      s.colorSwatch,
                      {
                        backgroundColor: AYAH_MARKER_COLOR_HEX[QUICK_HIGHLIGHT_COLOR],
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                      },
                    ]}
                  />
                }
                title={tr(kk.quran.ayahMenuHighlight)}
                a11y={kk.quran.ayahMenuHighlight}
                onPress={() => {
                  onPickMarkerColor(ayahMenuItem, QUICK_HIGHLIGHT_COLOR);
                  closeAll();
                }}
              />
              <MenuRow
                s={s}
                colors={colors}
                icon={
                  <MaterialCommunityIcons name="palette" size={21} color={colors.text} />
                }
                title={tr(kk.quran.ayahMenuHighlight)}
                subtitle={tr(kk.quran.ayahMenuHighlightPickColor)}
                a11y={kk.quran.ayahMenuHighlightPickColor}
                onPress={() => setColorPickerOpen((v) => !v)}
              />
              {colorPickerOpen ? (
                <View style={s.colorGrid}>
                  {AYAH_MARKER_COLOR_IDS.map((cid) => (
                    <Pressable
                      oyuBackdrop={false}
                      key={cid}
                      onPress={() => {
                        onPickMarkerColor(ayahMenuItem, cid);
                        closeAll();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={cid}
                      style={({ pressed }) => [
                        s.colorSwatch,
                        { backgroundColor: AYAH_MARKER_COLOR_HEX[cid] },
                        pressed && { opacity: 0.85 },
                      ]}
                    />
                  ))}
                  {hasMarkerForAyah ? (
                    <Pressable
                      oyuBackdrop={false}
                      onPress={() => {
                        onRemoveMarker(ayahMenuItem);
                        closeAll();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={kk.quran.ayahMenuRemoveMarker}
                      style={({ pressed }) => [s.row, pressed && s.rowPressed, { marginTop: 4 }]}
                    >
                      <MaterialIcons name="bookmark-remove" size={20} color={colors.error} />
                      <Text style={[s.rowTitle, { color: colors.error, marginLeft: 10 }]}>
                        {tr(kk.quran.ayahMenuRemoveMarker)}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <View style={s.divider} />
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialCommunityIcons name="earth" size={21} color={colors.text} />}
                title={tr(kk.quran.ayahMenuTranslationTafsir)}
                a11y={kk.quran.ayahMenuTranslationTafsir}
                onPress={() => {
                  onOpenTranslation(ayahMenuItem);
                  closeAll();
                }}
              />
              <MenuRow
                s={s}
                colors={colors}
                icon={<MaterialIcons name="content-copy" size={20} color={colors.text} />}
                title={tr(kk.quran.ayahMenuCopyShort)}
                a11y={kk.quran.ayahMenuCopyShort}
                onPress={() => {
                  onCopy(ayahMenuItem);
                  closeAll();
                }}
              />
              <MenuRow
                s={s}
                colors={colors}
                icon={
                  <MaterialIcons
                    name={Platform.OS === "ios" ? "ios-share" : "share"}
                    size={20}
                    color={colors.text}
                  />
                }
                title={tr(kk.quran.ayahMenuShare)}
                a11y={kk.quran.ayahMenuShare}
                onPress={() => {
                  onShare(ayahMenuItem);
                  closeAll();
                }}
              />
              {hatimReaderSettings ? (
                <>
                  <View style={s.divider} />
                  <HatimReaderSettingsMenuSection
                    colors={colors}
                    values={hatimReaderSettings.values}
                    handlers={hatimReaderSettings.handlers}
                  />
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </Modal>
  );
}

function makeMenuStyles(colors: ThemeColors, isDark: boolean, windowWidth: number): MenuStyles {
  const popoverW = Math.min(340, Math.max(280, windowWidth - 48));
  const surface = isDark ? "#1C1C1E" : "#FFFFFF";
  const ink = isDark ? "#F5F5F5" : "#111111";
  const muted = isDark ? "rgba(245,245,245,0.55)" : "rgba(0,0,0,0.45)";

  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.32)",
    },
    host: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    popover: {
      width: popoverW,
      maxWidth: "100%",
      borderRadius: 16,
      backgroundColor: surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.16,
          shadowRadius: 18,
        },
        android: { elevation: 12 },
        default: {
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
        } as ViewStyle,
      }),
    },
    scroll: {
      flexGrow: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      minHeight: 48,
    },
    rowPressed: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    },
    iconSlot: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTextCol: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: ink,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 21,
    },
    rowTitleInline: {
      lineHeight: 21,
    },
    rowSubtitle: {
      marginTop: 2,
      color: muted,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
    rowSubtitleInline: {
      color: muted,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 21,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 14,
      paddingBottom: 8,
      paddingTop: 2,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.95)",
    },
    reciterWrap: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },
    reciterTitle: {
      color: ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "800",
      marginBottom: 2,
    },
    reciterGroup: {
      color: muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      marginTop: 8,
      marginBottom: 4,
    },
    reciterOption: {
      minHeight: 38,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 7,
      backgroundColor: "transparent",
    },
    reciterOptionSelected: {
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.13)" : "rgba(5, 150, 105, 0.09)",
    },
    reciterOptionText: {
      flex: 1,
      minWidth: 0,
      color: ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "600",
    },
    reciterOptionTextSelected: {
      color: colors.accent,
      fontWeight: "900",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      marginHorizontal: 12,
      marginVertical: 2,
    },
  });
}
