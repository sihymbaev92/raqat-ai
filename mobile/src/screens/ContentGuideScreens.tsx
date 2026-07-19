import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import {
  getNamazLearningHintsForGuidePose,
  getNamazRecitationBlocksForGuidePose,
  type RecitationBlock,
} from "../content/namazLearningContent";
import {
  FIVE_PRAYER_RAKAT_ROWS,
  FIVE_PRAYER_RAKAT_SUMMARY,
  NAMAZ_POSE_VISUAL_STEPS,
  NAMAZ_PRAYER_TYPE_CARDS,
  type NamazPrayerTypeCardContent,
} from "../content/namazPrayerGuideContent";
import { NAMAZ_WUDU_EXTENDED } from "../content/namazWuduExtended";
import { NAMAZ_WUDU_VISUAL_STEPS } from "../content/namazWuduSteps";
import { GuideImageLightbox } from "../components/GuideImageLightbox";
import { GuideAccordionSection } from "../components/GuideAccordion";
import {
  NamazGuidePoseRecitationBlocks,
  NamazGuideWuduLearningBlock,
} from "../components/NamazGuideLearning";
import {
  NamazCompanionPicker,
  NamazCompanionSession,
} from "../components/NamazCompanionPanel";
import type { NamazCompanionSalatKey } from "../content/namazCompanionSession";
import { imageAssetAspectRatio } from "../utils/imageAssetAspect";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";
import { useModalSafeAreaInsets, appBottomSafeInset } from "../theme/deviceSafeArea";

const WUDU_THEORY_ACC_KEY = "wudu-theory";
const NAMAZ_IMAGE_THUMB_RESIZE_MULTIPLIER = Platform.OS === "android" ? 0.45 : undefined;
const NAMAZ_IMAGE_THUMB_MAX_HEIGHT_RATIO = 0.34;
type NamazPrimarySectionKey = "wudu" | "five-prayers";

const FIVE_PRAYER_END_RECITATIONS: RecitationBlock[] = [
  {
    id: "ayat-al-kursi",
    label: "1. Аят әл-Курси",
    arabic:
      "اللَّهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    transliterationKk:
      "Аллаһу лә иләһә иллә һуәл-хайюл-қайюм. Лә тә'хузуһу синәтун уә лә нәум. Ләһу мә фис-сәмәуәти уә мә фил-ард. Мән зәлләзи яшфағу ғиндәһу иллә би-изниһ. Яғләму мә бәйна әйдиһим уә мә халфаһум. Уә лә юхитуна бишәй'им мин ғилмиһи иллә бимә шәә. Уасиъа курсийюһус-сәмәуәти уәл-ард. Уә лә йәудуһу хифзуһума, уә һуәл-ғалийюл-ғазим.",
    meaningKk:
      "Алладан басқа құлшылыққа лайық тәңір жоқ. Ол — Мәңгі Тірі, барлық нәрсені Басқарушы. Оны қалғу да, ұйқы да алмайды. Көктер мен жердегі барлық нәрсе Оған тән. Оның рұқсатынсыз кім шапағат ете алады? Ол олардың алдындағыны да, артындағыны да біледі. Олар Оның білімінен қалағанынан басқа ештеңені қамти алмайды. Оның Күрсиі көктер мен жерді қамтиды. Екеуін сақтау Оған ауыр емес. Ол — аса Биік, өте Ұлы.",
  },
  {
    id: "qunut-dua",
    label: "2. Құнт дұғасы",
    arabic:
      "اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ، وَنُؤْمِنُ بِكَ وَنَتُوبُ إِلَيْكَ، وَنَتَوَكَّلُ عَلَيْكَ، وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ، نَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ.\nاللَّهُمَّ إِيَّاكَ نَعْبُدُ، وَلَكَ نُصَلِّي وَنَسْجُدُ، وَإِلَيْكَ نَسْعَى وَنَحْفِدُ، نَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ، إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ",
    transliterationKk:
      "Аллаһуммә иннә нәстәғинукә уә нәстағфирукә уә нәстәһдик. Уә ну'мину бикә уә нәтубу иләйк. Уә нәтәуәккәлу ғаләйк. Уә нусни ғаләйкәл-хайра кулләһ. Нәшкурукә уә лә нәкфурук. Уә нахлағу уә нәтруку мән йәфжурук.\nАллаһуммә иййәкә нәғбуду, уә ләкә нусалли уә нәсжуд. Уә иләйкә нәсға уә нәхфид. Нәржу рахмәтәкә уә нәхшә ғазәбәк. Иннә ғазәбәкә бил-куффәри мулхиқ.",
    meaningKk:
      "Уа, Алла! Біз Сенен жәрдем сұраймыз, кешірім тілейміз, тура жол сұраймыз. Саған иман келтіреміз, Саған тәубе етеміз, Саған тәуекел етеміз. Барлық жақсылықпен Сені мадақтаймыз. Саған шүкір етеміз, күпірлік етпейміз. Саған қарсы келгеннен алыстаймыз.\nУа, Алла! Тек Саған құлшылық қыламыз, Сен үшін намаз оқып, сәжде етеміз. Саған ұмтыламыз, қызмет етеміз. Рақымыңнан үміт етеміз, азабыңнан қорқамыз. Расында, Сенің азабың кәпірлерге жетеді.",
  },
];

