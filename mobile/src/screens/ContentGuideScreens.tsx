import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { TextSection } from "../content/hajjUmrahContent";
import { NAMAZ_GUIDE_SECTIONS } from "../content/namazContent";
import {
  getNamazLearningHintsForGuidePose,
  getNamazRecitationBlocksForGuidePose,
  type RecitationBlock,
} from "../content/namazLearningContent";
import { NAMAZ_WUDU_EXTENDED } from "../content/namazWuduExtended";
import { NAMAZ_WUDU_VISUAL_STEPS } from "../content/namazWuduSteps";
import { GuideImageLightbox } from "../components/GuideImageLightbox";
import { GuideAccordionSection } from "../components/GuideAccordion";
import {
  NamazGuidePoseRecitationBlocks,
  NamazGuideWuduLearningBlock,
} from "../components/NamazGuideLearning";
import { imageAssetAspectRatio } from "../utils/imageAssetAspect";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";

const WUDU_THEORY_ACC_KEY = "wudu-theory";
const NAMAZ_IMAGE_THUMB_RESIZE_MULTIPLIER = Platform.OS === "android" ? 0.45 : undefined;
const NAMAZ_IMAGE_THUMB_MAX_HEIGHT_RATIO = 0.34;
type NamazPrimarySectionKey = "wudu" | "five-prayers";

type NamazStudyCard = {
  key: string;
  no: number;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  body: string;
};

type FivePrayerRakatRow = {
  key: string;
  title: string;
  time: string;
  rakats: string[];
};

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

const FIVE_PRAYER_RAKAT_ROWS: FivePrayerRakatRow[] = [
  {
    key: "fajr",
    title: "Таң намазы",
    time: "Күн шығардан бұрын",
    rakats: ["2 рәкәт сүннет муәккәд", "2 рәкәт парыз"],
  },
  {
    key: "dhuhr",
    title: "Бесін намазы",
    time: "Күн тас төбеден ауғаннан кейін",
    rakats: ["4 рәкәт алғашқы сүннет", "4 рәкәт парыз", "2 рәкәт соңғы сүннет"],
  },
  {
    key: "asr",
    title: "Екінті намазы",
    time: "Бесін уақыты шыққаннан кейін",
    rakats: ["4 рәкәт парыз"],
  },
  {
    key: "maghrib",
    title: "Ақшам намазы",
    time: "Күн батқаннан кейін",
    rakats: ["3 рәкәт парыз", "2 рәкәт сүннет"],
  },
  {
    key: "isha",
    title: "Құптан намазы",
    time: "Ақшам уақыты шыққаннан кейін",
    rakats: ["4 рәкәт парыз", "2 рәкәт сүннет", "3 рәкәт үтір уәжіп"],
  },
];

