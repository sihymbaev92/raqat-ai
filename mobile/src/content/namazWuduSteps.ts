import type { ImageSourcePropType } from "react-native";
import type { RecitationBlock } from "./namazLearningContent";
import { NAMAZ_WUDU_LEARNING_MODULES } from "./namazLearningContent";

const WUDU_LEARNING = NAMAZ_WUDU_LEARNING_MODULES.find((m) => m.id === "wudu")!;

export type NamazWuduVisualStep = {
  id: string;
  stepNo: number;
  title: string;
  desc: string;
  actions: string[];
  hints?: string[];
  recitations?: RecitationBlock[];
  image: ImageSourcePropType;
};

/** Ханафи дәрет реті — сурет + қысқа түсіндіру (намаз қадамдары сияқты). */
export const NAMAZ_WUDU_VISUAL_STEPS: NamazWuduVisualStep[] = [
  {
    id: "wudu-step-01-niyyah",
    stepNo: 1,
    title: "Ниет және Бисмиллә",
    desc: "Дәрет алуға жүрекпен ниет етіңіз, «Бисмиллә» деп айтыңыз.",
    actions: [
      "Суды ысырап етпей, таза жерде тұрыңыз.",
      "Ниетті жүрекпен етіңіз — тілмен міндет емес.",
    ],
    hints: ["Суды үнемдеу — сүннет."],
    recitations: WUDU_LEARNING.steps[0]?.recitations,
    image: require("../../assets/namaz/wudu/wudu_step_01_niyyah.png"),
  },
  {
    id: "wudu-step-02-hands",
    stepNo: 2,
    title: "Қолды білекке дейін жуу",
    desc: "Оң қолды үш рет білекке дейін жуып, сол қолды да солай орындаңыз.",
    actions: [
      "Саусақ аралары мен тырнақ астын сумен жуу.",
      "Оңнан бастап, әр жууды үш рет қайталау — сүннет.",
    ],
    image: require("../../assets/namaz/wudu/wudu_step_02_hands.png"),
  },
  {
    id: "wudu-step-03-mouth",
    stepNo: 3,
    title: "Ауызды шаю",
    desc: "Оң қолдағы сумен ауызды үш рет жақсылап шаып, сумен тазалаңыз.",
    actions: ["Тістер арасына дейін су жеткізу.", "Үш рет шаю — сүннет."],
    image: require("../../assets/namaz/wudu/wudu_step_03_mouth.png"),
  },
  {
    id: "wudu-step-04-nose",
    stepNo: 4,
    title: "Мұрынды жуу",
    desc: "Мұрынды сумен үш рет жуып, мұрынды саусақпен жұмсақ тазалаңыз.",
    actions: [
      "Суды мұрынға тартып (истиншақ), содан мұрынды тазалау (истинфар).",
      "Үш рет — сүннет.",
    ],
    image: require("../../assets/namaz/wudu/wudu_step_04_nose.png"),
  },
  {
    id: "wudu-step-05-face",
    stepNo: 5,
    title: "Бетті жуу",
    desc: "Бетті маңдайдан иекке, бір құлақтан екінші құлаққа дейін үш рет жуу.",
    actions: ["Барлық бет тиісті жерлеріне су жетуі керек.", "Үш рет — сүннет."],
    image: require("../../assets/namaz/wudu/wudu_step_05_face.png"),
  },
  {
    id: "wudu-step-06-arm-right",
    stepNo: 6,
    title: "Оң қолды шынтаққа дейін жуу",
    desc: "Оң қолды шынтаққа дейін үш рет жуып, саусақ араларын тазалаңыз.",
    actions: ["Шынтаққа дейін толық жуу.", "Үш рет — сүннет."],
    image: require("../../assets/namaz/wudu/wudu_step_06_arm_right.png"),
  },
  {
    id: "wudu-step-07-arm-left",
    stepNo: 7,
    title: "Сол қолды шынтаққа дейін жуу",
    desc: "Сол қолды шынтаққа дейін үш рет жуу.",
    actions: ["Оң қол сияқты толық жуу.", "Үш рет — сүннет."],
    image: require("../../assets/namaz/wudu/wudu_step_07_arm_left.png"),
  },
  {
    id: "wudu-step-08-head-masah",
    stepNo: 8,
    title: "Басқа мәсіх тарту",
    desc: "Жуылған қолдарды басқа бір рет алғадан артқа сүрту.",
    actions: [
      "Бас шашының аз бөлігіне де су жетуі керек.",
      "Бір рет мәсіх — парыз.",
    ],
    image: require("../../assets/namaz/wudu/wudu_step_08_head_masah.png"),
  },
  {
    id: "wudu-step-09-ears-neck",
    stepNo: 9,
    title: "Құлаққа мәсіх және мойын",
    desc: "Басқа жақсаланған саусақпен құлақ ішіне мәсіх, саусақ артынан мойынды сүрту.",
    actions: [
      "Оң құлақ — оң саусақ, сол — сол саусақ.",
      "Мойынды қол артынан сүрту — сүннет.",
    ],
    image: require("../../assets/namaz/wudu/wudu_step_09_ears_neck.png"),
  },
  {
    id: "wudu-step-10-feet",
    stepNo: 10,
    title: "Екі аяқты тобыққа дейін жуу",
    desc: "Оң аяқты тобыққа дейін үш рет жуып, содан сол аяқты дәл солай.",
    actions: [
      "Саусақ аралары мен тырнақ астына су.",
      "Соңында дәрет дуасын оқыу — сүннет.",
    ],
    recitations: WUDU_LEARNING.steps[2]?.recitations,
    image: require("../../assets/namaz/wudu/wudu_step_10_feet.png"),
  },
];
