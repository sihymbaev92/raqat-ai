import { Platform } from "react-native";
import { navigateToMoreStackScreen } from "../navigation/navigateToMoreStack";

const CATEGORY_ID = "raqat_quick_actions_v1";
const ACTION_OPEN_AI = "open_raqat_ai";

let removeListener: (() => void) | null = null;

function handleQuickAction(actionId?: string) {
  if (actionId !== ACTION_OPEN_AI) return;
  navigateToMoreStackScreen("ImamAI");
}

export async function initNotificationQuickActions(): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await import("expo-notifications");
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_OPEN_AI,
      buttonTitle: "RAQAT · көмекші",
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
