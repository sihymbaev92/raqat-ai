import React, { useCallback, useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { GuideAccordionSection } from "./GuideAccordion";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { LearningModule, LearningStep, RecitationBlock } from "../content/namazLearningContent";
import { NAMAZ_WUDU_LEARNING_MODULES } from "../content/namazLearningContent";
import { NAMAZ_PHASE2_QUIZ_BANK } from "../content/namazCourseRoadmap";
import {
  loadNamazLearningProgress,
  saveNamazLearningStepProgress,
  savePhase2QuizAnswer,
  type NamazLearningProgress,
} from "../storage/namazLearningProgress";

const WUDU_MODULE = NAMAZ_WUDU_LEARNING_MODULES.find((m) => m.id === "wudu")!;

function makeLearnStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 17,
      marginBottom: 8,
      marginTop: 6,
    },
    sectionIntro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 12,
    },
    stepMeta: { color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: 8 },
    stepHint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    genderNote: { color: colors.accent, fontSize: 13, lineHeight: 19, marginBottom: 10 },
    recBlock: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recLabel: { color: colors.accent, fontWeight: "800", fontSize: 13, marginBottom: 6 },
    recAr: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.scriptureArabic,
      textAlign: "right",
      writingDirection: "rtl",
      lineHeight: 32,
      marginBottom: 6,
    },
    recTr: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
    recTrEn: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 4,
      fontStyle: "italic",
    },
    recMean: { color: colors.text, fontSize: 14, lineHeight: 21 },
    listHead: { color: colors.text, fontWeight: "800", fontSize: 13, marginTop: 8, marginBottom: 4 },
    listItem: { color: colors.text, fontSize: 13, lineHeight: 20, marginLeft: 4 },
    markRow: { marginTop: 12 },
    markBtn: {
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    markBtnDone: { borderColor: colors.accent, backgroundColor: colors.card },
    markBtnTxt: { color: colors.accent, fontWeight: "800", fontSize: 14 },
    markBtnTxtDone: { color: colors.text },
    quizWrap: { marginTop: 8, marginBottom: 16 },
    quizQ: { color: colors.text, fontWeight: "800", fontSize: 15, lineHeight: 22, marginBottom: 10 },
    quizOpt: {
      marginBottom: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    quizOptPressed: { opacity: 0.9 },
    quizOptCorrect: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
    quizOptWrong: { opacity: 0.75 },
    quizOptTxt: { color: colors.text, fontSize: 14, lineHeight: 20 },
    quizExplain: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 19 },
    quizScore: { marginTop: 14, color: colors.accent, fontWeight: "800", fontSize: 14 },
    loadRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  });
}

function RecitationBlocks({
  blocks,
  styles,
}: {
  blocks: RecitationBlock[];
  styles: ReturnType<typeof makeLearnStyles>;
}) {
  const { tr } = useKkAutoTranslator();
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((b) => (
        <View key={b.id} style={styles.recBlock}>
          <Text style={styles.recLabel}>{tr(b.label)}</Text>
          <Text style={styles.recAr}>{b.arabic}</Text>
          {b.transliterationKk ? <Text style={styles.recTr}>{b.transliterationKk}</Text> : null}
          <Text style={styles.recMean}>{tr(b.meaningKk)}</Text>
        </View>
      ))}
    </>
  );
}

/** Намаз нұсқауының сурет карточкасында: араб мәтін, қазақша оқылым, қазақша мағына. */
export function NamazGuidePoseRecitationBlocks({
  blocks,
  colors,
}: {
  blocks: RecitationBlock[];
  colors: ThemeColors;
}) {
  const styles = makeLearnStyles(colors);
  const { tr } = useKkAutoTranslator();
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((b) => (
        <View key={b.id} style={styles.recBlock}>
          <Text style={styles.recLabel}>{tr(b.label)}</Text>
          <Text style={styles.recAr}>{b.arabic}</Text>
          {b.transliterationKk ? <Text style={styles.recTr}>{b.transliterationKk}</Text> : null}
          <Text style={styles.recMean}>{tr(b.meaningKk)}</Text>
        </View>
      ))}
    </>
  );
}

