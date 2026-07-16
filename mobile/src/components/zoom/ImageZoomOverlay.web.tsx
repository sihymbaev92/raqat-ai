import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createPortal } = require("react-dom") as {
  createPortal: (children: React.ReactNode, container: Element) => React.ReactNode;
};
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ZoomableImageContent } from "./ZoomableImageContent";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";

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
  useAppLocale();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <View style={[styles.root, { width, height }]} accessibilityViewIsModal>
      <Pressable
        oyuBackdrop={false}
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      />
      <View style={[styles.topBar, { paddingTop: 8 + insets.top }]} pointerEvents="box-none">
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
      <View style={styles.imageArea} pointerEvents="box-none">
        <ZoomableImageContent source={source} width={imageWidth} height={imageHeight} />
      </View>
    </View>,
    document.body
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2147483000,
    backgroundColor: "rgba(0,0,0,0.94)",
    flexDirection: "column",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
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
    zIndex: 1,
  },
});
