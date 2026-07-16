import React, { memo, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";
import type { ThemeColors } from "../../theme/colors";
import { OfficialFeedCard } from "../OfficialFeedCard";
import { halalCompanyToFeedItem } from "../../utils/officialFeedMappers";
import { halalCatalogPageSize } from "../../utils/halalPerformanceProfile";
import { formatHalalDistanceKm, type HalalCompanyWithDistance } from "../../utils/halalGeoFilter";

type Props = {
  colors: ThemeColors;
  items: (HalalDamuCompanyCard | HalalCompanyWithDistance)[];
  onOpenCompany: (id: number) => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  /** Мекемелер каталогы: ірі логотип. */
  logoThumbSize?: number;
};

const ESTIMATED_ROW = 92;

const HalalCompanyRow = memo(function HalalCompanyRow({
  item,
  colors,
  onOpenCompany,
  logoThumbSize,
}: {
  item: HalalDamuCompanyCard | HalalCompanyWithDistance;
  colors: ThemeColors;
  onOpenCompany: (id: number) => void;
  logoThumbSize?: number;
}) {
  const feed = useMemo(() => {
    const base = halalCompanyToFeedItem(item);
    const dist = "distanceM" in item && item.distanceM > 0 ? formatHalalDistanceKm(item.distanceM) : null;
    const addr = item.address?.trim() || null;
    const subtitle = [dist, addr].filter(Boolean).join(" · ") || null;
    return { ...base, subtitle };
  }, [item]);
  return (
    <View style={styles.rowWrap}>
      <OfficialFeedCard
        item={feed}
        colors={colors}
        thumbSize={logoThumbSize}
        onPress={() => onOpenCompany(item.id)}
        accessibilityLabel={item.title}
      />
    </View>
  );
});

export function HalalCompanySearchList({
  colors,
  items,
  onOpenCompany,
  onEndReached,
  ListHeaderComponent,
  logoThumbSize,
}: Props) {
  const pageSize = halalCatalogPageSize();
  const renderItem = useCallback(
    ({ item }: { item: HalalDamuCompanyCard | HalalCompanyWithDistance }) => (
      <HalalCompanyRow
        item={item}
        colors={colors}
        onOpenCompany={onOpenCompany}
        logoThumbSize={logoThumbSize}
      />
    ),
    [colors, onOpenCompany, logoThumbSize]
  );

  return (
    <View style={styles.listHost}>
      <FlashList
        data={items}
        keyExtractor={(item) => `halal-co-${item.id}`}
        renderItem={renderItem}
        drawDistance={pageSize * ESTIMATED_ROW}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={ListHeaderComponent ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listHost: {
    flex: 1,
    minHeight: 120,
  },
  rowWrap: {
    marginBottom: 8,
  },
});
