import React, { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QiblaSensorProvider } from "./src/context/QiblaSensorContext";
import { raqatLinking } from "./src/navigation/linking";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { rootNavigationRef } from "./src/navigation/rootNavigationRef";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { VoiceAssistantProvider } from "./src/components/voice/VoiceAssistantContext";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { setRootNavReady, setRootNavState } from "./src/voice/rootNavStateStore";
import { hydrateRaqatApiBaseOverride } from "./src/config/raqatApiBase";
import { initNotificationQuickActions } from "./src/services/notificationQuickActions";

export default function App() {
  useEffect(() => {
    void hydrateRaqatApiBaseOverride();
    void initNotificationQuickActions();
  }, []);

  return (
    <View testID="raqat-app-root" style={{ flex: 1 }}>
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <VoiceAssistantProvider>
            {/**
             * Qibla — Nav ішінде: onReady/ state алдында үстімен тұрмайды, іске қосу/«қатты қатып»
             * кідірісі азаяды.
             */}
            <NavigationContainer
              ref={rootNavigationRef}
              linking={raqatLinking}
              onReady={() => {
                setRootNavReady(true, rootNavigationRef.getRootState() ?? undefined);
              }}
              onStateChange={(state) => {
                setRootNavState(state);
              }}
            >
              <QiblaSensorProvider>
                <RootNavigator />
              </QiblaSensorProvider>
            </NavigationContainer>
            <StatusBar style="auto" />
          </VoiceAssistantProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
    </View>
  );
}
