import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";
import { SEERAH_LESSON_COUNT } from "../config/seerahVideos";
import { loadSeerahProgress, saveSeerahLessonViewed } from "../storage/seerahProgress";
import { SeerahCurriculumRoadmap } from "../components/SeerahCurriculumRoadmap";

type Props = NativeStackScreenProps<MoreStackParamList, "Seerah">;

export function SeerahScreen(_props: Props) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();

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

  const onLessonViewed = useCallback(async (lesson: number) => {
    const next = await saveSeerahLessonViewed(lesson);
    setViewedLessons(next.viewedLessons);
    setLastLesson(next.lastLesson);
  }, []);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{t.seerah.title}</Text>
      <Text style={styles.intro}>{t.seerah.intro}</Text>
      {lastLesson ? (
        <Text style={styles.progressHint}>
          {t.seerah.lastLessonLabel}: {lastLesson} · {viewedLessons.length}/{SEERAH_LESSON_COUNT}
        </Text>
      ) : null}

      <SeerahCurriculumRoadmap
        colors={colors}
        tr={tr}
        viewedLessons={viewedLessons}
        lastLesson={lastLesson}
        onLessonViewed={onLessonViewed}
      />
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 36 },
    h1: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 8,
      letterSpacing: -0.2,
    },
    intro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "600",
      marginBottom: 14,
    },
    progressHint: {
      color: colors.muted,
      fontSize: 13,
      marginBottom: 12,
      fontWeight: "700",
    },
  });
}
