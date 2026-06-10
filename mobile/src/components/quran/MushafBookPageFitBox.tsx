import React, { useCallback, useRef, useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

type Props = {
  pageWidth: number;
  pageHeight: number;
  children: ReactNode;
};

/** Хатым: бет мазмұны экранға сыймаса — ішкі скролл (аяттар кесілмейді). */
export function MushafBookPageFitBox({ pageWidth, pageHeight, children }: Props) {
  const scrollEnabledRef = useRef(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const syncScrollEnabled = useCallback(
    (contentH: number) => {
      if (pageHeight <= 0 || contentH <= 0) return;
      const next = contentH > pageHeight + 2;
      if (scrollEnabledRef.current === next) return;
      scrollEnabledRef.current = next;
      setScrollEnabled(next);
    },
    [pageHeight]
  );

  return (
    <View
      style={{
        width: pageWidth,
        height: pageHeight,
        alignSelf: "center",
        minHeight: 0,
      }}
    >
      <ScrollView
        style={{ flex: 1, width: pageWidth }}
        contentContainerStyle={{ width: pageWidth }}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled
        showsVerticalScrollIndicator={scrollEnabled}
        onContentSizeChange={(_, h) => syncScrollEnabled(h)}
      >
        <View
          style={{ width: pageWidth }}
          onLayout={(e) => syncScrollEnabled(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
