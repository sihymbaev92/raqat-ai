import type { ImageSourcePropType } from "react-native";
import type { TraditionTopicCategory } from "./kazakhTraditionTopicStats";

export type TraditionAudioBlessing = {
  id: string;
  topicId?: string;
  title: string;
  duration: string;
  text: string;
  sourceLabel: string;
};

export type TraditionTopic = {
  id: string;
  title: string;
  subtitle: string;
  categories: TraditionTopicCategory[];
  summary: string;
  origin: string;
  religionLink: string;
  howTo: string[];
  blessing: string;
  quote: string;
  image: ImageSourcePropType;
  audioIds: string[];
  articleIds: string[];
};

export type TraditionArticle = {
  id: string;
  topicId?: string;
  title: string;
  source: string;
  excerpt: string;
  tag: string;
  url?: string;
};
