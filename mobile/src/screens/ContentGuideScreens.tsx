import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { NAMAZ_GUIDE_SECTIONS } from "../content/namazContent";
import { NAMAZ_WUDU_EXTENDED } from "../content/namazWuduExtended";
import { TAJWEED_WEEK_SECTIONS } from "../content/tajweedWeekContent";
import { TAJWEED_ARABIC_ALPHABET } from "../content/tajweedAlphabet";
import { TAJWEED_BOOK_SECTIONS } from "../content/tajweedBookContent";
import { GuideImageLightbox } from "../components/GuideImageLightbox";

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function NamazGuideScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  /** Сыртта алдымен намаз схемасы көрінсін; дәрет мәтіні мен суреттері тек ашылған бөлімде */
  const [wuduOpen, setWuduOpen] = useState(false);
  const wuduIntroBlocks = NAMAZ_GUIDE_SECTIONS.slice(0, 2);
  const visualSteps: { icon: MciName; title: string; desc: string; image: number }[] = [
    {
      icon: "hands-pray",
      title: "Қиям",
      desc: "Тік тұрып, Фатиха мен сүре оқу",
      image: require("../../assets/namaz/namaz_qiyam.png"),
    },
    {
      icon: "yoga",
      title: "Рукуғ",
      desc: "Белді түзу иіп, зікір айту",
      image: require("../../assets/namaz/namaz_ruku.png"),
    },
    {
      icon: "arrow-collapse-down",
      title: "Сәжде",
      desc: "Екі сәжде және дұға",
      image: require("../../assets/namaz/namaz_sajdah.png"),
    },
    {
      icon: "account-group",
      title: "Жамағат",
      desc: "Имамға ілесу, сап, жұма — толығырақ төмендегі бөлімде",
      image: require("../../assets/namaz/namaz_jamaat.png"),
    },
  ];

  const namazRest = NAMAZ_GUIDE_SECTIONS.slice(2);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{kk.namazGuide.intro}</Text>

      <Pressable
        onPress={() => setWuduOpen((o) => !o)}
        style={({ pressed }) => [styles.wuduHero, pressed && styles.wuduHeroPressed]}
        accessibilityRole="button"
        accessibilityLabel={wuduOpen ? "Дәрет бөлімін жасыру" : "Дәрет бөлімін ашу"}
      >
        <Text style={styles.wuduHeroIcon}>💧</Text>
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
          <Text style={styles.galleryTitle}>Дәрет суреттері (ер адам / әйел)</Text>
          <Text style={styles.imageHint}>{kk.namazGuide.imageTapHint}</Text>
          <View style={styles.ltrImageWrap}>
            <GuideImageLightbox
              source={require("../../assets/namaz/wudu_male.png")}
              colors={colors}
              thumbStyle={styles.guideImage}
              closeLabel={kk.namazGuide.closeImageLightbox}
              openImageA11y={kk.namazGuide.openImageA11y}
            />
          </View>
          <View style={styles.ltrImageWrap}>
            <GuideImageLightbox
              source={require("../../assets/namaz/wudu_female.png")}
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
      <View style={styles.visualStepsColumn}>
        {visualSteps.map((v) => (
          <View key={v.title} style={styles.visualStepBlock}>
            <View style={styles.visualCard}>
              <View style={styles.visualIconWrap}>
                <MaterialCommunityIcons name={v.icon} size={36} color={colors.accent} />
              </View>
              <Text style={styles.visualTitle}>{v.title}</Text>
              <Text style={styles.visualDesc}>{v.desc}</Text>
            </View>
            <View style={styles.ltrImageWrap}>
              <GuideImageLightbox
                source={v.image}
                colors={colors}
                thumbStyle={styles.namazPoseImage}
                closeLabel={kk.namazGuide.closeImageLightbox}
                openImageA11y={`${v.title}: ${kk.namazGuide.openImageA11y}`}
              />
            </View>
          </View>
        ))}
      </View>
      {namazRest.map((s) => (
        <View key={s.title} style={styles.block}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          <Text style={styles.blockBody}>{s.body}</Text>
        </View>
      ))}
      <Text style={[styles.galleryTitle, styles.galleryAfterText]}>Намаз қадамдары (суреттік схема)</Text>
      <View style={styles.ltrImageWrap}>
        <GuideImageLightbox
          source={require("../../assets/namaz/namaz_steps.png")}
          colors={colors}
          thumbStyle={styles.guideImage}
          closeLabel={kk.namazGuide.closeImageLightbox}
          openImageA11y={kk.namazGuide.openImageA11y}
        />
      </View>
    </ScrollView>
  );
}

export function TajweedGuideScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{kk.tajweedGuide.intro}</Text>
      <Text style={styles.weekHead}>{kk.tajweedGuide.alphabetHeading}</Text>
      {TAJWEED_ARABIC_ALPHABET.map((s) => (
        <View key={s.title} style={styles.block}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          {s.title === "Әріптер кестесі" ? (
            <View style={styles.tajTable}>
              {s.body.split("\n").map((line, idx) => {
                const sep = " — ";
                const i = line.indexOf(sep);
                const ar = i >= 0 ? line.slice(0, i).trim() : line.trim();
                const rest = i >= 0 ? line.slice(i + sep.length).trim() : "";
                return (
                  <View key={`${idx}-${ar}`} style={styles.tajRow}>
                    <Text style={styles.tajAr}>{ar}</Text>
                    <Text style={styles.tajMeta}>
                      {rest ? `${sep}${rest}` : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.blockBody}>{s.body}</Text>
          )}
        </View>
      ))}
      <Text style={styles.weekHead}>{kk.tajweedGuide.bookHeading}</Text>
      {TAJWEED_BOOK_SECTIONS.map((s) => (
        <View key={s.title} style={styles.block}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          <Text style={styles.blockBody}>{s.body}</Text>
        </View>
      ))}
      <Text style={styles.weekHead}>{kk.tajweedGuide.weekHeading}</Text>
      {TAJWEED_WEEK_SECTIONS.map((s) => (
        <View key={s.title} style={styles.block}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          <Text style={styles.blockBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 40 },
    intro: { color: colors.muted, marginBottom: 16, lineHeight: 22, fontSize: 14 },
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
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tajAr: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.accent,
      minWidth: 36,
      textAlign: "center",
      writingDirection: "rtl",
    },
    tajMeta: {
      flex: 1,
      minWidth: 120,
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    visualStepsColumn: {
      marginBottom: 8,
      alignSelf: "stretch",
    },
    visualStepBlock: {
      marginBottom: 14,
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
    galleryAfterText: { marginTop: 18 },
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
    visualCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    visualIconWrap: {
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
    },
    visualTitle: { color: colors.accent, fontWeight: "800", fontSize: 15, marginBottom: 4 },
    visualDesc: { color: colors.text, fontSize: 13, lineHeight: 18 },
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
    wuduHeroIcon: { fontSize: 36, marginRight: 12 },
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
