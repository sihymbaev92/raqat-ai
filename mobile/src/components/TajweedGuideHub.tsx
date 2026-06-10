import React, { useMemo, useState } from "react";
import { Linking, View, Text, StyleSheet, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "./GuideAutoTranslateBanner";
import { GuideAccordionSection } from "./GuideAccordion";
import { TajweedAlphabetGrid } from "./TajweedAlphabetGrid";
import { TajweedMuftyatToc } from "./TajweedMuftyatToc";
import { TajweedRulesLegendPanel } from "./TajweedRulesLegendPanel";
import {
  TAJWEED_APP_PAGE_COUNT,
  TAJWEED_APP_SECTIONS,
  buildTajweedTocGroups,
} from "../content/tajweedMuftyatScope";

type Props = {
  onOpenPage: (page: number) => void;
};

const TAJWEED_ONLINE_TEACHERS = [
  { name: "ИҚРО ілім", phone: "77081776948", displayPhone: "+7 708 177 6948" },
  { name: "Тоймурат ұстаз", phone: "77479669404", displayPhone: "+7 747 966 9404" },
] as const;
const TAJWEED_ONLINE_LESSON_MESSAGE =
  "Әссәләму алейкум\nRAHAT OMIR қосымшасынан хабарласып тұрмын, тәжуид үйренгім келеді";

export function TajweedGuideHome({ onOpenPage }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const [bookOpen, setBookOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false);
  const quickNavGroups = useMemo(() => buildTajweedTocGroups(TAJWEED_APP_SECTIONS), []);

  const openOnlineLesson = (phone: string) => {
    setTeacherPickerOpen(false);
    const text = encodeURIComponent(TAJWEED_ONLINE_LESSON_MESSAGE);
    void Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>{tr(kk.tajweedGuide.intro)}</Text>
      <View style={styles.onlineCard}>
        <View style={styles.onlineTop}>
          <Text style={styles.onlineEyebrow}>{tr(kk.tajweedGuide.onlineLessonEyebrow)}</Text>
          <Text style={styles.onlineText}>
            {tr(kk.tajweedGuide.onlineLessonBody(TAJWEED_ONLINE_TEACHERS.map((teacher) => teacher.displayPhone).join(" · ")))}
          </Text>
        </View>
        <Pressable
          onPress={() => setTeacherPickerOpen(true)}
          style={({ pressed }) => [styles.onlineBtnSingle, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.tajweedGuide.onlineLessonA11y}
        >
          <MaterialIcons name="chat" size={20} color="#FFFFFF" />
          <Text style={styles.onlineBtnSingleTxt}>{tr(kk.tajweedGuide.onlineLessonCta)}</Text>
        </Pressable>
      </View>

      <Modal
        visible={teacherPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTeacherPickerOpen(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setTeacherPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <Text style={styles.pickerTitle}>{tr("Ұстазды таңдаңыз")}</Text>
            {TAJWEED_ONLINE_TEACHERS.map((teacher) => (
              <Pressable
                key={teacher.phone}
                onPress={() => openOnlineLesson(teacher.phone)}
                style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.9 }]}
                accessibilityRole="link"
                accessibilityLabel={`${teacher.name}: ${kk.tajweedGuide.onlineLessonA11y}`}
              >
                <View style={styles.pickerIcon}>
                  <MaterialIcons name="chat" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.pickerTextCol}>
                  <Text style={styles.pickerName}>{teacher.name}</Text>
                  <Text style={styles.pickerPhone}>{teacher.displayPhone}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => setTeacherPickerOpen(false)}
              style={({ pressed }) => [styles.pickerCancel, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.common.close}
            >
              <Text style={styles.pickerCancelTxt}>{tr(kk.common.close)}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <TajweedAlphabetGrid />

      <View style={styles.studyCard}>
        <Text style={styles.studyTitle}>{tr("Бөлімдер")}</Text>
        <Text style={styles.studyHint}>
          {tr("65 бет тәжуид оқулығы тарауларға бөлінді: әліппе, дыбыс, созу, ғунна, уақф және ерекше белгілер. Тарауды бассаңыз, сол жерден ашылады.")}
        </Text>
        {quickNavGroups.map((group) => (
          <View key={`quick-${group.id}`} style={styles.studyGroup}>
            <Text style={styles.studyGroupTitle}>{tr(group.part?.title ?? kk.tajweedGuide.tocGroupPreface)}</Text>
            <View style={styles.chapterGrid}>
              {group.chapters.map((sec) => (
                <Pressable
                  key={sec.id}
                  onPress={() => onOpenPage(sec.startPage)}
                  style={({ pressed }) => [styles.chapterChip, pressed && { opacity: 0.9 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${sec.title}, ${sec.startPage}`}
                >
                  <Text style={styles.chapterChipTitle} numberOfLines={2}>
                    {tr(sec.title)}
                  </Text>
                  <Text style={styles.chapterChipPages}>
                    {sec.startPage}
                    {sec.endPage > sec.startPage ? `–${sec.endPage}` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      <GuideAccordionSection
        title={tr(kk.tajweedGuide.sectionBook)}
        subtitle={tr(kk.tajweedGuide.sectionBookSub(TAJWEED_APP_PAGE_COUNT))}
        expanded={bookOpen}
        onToggle={() => setBookOpen((open) => !open)}
        colors={colors}
      >
        <TajweedMuftyatToc embedded onPickPage={onOpenPage} />
      </GuideAccordionSection>

      <GuideAccordionSection
        title={tr(kk.tajweedGuide.sectionQuranColors)}
        subtitle={tr(kk.tajweedGuide.quranColorsHint)}
        expanded={rulesOpen}
        onToggle={() => setRulesOpen((o) => !o)}
        colors={colors}
      >
        <TajweedRulesLegendPanel compact />
      </GuideAccordionSection>

      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 4 },
    intro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 12,
      backgroundColor: colors.accentSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    studyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
    },
    onlineCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      gap: 12,
    },
    onlineTop: { gap: 4 },
    onlineEyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    onlineText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
    },
    onlineBtnSingle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      backgroundColor: colors.accent,
      paddingVertical: 13,
      paddingHorizontal: 14,
    },
    onlineBtnSingleTxt: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
    },
    pickerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 28,
      gap: 10,
    },
    pickerTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 4,
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    pickerIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
    },
    pickerTextCol: { flex: 1, minWidth: 0 },
    pickerName: { color: colors.text, fontSize: 15, fontWeight: "800" },
    pickerPhone: { color: colors.muted, fontSize: 13, marginTop: 2 },
    pickerCancel: {
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 4,
    },
    pickerCancelTxt: { color: colors.accent, fontSize: 15, fontWeight: "800" },
    onlineTeacherList: {
      gap: 8,
    },
    onlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      borderRadius: 14,
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    onlineBtnTextCol: {
      flex: 1,
      minWidth: 0,
    },
    onlineBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
    },
    onlineBtnSub: {
      color: "rgba(255,255,255,0.84)",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    onlineBtnCta: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    studyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 4,
    },
    studyHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    stepList: { gap: 9 },
    studyGroup: {
      gap: 8,
      marginTop: 10,
    },
    studyGroupTitle: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      lineHeight: 18,
    },
    chapterGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chapterChip: {
      width: "48%",
      minWidth: 132,
      flexGrow: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      paddingHorizontal: 11,
      paddingVertical: 10,
    },
    chapterChipTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      lineHeight: 18,
    },
    chapterChipPages: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      marginTop: 5,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    stepRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    stepBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      overflow: "hidden",
      textAlign: "center",
      lineHeight: 26,
      backgroundColor: colors.accent,
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    stepBadgeActive: {
      backgroundColor: "#FFFFFF",
      color: colors.accent,
    },
    stepText: { flex: 1, minWidth: 0 },
    stepTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 2,
    },
    stepTitleActive: { color: "#FFFFFF" },
    stepSub: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },
    stepSubActive: { color: "rgba(255,255,255,0.88)" },
    ruleSummary: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 12,
    },
  });
}
