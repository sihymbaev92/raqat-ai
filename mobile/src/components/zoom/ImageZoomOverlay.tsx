import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ImageSourcePropType } from "react-native";
import { ZoomableImageContent } from "./ZoomableImageContent";
import { kk } from "../../i18n/kk";

type Props = {
  visible: boolean;
  source: ImageSourcePropType;
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
  closeLabel?: string;
  pinchHint?: string;
};

export function ImageZoomOverlay({
  visible,
  source,
  imageWidth,
  imageHeight,
  onClose,
  closeLabel = kk.common.closeImageZoom,
  pinchHint = kk.common.imagePinchZoomHint,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated={Platform.OS === "android"}
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: 8 + insets.top }]}>
          <Pressable
            oyuBackdrop={false}
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
            <Text style={styles.closeTxt}>{closeLabel}</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { top: 12 + insets.top }]} pointerEvents="none">
          {pinchHint}
        </Text>
        <View style={[styles.imageArea, { width, height: height * 0.82 }]}>
          <ZoomableImageContent source={source} width={imageWidth} height={imageHeight} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 4,
    zIndex: 2,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  hint: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 2,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  imageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
