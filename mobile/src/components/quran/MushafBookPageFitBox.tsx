import React, { useCallback, useRef, useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

type Props = {
  pageWidth: number;
  pageHeight: number;
  children: ReactNode;
  /** Хатым: бір бет — auto-fit арқылы сiydir; скролл тек min масштабтан кейін де асса. */
  lockOnePage?: boolean;
  allowOverflowScroll?: boolean;
};

/** Хатым: бет мазмұны экранға auto-fit; қажет болса ғана вертикаль скролл. */
export function MushafBookPageFitBox({
  pageWidth,
  pageHeight,
  children,
  lockOnePage = false,
  allowOverflowScroll = false,
}: Props) {
  const scrollEnabledRef = useRef(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const syncScrollEnabled = useCallback(
    (contentH: number) => {
      if (pageHeight <= 0 || contentH <= 0) return;
      const next = lockOnePage
        ? allowOverflowScroll && contentH > pageHeight + 2
        : contentH > pageHeight + 2;
      if (scrollEnabledRef.current === next) return;
      scrollEnabledRef.current = next;
      setScrollEnabled(next);
    },
    [lockOnePage, allowOverflowScroll, pageHeight]
  );

  return (
    <View
      style={{
        width: pageWidth,
        height: pageHeight,
        alignSelf: "center",
        minHeight: 0,
        overflow: "visible",
      }}
    >
      <ScrollView
        style={{ flex: 1, width: pageWidth }}
        contentContainerStyle={{
          width: pageWidth,
          flexGrow: lockOnePage ? 0 : undefined,
          paddingBottom: lockOnePage ? 8 : 48,
        }}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled
        showsVerticalScrollIndicator={scrollEnabled}
        onContentSizeChange={(_, h) => syncScrollEnabled(h)}
      >
        <View
          style={{ width: pageWidth, overflow: "visible" }}
          onLayout={(e) => syncScrollEnabled(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
