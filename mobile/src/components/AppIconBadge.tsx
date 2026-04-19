import React from "react";
import { View, StyleSheet, Platform, Image, type ViewStyle, type ImageSourcePropType } from "react-native";
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
  } = props;
  const dim = SIZE_MAP[size];
  const box = boxPx != null && boxPx > 0 ? boxPx : dim.box;
  const iconFromBox = Math.round(dim.icon * (box / dim.box));
  const tint = iconColor ?? colors.accent;
  const radius = shape === "circle" ? box / 2 : box * 0.28;
  /** PNG: батырма ішінде мүмкіндігінше толық, бірақ шеңбер шегінен шықпайды */
  const rasterSize = imageSource ? Math.round(box * 0.995) : iconFromBox;
  const showBorder = !plain && border;
  const bg = plain ? "transparent" : tintBg;
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
        <Image
          source={imageSource}
          style={{ width: rasterSize, height: rasterSize }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
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
