import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
} from "react-native";
import { KazakhOrnamentBand } from "../components/KazakhOrnamentBand";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { QURAN_BASMALA_READER_AR } from "../constants/quranUthmani";
import type { MoreStackParamList } from "../navigation/types";
import { HATIM_SECTIONS } from "../content/spiritualContent";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { QURAN_JUZ_STARTS } from "../data/quranJuzBoundaries";
import { computeHatimJuzStats } from "../hatim/hatimJuzProgress";
import {
  hatimProgressFraction,
  loadHatimProgress,
  loadHatimResume,
  syncHatimWithServerBidirectional,
  toggleHatimSurah,
  type HatimResume,
} from "../storage/hatimProgress";
import { requestNotificationPermissions } from "../services/prayerNotifications";
import {
  getHatimReminderClock,
  getHatimReminderEnabled,
  setHatimReminderClock,
  setHatimReminderEnabled,
  syncHatimReminderSchedule,
} from "../services/hatimReminderNotifications";

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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderErr, setReminderErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [s, r, en, clock] = await Promise.all([
      loadHatimProgress(),
      loadHatimResume(),
      getHatimReminderEnabled(),
      getHatimReminderClock(),
    ]);
    setRead(s);
    setResume(r);
    setReminderEnabled(en);
    setReminderHour(clock.hour);
    setReminderMinute(clock.minute);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await syncHatimWithServerBidirectional();
        await reload();
        if (Platform.OS !== "web") {
          await syncHatimReminderSchedule();
        }
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

  const juzStats = useMemo(() => computeHatimJuzStats(read), [read]);

  const openJuzFromGrid = useCallback(
    (juz: number) => {
      const row = QURAN_JUZ_STARTS.find((x) => x.juz === juz);
      if (!row) return;
      navigation.navigate("QuranSurah", {
        surahNumber: row.startSurah,
        initialAyah: row.startAyah,
        mushafLayout: true,
        englishName: surahDisplayTitle(row.startSurah, ""),
      });
    },
    [navigation]
  );

  const goResume = () => {
    if (!resume) return;
    navigation.navigate("QuranSurah", {
      surahNumber: resume.surah,
      englishName: surahDisplayTitle(resume.surah, ""),
      initialAyah: resume.ayah,
      mushafLayout: true,
    });
  };

  const goFromBasmala = useCallback(() => {
    if (resume) {
      navigation.navigate("QuranSurah", {
        surahNumber: resume.surah,
        englishName: surahDisplayTitle(resume.surah, ""),
        initialAyah: resume.ayah,
        mushafLayout: true,
      });
      return;
    }
    for (let n = 1; n <= 114; n += 1) {
      if (!read.has(n)) {
        navigation.navigate("QuranSurah", {
          surahNumber: n,
          englishName: surahDisplayTitle(n, ""),
          mushafLayout: true,
        });
        return;
      }
    }
    navigation.navigate("QuranSurah", {
      surahNumber: 1,
      englishName: surahDisplayTitle(1, ""),
      mushafLayout: true,
    });
  }, [resume, read, navigation]);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const bumpReminderClock = async (deltaMin: number) => {
    let t = reminderHour * 60 + reminderMinute + deltaMin;
    t = Math.max(6 * 60, Math.min(23 * 60 + 59, t));
    const h = Math.floor(t / 60);
    const m = t % 60;
    await setHatimReminderClock(h, m);
    setReminderHour(h);
    setReminderMinute(m);
    if (reminderEnabled && Platform.OS !== "web") {
      await syncHatimReminderSchedule();
    }
  };

  const onReminderToggle = async (v: boolean) => {
    setReminderErr(null);
    if (Platform.OS === "web") return;
    if (v) {
      const ok = await requestNotificationPermissions();
      if (!ok) {
        setReminderErr(kk.hatim.reminderPermNeeded);
        return;
      }
    }
    await setHatimReminderEnabled(v);
    setReminderEnabled(v);
    await syncHatimReminderSchedule();
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
            extraData={{ readSig: [...read].sort((a, b) => a - b).join(",") }}
            contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                <View style={styles.basmalaSection}>
                  <KazakhOrnamentBand colors={colors} compact tone="quranGold" bleed={12} translucent />
                  <Pressable
                    onPress={goFromBasmala}
                    style={({ pressed }) => [styles.basmalaBanner, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.hatim.basmalaOpenReaderA11y}
                  >
                    <Text style={styles.basmalaArabic} importantForAccessibility="no">
                      {QURAN_BASMALA_READER_AR}
                    </Text>
                  </Pressable>
                </View>
                {Platform.OS !== "web" ? (
                  <View style={styles.reminderCard}>
                    <View style={styles.reminderHeadRow}>
                      <Text style={styles.reminderTitle}>{kk.hatim.reminderTitle}</Text>
                      <Switch
                        value={reminderEnabled}
                        onValueChange={(v) => void onReminderToggle(v)}
                        trackColor={{
                          false: colors.border,
                          true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)",
                        }}
                        thumbColor={reminderEnabled ? colors.accent : colors.muted}
                        accessibilityLabel={kk.hatim.reminderTitle}
                      />
                    </View>
                    <Text style={styles.reminderHint}>{kk.hatim.reminderHint}</Text>
                    {reminderErr ? <Text style={styles.reminderErr}>{reminderErr}</Text> : null}
                    {reminderEnabled ? (
                      <View style={styles.reminderTimeBlock}>
                        <Text style={styles.reminderTimeLabel}>{kk.hatim.reminderTimeLabel}</Text>
                        <View style={styles.reminderTimeRow}>
                          <Pressable
                            style={({ pressed }) => [styles.reminderTimeBtn, pressed && { opacity: 0.88 }]}
                            onPress={() => void bumpReminderClock(-30)}
                            accessibilityRole="button"
                            accessibilityLabel={kk.hatim.reminderTimeMinusA11y}
                          >
                            <Text style={styles.reminderTimeBtnTxt}>−</Text>
                          </Pressable>
                          <Text style={styles.reminderTimeValue} accessibilityRole="text">
                            {pad2(reminderHour)}:{pad2(reminderMinute)}
                          </Text>
                          <Pressable
                            style={({ pressed }) => [styles.reminderTimeBtn, pressed && { opacity: 0.88 }]}
                            onPress={() => void bumpReminderClock(30)}
                            accessibilityRole="button"
                            accessibilityLabel={kk.hatim.reminderTimePlusA11y}
                          >
                            <Text style={styles.reminderTimeBtnTxt}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
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
                <View style={styles.juzSection}>
                  <Text style={styles.juzSectionTitle}>{kk.hatim.juzProgressTitle}</Text>
                  <Text style={styles.juzSectionHint}>{kk.hatim.juzProgressHint}</Text>
                  <View style={styles.juzGrid}>
                    {juzStats.map((st) => (
                      <View key={st.juz} style={styles.juzCellWrap}>
                        <Pressable
                          onPress={() => openJuzFromGrid(st.juz)}
                          accessibilityRole="button"
                          accessibilityLabel={kk.hatim.juzOpenA11y(st.juz)}
                          style={({ pressed }) => [styles.juzCellPress, pressed && { opacity: 0.9 }]}
                        >
                          <View style={styles.juzBarTrack}>
                            <View
                              style={[
                                styles.juzBarFill,
                                { height: `${Math.round(st.fraction * 100)}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.juzNum}>{st.juz}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
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
                    accessibilityRole="button"
                    accessibilityLabel={kk.hatim.openSurahRowA11y(item.number, item.title)}
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
    basmalaSection: {
      alignSelf: "stretch",
      marginBottom: 10,
    },
    reminderCard: {
      alignSelf: "stretch",
      backgroundColor: surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: surfaceBorder,
      padding: 12,
      marginBottom: 10,
    },
    reminderHeadRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    reminderTitle: { fontSize: 15, fontWeight: "800", color: inkStrong, flex: 1 },
    reminderHint: { marginTop: 8, fontSize: 12, lineHeight: 17, color: inkMuted },
    reminderErr: { marginTop: 8, fontSize: 12, fontWeight: "700", color: colors.error },
    reminderTimeBlock: { marginTop: 12 },
    reminderTimeLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: inkMuted,
      marginBottom: 8,
      textAlign: "center",
    },
    reminderTimeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    reminderTimeBtn: {
      minWidth: 44,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: surfaceBorder,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: checkBg,
    },
    reminderTimeBtnTxt: { fontSize: 20, fontWeight: "800", color: colors.accent },
    reminderTimeValue: { fontSize: 17, fontWeight: "900", color: inkStrong, minWidth: 96, textAlign: "center" },
    basmalaBanner: {
      marginTop: 6,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(212, 175, 55, 0.42)" : "rgba(166, 142, 116, 0.4)",
      backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(253, 246, 233, 0.72)",
    },
    basmalaArabic: {
      textAlign: "center",
      writingDirection: "rtl",
      color: isDark ? "#FAFAFA" : "#000000",
      fontSize: 24,
      lineHeight: 40,
      fontWeight: "500",
      letterSpacing: 0,
      ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
    },
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
    juzSection: {
      alignSelf: "stretch",
      backgroundColor: surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: surfaceBorder,
      padding: 12,
      marginBottom: 10,
    },
    juzSectionTitle: { fontSize: 15, fontWeight: "800", color: inkStrong, marginBottom: 6 },
    juzSectionHint: { fontSize: 11, lineHeight: 16, color: inkMuted, marginBottom: 10 },
    juzGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -3,
    },
    juzCellWrap: {
      width: "16.666%",
      padding: 3,
    },
    juzCellPress: {
      alignItems: "center",
    },
    juzBarTrack: {
      width: "100%",
      height: 34,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(166, 142, 116, 0.22)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaceBorder,
      justifyContent: "flex-end",
    },
    juzBarFill: {
      width: "100%",
      backgroundColor: colors.accent,
      minHeight: 0,
    },
    juzNum: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: "800",
      color: inkStrong,
    },
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
