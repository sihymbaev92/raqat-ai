import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { urlForSeerahLesson } from "../config/seerahVideos";
import { openYouTubeWatchUrl } from "../utils/openExternalVideo";
import {
  SEERAH_PHASES,
  getSeerahLessonsForPhase,
  type SeerahPhase,
} from "../content/seerahCurriculum";

type Props = {
  colors: ThemeColors;
  tr: (text: string) => string;
  viewedLessons: number[];
  lastLesson: number | null;
  onLessonViewed: (lesson: number) => Promise<void>;
};

export function SeerahCurriculumRoadmap({
  colors,
  tr,
  viewedLessons,
  lastLesson,
  onLessonViewed,
}: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [openPhase, setOpenPhase] = useState<string | null>(SEERAH_PHASES[0]?.id ?? null);
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  const openVideo = useCallback(
    async (lesson: number) => {
      try {
        const url = urlForSeerahLesson(lesson);
        await openYouTubeWatchUrl(url);
        await onLessonViewed(lesson);
      } catch {
        Alert.alert(kk.common.error, kk.seerah.openError);
      }
    },
    [onLessonViewed]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <MaterialIcons name="auto-stories" size={20} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{tr(kk.seerah.curriculumTitle)}</Text>
          <Text style={styles.lead}>{tr(kk.seerah.curriculumLead)}</Text>
        </View>
      </View>

      <View style={styles.phaseList}>
        {SEERAH_PHASES.map((phase) => (
          <SeerahPhaseBlock
            key={phase.id}
            phase={phase}
            colors={colors}
            tr={tr}
            expanded={openPhase === phase.id}
            onToggle={() => {
              setOpenLesson(null);
              setOpenPhase((cur) => (cur === phase.id ? null : phase.id));
            }}
            openLesson={openLesson}
            onLessonToggle={(n) => setOpenLesson((cur) => (cur === n ? null : n))}
            viewedLessons={viewedLessons}
            lastLesson={lastLesson}
            onOpenVideo={(n) => void openVideo(n)}
          />
        ))}
      </View>
    </View>
  );
}

function SeerahPhaseBlock({
  phase,
  colors,
  tr,
  expanded,
  onToggle,
  openLesson,
  onLessonToggle,
  viewedLessons,
  lastLesson,
  onOpenVideo,
}: {
  phase: SeerahPhase;
  colors: ThemeColors;
  tr: (text: string) => string;
  expanded: boolean;
  onToggle: () => void;
  openLesson: number | null;
  onLessonToggle: (n: number) => void;
  viewedLessons: number[];
  lastLesson: number | null;
  onOpenVideo: (n: number) => void;
}) {
  const styles = useMemo(() => makePhaseStyles(colors), [colors]);
  const lessons = useMemo(() => getSeerahLessonsForPhase(phase.id), [phase.id]);

  return (
    <View style={styles.phaseWrap}>
      <Pressable
        oyuBackdrop={false}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${tr(phase.titleKk)} — ${expanded ? "жабу" : "ашу"}`}
        style={({ pressed }) => [styles.phaseHead, expanded && styles.phaseHeadOpen, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.phaseIcon}>
          <MaterialIcons name={phase.icon} size={18} color={expanded ? "#FFFFFF" : colors.accent} />
        </View>
        <View style={styles.phaseTextCol}>
          <Text style={[styles.phaseTitle, expanded && styles.phaseTitleOpen]} numberOfLines={2}>
            {tr(phase.titleKk)}
          </Text>
          <Text style={[styles.phaseSub, expanded && styles.phaseSubOpen]} numberOfLines={1}>
            {tr(phase.subtitleKk)}
          </Text>
        </View>
        <Text style={[styles.phaseCount, expanded && styles.phaseCountOpen]}>{lessons.length}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <Text style={styles.phaseIntro}>{tr(phase.introKk)}</Text>
          {lessons.map((lesson) => {
            const lessonOpen = openLesson === lesson.n;
            const viewed = viewedLessons.includes(lesson.n);
            return (
              <View key={lesson.n} style={styles.lessonCard}>
                <Pressable
                  oyuBackdrop={false}
                  onPress={() => onLessonToggle(lesson.n)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: lessonOpen }}
                  accessibilityLabel={`${tr(lesson.titleKk)} — ${lessonOpen ? "жабу" : "ашу"}`}
                  style={({ pressed }) => [styles.lessonHead, pressed && { opacity: 0.92 }]}
                >
                  <View style={[styles.lessonNum, viewed && styles.lessonNumViewed]}>
                    <Text style={[styles.lessonNumText, viewed && styles.lessonNumTextViewed]}>{lesson.n}</Text>
                  </View>
                  <View style={styles.lessonTextCol}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>
                      {tr(lesson.titleKk)}
                      {lastLesson === lesson.n ? ` · ${tr("Соңғы")}` : ""}
                    </Text>
                    <Text style={styles.lessonFocus}>{tr(lesson.focusKk)}</Text>
                  </View>
                  <MaterialIcons
                    name={lessonOpen ? "expand-less" : "expand-more"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
                {lessonOpen ? (
                  <View style={styles.lessonBody}>
                    <Text style={styles.lessonSummary}>{tr(lesson.summaryKk)}</Text>
                    <Pressable
                      oyuBackdrop={false}
                      onPress={() => onOpenVideo(lesson.n)}
                      accessibilityRole="button"
                      accessibilityLabel={kk.seerah.lessonA11y(lesson.n)}
                      style={({ pressed }) => [styles.videoBtn, pressed && { opacity: 0.9 }]}
                    >
                      <MaterialIcons name="play-circle-outline" size={18} color={colors.accent} />
                      <Text style={styles.videoBtnText}>{tr(kk.seerah.lessonSub)}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 20, alignSelf: "stretch" },
    head: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
      alignItems: "flex-start",
    },
    headIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headText: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontWeight: "800", fontSize: 16, lineHeight: 22 },
    lead: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    phaseList: { gap: 10 },
  });
}

function makePhaseStyles(colors: ThemeColors) {
  return StyleSheet.create({
    phaseWrap: { alignSelf: "stretch" },
    phaseHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    phaseHeadOpen: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    phaseIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    phaseTextCol: { flex: 1, minWidth: 0 },
    phaseTitle: { color: colors.text, fontWeight: "800", fontSize: 14, lineHeight: 20 },
    phaseTitleOpen: { color: "#FFFFFF" },
    phaseSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
    phaseSubOpen: { color: "rgba(255,255,255,0.85)" },
    phaseCount: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 15,
      minWidth: 22,
      textAlign: "right",
    },
    phaseCountOpen: { color: "#FFFFFF" },
    body: {
      marginTop: 8,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 10,
    },
    phaseIntro: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 4,
    },
    lessonCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.bg,
    },
    lessonHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
    },
    lessonNum: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    lessonNumViewed: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    lessonNumText: { color: colors.accent, fontWeight: "800", fontSize: 12 },
    lessonNumTextViewed: { color: "#FFFFFF" },
    lessonTextCol: { flex: 1, minWidth: 0 },
    lessonTitle: { color: colors.text, fontWeight: "700", fontSize: 14, lineHeight: 19 },
    lessonFocus: { color: colors.muted, fontSize: 11, marginTop: 2 },
    lessonBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
    lessonSummary: { color: colors.text, fontSize: 14, lineHeight: 22 },
    videoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    videoBtnText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
  });
}
