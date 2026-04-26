import React, { useEffect, useState } from "react";
import { Platform, Pressable, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeContext";
import { kk } from "../../i18n/kk";
import { useVoiceAssistant } from "./voiceAssistantCore";
import {
  getRootNavReady,
  getRootNavState,
  subscribeRootNavState,
} from "../../voice/rootNavStateStore";
import { deriveGlobalVoiceEntryLayout } from "../../voice/deriveGlobalVoiceEntry";

/**
 * Басты беттен басқа: төмен оң жақта тұрақты микрофон (Siri-стил қолжетімділік).
 *
 * useSyncExternalStore + әр шақырғанда жаңа `{}` → React шексіз қайта-рендер (қара экран).
 * Нави өзгергенде ғана state жаңартады.
 */
export function VoiceAssistantGlobalFab() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { phase, toggleListen } = useVoiceAssistant();

  const [layout, setLayout] = useState(() =>
    deriveGlobalVoiceEntryLayout(getRootNavState(), getRootNavReady())
  );

  useEffect(() => {
    const sync = () => {
      setLayout((prev) => {
        const next = deriveGlobalVoiceEntryLayout(getRootNavState(), getRootNavReady());
        if (prev.showGlobalFab === next.showGlobalFab && prev.bottomInset === next.bottomInset) {
          return prev;
        }
        return next;
      });
    };
    sync();
    return subscribeRootNavState(sync);
  }, []);

  if (Platform.OS === "web" || !layout.showGlobalFab) {
    return null;
  }

  return (
    <Pressable
      onPress={() => void toggleListen()}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: insets.bottom + layout.bottomInset,
          backgroundColor: colors.accentSurfaceStrong,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.92 },
        phase === "listening" && { borderWidth: 2, borderColor: colors.accent },
      ]}
      accessibilityRole="button"
      accessibilityLabel={kk.voiceAssistant.globalFabA11y}
      accessibilityState={{ busy: phase === "listening" || phase === "busy" }}
    >
      {phase === "busy" ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <MaterialIcons
          name="mic"
          size={26}
          color={phase === "listening" ? colors.accent : colors.text}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 150,
    elevation: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  } satisfies ViewStyle,
});