export function NamazGuideScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return <NamazGuideBody colors={colors} styles={styles} />;
}

function NamazGuideBody({
  colors,
  styles,
}: {
  colors: ReturnType<typeof useAppTheme>["colors"];
  styles: ReturnType<typeof makeStyles>;
}) {
  const t = useI18n();
  const { tr, translated } = useKkAutoTranslator();
  const modalInsets = useModalSafeAreaInsets();
  const modalBottomPad = appBottomSafeInset(modalInsets);
  const [selectedPrimarySection, setSelectedPrimarySection] = useState<NamazPrimarySectionKey | null>(null);
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({});
  const [selectedPrayerCard, setSelectedPrayerCard] = useState<NamazPrayerTypeCardContent | null>(null);
  const [companionSalatKey, setCompanionSalatKey] = useState<NamazCompanionSalatKey | null>(null);
  const [companionStepIndex, setCompanionStepIndex] = useState(0);
  const exitCompanionSession = useCallback(() => {
    setCompanionSalatKey(null);
    setCompanionStepIndex(0);
  }, []);
  const closeOpenNamazPanel = useCallback(() => {
    if (selectedPrayerCard) {
      setSelectedPrayerCard(null);
      return true;
    }
    if (companionSalatKey) {
      exitCompanionSession();
      return true;
    }
    if (selectedPrimarySection) {
      exitCompanionSession();
      setSelectedPrimarySection(null);
      return true;
    }
    return false;
  }, [companionSalatKey, exitCompanionSession, selectedPrayerCard, selectedPrimarySection]);
  useHardwareBackPress(
    closeOpenNamazPanel,
    selectedPrimarySection != null || selectedPrayerCard != null || companionSalatKey != null
  );
  const toggleAcc = (key: string) => setAccOpen((o) => ({ ...o, [key]: !o[key] }));

  const primarySectionTitle =
    selectedPrimarySection === "wudu"
      ? `1. ${t.namazGuide.wuduHeroTitle}`
      : selectedPrimarySection === "five-prayers"
        ? `2. ${t.namazGuide.fivePrayersTitle}`
        : "";
  const primarySectionSub =
    selectedPrimarySection === "wudu"
      ? t.namazGuide.wuduCardSub
      : selectedPrimarySection === "five-prayers"
        ? t.namazGuide.fivePrayersSub
        : "";

  const renderWuduContent = () => (
    <View style={styles.wuduExpanded}>
      <Text style={styles.unifiedIntro}>{t.namazGuide.wuduStepsIntro}</Text>
      <Text style={styles.imageHint}>{t.namazGuide.imageTapHint}</Text>

      {NAMAZ_WUDU_VISUAL_STEPS.map((step) => (
        <View key={step.id} style={[styles.visualStepCard, { marginBottom: 14 }]}>
          <View style={styles.unifiedStepHead}>
            <Text style={styles.unifiedStepTitle}>
              {step.stepNo}. {tr(step.title)}
            </Text>
          </View>
          <View style={styles.ltrImageWrap}>
            <GuideImageLightbox
              source={step.image}
              colors={colors}
              thumbStyle={[styles.namazGuideImageThumb, styles.namazGuideImageThumbBleed]}
              imageAspectRatio={imageAssetAspectRatio(step.image)}
              closeLabel={kk.namazGuide.closeImageLightbox}
              openImageA11y={`${step.title}. ${step.desc}. ${kk.namazGuide.openImageA11y}`}
              softenThumbOverlay={false}
              fitThumbToScreen
              maxThumbHeightRatio={NAMAZ_IMAGE_THUMB_MAX_HEIGHT_RATIO}
              thumbResizeMultiplier={NAMAZ_IMAGE_THUMB_RESIZE_MULTIPLIER}
            />
          </View>
          <View style={styles.visualStepCardBody}>
            <Text style={styles.stepShortExplain}>{tr(step.desc)}</Text>
            {step.actions.map((a, i) => (
              <Text key={`${step.id}-act-${i}`} style={styles.namazPoseLearningLine}>
                {tr(a)}
              </Text>
            ))}
            {(step.hints ?? []).map((h, i) => (
              <Text key={`${step.id}-hint-${i}`} style={styles.namazPoseLearningHint}>
                {tr(h)}
              </Text>
            ))}
            {step.recitations?.length ? (
              <View style={styles.namazPoseReciteWrap}>
                <NamazGuidePoseRecitationBlocks blocks={step.recitations} colors={colors} />
              </View>
            ) : null}
          </View>
        </View>
      ))}

      <GuideAccordionSection
        title={kk.namazGuide.wuduTheoryTitle}
        subtitle={kk.namazGuide.wuduTheorySubtitle}
        expanded={!!accOpen[WUDU_THEORY_ACC_KEY]}
        onToggle={() => toggleAcc(WUDU_THEORY_ACC_KEY)}
        colors={colors}
      >
        {NAMAZ_WUDU_EXTENDED.map((s) => (
          <View key={s.title} style={styles.block}>
            <Text style={styles.blockTitle}>{tr(s.title)}</Text>
            <Text style={styles.blockBody}>{tr(s.body)}</Text>
          </View>
        ))}
      </GuideAccordionSection>

      <NamazGuideWuduLearningBlock colors={colors} accOpen={accOpen} toggleAcc={toggleAcc} />
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );

  const renderFivePrayerContent = () => (
    <View style={styles.namazExpanded}>
      <NamazCompanionPicker
        colors={colors}
        onStart={(key) => {
          setCompanionSalatKey(key);
          setCompanionStepIndex(0);
        }}
      />
      <View style={styles.manualNamazPage}>
        <View style={styles.manualPageHeader}>
          <Text style={styles.manualPageEyebrow}>{t.namazGuide.screenTitle}</Text>
          <Text style={styles.manualPageTitle}>{t.namazGuide.rakatTableTitle}</Text>
          <Text style={styles.manualPageLead}>
            {t.namazGuide.rakatTableHint}
          </Text>
        </View>
        {FIVE_PRAYER_RAKAT_ROWS.map((row) => (
          <View key={row.key} style={styles.rakatPrayerCard}>
            <View style={styles.rakatPrayerTop}>
              <Text style={styles.rakatPrayerTitle}>{tr(row.title)}</Text>
              <Text style={styles.rakatPrayerTime}>{tr(row.time)}</Text>
            </View>
            {row.rakats.map((rakat) => (
              <Text key={`${row.key}-${rakat}`} style={styles.rakatLine}>
                {tr(rakat)}
              </Text>
            ))}
            {row.notes.map((note) => (
              <Text key={`${row.key}-note-${note}`} style={styles.rakatNoteLine}>
                {tr(note)}
              </Text>
            ))}
          </View>
        ))}
        <View style={styles.rakatSummaryBox}>
          {FIVE_PRAYER_RAKAT_SUMMARY.map((line) => (
            <Text key={line} style={styles.rakatSummaryLine}>
              {tr(line)}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.unifiedIntro}>{t.namazGuide.unifiedNamazIntro}</Text>
      <Text style={styles.imageHint}>{t.namazGuide.imageTapHint}</Text>

      {NAMAZ_POSE_VISUAL_STEPS.map((v) => {
        const poseKey = `pose-${v.title}`;
        const recBlocks = getNamazRecitationBlocksForGuidePose(v.title);
        const learnHints = getNamazLearningHintsForGuidePose(v.title);
        return (
          <View key={poseKey} style={[styles.visualStepCard, { marginBottom: 14 }]}>
            <View style={styles.unifiedStepHead}>
              <Text style={styles.unifiedStepTitle}>{tr(v.title)}</Text>
            </View>
            <View style={styles.ltrImageWrap}>
              <GuideImageLightbox
                source={v.image}
                colors={colors}
                thumbStyle={[styles.namazGuideImageThumb, styles.namazGuideImageThumbBleed]}
                imageAspectRatio={imageAssetAspectRatio(v.image)}
                closeLabel={kk.namazGuide.closeImageLightbox}
                openImageA11y={`${v.title}. ${v.desc}. ${kk.namazGuide.openImageA11y}`}
                softenThumbOverlay={false}
                fitThumbToScreen
                maxThumbHeightRatio={NAMAZ_IMAGE_THUMB_MAX_HEIGHT_RATIO}
                thumbResizeMultiplier={NAMAZ_IMAGE_THUMB_RESIZE_MULTIPLIER}
              />
            </View>
            <View style={styles.visualStepCardBody}>
              <Text style={styles.stepShortExplain}>{tr(v.desc)}</Text>
              {(v.actions.length ? v.actions : learnHints?.actions ?? []).map((a, i) => (
                <Text key={`${v.title}-act-${i}`} style={styles.namazPoseLearningLine}>
                  {tr(a)}
                </Text>
              ))}
              {(v.hints?.length ? v.hints : learnHints?.hints ?? []).map((h, i) => (
                <Text key={`${v.title}-hint-${i}`} style={styles.namazPoseLearningHint}>
                  {tr(h)}
                </Text>
              ))}
              {learnHints?.genderNote ? (
                <Text style={styles.namazPoseGenderNote}>{tr(learnHints.genderNote)}</Text>
              ) : null}
              {recBlocks.length ? (
                <View style={styles.namazPoseReciteWrap}>
                  <NamazGuidePoseRecitationBlocks blocks={recBlocks} colors={colors} />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      <View style={[styles.visualStepCard, { marginBottom: 14 }]}>
        <View style={styles.unifiedStepHead}>
          <Text style={styles.unifiedStepTitle}>{t.namazGuide.afterPrayerDuasTitle}</Text>
        </View>
        <View style={styles.visualStepCardBody}>
          <Text style={styles.stepShortExplain}>
            {t.namazGuide.afterPrayerDuasHint}
          </Text>
          <View style={styles.namazPoseReciteWrap}>
            <NamazGuidePoseRecitationBlocks blocks={FIVE_PRAYER_END_RECITATIONS} colors={colors} />
          </View>
        </View>
      </View>
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );

  return (
    <>
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View style={styles.studyMap}>
        <Text style={styles.studyMapTitle}>{t.namazGuide.studyMapTitle}</Text>
        <Text style={styles.studyMapHint}>{t.namazGuide.studyMapPickHint}</Text>
        <View style={styles.studyMapGrid}>
          <Pressable
            onPress={() => setSelectedPrimarySection("wudu")}
            style={({ pressed }) => [
              styles.studyMapCard,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.studyMapBadge}>1</Text>
            <View style={styles.studyMapTextCol}>
              <Text style={styles.studyMapCardTitle} numberOfLines={2}>
                {t.namazGuide.wuduHeroTitle}
              </Text>
              <Text style={styles.studyMapCardSub} numberOfLines={2}>
                {t.namazGuide.wuduCardSub}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setSelectedPrimarySection("five-prayers")}
            style={({ pressed }) => [
              styles.studyMapCard,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.studyMapBadge}>2</Text>
            <View style={styles.studyMapTextCol}>
              <Text style={styles.studyMapCardTitle} numberOfLines={2}>
                {t.namazGuide.fivePrayersTitle}
              </Text>
              <Text style={styles.studyMapCardSub} numberOfLines={2}>
                {t.namazGuide.fivePrayersSub}
              </Text>
            </View>
          </Pressable>
          {NAMAZ_PRAYER_TYPE_CARDS.map((card) => {
            return (
              <Pressable
                key={card.key}
                onPress={() => setSelectedPrayerCard(card)}
                style={({ pressed }) => [
                  styles.studyMapCard,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.studyMapBadge}>{card.no}</Text>
                <View style={styles.studyMapTextCol}>
                  <Text style={styles.studyMapCardTitle} numberOfLines={2}>
                    {tr(card.title)}
                  </Text>
                  <Text style={styles.studyMapCardSub} numberOfLines={2}>
                    {tr(card.subtitle)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <GuideAutoTranslateBanner colors={colors} visible={translated} />

    </ScrollView>
    <Modal
      visible={selectedPrimarySection != null}
      animationType="slide"
      onRequestClose={closeOpenNamazPanel}
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === "android"}
    >
      <View
        style={[
          styles.modalRoot,
          { paddingTop: modalInsets.top, paddingBottom: modalBottomPad },
        ]}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleCol}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {companionSalatKey ? kk.namazCompanion.screenTitle : primarySectionTitle}
            </Text>
            <Text style={styles.modalSub} numberOfLines={1}>
              {companionSalatKey ? kk.namazCompanion.lockedHint : primarySectionSub}
            </Text>
          </View>
        </View>
        {selectedPrimarySection && companionSalatKey ? (
          <NamazCompanionSession
            colors={colors}
            salatKey={companionSalatKey}
            stepIndex={companionStepIndex}
            onStepIndexChange={setCompanionStepIndex}
            onExit={exitCompanionSession}
          />
        ) : selectedPrimarySection ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            removeClippedSubviews={Platform.OS === "android"}
          >
            {selectedPrimarySection === "wudu" ? renderWuduContent() : renderFivePrayerContent()}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
    <Modal
      visible={selectedPrayerCard != null}
      animationType="slide"
      onRequestClose={() => setSelectedPrayerCard(null)}
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === "android"}
    >
      <View
        style={[
          styles.modalRoot,
          { paddingTop: modalInsets.top, paddingBottom: modalBottomPad },
        ]}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleCol}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedPrayerCard ? `${selectedPrayerCard.no}. ${tr(selectedPrayerCard.title)}` : ""}
            </Text>
            <Text style={styles.modalSub} numberOfLines={1}>
              {selectedPrayerCard ? tr(selectedPrayerCard.subtitle) : ""}
            </Text>
          </View>
        </View>
        {selectedPrayerCard ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={Platform.OS === "android"}
          >
            <View style={styles.visualStepCard}>
              <View style={styles.ltrImageWrap}>
                <GuideImageLightbox
                  source={selectedPrayerCard.image}
                  colors={colors}
                  thumbStyle={[styles.namazGuideImageThumb, styles.namazGuideImageThumbBleed]}
                  imageAspectRatio={imageAssetAspectRatio(selectedPrayerCard.image)}
                  closeLabel={kk.namazGuide.closeImageLightbox}
                  openImageA11y={`${selectedPrayerCard.title}. ${selectedPrayerCard.subtitle}. ${kk.namazGuide.openImageA11y}`}
                  softenThumbOverlay={false}
                  fitThumbToScreen
                  maxThumbHeightRatio={NAMAZ_IMAGE_THUMB_MAX_HEIGHT_RATIO}
                  thumbResizeMultiplier={NAMAZ_IMAGE_THUMB_RESIZE_MULTIPLIER}
                />
              </View>
              <View style={styles.visualStepCardBody}>
                <Text style={styles.stepShortExplain}>{tr(selectedPrayerCard.lead)}</Text>
                {selectedPrayerCard.sections.map((section) => (
                  <View key={`${selectedPrayerCard.key}-${section.title}`} style={styles.block}>
                    <Text style={styles.blockTitle}>{tr(section.title)}</Text>
                    {section.lines.map((line) => (
                      <Text
                        key={`${selectedPrayerCard.key}-${section.title}-${line}`}
                        style={[styles.blockBody, styles.prayerGuideSectionLine]}
                      >
                        {tr(line)}
                      </Text>
                    ))}
                  </View>
                ))}
                <GuideAutoTranslateBanner colors={colors} visible={translated} />
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 14, paddingBottom: 44 },
    modalRoot: { flex: 1, backgroundColor: colors.bg },
    modalHeader: {
      minHeight: 64,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalBackBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalBackTxt: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "800",
      lineHeight: 28,
    },
    modalTitleCol: { flex: 1, minWidth: 0 },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
    modalSub: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    modalContent: { padding: 14, paddingBottom: 56 },
    block: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blockTitle: { color: colors.accent, fontWeight: "800", fontSize: 15, marginBottom: 8 },
    blockBody: { color: colors.text, fontSize: 15, lineHeight: 24 },
    prayerGuideSectionLine: { marginBottom: 6 },
    studyMap: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
    },
    studyMapTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 4,
    },
    studyMapHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    studyMapGrid: {
      flexDirection: "column",
      gap: 10,
    },
    studyMapCard: {
      alignSelf: "stretch",
      maxWidth: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      overflow: "hidden",
    },
    studyMapTextCol: {
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
    },
    studyMapCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    studyMapBadge: {
      flexShrink: 0,
      alignSelf: "flex-start",
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      textAlign: "center",
      lineHeight: 24,
      backgroundColor: colors.accent,
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    studyMapBadgeActive: {
      backgroundColor: "#FFFFFF",
      color: colors.accent,
    },
    studyMapCardTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      minWidth: 0,
      flexShrink: 1,
    },
    studyMapCardTitleActive: { color: "#FFFFFF" },
    studyMapCardSub: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      minWidth: 0,
      flexShrink: 1,
    },
    studyMapCardSubActive: { color: "rgba(255,255,255,0.88)" },
    /** Тәжуид кестесі: 7 баған × 4 жол; `row-reverse` — ا оң жақта, оқу оңнан солға. */
    tajGridWrap: { marginTop: 4, alignSelf: "stretch" },
    tajLegendRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tajLegendItem: { flex: 1, minWidth: 0 },
    tajLegendHeavy: { color: colors.error, fontSize: 12, fontWeight: "800", textAlign: "left" },
    tajLegendLight: { color: colors.text, fontSize: 12, fontWeight: "800", textAlign: "right" },
    tajGrid: { alignSelf: "stretch" },
    tajGridRow: {
      flexDirection: "row-reverse",
      alignSelf: "stretch",
      gap: 6,
      marginBottom: 6,
    },
    tajCell: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 10,
      paddingHorizontal: 2,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      direction: "ltr",
    },
    tajCellHeavy: {
      borderColor: `${colors.error}99`,
      backgroundColor: `${colors.error}12`,
    },
    tajCellArabic: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.scriptureArabic,
      textAlign: "center",
      writingDirection: "rtl",
    },
    tajCellName: { fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 13 },
    tajCellListen: { fontSize: 11, marginTop: 2, color: colors.muted },
    tajGridLegend: {
      marginTop: 10,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
    },
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
    /** Сурет + қысқа түсінік + оқылатын мәтін — бір карточкада (екі бөлек «қатар» емес). */
    visualStepCard: {
      alignSelf: "stretch",
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    visualStepCardBody: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 4,
    },
    stepShortExplain: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 22,
      marginBottom: 10,
    },
    namazPoseLearningLine: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 8,
    },
    namazPoseLearningHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 6,
    },
    namazPoseGenderNote: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
    },
    namazPoseReciteWrap: {
      marginTop: 8,
      marginBottom: 4,
    },
    stepReciteBox: {
      marginTop: 0,
      backgroundColor: colors.accentSurface,
      borderRadius: 14,
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
    manualNamazPage: {
      alignSelf: "stretch",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 14,
      gap: 10,
    },
    manualPageHeader: {
      alignItems: "center",
      paddingHorizontal: 6,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 2,
    },
    manualPageEyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.55,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    manualPageTitle: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900",
      textAlign: "center",
    },
    manualPageLead: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 5,
    },
    rakatPrayerCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    rakatPrayerTop: {
      marginBottom: 6,
    },
    rakatPrayerTitle: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      textAlign: "center",
    },
    rakatPrayerTime: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 2,
    },
    rakatLine: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700",
      textAlign: "center",
    },
    rakatNoteLine: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 6,
    },
    rakatSummaryBox: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    rakatSummaryLine: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "900",
      textAlign: "center",
    },
    imageHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 10,
    },
    /** RTL интерфейсте Android суретті айнадағыдай көрсетпеу үшін */
    ltrImageWrap: {
      direction: "ltr",
      alignSelf: "stretch",
      paddingHorizontal: 2,
    },
    /** Намаз/дәрет суреттері — GuideImageLightbox fitThumbToScreen арқылы экранға сыйады */
    namazGuideImageThumb: {
      width: "100%",
      alignSelf: "stretch",
      borderRadius: 12,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    namazGuideImageThumbBleed: {
      borderRadius: 0,
      borderWidth: 0,
      marginBottom: 0,
    },
    guideImage: {
      width: "100%",
      borderRadius: 18,
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
    wuduDiagramCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingTop: 14,
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    wuduCardDiagramTitle: {
      color: colors.accent,
      fontWeight: "800",
      fontSize: 15,
      marginBottom: 4,
    },
    wuduExpanded: {
      marginTop: 10,
      gap: 10,
    },
    namazExpanded: {
      gap: 10,
      marginBottom: 14,
    },
    wuduHero: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginBottom: 14,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wuduHeroPressed: { opacity: 0.92 },
    wuduHeroIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 12,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    wuduHeroIcon: {
      width: 62,
      height: 62,
      transform: [{ translateX: 6 }],
    },
    wuduHeroTextCol: { flex: 1 },
    wuduHeroTitle: { color: colors.accent, fontWeight: "900", fontSize: 17, marginBottom: 4 },
    wuduHeroSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    wuduHeroChevron: { color: colors.accent, fontSize: 18, fontWeight: "800" },
    unifiedIntro: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 12,
    },
    unifiedStepHead: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    unifiedStepTitle: {
      color: colors.accent,
      fontWeight: "800",
      fontSize: 16,
      lineHeight: 22,
    },
  });
}
