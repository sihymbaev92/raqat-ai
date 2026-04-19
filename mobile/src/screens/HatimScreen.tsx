import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Hatim">;
};

type Row = { number: number; title: string };

export function HatimScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
    });
  };

  const onToggle = async (n: number) => {
    const next = await toggleHatimSurah(n);
    setRead(next);
  };

  return (
    <FlatList
      style={styles.root}
      data={data}
      keyExtractor={(it) => String(it.number)}
      contentContainerStyle={styles.pad}
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
        const inProgress =
          !done && resume != null && resume.surah === item.number;
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
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    pad: { paddingHorizontal: 14, paddingBottom: 36 },
    headerBlock: { marginBottom: 12 },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    progressCardActive: {
      borderColor: colors.accent,
      borderWidth: 1.5,
    },
    progressTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: 10 },
    barBg: {
      height: 10,
      borderRadius: 6,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.accent,
    },
    progressSub: { marginTop: 8, fontSize: 13, color: colors.muted },
    resumeLine: {
      marginTop: 10,
      fontSize: 13,
      color: colors.text,
      fontWeight: "600",
    },
    continueCta: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: "800",
      color: colors.accent,
    },
    tapHint: { marginTop: 10, fontSize: 12, lineHeight: 17, color: colors.muted },
    guideToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    guideToggleText: { fontSize: 15, fontWeight: "700", color: colors.accent },
    guideChev: { fontSize: 14, color: colors.accent },
    guideBody: { marginBottom: 8 },
    guideSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
    },
    guideSectionTitle: { color: colors.accent, fontWeight: "800", fontSize: 14, marginBottom: 6 },
    guideSectionBody: { color: colors.text, fontSize: 14, lineHeight: 22 },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      overflow: "hidden",
    },
    checkWrap: { justifyContent: "center", paddingHorizontal: 12 },
    checkBox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    checkBoxOn: { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
    checkMark: { color: colors.accent, fontWeight: "900", fontSize: 16 },
    rowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingRight: 10,
      gap: 8,
    },
    rowNum: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.muted,
      minWidth: 28,
    },
    rowTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
    rowChev: { fontSize: 18, color: colors.muted, fontWeight: "300" },
    progressDot: { color: colors.accent, fontSize: 12, marginRight: 4 },
  });
}
