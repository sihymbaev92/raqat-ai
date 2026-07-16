import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppLocale } from "../i18n/runtime";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { MakkahLiveHlsPlayer } from "../components/MakkahLiveHlsPlayer";
import { appBottomSafeInset, useDeviceSafeAreaInsets } from "../theme/deviceSafeArea";

type Props = NativeStackScreenProps<MoreStackParamList, "MakkahLive">;

/**
 * Қағба тікелей эфир.
 * Кара фон safe-area аймағына дейін жағады, бірақ мәтін/батырмалар кесілмейді
 * (margin + қайтармалы padding үлгісі).
 */
export function MakkahLiveScreen({ navigation }: Props) {
  useAppLocale();
  const deviceInsets = useDeviceSafeAreaInsets();
  const bottomInset = appBottomSafeInset(deviceInsets);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <View
      style={[
        styles.root,
        fullscreen
          ? styles.rootFullscreen
          : {
              marginTop: -deviceInsets.top,
              marginBottom: -bottomInset,
              paddingTop: deviceInsets.top,
              paddingBottom: bottomInset,
            },
      ]}
    >
      <StatusBar style="light" backgroundColor="#000" />
      <MakkahLiveHlsPlayer
        title={kk.features.kaabaLiveTitle}
        backLabel={kk.common.back}
        loadingLabel={kk.features.kaabaLiveHlsLoading}
        errorLabel={kk.features.kaabaLiveHlsError}
        retryLabel={kk.features.kaabaLiveHlsRetry}
        expandLabel={kk.features.kaabaLiveExpand}
        collapseLabel={kk.features.kaabaLiveCollapse}
        onBack={() => navigation.goBack()}
        onFullscreenChange={setFullscreen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  rootFullscreen: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
