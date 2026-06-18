import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Modal, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";
import { EmbeddedSiteWebView, shouldLoadEmbeddedSiteUrl, shouldOpenEmbeddedSiteUrlExternally, withEmbeddedSiteCacheBust } from "./EmbeddedSiteWebView";

export { shouldLoadEmbeddedSiteUrl, shouldOpenEmbeddedSiteUrlExternally, withEmbeddedSiteCacheBust };

type Props = {
  visible: boolean;
  url: string;
  onClose: () => void;
  colors: ThemeColors;
  /** Тақырып жолы (жоғары панель) */
  title: string;
};

/**
 * Ресми сайтты қолданба ішінде толық көрсету (WebView modal).
 * HTML көшірмесіз — тікелей URL жүктеледі.
 */
export function EmbeddedSiteSheet({ visible, url, onClose, colors, title }: Props) {
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        toolbar: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          paddingVertical: 6,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          gap: 4,
        },
        iconBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        toolbarTitle: {
          flex: 1,
          fontSize: 15,
          fontWeight: "800",
          color: colors.text,
        },
      }),
    [colors]
  );
  const [reloadKey, setReloadKey] = useState(0);

  const onReload = useCallback(() => setReloadKey((k) => k + 1), []);

  const openInBrowser = useCallback(() => {
    if (url) void Linking.openURL(url);
  }, [url]);

  useEffect(() => {
    if (visible && url) {
      setReloadKey((k) => k + 1);
    }
  }, [visible, url]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: modalInsets.top, paddingBottom: modalInsets.bottom }]}>
        <View style={styles.toolbar}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.cancel}
          >
            <MaterialIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.toolbarTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onReload}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
          >
            <MaterialIcons name="refresh" size={24} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={openInBrowser}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.openInBrowser}
          >
            <MaterialIcons name="open-in-new" size={23} color={colors.accent} />
          </Pressable>
        </View>
        {url ? (
          <EmbeddedSiteWebView url={url} colors={colors} title={title} reloadKey={reloadKey} />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
            <Text style={{ color: colors.muted }}>—</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
