import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
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

/** Сира: офлайн қысқаша + опциялық YouTube. */
export function SeerahCurriculumRoadmap({
  colors,
  tr,
  viewedLessons,
  lastLesson,
  onLessonViewed,
}: Props) {
  const t = useI18n();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [openPhase, setOpenPhase] = useState<string | null>(SEERAH_PHASES[0]?.id ?? null);

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
      {SEERAH_PHASES.map((phase) => (
        <SeerahPhaseBlock
          key={phase.id}
          phase={phase}
          colors={colors}
          tr={tr}
          expanded={openPhase === phase.id}
          onToggle={() => setOpenPhase((cur) => (cur === phase.id ? null : phase.id))}
          viewedLessons={viewedLessons}
          lastLesson={lastLesson}
          onOpenVideo={(n) => void openVideo(n)}
        />
      ))}
    </View>
  );
}

function SeerahPhaseBlock({
  phase,
  colors,
  tr,
  expanded,
  onToggle,
  viewedLessons,
  lastLesson,
  onOpenVideo,
}: {
  phase: SeerahPhase;
  colors: ThemeColors;
  tr: (text: string) => string;
  expanded: boolean;
  onToggle: () => void;
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
        accessibilityLabel={`${tr(phase.titleKk)} — ${expanded ? kk.common.guideAccordionCollapse : kk.common.guideAccordionExpand}`}
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
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={22}
          color={expanded ? "#FFFFFF" : colors.muted}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <Text style={styles.phaseIntro}>{tr(phase.introKk)}</Text>
          {lessons.map((lesson) => {
            const viewed = viewedLessons.includes(lesson.n);
            const isLast = lastLesson === lesson.n;
            return (
              <View key={lesson.n} style={styles.lessonRow}>
                <View style={[styles.lessonNum, viewed && styles.lessonNumViewed]}>
                  <Text style={[styles.lessonNumText, viewed && styles.lessonNumTextViewed]}>{lesson.n}</Text>
                </View>
                <Pressable
                  oyuBackdrop={false}
                  onPress={() => onOpenVideo(lesson.n)}
                  accessibilityRole="button"
                  accessibilityLabel={kk.seerah.openVideoA11y(lesson.n)}
                  style={({ pressed }) => [styles.lessonTextCol, pressed && styles.lessonTextColPressed]}
                >
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {tr(lesson.titleKk)}
                    {isLast ? ` · ${kk.seerah.lastBadge}` : ""}
                  </Text>
                  <Text style={styles.lessonFocus} numberOfLines={2}>
                    {tr(lesson.focusKk)}
                  </Text>
                  <Text style={styles.lessonSummary}>{tr(lesson.summaryKk)}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 12, alignSelf: "stretch", gap: 8 },
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    phaseHeadOpen: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    phaseIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    phaseTextCol: { flex: 1, minWidth: 0 },
    phaseTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
    phaseTitleOpen: { color: "#FFFFFF" },
    phaseSub: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
    phaseSubOpen: { color: "rgba(255,255,255,0.85)" },
    body: {
      marginTop: 6,
      gap: 8,
      paddingLeft: 4,
    },
    phaseIntro: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
      paddingHorizontal: 6,
      paddingBottom: 2,
    },
    lessonRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    lessonNum: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
      marginTop: 2,
    },
    lessonNumViewed: { backgroundColor: colors.accent },
    lessonNumText: { color: colors.accent, fontSize: 12, fontWeight: "900" },
    lessonNumTextViewed: { color: "#FFFFFF" },
    lessonTextCol: { flex: 1, minWidth: 0 },
    lessonTextColPressed: { opacity: 0.88 },
    lessonTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
    lessonFocus: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
    lessonSummary: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      marginTop: 6,
      opacity: 0.92,
    },
  });
}
