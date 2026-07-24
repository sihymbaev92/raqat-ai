/** KazakhTraditionScreen — санат түрі және негізгі тақырып id-лері. */

export type TraditionTopicCategory = "family" | "social" | "ceremony" | "faith";

/** Хабта жеке карточка ретінде шығады — жалпы тізімнен бөлек. */
export const TRADITION_FOUNDATION_TOPIC_IDS = ["dastur-men-din-negiz", "yrymdar-men-din"] as const;

export type TraditionFoundationTopicId = (typeof TRADITION_FOUNDATION_TOPIC_IDS)[number];

export function isTraditionFoundationTopicId(id: string): boolean {
  return (TRADITION_FOUNDATION_TOPIC_IDS as readonly string[]).includes(id);
}
