import {
  KURBAN_AIT_GUIDE_SECTIONS,
  type KurbanAitGuideSection,
} from "./kurbanAitGuideContent";

export type KurbanAitDashboardTopic = {
  id: string;
  title: string;
  subtitle?: string;
};

const EXTRA_TOPICS: KurbanAitDashboardTopic[] = [
  {
    id: "phrases",
    title: "Қазақы құттықтау сөздері",
    subtitle: "Айт құтты болсын, оразаңыз қабыл болсын…",
  },
  {
    id: "dayplan",
    title: "Күн бойынша жоспар",
    subtitle: "Айттың алдындағы күн, айт күні, кейінгі күндер",
  },
];

export function getKurbanAitDashboardTopics(): KurbanAitDashboardTopic[] {
  const fromSections: KurbanAitDashboardTopic[] = KURBAN_AIT_GUIDE_SECTIONS.map(
    (s: KurbanAitGuideSection) => ({
      id: s.id,
      title: s.title,
      subtitle: s.lead,
    })
  );
  return [...fromSections, ...EXTRA_TOPICS];
}
