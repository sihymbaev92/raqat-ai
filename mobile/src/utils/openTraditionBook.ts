import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Linking } from "react-native";
import { KAZAKH_TRADITION_EID_KURBAN_BLOCK_TITLE } from "../content/kazakhTraditionAnchors";
import { getTraditionTopicByTitle } from "../content/traditionTopicsCatalog";
import type { TraditionBookEntry } from "../content/traditionBooksCatalog";
import {
  navigateToMainTabScreen,
  navigateToMoreStackScreen,
  navigateToRootStackScreen,
  type StackNavLike,
} from "../navigation/navigateToMoreStack";
import type { MoreStackParamList } from "../navigation/types";
import { kk } from "../i18n/kk";

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export type OpenTraditionBookOpts = {
  scrollToBlockTitle?: (title: string) => void;
  scrollToTopics?: () => void;
  scrollToTopicsCategory?: (category: "family" | "social" | "ceremony" | "faith") => void;
};

export function openTraditionBook(nav: Nav, book: TraditionBookEntry, opts?: OpenTraditionBookOpts) {
  const action = book.action;
  const navLike = nav as unknown as StackNavLike;
  if (action.kind === "screen") {
    navigateToMoreStackScreen(action.screen, action.params, navLike);
    return;
  }
  if (action.kind === "rootScreen") {
    navigateToRootStackScreen(action.screen, action.params, navLike);
    return;
  }
  if (action.kind === "mainTab") {
    navigateToMainTabScreen(action.tab, action.params, navLike);
    return;
  }
  if (action.kind === "scrollBlock") {
    if (action.blockTitle === KAZAKH_TRADITION_EID_KURBAN_BLOCK_TITLE) {
      nav.navigate("KurbanAit");
      return;
    }
    const topic = getTraditionTopicByTitle(action.blockTitle);
    if (topic) {
      nav.navigate("KazakhTraditionTopicDetail", { topicId: topic.id });
      return;
    }
    opts?.scrollToBlockTitle?.(action.blockTitle);
    return;
  }
  if (action.kind === "scrollTopicsCategory") {
    opts?.scrollToTopicsCategory?.(action.category);
    return;
  }
  if (action.kind === "scrollTopics") {
    opts?.scrollToTopics?.();
    return;
  }
  if (action.kind === "externalUrl") {
    void Linking.openURL(action.url).catch(() => {
      Alert.alert(kk.common.error, action.url);
    });
  }
}