function LearningModuleSteps({
  module,
  moduleId,
  colors,
  accOpen,
  toggleAcc,
  progress,
  onMarkStep,
}: {
  module: LearningModule;
  moduleId: "wudu" | "namaz";
  colors: ThemeColors;
  accOpen: Record<string, boolean>;
  toggleAcc: (key: string) => void;
  progress: NamazLearningProgress | null;
  onMarkStep: (stepIndex: number, stepId: string) => void;
}) {
  const styles = makeLearnStyles(colors);
  const { tr } = useKkAutoTranslator();
  const modProg = progress?.modules[moduleId];
  const completed = new Set(modProg?.completedStepIds ?? []);

  return (
    <>
      <Text style={styles.sectionIntro}>{tr(module.intro)}</Text>
      {module.steps.map((step: LearningStep, idx: number) => {
        const key = `learn-${moduleId}-${step.id}`;
        const done = completed.has(step.id);
        const title = done ? `✓ ${tr(step.title)}` : tr(step.title);
        return (
          <GuideAccordionSection
            key={key}
            title={title}
            subtitle={tr(step.action)}
            expanded={!!accOpen[key]}
            onToggle={() => toggleAcc(key)}
            colors={colors}
          >
            <Text style={styles.stepMeta}>{tr(step.action)}</Text>
            {step.bodyPositionHint ? <Text style={styles.stepHint}>{tr(step.bodyPositionHint)}</Text> : null}
            {step.genderNoteHanafi ? <Text style={styles.genderNote}>{tr(step.genderNoteHanafi)}</Text> : null}
            <RecitationBlocks blocks={step.recitations} styles={styles} />
            {step.commonMistakes.length ? (
              <>
                <Text style={styles.listHead}>{tr(kk.namazGuide.learningCommonMistakes)}</Text>
                {step.commonMistakes.map((m, i) => (
                  <Text key={`${step.id}-m-${i}`} style={styles.listItem}>
                    • {tr(m)}
                  </Text>
                ))}
              </>
            ) : null}
            {step.checkpoint.length ? (
              <>
                <Text style={styles.listHead}>{tr(kk.namazGuide.learningCheckpoint)}</Text>
                {step.checkpoint.map((c, i) => (
                  <Text key={`${step.id}-c-${i}`} style={styles.listItem}>
                    • {tr(c)}
                  </Text>
                ))}
              </>
            ) : null}
            <View style={styles.markRow}>
              <Pressable
                onPress={() => onMarkStep(idx, step.id)}
                style={({ pressed }) => [
                  styles.markBtn,
                  done && styles.markBtnDone,
                  pressed && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={done ? kk.namazGuide.stepMarkedDoneA11y : kk.namazGuide.stepMarkDoneA11y}
              >
                <Text style={[styles.markBtnTxt, done && styles.markBtnTxtDone]}>
                  {done ? kk.namazGuide.stepMarkedDone : kk.namazGuide.stepMarkDone}
                </Text>
              </Pressable>
            </View>
          </GuideAccordionSection>
        );
      })}
    </>
  );
}

export function NamazGuideWuduLearningBlock({
  colors,
  accOpen,
  toggleAcc,
}: {
  colors: ThemeColors;
  accOpen: Record<string, boolean>;
  toggleAcc: (key: string) => void;
}) {
  const styles = makeLearnStyles(colors);
  const [progress, setProgress] = useState<NamazLearningProgress | null>(null);

  useEffect(() => {
    let alive = true;
    loadNamazLearningProgress().then((p) => {
      if (alive) setProgress(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onMarkStep = useCallback(
    async (stepIndex: number, stepId: string) => {
      const next = await saveNamazLearningStepProgress({ moduleId: "wudu", stepIndex, stepId });
      setProgress(next);
    },
    []
  );

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.sectionTitle}>{kk.namazGuide.learningWuduHeading}</Text>
      {!progress ? (
        <View style={styles.loadRow}>
          <RaqatOrnamentSpinner size={36} />
          <Text style={styles.stepHint}>{kk.common.loading}</Text>
        </View>
      ) : (
        <LearningModuleSteps
          module={WUDU_MODULE}
          moduleId="wudu"
          colors={colors}
          accOpen={accOpen}
          toggleAcc={toggleAcc}
          progress={progress}
          onMarkStep={onMarkStep}
        />
      )}
    </View>
  );
}

export function NamazGuidePhase2Quiz({ colors }: { colors: ThemeColors }) {
  const styles = makeLearnStyles(colors);
  const [progress, setProgress] = useState<NamazLearningProgress | null>(null);

  useEffect(() => {
    let alive = true;
    loadNamazLearningProgress().then((p) => {
      if (alive) setProgress(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onPick = useCallback(async (questionId: string, pickedIndex: number, correctIndex: number) => {
    const correct = pickedIndex === correctIndex;
    const next = await savePhase2QuizAnswer({ questionId, pickedIndex, correct });
    setProgress(next);
  }, []);

  const answers = progress?.phase2Answers ?? {};
  const total = NAMAZ_PHASE2_QUIZ_BANK.length;
  let correctCount = 0;
  for (const q of NAMAZ_PHASE2_QUIZ_BANK) {
    const a = answers[q.id];
    if (a?.correct) correctCount++;
  }

  return (
    <View style={styles.quizWrap}>
      <Text style={styles.sectionTitle}>{kk.namazGuide.quizHeading}</Text>
      <Text style={styles.sectionIntro}>{kk.namazGuide.quizIntro}</Text>
      {!progress ? (
        <View style={styles.loadRow}>
          <RaqatOrnamentSpinner size={36} />
        </View>
      ) : (
        <>
          {NAMAZ_PHASE2_QUIZ_BANK.map((q) => {
            const stored = answers[q.id];
            return (
              <View key={q.id} style={{ marginBottom: 18 }}>
                <Text style={styles.quizQ}>{q.prompt}</Text>
                {q.options.map((opt, i) => {
                  const isPicked = stored?.pickedIndex === i;
                  const isCorrectOpt = i === q.correctIndex;
                  const showResult = !!stored;
                  const highlightOk = showResult && isCorrectOpt;
                  const highlightBad = showResult && isPicked && !isCorrectOpt;
                  return (
                    <Pressable
                      key={`${q.id}-o-${i}`}
                      onPress={() => {
                        if (stored) return;
                        void onPick(q.id, i, q.correctIndex);
                      }}
                      style={({ pressed }) => [
                        styles.quizOpt,
                        pressed && styles.quizOptPressed,
                        highlightOk && styles.quizOptCorrect,
                        highlightBad && styles.quizOptWrong,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !!stored }}
                    >
                      <Text style={styles.quizOptTxt}>{opt}</Text>
                    </Pressable>
                  );
                })}
                {stored ? <Text style={styles.quizExplain}>{q.explainWhy}</Text> : null}
              </View>
            );
          })}
          <Text style={styles.quizScore}>{kk.namazGuide.quizScore(correctCount, total)}</Text>
        </>
      )}
    </View>
  );
}