const FIVE_PRAYER_RAKAT_SUMMARY = [
  "Барлығы: 17 рәкәт парыз.",
  "Үтір: 3 рәкәт уәжіп.",
  "Бекітілген сүннет: 12 рәкәт.",
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
  const { tr, translated } = useKkAutoTranslator();
  const [selectedPrimarySection, setSelectedPrimarySection] = useState<NamazPrimarySectionKey | null>(null);
  const visualSteps: { title: string; desc: string; image: ImageSourcePropType }[] = [
    {
      title: "Ниет және алғашқы тәкбір",
      desc: "Намазды ниетпен бастап, қол көтеріп «Аллаһу әкбар» деу",
      image: require("../../assets/namaz/namaz_takbir_tahreema.png"),
    },
    {
      title: "Қиям",
      desc: "Тік тұрып, Субханака, Фатиха және қысқа сүре оқу",
      image: require("../../assets/namaz/namaz_qiyam.png"),
    },
    {
      title: "Рукуғ",
      desc: "Белді түзу иіп, зікір айту",
      image: require("../../assets/namaz/namaz_ruku.png"),
    },
    {
      title: "Сәжде",
      desc: "Екі сәжде және дұға",
      image: require("../../assets/namaz/namaz_sajdah.png"),
    },
    {
      title: "Соңғы отырыс",
      desc: "Әттахият, салауат, дұға және сәлем",
      image: require("../../assets/namaz/namaz_final_sitting_custom.png"),
    },
  ];

  const jamaatGuideBody = useMemo(
    () => NAMAZ_GUIDE_SECTIONS.find((s) => s.title === "VIII. Жамағат пен имамға ілесу")?.body ?? "",
    []
  );
  const travelGuideBody = useMemo(
    () => NAMAZ_GUIDE_SECTIONS.find((s) => s.title === "IX. Саяхат намазы")?.body ?? "",
    []
  );
  const janazaGuideBody = useMemo(
    () => NAMAZ_GUIDE_SECTIONS.find((s) => s.title === "XIII. Жаназа намазы")?.body ?? "",
    []
  );
  const prayerTypeCards = useMemo<NamazStudyCard[]>(
    () => [
      {
        key: "jamaat",
        no: 3,
        title: "Жамағат намазы",
        subtitle: "Имамға ілесу, сап, жұма",
        image: require("../../assets/namaz/namaz_jamaat.png"),
        body: jamaatGuideBody,
      },
      {
        key: "janaza",
        no: 4,
        title: "Жаназа намазы",
        subtitle: "Тәкбірлер, дұға, сәлем",
        image: require("../../assets/namaz/namaz_janaza.png"),
        body: janazaGuideBody,
      },
      {
        key: "travel",
        no: 5,
        title: "Сапар намазы",
        subtitle: "Қаср, жолдағы тәртіп",
        image: require("../../assets/namaz/namaz_takbir_tahreema.png"),
        body: travelGuideBody,
      },
      {
        key: "dhuha",
        no: 6,
        title: "Дұха намазы",
        subtitle: "Күн көтерілгеннен кейінгі нәпіл",
        image: require("../../assets/namaz/namaz_qiyam.png"),
        body:
          "Дұха намазы — күн найза бойы көтерілгеннен кейін, бесінге дейін оқылатын нәпіл намаз.\n\n" +
          "Қысқаша: 2 рәкәттен бастап оқылады; мүмкіндігіне қарай 4, 6 немесе 8 рәкәт етіп оқуға болады. Әр 2 рәкәттен кейін сәлем беру ыңғайлы.\n\n" +
          "Ниет: «Алла разылығы үшін дұха намазын оқуға ниет еттім» деп жүрекпен ниет ету.\n\n" +
          "Ескерту: нақты уақытын жергілікті күн шығу кестесімен және ұстаз нұсқауымен нақтылаңыз.",
      },
      {
        key: "tahajjud",
        no: 7,
        title: "Тәһәжжуд намазы",
        subtitle: "Түнгі нәпіл, дұға уақыты",
        image: require("../../assets/namaz/namaz_sajdah.png"),
        body:
          "Тәһәжжуд — түнде ұйқыдан кейін тұрып оқылатын нәпіл намаз. Бұл намазда асықпай оқу, дұға мен истиғфарды көбейту абзал.\n\n" +
          "Қысқаша: 2 рәкәттен бастап оқылады; шамасы келгенше 2–8 рәкәт оқуға болады. Соңынан витр оқылса, витрдің уақытын ұстазбен нақтылаңыз.\n\n" +
          "Ниет: «Алла разылығы үшін түнгі тәһәжжуд намазын оқуға ниет еттім» деп жүрекпен ниет ету.\n\n" +
          "Кеңес: аз болса да тұрақты оқу — ең пайдалы жол.",
      },
      {
        key: "tawba",
        no: 8,
        title: "Тәубе намазы",
        subtitle: "Күнәдан қайтып, кешірім тілеу",
        image: require("../../assets/namaz/namaz_sajdah.png"),
        body:
          "Тәубе намазы — пенде қателігін сезіп, Алладан кешірім сұрағанда оқылатын нәпіл намаз.\n\n" +
          "Не үшін оқылады: жүректі жұмсарту, күнәдан қайтуға бекіну, истиғфарды көбейту үшін.\n\n" +
          "Қалай оқылады: дәрет алып, 2 рәкәт нәпіл намаз оқылады. Әр рәкәтте Фатиха және қысқа сүре оқылады. Сәлемнен кейін шын жүрекпен тәубе етіп, «Астағфируллаһ» деп истиғфар айту, күнәні қайталамауға ниет ету керек.\n\n" +
          "Маңызды: тәубенің шарты — күнәні тоқтату, өкіну және қайталамауға бекіну; кісі ақысы болса, ақысын өтеу.",
      },
      {
        key: "hajat",
        no: 9,
        title: "Қажет намазы",
        subtitle: "Мұқтаждық, тілек, қиын іс",
        image: require("../../assets/namaz/namaz_qiyam.png"),
        body:
          "Қажет намазы — адам Алладан бір ісінің жеңілдеуін, халал тілегінің орындалуын сұрағанда оқылатын нәпіл намаз.\n\n" +
          "Не үшін оқылады: қиындықта, маңызды шешім алдында, ризық, ем, отбасы немесе оқу-жұмыс мәселесінде Алладан жәрдем сұрау үшін.\n\n" +
          "Қалай оқылады: әдетте 2 рәкәт нәпіл намаз оқылады. Сәлемнен кейін Аллаға мадақ, Пайғамбарға ﷺ салауат айтып, өз қажетіңізді дұға етіп сұрайсыз.\n\n" +
          "Кеңес: тілек адал болуы керек; себептерін жасап, нәтижесін Аллаға тапсырыңыз.",
      },
      {
        key: "istikharah",
        no: 10,
        title: "Истихара намазы",
        subtitle: "Таңдау алдында жақсылық сұрау",
        image: require("../../assets/namaz/namaz_final_sitting_custom.png"),
        body:
          "Истихара — екі істің бірін таңдау қиын болғанда Алладан қайырлысын сұрау намазы.\n\n" +
          "Не үшін оқылады: үйлену, жұмыс, көшу, оқу, келісім сияқты маңызды шешімдерде қайырлы бағыт сұрау үшін.\n\n" +
          "Қалай оқылады: парыз емес уақытта 2 рәкәт нәпіл намаз оқылады. Сәлемнен кейін истихара дұғасы оқылып, қай істің қайырлы екенін Алладан сұрайсыз. Дұғадан кейін жүрек тыныштығы, жағдайдың жеңілдеуі және ақылдасуға мән беріледі.\n\n" +
          "Ескерту: түс көру шарт емес. Истихарамен бірге ақылдасу, ақпарат жинау және адал себеп жасау қажет.",
      },
      {
        key: "tahiyyat-masjid",
        no: 11,
        title: "Тахиятул-мәсжид",
        subtitle: "Мешітке кіргендегі сәлем намазы",
        image: require("../../assets/namaz/namaz_takbir_tahreema.png"),
        body:
          "Тахиятул-мәсжид — мешітке кіргенде, отырмай тұрып оқылатын 2 рәкәт нәпіл намаз.\n\n" +
          "Не үшін оқылады: мешітті құрметтеу, жүректі құлшылыққа дайындау және Алланың үйіне әдеппен кіру үшін.\n\n" +
          "Қалай оқылады: мешітке кіріп, намаз оқуға тыйым салынған уақыт болмаса, 2 рәкәт оқылады. Егер жамағат парызға тұрып кеткен болса, сол парызға қосылу жеткілікті болады.\n\n" +
          "Кеңес: мешіт әдебі бөліміндегі кірер/шығар дұғаларын бірге жаттап алыңыз.",
      },
      {
        key: "awwabin",
        no: 12,
        title: "Әууәбин намазы",
        subtitle: "Ақшамнан кейінгі нәпіл",
        image: require("../../assets/namaz/namaz_qiyam.png"),
        body:
          "Әууәбин намазы — ақшам намазынан кейін оқылатын нәпіл намаздардың бірі.\n\n" +
          "Не үшін оқылады: кешкі уақытта тәубе, шүкір және қосымша құлшылықты көбейту үшін.\n\n" +
          "Қалай оқылады: ақшамның парызы мен сүннетінен кейін 2 рәкәттен бастап оқуға болады; кей кітаптарда 6 рәкәтке дейін айтылған. Әр 2 рәкәттен кейін сәлем беру ыңғайлы.\n\n" +
          "Ескерту: нақты рәкәт саны мен әдетін жергілікті ұстаздан нақтылап алыңыз.",
      },
      {
        key: "tarawih",
        no: 13,
        title: "Тарауих намазы",
        subtitle: "Рамазан түніндегі сүннет",
        image: require("../../assets/namaz/namaz_jamaat.png"),
        body:
          "Тарауих — Рамазан айында құптаннан кейін, үтірден бұрын оқылатын түнгі сүннет намаз.\n\n" +
          "Не үшін оқылады: Рамазан түндерін құлшылықпен өткізу, Құран тыңдау, жамағатпен рухани тәрбие алу үшін.\n\n" +
          "Қалай оқылады: мешітте имаммен жамағат болып немесе үйде оқуға болады. Көп жерде 20 рәкәт оқылады; 2 рәкәт сайын сәлем беріледі. Соңынан үтір намазы оқылады.\n\n" +
          "Кеңес: мешіт кестесіне ілесіп, шаршасаңыз да тұрақты қатысуға тырысыңыз; денсаулық пен отбасы жағдайын да ескеріңіз.",
      },
    ],
    [jamaatGuideBody, janazaGuideBody, travelGuideBody]
  );

  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({});
  const [selectedPrayerCard, setSelectedPrayerCard] = useState<NamazStudyCard | null>(null);
  const closeOpenNamazPanel = useCallback(() => {
    if (selectedPrayerCard) {
      setSelectedPrayerCard(null);
      return true;
    }
    if (selectedPrimarySection) {
      setSelectedPrimarySection(null);
      return true;
    }
    return false;
  }, [selectedPrayerCard, selectedPrimarySection]);
  useHardwareBackPress(closeOpenNamazPanel, selectedPrimarySection != null || selectedPrayerCard != null);
  const toggleAcc = (key: string) => setAccOpen((o) => ({ ...o, [key]: !o[key] }));

  const primarySectionTitle =
    selectedPrimarySection === "wudu"
      ? "1. Дәрет"
      : selectedPrimarySection === "five-prayers"
        ? "2. 5 уақыт намаз"
        : "";
  const primarySectionSub =
    selectedPrimarySection === "wudu"
      ? "Қадамдар және бұзылу"
      : selectedPrimarySection === "five-prayers"
        ? "Ниеттен сәлемге дейін"
        : "";

  const renderWuduContent = () => (
    <View style={styles.wuduExpanded}>
      <Text style={styles.unifiedIntro}>{tr(kk.namazGuide.wuduStepsIntro)}</Text>
      <Text style={styles.imageHint}>{tr(kk.namazGuide.imageTapHint)}</Text>

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
      <View style={styles.manualNamazPage}>
        <View style={styles.manualPageHeader}>
          <Text style={styles.manualPageEyebrow}>{tr("Намаз оқулығы")}</Text>
          <Text style={styles.manualPageTitle}>{tr("5 уақыт намаздың рәкәттері мен оқу реті")}</Text>
          <Text style={styles.manualPageLead}>
            {tr("Рәкәт реті сурет емес, қолданба бетіне мәтін болып жазылды. Тіл ауысқанда осы кесте де бірге аударылады.")}
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
      <Text style={styles.unifiedIntro}>{tr(kk.namazGuide.unifiedNamazIntro)}</Text>
      <Text style={styles.imageHint}>{tr(kk.namazGuide.imageTapHint)}</Text>

      {visualSteps.map((v) => {
        const poseKey = `pose-${v.title}`;
        const recBlocks = getNamazRecitationBlocksForGuidePose(v.title);
        const learnHints = getNamazLearningHintsForGuidePose(v.title);
        const isJamaat = v.title === "Жамағат";
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
              {(learnHints?.actions ?? []).map((a, i) => (
                <Text key={`${v.title}-act-${i}`} style={styles.namazPoseLearningLine}>
                  {tr(a)}
                </Text>
              ))}
              {(learnHints?.hints ?? []).map((h, i) => (
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
              ) : isJamaat && jamaatGuideBody ? (
                <View style={styles.stepReciteBox}>
                  <Text style={styles.stepReciteLine}>{tr(jamaatGuideBody)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      <View style={[styles.visualStepCard, { marginBottom: 14 }]}>
        <View style={styles.unifiedStepHead}>
          <Text style={styles.unifiedStepTitle}>{tr("Намаз соңында оқылатын дұғалар")}</Text>
        </View>
        <View style={styles.visualStepCardBody}>
          <Text style={styles.stepShortExplain}>
            {tr("Реті: алдымен Аят әл-Курси, кейін Құнт дұғасын жаттауға ыңғайлы мәтін ретінде оқыңыз.")}
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
      <Text style={styles.intro}>{tr(kk.namazGuide.intro)}</Text>

      <View style={styles.studyMap}>
        <Text style={styles.studyMapTitle}>{tr("Оқу картасы")}</Text>
        <Text style={styles.studyMapHint}>{tr("Бөлімді таңдаңыз. Алдымен дәрет, кейін намаз қадамдарын оқыңыз.")}</Text>
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
            <Text style={styles.studyMapCardTitle}>{tr("Дәрет")}</Text>
            <Text style={styles.studyMapCardSub}>
              {tr("Қадамдар және бұзылу")}
            </Text>
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
            <Text style={styles.studyMapCardTitle}>
              {tr("5 уақыт намаз")}
            </Text>
            <Text style={styles.studyMapCardSub}>
              {tr("Ниеттен сәлемге дейін")}
            </Text>
          </Pressable>
          {prayerTypeCards.map((card) => {
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
                  <Text style={styles.studyMapCardTitle}>{tr(card.title)}</Text>
                  <Text style={styles.studyMapCardSub}>{tr(card.subtitle)}</Text>
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
      onRequestClose={() => setSelectedPrimarySection(null)}
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => setSelectedPrimarySection(null)}
            style={({ pressed }) => [styles.modalBackBtn, pressed && { opacity: 0.82 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
          >
            <Text style={styles.modalBackTxt}>←</Text>
          </Pressable>
          <View style={styles.modalTitleCol}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {tr(primarySectionTitle)}
            </Text>
            <Text style={styles.modalSub} numberOfLines={1}>
              {tr(primarySectionSub)}
            </Text>
          </View>
        </View>
        {selectedPrimarySection ? (
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
    >
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => setSelectedPrayerCard(null)}
            style={({ pressed }) => [styles.modalBackBtn, pressed && { opacity: 0.82 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
          >
            <Text style={styles.modalBackTxt}>←</Text>
          </Pressable>
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
                <Text style={styles.stepShortExplain}>{tr(selectedPrayerCard.subtitle)}</Text>
                <View style={styles.stepReciteBox}>
                  <Text style={styles.stepReciteLine}>{tr(selectedPrayerCard.body)}</Text>
                </View>
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
    modalContent: { padding: 14, paddingBottom: 40 },
    intro: {
      color: colors.muted,
      marginBottom: 16,
      lineHeight: 22,
      fontSize: 14,
      backgroundColor: colors.accentSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
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
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    studyMapTextCol: {
      flex: 1,
      minWidth: 0,
    },
    studyMapCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    studyMapBadge: {
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
    },
    studyMapCardTitleActive: { color: "#FFFFFF" },
    studyMapCardSub: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
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
