import React, { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  source: ImageSourcePropType;
  /** Сурет ені/биіктік қатынасы (мыс. 1024/417) */
  aspectRatio: number;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  /** Көрінбейтін аймаққа түс (contain кезінде) */
  backdropColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
};

/**
 * Намаз hero суреті: контейнер қатынасы суретке сәйкес — cover қиып кетпейді.
 * Мәтін/виджет үстіне қойылады.
 */
export function PrayerHeroImageBackdrop({
  source,
  aspectRatio,
  borderRadius = 0,
  resizeMode = "cover",
  backdropColor = "#121820",
  style,
  children,
  accessibilityLabel,
}: Props) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        frame: {
          width: "100%",
          aspectRatio,
          position: "relative",
          overflow: "hidden",
          backgroundColor: backdropColor,
          borderRadius,
        },
        image: {
          ...StyleSheet.absoluteFillObject,
        },
        content: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: "flex-end",
        },
      }),
    [aspectRatio, backdropColor, borderRadius]
  );

  return (
    <View style={[styles.frame, style]} accessibilityLabel={accessibilityLabel}>
      <ImageBackground
        source={source}
        style={styles.image}
        resizeMode={resizeMode}
        resizeMethod="resize"
        accessibilityIgnoresInvertColors
      >
        <View style={styles.content} pointerEvents="box-none">
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}
