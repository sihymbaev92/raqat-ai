import React from "react";
import { View, StyleSheet, Platform, type ViewStyle, type ImageSourcePropType } from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import type { MciName } from "../theme/appIcons";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, { box: number; icon: number }> = {
  sm: { box: 48, icon: 26 },
  md: { box: 58, icon: 33 },
  lg: { box: 68, icon: 38 },
  /** Мазмұн хабы тайлдары — үлкен растр PNG */
  xl: { box: 84, icon: 45 },
};

type Props = {
  /** Вектор иконка (imageSource жоқ болса міндетті) */
  name?: MciName;
  /** PNG / жергілікті asset — болса вектордың орнына */
  imageSource?: ImageSourcePropType;
  colors: ThemeColors;
  /** Артқы дақ түсі (dashboard accentSoft сияқты) */
  tintBg: string;
  /** Иконка түсі (әдепкі: colors.accent) */
  iconColor?: string;
  border?: boolean;
  size?: Size;
  /**
   * Тікбұрышты px: тор/басты бет сияқты нақты өлшем қажет болғанда (SIZE_MAP-ты басып тұрады).
   * Растр: ішкі сурет шамамен box × 0,99.
   */
  boxPx?: number;
  style?: ViewStyle;
  /**
   * `circle` — толық дөңгелек (басты бет тайлдары).
   * Әдепкі `squircle` — жұмыр тіктөртбұрыш (мазмұн хабы т.б.).
   */
  shape?: "squircle" | "circle";
  /**
   * Тек PNG: шекара жоқ, артқы дақ жоқ, көлеңке жоқ — карта/экран фоны өз күйінде.
   */
  plain?: boolean;
  /** PNG суреттерін визуалды жеңілдету (0..1), әдепкі: 0.9 */
  imageOpacity?: number;
  /** PNG: сәл қараңғырату — қара қабат opacity (0..~0.28), мысалы Сира/Тәжуид/Қажылық */
  imageDarken?: number;
  /**
   * PNG: 1-ден үлкен — суретті ішінен үлкейтіп қоршауды кесу (иконка сыртындағы жиек/жарық шеңберді тайл ішінде қалдырмау).
   */
  imageCropZoom?: number;
  /** PNG: ішкі translateY (px), мысалы compositions астындағы бөлігін көрсету */
  imageTranslateY?: number;
};

/**
 * Иконканы дөңгелек/жұмыр бұрышты артқа салады — мазмұн карточкалары үшін біркелкі көрініс.
 */
export function AppIconBadge(props: Props) {
  const {
    name,
    imageSource,
    colors,
    tintBg,
    iconColor,
    border = true,
    size = "md",
    boxPx,
    style,
    shape = "squircle",
    plain = false,
    imageOpacity = 1,
    imageDarken,
    imageCropZoom,
    imageTranslateY,
  } = props;
  const dim = SIZE_MAP[size];
  const box = boxPx != null && boxPx > 0 ? boxPx : dim.box;
  const iconFromBox = Math.round(dim.icon * (box / dim.box));
  const tint = iconColor ?? colors.accent;
  const radius = shape === "circle" ? box / 2 : box * 0.28;
  /** PNG: батырма ішінде толық кадр — contain; zoom тек 1.05-ке дейін */
  const rasterSize = imageSource ? Math.round(box * 0.92) : iconFromBox;
  const showBorder = !plain && border;
  const bg = plain ? "transparent" : tintBg;
  const dimOverlay =
    typeof imageDarken === "number" && imageDarken > 0
      ? Math.min(0.28, Math.max(0.04, imageDarken))
      : 0;
  const innerRasterRadius = shape === "circle" ? rasterSize / 2 : radius * (rasterSize / box);
  return (
    <View
      style={[
        styles.wrap,
        plain && styles.wrapPlain,
        shape === "circle" && styles.wrapCircleClip,
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: bg,
          borderWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderColor: showBorder ? colors.border : "transparent",
        },
        style,
      ]}
    >
      {imageSource ? (
        typeof imageCropZoom === "number" && imageCropZoom > 1.05 ? (
          <View
            style={{
              width: rasterSize,
              height: rasterSize,
              overflow: "hidden",
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: innerRasterRadius,
            }}
          >
            <RasterImage
              source={imageSource}
              style={{
                width: rasterSize,
                height: rasterSize,
                transform: [
                  { scale: imageCropZoom },
                  ...(typeof imageTranslateY === "number" ? [{ translateY: imageTranslateY }] : []),
                ],
                opacity: Math.min(1, Math.max(0.85, imageOpacity)),
              }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            {dimOverlay > 0 ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "#000000", opacity: dimOverlay },
                ]}
              />
            ) : null}
          </View>
        ) : (
          <View
            style={{
              width: rasterSize,
              height: rasterSize,
              position: "relative",
              overflow: "hidden",
              borderRadius: innerRasterRadius,
            }}
          >
            <RasterImage
              source={imageSource}
              style={{
                width: rasterSize,
                height: rasterSize,
                opacity: Math.min(1, Math.max(0.85, imageOpacity)),
                ...(typeof imageTranslateY === "number"
                  ? { transform: [{ translateY: imageTranslateY }] }
                  : {}),
              }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            {dimOverlay > 0 ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "#000000", opacity: dimOverlay },
                ]}
              />
            ) : null}
          </View>
        )
      ) : name ? (
        <MaterialCommunityIcons name={name} size={iconFromBox} color={tint} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  /** Тек сурет: көлеңке мен көтерілу жоқ */
  wrapPlain: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: { elevation: 0 },
      default: {},
    }),
  },
  wrapCircleClip: {
    overflow: "hidden",
  },
});
