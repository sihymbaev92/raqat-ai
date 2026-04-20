import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { SEERAH_LESSON_COUNT, urlForSeerahLesson } from "../config/seerahVideos";
import { loadSeerahProgress, saveSeerahLessonViewed } from "../storage/seerahProgress";

type Props = NativeStackScreenProps<MoreStackParamList, "Seerah">;

export function SeerahScreen(_props: Props) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  const lessons = useMemo(
    () => Array.from({ length: SEERAH_LESSON_COUNT }, (_, i) => i + 1),
    []
  );
  const [viewedLessons, setViewedLessons] = useState<number[]>([]);
  const [lastLesson, setLastLesson] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const p = await loadSeerahProgress();
      if (!active) return;
      setViewedLessons(p.viewedLessons);
      setLastLesson(p.lastLesson);
    })();
    return () => {
      active = false;
    };
  }, []);

  const openLesson = useCallback(async (lesson: number) => {
    const url = urlForSeerahLesson(lesson);
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(kk.common.error, kk.seerah.openError);
        return;
      }
      await Linking.openURL(url);
      const next = await saveSeerahLessonViewed(lesson);
      setViewedLessons(next.viewedLessons);
      setLastLesson(next.lastLesson);
    } catch {
      Alert.alert(kk.common.error, kk.seerah.openError);
    }
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{kk.seerah.title}</Text>
      <Text style={styles.intro}>{kk.seerah.intro}</Text>
      {lastLesson ? (
        <Text style={styles.progressHint}>
          Соңғы ашылған сабақ: {lastLesson} · Прогресс: {viewedLessons.length}/{SEERAH_LESSON_COUNT}
        </Text>
      ) : null}

      <Text style={styles.sectionLabel}>{kk.seerah.lessonsSection}</Text>
      <View style={styles.lessonGrid} accessibilityRole="list">
        {lessons.map((lesson) => (
          <Pressable
            key={lesson}
            style={({ pressed }) => [
              styles.lessonChip,
              viewedLessons.includes(lesson) && styles.lessonChipViewed,
              pressed && styles.chipPressed,
            ]}
            onPress={() => void openLesson(lesson)}
            accessibilityRole="button"
            accessibilityLabel={kk.seerah.lessonA11y(lesson)}
          >
            {lastLesson === lesson ? <Text style={styles.lastBadge}>Соңғы</Text> : null}
            <Text style={styles.chipTitle} numberOfLines={1}>
              {kk.seerah.lessonTitle(lesson)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 40 },
    h1: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    intro: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 24,
      marginBottom: 16,
    },
    progressHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    sectionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 12,
      letterSpacing: 0.2,
    },
    lessonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    lessonChip: {
      width: "48%",
      minWidth: 0,
      overflow: "hidden",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: "stretch",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    chipPressed: { opacity: 0.92 },
    lessonChipViewed: {
      borderColor: colors.accent,
      backgroundColor: "rgba(56,189,248,0.08)",
    },
    lastBadge: {
      alignSelf: "center",
      color: colors.accent,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
    },
    chipTitle: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900",
      paddingHorizontal: 8,
      textAlign: "center",
    },
  });
}
