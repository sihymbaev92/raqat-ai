import {
  getTraditionPracticeLanes,
  getTraditionUnderstandingChecklist,
  getTraditionUnderstandingSteps,
} from "../traditionSystemGuide";
import {
  getRelatedTraditionArticles,
  getRelatedTraditionAudios,
  getTraditionArticleById,
  getTraditionAudioById,
  getTraditionTopicById,
  getTraditionTopics,
} from "../traditionTopicsCatalog";

describe("traditionSystemGuide", () => {
  it("builds four systematic practice lanes with valid topics", () => {
    const lanes = getTraditionPracticeLanes();

    expect(lanes.map((lane) => lane.id).sort()).toEqual(["ceremony", "faith", "family", "social"]);
    for (const lane of lanes) {
      expect(lane.topicCount).toBeGreaterThan(0);
      expect(lane.topicIds.length).toBeGreaterThan(0);
      expect(lane.method.trim().length).toBeGreaterThan(12);
      for (const topicId of lane.topicIds) {
        expect(getTraditionTopicById(topicId)).toBeTruthy();
      }
    }
  });

  it("keeps every tradition topic understandable and actionable", () => {
    for (const topic of getTraditionTopics()) {
      expect(topic.summary.trim().length).toBeGreaterThan(20);
      expect(topic.origin.trim().length).toBeGreaterThan(20);
      expect(topic.religionLink).toContain("Ұштасуы:");
      expect(topic.religionLink).toContain("Шегі:");
      expect(topic.howTo.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("provides a four step understanding checklist", () => {
    const checklist = getTraditionUnderstandingChecklist();
    const steps = getTraditionUnderstandingSteps();

    expect(checklist).toHaveLength(4);
    expect(steps).toHaveLength(4);
    expect(steps.every((step) => step.title && step.body && step.action)).toBe(true);
    expect(checklist.join(" ")).toContain("Мақсаты");
    expect(checklist.join(" ")).toContain("Шегі");
  });

  it("keeps topic audio/article ids resolvable and surfaced", () => {
    for (const topic of getTraditionTopics()) {
      for (const id of topic.audioIds) {
        expect(getTraditionAudioById(id)).toBeTruthy();
      }
      for (const id of topic.articleIds) {
        expect(getTraditionArticleById(id)).toBeTruthy();
      }
      expect(getRelatedTraditionAudios(topic.id).length).toBe(
        topic.id === "bata-beru" ? 100 : topic.audioIds.length
      );
      expect(getRelatedTraditionArticles(topic.id).length).toBe(topic.articleIds.length);
    }
  });
});
