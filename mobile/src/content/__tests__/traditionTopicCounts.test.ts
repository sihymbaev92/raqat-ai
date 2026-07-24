import {
  TRADITION_FOUNDATION_TOPIC_IDS,
  isTraditionFoundationTopicId,
} from "../kazakhTraditionTopicStats";
import {
  TRADITION_LIST_TOPIC_COUNT,
  TRADITION_TOPIC_BLOCK_COUNT,
  TRADITION_TOPIC_COUNT_BY_CATEGORY,
  TRADITION_TOPICS,
} from "../traditionTopicsCatalog";

describe("tradition topic counts", () => {
  it("derives block and list counts from the catalog", () => {
    expect(TRADITION_TOPIC_BLOCK_COUNT).toBe(TRADITION_TOPICS.length);
    expect(TRADITION_TOPIC_BLOCK_COUNT).toBe(38);
    expect(TRADITION_FOUNDATION_TOPIC_IDS).toHaveLength(2);
    expect(TRADITION_LIST_TOPIC_COUNT).toBe(TRADITION_TOPIC_BLOCK_COUNT - 2);
    expect(TRADITION_LIST_TOPIC_COUNT).toBe(36);
    for (const id of TRADITION_FOUNDATION_TOPIC_IDS) {
      expect(isTraditionFoundationTopicId(id)).toBe(true);
      expect(TRADITION_TOPICS.some((t) => t.id === id)).toBe(true);
    }
  });

  it("counts category badges from topic membership", () => {
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.family).toBe(
      TRADITION_TOPICS.filter((t) => t.categories.includes("family")).length
    );
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.social).toBe(
      TRADITION_TOPICS.filter((t) => t.categories.includes("social")).length
    );
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.ceremony).toBe(
      TRADITION_TOPICS.filter((t) => t.categories.includes("ceremony")).length
    );
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.faith).toBe(
      TRADITION_TOPICS.filter((t) => t.categories.includes("faith")).length
    );
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.family).toBe(22);
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.social).toBe(27);
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.ceremony).toBe(22);
    expect(TRADITION_TOPIC_COUNT_BY_CATEGORY.faith).toBe(28);
  });
});
