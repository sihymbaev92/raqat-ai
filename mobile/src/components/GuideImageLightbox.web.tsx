import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
  type ViewStyle,
  PixelRatio,
} from "react-native";
import {
  guideLightboxFitSize,
  guideThumbFitContain,
  resolveGuideImageThumbImageStyle,
} from "../utils/guideLightboxFit";
import { imageAssetAspectRatio, imageAssetPixelSize } from "../utils/imageAssetAspect";
import { ZoomableImageContent } from "./zoom/ZoomableImageContent";
import { kk } from "../i18n/kk";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createPortal } = require("react-dom") as {
  createPortal: (children: React.ReactNode, container: Element) => React.ReactNode;
};
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";

type Props = {
  source: ImageSourcePropType;
  colors: ThemeColors;
  thumbStyle: StyleProp<ImageStyle>;
  closeLabel: string;
  openImageA11y: string;
  imageAspectRatio?: number;
  softenThumbOverlay?: boolean;
  fillWidth?: boolean;
  hideZoomHint?: boolean;
  fitThumbToScreen?: boolean;
  thumbHorizontalInset?: number;
  maxThumbHeightRatio?: number;
};

/**
 * Веб: толық экран — body порталы; кіші превью карточка енінде (contain).
 */
export function GuideImageLightbox({
  source,
  colors,
  thumbStyle,
  closeLabel,
  openImageA11y,
  imageAspectRatio,
  softenThumbOverlay = false,
  fillWidth = false,
  hideZoomHint = false,
  fitThumbToScreen = false,
  thumbHorizontalInset = 56,
  maxThumbHeightRatio = 0.48,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pixelRatio = PixelRatio.get();
  const effectiveAspect = useMemo(() => {
    if (imageAspectRatio != null && imageAspectRatio > 0) return imageAspectRatio;
    return imageAssetAspectRatio(source);
  }, [imageAspectRatio, source]);

  const sourcePixels = useMemo(() => imageAssetPixelSize(source), [source]);

  const fittedThumbSize = useMemo(() => {
    if (!fitThumbToScreen || effectiveAspect == null || effectiveAspect <= 0) return null;
    const maxW = Math.max(1, width - thumbHorizontalInset);
    const maxH = Math.max(120, height * maxThumbHeightRatio);
    return guideThumbFitContain(maxW, maxH, effectiveAspect, sourcePixels, pixelRatio);
  }, [
    fitThumbToScreen,
    effectiveAspect,
    width,
    height,
    thumbHorizontalInset,
    maxThumbHeightRatio,
    sourcePixels,
    pixelRatio,
  ]);

  const modalImageSize = useMemo(() => {
    if (effectiveAspect == null || effectiveAspect <= 0) {
      return { width, height: height * 0.78 };
    }
    return guideLightboxFitSize(width, height, insets.top, effectiveAspect);
  }, [width, height, insets.top, effectiveAspect]);

  const thumbImageStyle = useMemo((): StyleProp<ImageStyle> => {
    const flat = StyleSheet.flatten(thumbStyle) ?? {};
    const chrome = resolveGuideImageThumbImageStyle(thumbStyle);

    if (fittedThumbSize) {
      return [
        chrome,
        {
          width: fittedThumbSize.width,
          height: fittedThumbSize.height,
          alignSelf: "center",
        },
      ];
    }

    const width = (flat.width as ImageStyle["width"]) ?? "100%";

    if (typeof flat.height === "number") {
      return [chrome, { width, height: flat.height, alignSelf: "stretch" }];
    }
    if (effectiveAspect != null && effectiveAspect > 0) {
      return [chrome, { width, aspectRatio: effectiveAspect, alignSelf: "stretch" }];
    }
    return [chrome, { width, height: 220, alignSelf: "stretch" }];
  }, [thumbStyle, effectiveAspect, fittedThumbSize]);

  const thumbFrameStyle = useMemo((): StyleProp<ViewStyle> => {
    const base: ViewStyle[] = [styles.thumbFrame];
    if (fillWidth) base.push(styles.thumbFrameFill);
    if (fittedThumbSize) {
      base.push({
        width: "100%",
        alignItems: "center",
        minHeight: fittedThumbSize.height,
      });
    }
    return base;
  }, [fillWidth, fittedThumbSize]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const overlay = (
    <View style={[styles.modalRoot, { width, height }]} accessibilityViewIsModal>
      <Pressable
        oyuBackdrop={false}
        style={styles.modalBackdrop}
        onPress={() => setOpen(false)}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      />
      <View style={[styles.modalTopBar, { paddingTop: 8 + insets.top }]} pointerEvents="box-none">
        <Pressable
          oyuBackdrop={false}
          style={styles.closeBtn}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        >
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
          <Text style={styles.closeTxt}>{closeLabel}</Text>
        </Pressable>
      </View>
      <Text style={[styles.pinchHint, { top: 12 + insets.top }]} pointerEvents="none">
        {kk.common.imagePinchZoomHint}
      </Text>
      <View style={styles.modalImageArea} pointerEvents="box-none">
        <ZoomableImageContent
          source={source}
          width={modalImageSize.width}
          height={modalImageSize.height}
        />
      </View>
    </View>
  );

  return (
    <>
      <View style={[styles.thumbWrap, fillWidth && styles.thumbWrapFill]}>
        <Pressable
          oyuBackdrop={false}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={openImageA11y}
          style={({ pressed }) => [
            styles.thumbPressable,
            fillWidth && styles.thumbPressableFill,
            pressed && { opacity: 0.92 },
          ]}
        >
          <View style={thumbFrameStyle}>
            <RasterImage
              source={source}
              style={thumbImageStyle}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            {softenThumbOverlay ? <View style={styles.thumbLightenOverlay} pointerEvents="none" /> : null}
            {hideZoomHint ? null : (
              <View
                style={[styles.zoomHint, { borderColor: colors.border, backgroundColor: colors.card }]}
                pointerEvents="none"
              >
                <MaterialCommunityIcons name="magnify-plus-outline" size={16} color={colors.accent} />
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {open && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    alignSelf: "stretch",
    width: "100%",
  },
  thumbWrapFill: {
    alignItems: "stretch",
  },
  thumbPressable: {
    alignSelf: "stretch",
  },
  thumbPressableFill: {
    width: "100%",
  },
  thumbFrame: {
    position: "relative",
    alignSelf: "stretch",
  },
  thumbFrameFill: {
    width: "100%",
  },
  thumbLightenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    opacity: 0.05,
    borderRadius: 14,
  },
  zoomHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2147483000,
    backgroundColor: "rgba(0,0,0,0.94)",
    flexDirection: "column",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modalTopBar: {
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
  pinchHint: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 2,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  modalImageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
