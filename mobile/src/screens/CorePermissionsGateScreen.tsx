import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { layout } from "../theme/layout";
import { kk } from "../i18n/kk";
import {
  getCorePermissionSnapshot,
  requestNextCorePermission,
  type CorePermissionStep,
} from "../services/corePermissions";

const ACTIVE_PROMPT_DEBOUNCE_MS = 400;
const PROMPT_BUSY_SAFETY_MS = 18_000;

type Props = {
  onSatisfied: () => void;
};

function stepIcon(step: CorePermissionStep | null): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (step) {
    case "location":
      return "map-marker-radius";
    case "notifications":
      return "bell-ring";
    case "exactAlarm":
      return "alarm";
    case "fullScreenIntent":
      return "cellphone-lock";
    case "battery":
      return "battery-heart-variant";
    default:
      return "shield-check";
  }
}

export function CorePermissionsGateScreen({ onSatisfied }: Props) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [currentStep, setCurrentStep] = useState<CorePermissionStep | null>(null);
  const [busy, setBusy] = useState(false);
  const promptingRef = useRef(false);
  const lastPromptAtRef = useRef(0);
  const busySafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBusy = useCallback(() => {
    if (busySafetyRef.current) {
      clearTimeout(busySafetyRef.current);
      busySafetyRef.current = null;
    }
    setBusy(false);
    promptingRef.current = false;
    lastPromptAtRef.current = Date.now();
  }, []);

  const refreshStep = useCallback(async () => {
    const snap = await getCorePermissionSnapshot();
    if (snap.allSatisfied) {
      onSatisfied();
      return true;
    }
    setCurrentStep(snap.missing[0] ?? null);
    return false;
  }, [onSatisfied]);

  const promptNext = useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    setBusy(true);
    busySafetyRef.current = setTimeout(() => clearBusy(), PROMPT_BUSY_SAFETY_MS);
    try {
      const step = await requestNextCorePermission();
      if (step === "done") {
        await refreshStep();
        return;
      }
      setCurrentStep(step);
      await refreshStep();
    } finally {
      clearBusy();
    }
  }, [clearBusy, refreshStep]);

  useEffect(() => {
    void refreshStep();
  }, [refreshStep]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      if (Date.now() - lastPromptAtRef.current < ACTIVE_PROMPT_DEBOUNCE_MS) return;
      void refreshStep();
    });
    return () => sub.remove();
  }, [refreshStep]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      ToastAndroid.show(kk.corePermissions.backBlocked, ToastAndroid.SHORT);
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(
    () => () => {
      if (busySafetyRef.current) clearTimeout(busySafetyRef.current);
    },
    []
  );

  const stepLabel =
    currentStep != null ? kk.corePermissions.steps[currentStep] : kk.corePermissions.title;

  return (
    <View style={styles.root} accessibilityLabel={kk.corePermissions.title}>
      <View style={styles.card}>
        <MaterialCommunityIcons name={stepIcon(currentStep)} size={44} color={colors.accent} />
        <Text style={styles.title}>{kk.corePermissions.title}</Text>
        <Text style={styles.step}>{stepLabel}</Text>
        <Pressable
          style={({ pressed }) => [styles.btn, (pressed || busy) && { opacity: 0.9 }]}
          onPress={() => void promptNext()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={kk.corePermissions.grant}
          accessibilityState={{ busy }}
        >
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.btnTxt}>{kk.corePermissions.grant}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "center",
      padding: layout.screenPadding,
      backgroundColor: colors.bg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: layout.radiusLg,
      padding: layout.gapLg + 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      gap: layout.gapMd,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
    },
    step: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: layout.bodyLineHeight,
      textAlign: "center",
    },
    btn: {
      marginTop: layout.gapSm,
      backgroundColor: colors.accent,
      paddingVertical: layout.gapMd + 2,
      paddingHorizontal: layout.gapLg,
      borderRadius: layout.radiusMd,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 220,
      minHeight: 48,
    },
    btnTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  });
}
