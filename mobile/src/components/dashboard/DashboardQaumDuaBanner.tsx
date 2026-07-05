import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect } from "@react-navigation/native";
import type { ThemeColors } from "../../theme/colors";
import { uiText } from "../../theme/typography";
import { kk } from "../../i18n/kk";
import { useI18n } from "../../i18n/useI18n";
import { getRaqatApiBase } from "../../config/raqatApiBase";
import { getValidAccessToken } from "../../storage/authTokens";
import { getOrCreateClientId } from "../../storage/clientId";
import {
  fetchCommunityDuas,
  postCommunityDuaAmen,
  type CommunityDuaRow,
} from "../../services/platformApiClient";
import {
  getDismissedCommunityDuaId,
  setDismissedCommunityDuaId,
} from "../../storage/communityDuaBannerDismiss";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  onOpenList: () => void;
};

export const DashboardQaumDuaBanner = memo(function DashboardQaumDuaBanner({
  colors,
  isDark,
  onOpenList,
}: Props) {
  useI18n();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [latest, setLatest] = useState<CommunityDuaRow | null>(null);
  const [visible, setVisible] = useState(false);
  const [amenBusy, setAmenBusy] = useState(false);

  const refresh = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setVisible(false);
      setLatest(null);
      return;
    }
    const dismissed = await getDismissedCommunityDuaId();
    const bearer = (await getValidAccessToken())?.trim() ?? undefined;
    const j = await fetchCommunityDuas(base, { limit: 1, authorizationBearer: bearer, timeoutMs: 18_000 });
    const row = j?.ok && Array.isArray(j.duas) ? j.duas[0] ?? null : null;
    if (!row || dismissed === row.id) {
      setVisible(false);
      setLatest(row);
      return;
    }
    setLatest(row);
    setVisible(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onAmen = useCallback(async () => {
    if (!latest || amenBusy) return;
    const base = getRaqatApiBase();
    const cid = await getOrCreateClientId();
    if (!base || !cid) return;
    setAmenBusy(true);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? undefined;
      await postCommunityDuaAmen(base, latest.id, cid, { authorizationBearer: bearer });
      await setDismissedCommunityDuaId(latest.id);
      setVisible(false);
    } finally {
      setAmenBusy(false);
    }
  }, [amenBusy, latest]);

  if (!visible || !latest) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{kk.communityDua.bannerTitle}</Text>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.textCol, pressed && styles.textColPressed]}
          onPress={onOpenList}
          accessibilityRole="button"
          accessibilityLabel={kk.communityDua.bannerOpenA11y}
        >
          <Text style={styles.body} numberOfLines={2}>
            {latest.body}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.amenBtn,
            pressed && styles.amenBtnPressed,
            amenBusy && styles.amenBtnBusy,
          ]}
          onPress={() => void onAmen()}
          disabled={amenBusy}
          accessibilityRole="button"
          accessibilityLabel={kk.communityDua.amen}
        >
          <Text style={styles.amenTxt}>{kk.communityDua.amen}</Text>
        </Pressable>
      </View>
    </View>
  );
});

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(34, 197, 94, 0.28)" : colors.border,
      backgroundColor: colors.card,
    },
    title: {
      ...uiText("xs", "bold"),
      color: colors.accent,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    textColPressed: {
      opacity: 0.88,
    },
    body: {
      ...uiText("sm", "medium"),
      color: colors.text,
      lineHeight: 20,
    },
    amenBtn: {
      flexShrink: 0,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${colors.accent}22`,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    amenBtnPressed: {
      opacity: 0.9,
    },
    amenBtnBusy: {
      opacity: 0.55,
    },
    amenTxt: {
      ...uiText("sm", "bold"),
      color: colors.accent,
    },
  });
}
