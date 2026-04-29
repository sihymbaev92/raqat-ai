import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, type ImageSourcePropType } from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { TextSection } from "../content/hajjUmrahContent";
import { NAMAZ_GUIDE_SECTIONS } from "../content/namazContent";
import { NAMAZ_WUDU_EXTENDED } from "../content/namazWuduExtended";
import { TAJWEED_WEEK_SECTIONS } from "../content/tajweedWeekContent";
import { TAJWEED_ARABIC_ALPHABET } from "../content/tajweedAlphabet";
import { TAJWEED_BOOK_SECTIONS } from "../content/tajweedBookContent";
import { GuideImageLightbox } from "../components/GuideImageLightbox";
import { GuideAccordionSection } from "../components/GuideAccordion";

export function NamazGuideScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  /** Сыртта алдымен намаз схемасы көрінсін; дәрет мәтіні мен суреттері тек ашылған бөлімде */
  const [wuduOpen, setWuduOpen] = useState(false);
  const wuduIntroBlocks = NAMAZ_GUIDE_SECTIONS.slice(0, 2);
  const visualSteps: { title: string; desc: string; image: ImageSourcePropType; recitation: string[] }[] = [
    {
      title: "Ниет және алғашқы тәкбір",
      desc: "Намазды ниетпен бастап, қол көтеріп «Аллаһу әкбар» деу",
      image: require("../../assets/namaz/namaz_takbir_custom.jpg"),
      recitation: [
        "Ниет (жүрекпен): қай намазды оқитыныңды бекіту.",
        "Мысалы: «Бүгінгі парыз намазын Аллаһ разылығы үшін оқуға ниет еттім».",
        "Кейін алғашқы тәкбір:",
        "«Аллаһу әкбар».",
        "Осыдан кейін қиямға өтіп, Субханака және Фатиха басталады.",
      ],
    },
    {
      title: "Қиям",
      desc: "Тік тұрып, Фатиха мен сүре оқу",
      image: require("../../assets/namaz/namaz_qiyam.png"),
      recitation: [
        "Қиямда (тік тұрған кезде) оқылады:",
        "1) Субханака (алғашқы тәкбірден кейін).",
        "2) «Әғузу билләһи...», «Бисмилләһ...»",
        "3) Фатиха сүресі.",
        "4) Қосымша сүре немесе аят (мысалы: Ихлас, Кәусар).",
      ],
    },
    {
      title: "Рукуғ",
      desc: "Белді түзу иіп, зікір айту",
      image: require("../../assets/namaz/namaz_ruku.png"),
      recitation: [
        "Рукуғта айтылады:",
        "«Субхана раббиял-азыйм» (кемі 3 рет).",
        "Рукуғтан тұрған кезде:",
        "«Сами'аллаһу лиман хамидаһ»",
        "Тік тұрған соң:",
        "«Раббана лакәл-хамд».",
      ],
    },
    {
      title: "Сәжде",
      desc: "Екі сәжде және дұға",
      image: require("../../assets/namaz/namaz_sajdah.png"),
      recitation: [
        "Сәждеде айтылады:",
        "«Субхана раббиял-ағлә» (кемі 3 рет).",
        "Екі сәжденің ортасында (отырыста):",
        "«Раббиғфир ли, вархамни, ваһдини, варзуқни»",
        "(қысқа нұсқа: «Раббиғфир ли»).",
      ],
    },
    {
      title: "Соңғы отырыс",
      desc: "Әттахият, салауат, дұға және сәлем",
      image: require("../../assets/namaz/namaz_final_sitting_custom.png"),
      recitation: [
        "Соңғы отырыста реті:",
        "1) Әттахият:",
        "«Әт-тахияту лиллаһи вас-салауату ват-таййибат...»",
        "2) Салауат (Аллаһумма салли / барик).",
        "3) Дұға (мысалы: «Раббана атина...» немесе басқа мәснүн дұға).",
        "4) Сәлем:",
        "Оңға, сосын солға: «Әссәләму аләйкум уә рахматуллаһ».",
      ],
    },
    {
      title: "Жамағат",
      desc: "Имамға ілесу, сап, жұма — толығырақ төмендегі бөлімде",
      image: require("../../assets/namaz/namaz_jamaat.png"),
      recitation: [
        "Жамағатта имамға ілесу тәртібі сақталады.",
        "Имам рукуғқа/сәждеге өтпей тұрып озбау.",
        "Дауыстап оқылатын намаздарда имамды тыңдау,",
        "іштен оқылатын жерлерде зікір/тәсбихпен бірге ілесу.",
      ],
    },
  ];

  const namazRest = NAMAZ_GUIDE_SECTIONS.slice(2);
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({});
  const toggleAcc = (key: string) => setAccOpen((o) => ({ ...o, [key]: !o[key] }));
  const coachSteps = [
    { title: "Ниет + тәкбір", detail: "Намазға ниет етіп, «Аллаһу әкбар» деп қиямға тұру." },
    { title: "Қиям", detail: "Субханака, Фатиха және қысқа сүре оқу." },
    { title: "Рукуғ", detail: "Белді иіп, «Субхана раббиял-азыйм» (кемі 3 рет)." },
    { title: "Қаумә", detail: "Тік тұрып: «Сами'аллаһу лиман хамидаһ», «Раббана лакәл-хамд»." },
    { title: "Сәжде 1", detail: "«Субхана раббиял-ағлә» (кемі 3 рет)." },
    { title: "Екі сәжде арасы", detail: "Отырыста «Раббиғфир ли» дұғасы." },
    { title: "Сәжде 2", detail: "Екінші сәжде — сол зікірмен." },
    { title: "Келесі рәкәғат", detail: "Тұрып келесі рәкәғатқа өту; соңғысында тәшәһһудқа отыру." },
    { title: "Соңғы отырыс", detail: "Әттахият, салауат, дұға." },
    { title: "Сәлем", detail: "Оңға және солға: «Әссәләму аләйкум уә рахматуллаһ»." },
  ] as const;
  const [coachActive, setCoachActive] = useState(false);
  const [coachIdx, setCoachIdx] = useState(0);

  const stepCoach = useCallback(
    async (delta: number) => {
      const next = Math.max(0, Math.min(coachSteps.length - 1, coachIdx + delta));
      if (next === coachIdx) return;
      setCoachIdx(next);
      try {
        await Haptics.selectionAsync();
      } catch {
        // вибро қолжетімсіз болса, үнсіз өткіземіз
      }
    },
    [coachIdx, coachSteps.length]
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{kk.namazGuide.intro}</Text>
      <View style={styles.coachCard}>
        <Text style={styles.coachTitle}>{kk.namazGuide.coachTitle}</Text>
        <Text style={styles.coachIntro}>{kk.namazGuide.coachIntro}</Text>
        {!coachActive ? (
          <Pressable
            onPress={() => {
              setCoachIdx(0);
              setCoachActive(true);
            }}
            style={({ pressed }) => [styles.coachPrimaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.coachPrimaryBtnTxt}>{kk.namazGuide.coachStart}</Text>
          </Pressable>
        ) : (
          <View style={styles.coachFlow}>
            <Text style={styles.coachStepLabel}>{kk.namazGuide.coachStepLabel(coachIdx + 1, coachSteps.length)}</Text>
            <Text style={styles.coachStepTitle}>{coachSteps[coachIdx].title}</Text>
            <Text style={styles.coachStepDetail}>{coachSteps[coachIdx].detail}</Text>
            <View style={styles.coachBtnsRow}>
              <Pressable style={styles.coachGhostBtn} onPress={() => void stepCoach(-1)}>
                <Text style={styles.coachGhostBtnTxt}>{kk.namazGuide.coachPrev}</Text>
              </Pressable>
              {coachIdx < coachSteps.length - 1 ? (
                <Pressable style={styles.coachPrimaryBtn} onPress={() => void stepCoach(1)}>
                  <Text style={styles.coachPrimaryBtnTxt}>{kk.namazGuide.coachNext}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.coachPrimaryBtn}
                  onPress={() => {
                    setCoachActive(false);
                    setCoachIdx(0);
                  }}
                >
                  <Text style={styles.coachPrimaryBtnTxt}>{kk.namazGuide.coachDone}</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.coachStopBtn, pressed && { opacity: 0.88 }]}
              onPress={() => {
                setCoachActive(false);
                setCoachIdx(0);
              }}
            >
              <Text style={styles.coachStopBtnTxt}>{kk.namazGuide.coachStop}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => setWuduOpen((o) => !o)}
        style={({ pressed }) => [styles.wuduHero, pressed && styles.wuduHeroPressed]}
        accessibilityRole="button"
        accessibilityLabel={wuduOpen ? "Дәрет бөлімін жасыру" : "Дәрет бөлімін ашу"}
      >
        <Image
          source={require("../../assets/namaz/wudu_button_icon_custom.png")}
          style={styles.wuduHeroIcon}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.wuduHeroTextCol}>
          <Text style={styles.wuduHeroTitle}>Дәрет</Text>
          <Text style={styles.wuduHeroSub}>
            Ниет, түрлері, бұзылу, қадамдар, ер/әйел суреттері — бәрі осы бөлімнің ішінде.
          </Text>
        </View>
        <Text style={styles.wuduHeroChevron}>{wuduOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {wuduOpen ? (
        <>
          {wuduIntroBlocks.map((s) => (
            <View key={s.title} style={styles.block}>
              <Text style={styles.blockTitle}>{s.title}</Text>
              <Text style={styles.blockBody}>{s.body}</Text>
            </View>
          ))}
          {NAMAZ_WUDU_EXTENDED.map((s) => (
            <View key={s.title} style={styles.block}>
              <Text style={styles.blockTitle}>{s.title}</Text>
              <Text style={styles.blockBody}>{s.body}</Text>
            </View>
          ))}
          <Text style={styles.galleryTitle}>Дәрет алу реті (біріктірілген толық схема)</Text>
          <Text style={styles.imageHint}>{kk.namazGuide.imageTapHint}</Text>
          <View style={styles.ltrImageWrap}>
            <GuideImageLightbox
              source={require("../../assets/namaz/wudu_full_steps.png")}
              colors={colors}
              thumbStyle={styles.guideImage}
              closeLabel={kk.namazGuide.closeImageLightbox}
              openImageA11y={kk.namazGuide.openImageA11y}
            />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionAfterWudu}>Намаз қимылы мен сәләм</Text>
      <Text style={styles.imageHint}>{kk.namazGuide.imageTapHint}</Text>
      {visualSteps.map((v) => {
        const key = `pose-${v.title}`;
        return (
          <GuideAccordionSection
            key={key}
            title={v.title}
            subtitle={v.desc}
            expanded={!!accOpen[key]}
            onToggle={() => toggleAcc(key)}
            colors={colors}
          >
            <View style={styles.visualStepBlock}>
              <View style={styles.ltrImageWrap}>
                <GuideImageLightbox
                  source={v.image}
                  colors={colors}
                  thumbStyle={styles.namazPoseImage}
                  closeLabel={kk.namazGuide.closeImageLightbox}
                  openImageA11y={`${v.title}: ${kk.namazGuide.openImageA11y}`}
                />
              </View>
              <View style={styles.stepReciteBox}>
                {v.recitation.map((line, idx) => (
                  <Text key={`${v.title}-r-${idx}`} style={styles.stepReciteLine}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </GuideAccordionSection>
        );
      })}
      {namazRest.map((s, idx) => {
        const key = `namaz-txt-${idx}-${s.title}`;
        return (
          <GuideAccordionSection
            key={key}
            title={s.title}
            expanded={!!accOpen[key]}
            onToggle={() => toggleAcc(key)}
            colors={colors}
          >
            <Text style={styles.blockBody}>{s.body}</Text>
          </GuideAccordionSection>
        );
      })}
      <GuideAccordionSection
        title="Намаз қадамдары (суреттік схема)"
        expanded={!!accOpen["namaz-steps-diagram"]}
        onToggle={() => toggleAcc("namaz-steps-diagram")}
        colors={colors}
      >
        <Text style={styles.imageHint}>{kk.namazGuide.imageTapHint}</Text>
        <View style={styles.ltrImageWrap}>
          <GuideImageLightbox
            source={require("../../assets/namaz/namaz_steps.png")}
            colors={colors}
            thumbStyle={styles.guideImage}
            closeLabel={kk.namazGuide.closeImageLightbox}
            openImageA11y={kk.namazGuide.openImageA11y}
          />
        </View>
      </GuideAccordionSection>
    </ScrollView>
  );
}

export function TajweedGuideScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const playTajweedLine = useCallback(async (line: string, rowKey: string) => {
    const sep = " — ";
    const i = line.indexOf(sep);
    const ar = i >= 0 ? line.slice(0, i).trim() : line.trim();
    const rest = i >= 0 ? line.slice(i + sep.length).trim() : "";
    const sample = rest.includes("·") ? rest.split("·").pop()?.trim() ?? "" : "";
    const speechText = [ar, sample].filter(Boolean).join(" ");
    if (!speechText) return;
    try {
      await Speech.stop();
      setSpeakingKey(rowKey);
      Speech.speak(speechText, {
        language: "ar",
        pitch: 1.0,
        rate: 0.82,
        onDone: () => setSpeakingKey((k) => (k === rowKey ? null : k)),
        onStopped: () => setSpeakingKey((k) => (k === rowKey ? null : k)),
        onError: () => setSpeakingKey((k) => (k === rowKey ? null : k)),
      });
    } catch {
      setSpeakingKey(null);
    }
  }, []);

  const renderTajweedBody = (s: TextSection) => {
    if (s.title === "Әріптер кестесі") {
      return (
        <View style={styles.tajTable}>
          {s.body.split("\n").map((line, idx) => {
            const sep = " — ";
            const i = line.indexOf(sep);
            const ar = i >= 0 ? line.slice(0, i).trim() : line.trim();
            const rest = i >= 0 ? line.slice(i + sep.length).trim() : "";
            const rowKey = `${idx}-${ar}`;
            return (
              <View key={rowKey} style={styles.tajRow}>
                <View style={styles.tajRowTop}>
                  <Text style={styles.tajAr}>{ar}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.tajAudioBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={() => void playTajweedLine(line, rowKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`Әріпті тыңдау: ${ar}`}
                  >
                    <Text style={styles.tajAudioBtnTxt}>
                      {speakingKey === rowKey ? "⏹ Тоқтату" : "🔊 Тыңдау"}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.tajMeta}>{rest ? `${sep}${rest}` : ""}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return <Text style={styles.blockBody}>{s.body}</Text>;
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{kk.tajweedGuide.intro}</Text>
      <Text style={styles.weekHead}>{kk.tajweedGuide.alphabetHeading}</Text>
      {TAJWEED_ARABIC_ALPHABET.map((s, i) => {
        const key = `taj-alph-${i}`;
        return (
          <GuideAccordionSection
            key={key}
            title={s.title}
            expanded={!!open[key]}
            onToggle={() => toggle(key)}
            colors={colors}
          >
            {renderTajweedBody(s)}
          </GuideAccordionSection>
        );
      })}
      <Text style={styles.weekHead}>{kk.tajweedGuide.bookHeading}</Text>
      {TAJWEED_BOOK_SECTIONS.map((s, i) => {
        const key = `taj-book-${i}`;
        return (
          <GuideAccordionSection
            key={key}
            title={s.title}
            expanded={!!open[key]}
            onToggle={() => toggle(key)}
            colors={colors}
          >
            <Text style={styles.blockBody}>{s.body}</Text>
          </GuideAccordionSection>
        );
      })}
      <Text style={styles.weekHead}>{kk.tajweedGuide.weekHeading}</Text>
      {TAJWEED_WEEK_SECTIONS.map((s, i) => {
        const key = `taj-week-${i}`;
        return (
          <GuideAccordionSection
            key={key}
            title={s.title}
            expanded={!!open[key]}
            onToggle={() => toggle(key)}
            colors={colors}
          >
            <Text style={styles.blockBody}>{s.body}</Text>
          </GuideAccordionSection>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 40 },
    intro: { color: colors.muted, marginBottom: 16, lineHeight: 22, fontSize: 14 },
    coachCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coachTitle: { color: colors.accent, fontWeight: "900", fontSize: 16, marginBottom: 6 },
    coachIntro: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 10 },
    coachFlow: { gap: 8 },
    coachStepLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
    coachStepTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
    coachStepDetail: { color: colors.text, fontSize: 14, lineHeight: 21 },
    coachBtnsRow: { flexDirection: "row", gap: 8, marginTop: 2 },
    coachPrimaryBtn: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    coachPrimaryBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
    coachGhostBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    coachGhostBtnTxt: { color: colors.text, fontSize: 13, fontWeight: "700" },
    coachStopBtn: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 2 },
    coachStopBtnTxt: { color: colors.muted, fontSize: 12, textDecorationLine: "underline" },
    block: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blockTitle: { color: colors.accent, fontWeight: "800", fontSize: 15, marginBottom: 8 },
    blockBody: { color: colors.text, fontSize: 15, lineHeight: 24 },
    tajTable: { marginTop: 4, gap: 10 },
    tajRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tajRowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    tajAr: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.scriptureArabic,
      minWidth: 36,
      textAlign: "center",
      writingDirection: "rtl",
    },
    tajMeta: {
      marginTop: 4,
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    tajAudioBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    tajAudioBtnTxt: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    visualStepBlock: {
      marginBottom: 4,
      alignSelf: "stretch",
    },
    stepReciteBox: {
      marginTop: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    stepReciteLine: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    namazPoseImage: {
      width: "100%",
      height: 240,
      borderRadius: 14,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 0,
    },
    galleryTitle: { color: colors.accent, fontWeight: "800", fontSize: 16, marginBottom: 6 },
    imageHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 10,
    },
    /** RTL интерфейсте Android суретті айнадағыдай көрсетпеу үшін */
    ltrImageWrap: { direction: "ltr", alignSelf: "stretch" },
    guideImage: {
      width: "100%",
      height: 260,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    weekHead: {
      color: colors.accent,
      fontWeight: "800",
      fontSize: 16,
      marginTop: 8,
      marginBottom: 10,
    },
    wuduHero: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    wuduHeroPressed: { opacity: 0.92 },
    wuduHeroIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    wuduHeroTextCol: { flex: 1 },
    wuduHeroTitle: { color: colors.accent, fontWeight: "900", fontSize: 17, marginBottom: 4 },
    wuduHeroSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    wuduHeroChevron: { color: colors.accent, fontSize: 18, fontWeight: "800" },
    sectionAfterWudu: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 17,
      marginBottom: 10,
      marginTop: 4,
    },
  });
}
