import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
  type ViewStyle,
  PixelRatio,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { guideLightboxFitSize, guideThumbFitContain, guideImageDecodeMultiplier, resolveGuideImageThumbImageStyle } from "../utils/guideLightboxFit";
import { imageAssetAspectRatio, imageAssetPixelSize } from "../utils/imageAssetAspect";
import { ZoomableImageContent } from "./zoom/ZoomableImageContent";
import { kk } from "../i18n/kk";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  source: ImageSourcePropType;
  colors: ThemeColors;
  /** Сурет стилі (карточка ішінде) */
  thumbStyle: StyleProp<ImageStyle>;
  /** Толық экранда жабу мәтіні */
  closeLabel: string;
  /** Кіші суретті басып ашу (a11y) */
  openImageA11y: string;
  /** Берілсе, модалда сурет шеттері кеспелмей сыйыстырылады */
  imageAspectRatio?: number;
  /** Кіші превью үстіндегі ақ әсер (инфографикада өшіріңіз) */
  softenThumbOverlay?: boolean;
  /** Превью толық енін алу (тәжуид беттері) */
  fillWidth?: boolean;
  /** 🔍 белгісін жасыру */
  hideZoomHint?: boolean;
  /** Превью экран еніне/биіктігіне contain арқылы сыйсын (намаз оқулығы). */
  fitThumbToScreen?: boolean;
  /** fitThumbToScreen: scroll+card padding (px). */
  thumbHorizontalInset?: number;
  /** fitThumbToScreen: max биіктік — экран биіктігінің үлесі. */
  maxThumbHeightRatio?: number;
  /** Android thumbnail decode size. Full-screen zoom keeps original quality when opened. */
  thumbResizeMultiplier?: number;
};

/**
 * Намаз оқулығындағы суреттер: басып толық экранда ірі қарау (бұрын тек кіші превью болды).
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
  thumbResizeMultiplier,
}: Props) {
  useAppLocale();
  const [open, setOpen] = useState(false);
  const [zoomReady, setZoomReady] = useState(false);
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
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

  const modalDecodeMultiplier = useMemo(
    () => guideImageDecodeMultiplier(modalImageSize.width, sourcePixels, pixelRatio),
    [modalImageSize.width, sourcePixels, pixelRatio]
  );

  const instantDecodeMultiplier = thumbResizeMultiplier ?? modalDecodeMultiplier;

  useEffect(() => {
    if (!open) setZoomReady(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fallback = setTimeout(() => setZoomReady(true), 150);
    return () => clearTimeout(fallback);
  }, [open]);

  /** Android: absoluteFill + scale contain ортадан кесіп көрсетуі мүмкін — өлшем Image-ке тікелей. */
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
              resizeMultiplier={thumbResizeMultiplier}
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

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        hardwareAccelerated={Platform.OS === "android"}
        presentationStyle="overFullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modalRoot, { paddingBottom: modalInsets.bottom }]}>
          <View style={[styles.modalTopBar, { paddingTop: 8 + modalInsets.top }]}>
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
          <Text style={[styles.pinchHint, { top: 12 + modalInsets.top }]} pointerEvents="none">
            {kk.common.imagePinchZoomHint}
          </Text>
          <View style={styles.modalImageArea}>
            {zoomReady ? (
              <ZoomableImageContent
                source={source}
                width={modalImageSize.width}
                height={modalImageSize.height}
                resizeMultiplier={modalDecodeMultiplier}
              />
            ) : (
              <RasterImage
                source={source}
                style={{ width: modalImageSize.width, height: modalImageSize.height }}
                resizeMode="contain"
                resizeMultiplier={instantDecodeMultiplier}
                onLoad={() => setZoomReady(true)}
                accessibilityIgnoresInvertColors
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
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
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
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
  },
});
