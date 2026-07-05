import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { CorePermissionsGateScreen } from "../screens/CorePermissionsGateScreen";
import {
  areCorePermissionsSatisfied,
  onCorePermissionsGranted,
} from "../services/corePermissions";

type Props = {
  children: React.ReactNode;
};

/**
 * Негізгі қолданбаға өтпес бұрын: орын, азан, батарея рұқсаттары міндетті.
 * Рұқсат алынғаннан кейін ғана children көрсетіледі; кейін қайта алынса — қайта осы экран.
 */
export function CorePermissionsAppGate({ children }: Props) {
  const { colors } = useAppTheme();
  const [satisfied, setSatisfied] = useState<boolean | null>(Platform.OS === "web" ? true : null);

  const recheck = useCallback(async () => {
    if (Platform.OS === "web") {
      setSatisfied(true);
      return;
    }
    const ok = await areCorePermissionsSatisfied();
    if (ok) {
      await onCorePermissionsGranted();
    }
    setSatisfied(ok);
  }, []);

  useEffect(() => {
    void recheck();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void recheck();
    });
    return () => sub.remove();
  }, [recheck]);

  if (satisfied === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!satisfied) {
    return <CorePermissionsGateScreen onSatisfied={() => void recheck()} />;
  }

  return <>{children}</>;
}
