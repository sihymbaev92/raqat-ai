import React from "react";
import { Modal } from "react-native";
import { QiblaArCameraView } from "./QiblaArCameraView";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
};

/** Басты бет шапкасы: ұзақ басу — алдыңғы камера + құбыла AR. */
export function QiblaArCameraModal({ visible, colors, onClose }: Props) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <QiblaArCameraView
        colors={colors}
        layout="modal"
        onClose={onClose}
        title={kk.qibla.cameraTitle}
      />
    </Modal>
  );
}
