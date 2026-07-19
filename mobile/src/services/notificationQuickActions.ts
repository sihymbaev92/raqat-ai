import { Linking, Platform } from "react-native";
import { kk } from "../i18n/kk";
import { navigateToMoreStackScreen } from "../navigation/navigateToMoreStack";
import { rootNavigationRef } from "../navigation/rootNavigationRef";

const CATEGORY_ID = "raqat_quick_actions_v1";
const ACTION_OPEN_KNOWLEDGE = "open_knowledge_portal";
const KNOWLEDGE_DEEP_LINK = "raqat://more/knowledge";

let removeListener: (() => void) | null = null;
let pendingKnowledgeOpen = false;
let navReadyPoll: ReturnType<typeof setInterval> | null = null;

function clearNavReadyPoll(): void {
  if (navReadyPoll) {
    clearInterval(navReadyPoll);
    navReadyPoll = null;
  }
}

function openKnowledgePortalNow(): boolean {
  if (rootNavigationRef.isReady()) {
    navigateToMoreStackScreen("OfficialKnowledgePortal");
    return true;
  }
  return false;
}

function scheduleKnowledgePortalOpen(): void {
  if (openKnowledgePortalNow()) return;
  pendingKnowledgeOpen = true;
  if (navReadyPoll) return;
  let attempts = 0;
  navReadyPoll = setInterval(() => {
    attempts += 1;
    if (openKnowledgePortalNow()) {
      pendingKnowledgeOpen = false;
      clearNavReadyPoll();
      return;
    }
    if (attempts >= 40) {
      clearNavReadyPoll();
      pendingKnowledgeOpen = false;
      void Linking.openURL(KNOWLEDGE_DEEP_LINK).catch(() => {});
    }
  }, 250);
}

function handleQuickAction(actionId?: string) {
  if (actionId !== ACTION_OPEN_KNOWLEDGE) return;
  scheduleKnowledgePortalOpen();
}

/** NavigationContainer.onReady — cold-start quick action replay. */
export function flushPendingNotificationQuickActions(): void {
  if (!pendingKnowledgeOpen) return;
  if (openKnowledgePortalNow()) {
    pendingKnowledgeOpen = false;
    clearNavReadyPoll();
  }
}

export async function initNotificationQuickActions(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await import("expo-notifications");
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_OPEN_KNOWLEDGE,
      buttonTitle: kk.knowledgePortal.notifQuickActionSearchFatwa,
      options: {
        opensAppToForeground: true,
      },
    },
  ]);

  const last = await Notifications.getLastNotificationResponseAsync();
  if (last) {
    handleQuickAction(last.actionIdentifier);
  }

  if (!removeListener) {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      handleQuickAction(resp.actionIdentifier);
    });
    removeListener = () => sub.remove();
  }
}

export function getQuickActionCategoryId(): string {
  return CATEGORY_ID;
}
