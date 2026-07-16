/** KazakhTraditionScreen — салт-дәстүр тақырыптарының саны. */
export const TRADITION_TOPIC_BLOCK_COUNT = 38;

export type TraditionTopicCategory = "family" | "social" | "ceremony" | "faith";

export const TRADITION_TOPIC_COUNT_BY_CATEGORY: Record<TraditionTopicCategory, number> = {
  family: 28,
  social: 24,
  ceremony: 15,
  faith: 28,
};
