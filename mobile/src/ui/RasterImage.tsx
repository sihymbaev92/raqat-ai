import React, { useMemo, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageProps,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageZoomOverlay } from "../components/zoom/ImageZoomOverlay";
import { guideLightboxFitSize } from "../utils/guideLightboxFit";
import { imageAssetAspectRatio } from "../utils/imageAssetAspect";
import { kk } from "../i18n/kk";

export type RasterImageProps = ImageProps & {
  /** Басып толық экранда pinch-zoom ашу */
  zoomable?: boolean;
  /** true: тек 🔍 белгісі зум ашады (сыртқы Pressable қақтығыспасын) */
  zoomNested?: boolean;
  hideZoomHint?: boolean;
  zoomCloseLabel?: string;
  zoomOpenA11y?: string;
  zoomHintBorderColor?: string;
  zoomHintBgColor?: string;
  zoomHintIconColor?: string;
};

function resolveModalImageSize(
  source: ImageSourcePropType,
  windowWidth: number,
  windowHeight: number,
  insetTop: number
) {
  const aspect = imageAssetAspectRatio(source);
  if (aspect == null || aspect <= 0) {
    return { width: windowWidth, height: windowHeight * 0.78 };
  }
  return guideLightboxFitSize(windowWidth, windowHeight, insetTop, aspect);
}

/**
 * Android: әдепкі `resize` — bitmap layout өлшеміне software масштабы (иконка/hero үшін анық).
 * `scale` — GPU масштабы; тек animation/transform керек болса беріңіз.
 */
export function RasterImage({
  resizeMethod,
  zoomable = false,
  zoomNested = false,
  hideZoomHint = false,
  zoomCloseLabel,
  zoomOpenA11y,
  zoomHintBorderColor = "rgba(255,255,255,0.35)",
  zoomHintBgColor = "rgba(0,0,0,0.45)",
  zoomHintIconColor = "#fff",
  source,
  style,
  ...rest
}: RasterImageProps) {
  const method = resizeMethod ?? (Platform.OS === "android" ? "resize" : undefined);
  const [open, setOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const modalImageSize = useMemo(() => {
    if (!zoomable || source == null) return { width, height: height * 0.78 };
    return resolveModalImageSize(source, width, height, insets.top);
  }, [zoomable, source, width, height, insets.top]);

  const imageNode = <Image resizeMethod={method} source={source} style={style} {...rest} />;

  if (!zoomable || source == null) {
    return imageNode;
  }

  const openZoom = () => setOpen(true);
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const frameStyle: StyleProp<ImageStyle> = [
    flatStyle.width != null || flatStyle.height != null ? { alignSelf: "stretch" as const } : null,
    styles.zoomFrame,
  ];

  return (
    <>
      <View style={frameStyle}>
        {zoomNested ? (
          imageNode
        ) : (
          <Pressable
            oyuBackdrop={false}
            onPress={openZoom}
            accessibilityRole="button"
            accessibilityLabel={zoomOpenA11y ?? kk.common.openImageZoomA11y}
            style={({ pressed }) => [styles.zoomPressable, pressed && { opacity: 0.92 }]}
          >
            {imageNode}
          </Pressable>
        )}
        {hideZoomHint ? null : (
          <Pressable
            oyuBackdrop={false}
            onPress={openZoom}
            accessibilityRole="button"
            accessibilityLabel={zoomOpenA11y ?? kk.common.openImageZoomA11y}
            style={({ pressed }) => [
              styles.zoomHint,
              {
                borderColor: zoomHintBorderColor,
                backgroundColor: zoomHintBgColor,
              },
              pressed && { opacity: 0.88 },
            ]}
          >
            <MaterialCommunityIcons name="magnify-plus-outline" size={16} color={zoomHintIconColor} />
          </Pressable>
        )}
      </View>

      <ImageZoomOverlay
        visible={open}
        source={source}
        imageWidth={modalImageSize.width}
        imageHeight={modalImageSize.height}
        onClose={() => setOpen(false)}
        closeLabel={zoomCloseLabel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  zoomFrame: {
    position: "relative",
    alignSelf: "stretch",
  },
  zoomPressable: {
    alignSelf: "stretch",
  },
  zoomHint: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
