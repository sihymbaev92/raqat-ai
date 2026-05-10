import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { HATIM_SECTIONS } from "../content/spiritualContent";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import {
  hatimProgressFraction,
  loadHatimProgress,
  loadHatimResume,
  syncHatimWithServerBidirectional,
  toggleHatimSurah,
  type HatimResume,
} from "../storage/hatimProgress";

/** QuranSurah mushafLayout-пен бір кітап палитрасы. */
const MUSHAF_LIGHT_TAUPE = "#A68E74";
const MUSHAF_LIGHT_PAGE = "#FDF6E9";
const MUSHAF_LIGHT_DESK = "#EBE4D4";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Hatim">;
};

type Row = { number: number; title: string };

export function HatimScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [read, setRead] = useState<Set<number>>(new Set());
  const [resume, setResume] = useState<HatimResume | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const reload = useCallback(async () => {
    const [s, r] = await Promise.all([loadHatimProgress(), loadHatimResume()]);
    setRead(s);
    setResume(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await syncHatimWithServerBidirectional();
        await reload();
      })();
    }, [reload])
  );

  const data: Row[] = useMemo(
    () =>
      Array.from({ length: 114 }, (_, i) => {
        const number = i + 1;
        return { number, title: surahDisplayTitle(number, "") };
      }),
    []
  );

  const { read: readCount, total, pct } = hatimProgressFraction(read);

  const goResume = () => {
    if (!resume) return;
    navigation.navigate("QuranSurah", {
      surahNumber: resume.surah,
      englishName: surahDisplayTitle(resume.surah, ""),
      initialAyah: resume.ayah,
      mushafLayout: true,
    });
  };

  const onToggle = async (n: number) => {
    const next = await toggleHatimSurah(n);
    setRead(next);
  };

  const listBottomPad = 24 + insets.bottom;

  return (
    <View style={styles.bookDesk}>
      <View style={[styles.bookPageWrap, { paddingBottom: Math.max(6, Math.round(insets.bottom * 0.45)) }]}>
        <View style={[styles.bookPage, isDark && styles.bookPageDark]}>
          <FlatList
            style={styles.listFlex}
            data={data}
            keyExtractor={(it) => String(it.number)}
            contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                <Pressable
                  onPress={goResume}
                  disabled={!resume}
                  style={({ pressed }) => [
                    styles.progressCard,
                    resume ? styles.progressCardActive : null,
                    pressed && resume && { opacity: 0.94 },
                  ]}
                  accessibilityRole={resume ? "button" : "none"}
                  accessibilityLabel={resume ? kk.hatim.continueReading : undefined}
                >
                  <Text style={styles.progressTitle}>{kk.hatim.progressTitle}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                  <Text style={styles.progressSub}>
                    {kk.hatim.progressCount.replace("{read}", String(readCount)).replace("{total}", String(total))}
                  </Text>
                  {resume ? (
                    <>
                      <Text style={styles.resumeLine}>
                        {kk.hatim.resumeLine
                          .replace("{surah}", String(resume.surah))
                          .replace("{ayah}", String(resume.ayah))}
                      </Text>
                      <Text style={styles.continueCta}>{kk.hatim.continueReading} ›</Text>
                    </>
                  ) : (
                    <Text style={styles.tapHint}>{kk.hatim.tapAyahHint}</Text>
                  )}
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.guideToggle, pressed && { opacity: 0.92 }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setGuideOpen((v) => !v);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={kk.hatim.guideToggle}
                >
                  <Text style={styles.guideToggleText}>{guideOpen ? kk.hatim.guideHide : kk.hatim.guideShow}</Text>
                  <Text style={styles.guideChev}>{guideOpen ? "▾" : "▸"}</Text>
                </Pressable>
                {guideOpen ? (
                  <View style={styles.guideBody}>
                    {HATIM_SECTIONS.map((s) => (
                      <View key={s.title} style={styles.guideSection}>
                        <Text style={styles.guideSectionTitle}>{s.title}</Text>
                        <Text style={styles.guideSectionBody}>{s.body}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => {
              const done = read.has(item.number);
              const inProgress = !done && resume != null && resume.surah === item.number;
              return (
                <View style={styles.row}>
                  <Pressable
                    style={({ pressed }) => [styles.checkWrap, pressed && { opacity: 0.88 }]}
                    onPress={() => void onToggle(item.number)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={kk.hatim.markReadA11y.replace("{n}", String(item.number))}
                  >
                    <View style={[styles.checkBox, done && styles.checkBoxOn]}>
                      {done ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.9 }]}
                    onPress={() =>
                      navigation.navigate("QuranSurah", {
                        surahNumber: item.number,
                        englishName: item.title,
                        mushafLayout: true,
                        ...(inProgress && resume ? { initialAyah: resume.ayah } : {}),
                      })
                    }
                  >
                    <Text style={styles.rowNum}>{item.number}</Text>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {inProgress ? <Text style={styles.progressDot}>●</Text> : null}
                    <Text style={styles.rowChev}>›</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const deskBg = isDark ? "#0D0C0B" : MUSHAF_LIGHT_DESK;
  const pageBg = isDark ? "#161513" : MUSHAF_LIGHT_PAGE;
  const pageBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(45,36,24,0.12)";
  const ink = isDark ? colors.text : "#2A2319";
  const inkMuted = isDark ? colors.muted : MUSHAF_LIGHT_TAUPE;
  const inkStrong = isDark ? colors.text : "#5C4D3D";
  const surface = isDark ? "#1C1B19" : "rgba(255, 252, 247, 0.96)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(166, 142, 116, 0.38)";
  const checkBg = isDark ? "#121110" : "#FFFEF7";

  return StyleSheet.create({
    bookDesk: { flex: 1, backgroundColor: deskBg },
    bookPageWrap: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 6,
    },
    bookPage: {
      flex: 1,
      backgroundColor: pageBg,
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: pageBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: isDark ? 0.35 : 0.14,
      shadowRadius: 16,
      elevation: 6,
    },
    bookPageDark: {
      borderColor: "rgba(255,255,255,0.08)",
    },
    listFlex: { flex: 1 },
    pad: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
    headerBlock: { marginBottom: 10 },
    progressCard: {
      backgroundColor: surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: surfaceBorder,
      padding: 14,
      marginBottom: 8,
    },
    progressCardActive: {
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    progressTitle: { fontSize: 15, fontWeight: "800", color: inkStrong, marginBottom: 10 },
    barBg: {
      height: 10,
      borderRadius: 6,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(166, 142, 116, 0.28)",
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    progressSub: { marginTop: 8, fontSize: 13, color: inkMuted },
    resumeLine: {
      marginTop: 10,
      fontSize: 13,
      color: ink,
      fontWeight: "600",
    },
    continueCta: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: "800",
      color: colors.accent,
    },
    tapHint: { marginTop: 10, fontSize: 12, lineHeight: 17, color: inkMuted },
    guideToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 2,
    },
    guideToggleText: { fontSize: 15, fontWeight: "700", color: colors.accent },
    guideChev: { fontSize: 14, color: colors.accent },
    guideBody: { marginBottom: 6 },
    guideSection: {
      backgroundColor: surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: surfaceBorder,
      padding: 12,
      marginBottom: 8,
    },
    guideSectionTitle: { color: colors.accent, fontWeight: "800", fontSize: 14, marginBottom: 6 },
    guideSectionBody: { color: ink, fontSize: 14, lineHeight: 22 },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: surfaceBorder,
      marginBottom: 7,
      overflow: "hidden",
    },
    checkWrap: { justifyContent: "center", paddingHorizontal: 11 },
    checkBox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: surfaceBorder,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: checkBg,
    },
    checkBoxOn: { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
    checkMark: { color: colors.accent, fontWeight: "900", fontSize: 16 },
    rowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      paddingRight: 10,
      gap: 8,
    },
    rowNum: {
      fontSize: 14,
      fontWeight: "800",
      color: inkMuted,
      minWidth: 28,
    },
    rowTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: ink },
    rowChev: { fontSize: 18, color: inkMuted, fontWeight: "600" },
    progressDot: { color: colors.accent, fontSize: 12, marginRight: 4 },
  });
}
