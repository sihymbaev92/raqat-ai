import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";

type Props = {
  source: ImageSourcePropType;
  colors: ThemeColors;
  /** Сурет стилі (карточка ішінде) */
  thumbStyle: StyleProp<ImageStyle>;
  /** Толық экранда жабу мәтіні */
  closeLabel: string;
  /** Кіші суретті басып ашу (a11y) */
  openImageA11y: string;
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
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={openImageA11y}
        style={({ pressed }) => [styles.thumbWrap, pressed && { opacity: 0.92 }]}
      >
        <Image source={source} style={thumbStyle} resizeMode="contain" />
        <View style={[styles.zoomHint, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="magnify-plus-outline" size={16} color={colors.accent} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={[styles.modalTopBar, { paddingTop: 8 + insets.top }]}>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
            >
              <MaterialCommunityIcons name="close" size={26} color="#fff" />
              <Text style={styles.closeTxt}>{closeLabel}</Text>
            </Pressable>
          </View>
          <View style={styles.modalImageArea}>
            <Image
              source={source}
              style={{ width, height: height * 0.78 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    position: "relative",
    alignSelf: "stretch",
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
  modalImageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
