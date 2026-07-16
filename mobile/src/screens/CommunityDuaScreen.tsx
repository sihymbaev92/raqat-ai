import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable as RNPressable,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getOrCreateClientId } from "../storage/clientId";
import { getValidAccessToken } from "../storage/authTokens";
import { postCommunityDua, type CommunityDuaRow } from "../services/platformApiClient";
import { useCommunityDuas } from "../hooks/useCommunityDuas";
import type { MoreStackParamList } from "../navigation/types";
import { uiText } from "../theme/typography";

type Props = NativeStackScreenProps<MoreStackParamList, "CommunityDua">;

export function CommunityDuaScreen(_props: Props) {
  useI18n();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardOffset = useKeyboardOffset();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { rows, loading, error, load, amen } = useCommunityDuas(50);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<CommunityDuaRow | null>(null);
  const [detailAmenBusy, setDetailAmenBusy] = useState(false);

  const composePadBottom =
    10 +
    Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) +
    (Platform.OS === "android" ? keyboardOffset : 0);

  const mapLoadError = useCallback((code: string | null) => {
    if (code === "api_missing") return kk.communityDua.apiMissing;
    if (code === "network") return kk.communityDua.loadErrorNetwork;
    return kk.communityDua.loadError;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onSubmit = async () => {
    const base = getRaqatApiBase();
    const cid = await getOrCreateClientId();
    if (!base || !cid) return;
    const t = draft.trim();
    if (t.length < 3) {
      setErr(kk.communityDua.tooShort);
      return;
    }
    setSending(true);
    setErr(null);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? undefined;
      const r = await postCommunityDua(base, t, cid, { authorizationBearer: bearer });
      if (r.ok && r.id != null) {
        setDraft("");
        await load();
        return;
      }
      if (r.status === 429) {
        setErr(kk.communityDua.rateLimit);
        return;
      }
      setErr(kk.communityDua.loadError);
    } finally {
      setSending(false);
    }
  };

  const onOpenDetail = useCallback((item: CommunityDuaRow) => {
    setSelected(item);
  }, []);

  const onDetailAmen = async () => {
    if (!selected || detailAmenBusy) return;
    setDetailAmenBusy(true);
    try {
      const total = await amen(selected.id);
      if (typeof total === "number") {
        setSelected((prev) => (prev ? { ...prev, amen_count: total } : prev));
      }
    } finally {
      setDetailAmenBusy(false);
    }
  };

  const bannerErr = err ?? (error ? mapLoadError(error) : null);

  const list = (
    <FlatList
      style={styles.list}
      data={rows}
      keyExtractor={(it) => String(it.id)}
      contentContainerStyle={styles.listPad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<Text style={styles.hint}>{kk.communityDua.listIntro}</Text>}
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.empty}>
            {error === "api_missing" || error === "network"
              ? kk.communityDua.emptyOffline
              : kk.communityDua.empty}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => onOpenDetail(item)}
          accessibilityRole="button"
          accessibilityLabel={item.body}
        >
          <Text style={styles.bodyPreview} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={styles.meta}>{kk.communityDua.countAmen(item.amen_count)}</Text>
        </Pressable>
      )}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {bannerErr ? <Text style={styles.bannerErr}>{bannerErr}</Text> : null}
      {loading && !rows.length ? (
        <View style={styles.center}>
          <RaqatOrnamentSpinner size={52} />
        </View>
      ) : (
        list
      )}
      <View
        style={[
          styles.compose,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.bg,
            paddingBottom: composePadBottom,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder={kk.communityDua.placeholder}
          placeholderTextColor={colors.muted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={400}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.92 },
            sending && { opacity: 0.6 },
          ]}
          onPress={() => void onSubmit()}
          disabled={sending}
        >
          <Text style={styles.sendTxt}>{kk.communityDua.submit}</Text>
        </Pressable>
      </View>

      <Modal
        visible={selected != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <RNPressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <RNPressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selected ? (
              <>
                <Text style={styles.modalBody}>{selected.body}</Text>
                <Text style={styles.modalMeta}>{kk.communityDua.countAmen(selected.amen_count)}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalAmenBtn,
                    { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
                    pressed && { opacity: 0.9 },
                    detailAmenBusy && { opacity: 0.55 },
                  ]}
                  onPress={() => void onDetailAmen()}
                  disabled={detailAmenBusy}
                >
                  <Text style={[styles.modalAmenTxt, { color: colors.accent }]}>{kk.communityDua.amen}</Text>
                </Pressable>
              </>
            ) : null}
          </RNPressable>
        </RNPressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    list: { flex: 1 },
    listPad: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
    empty: { color: colors.muted, marginTop: 24, textAlign: "center", paddingHorizontal: 12 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    cardPressed: { opacity: 0.92 },
    bodyPreview: { color: colors.text, fontSize: 16, lineHeight: 24 },
    meta: { color: colors.muted, fontSize: 13, marginTop: 10 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    bannerErr: {
      color: "#b91c1c",
      paddingHorizontal: 14,
      paddingVertical: 8,
      fontSize: 13,
    },
    compose: {
      borderTopWidth: 1,
      paddingHorizontal: 12,
      paddingTop: 10,
    },
    input: {
      minHeight: 72,
      maxHeight: 120,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      textAlignVertical: "top",
      marginBottom: 10,
    },
    sendBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    sendTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    modalCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 18,
      maxHeight: "78%",
    },
    modalBody: {
      ...uiText("base", "medium"),
      color: colors.text,
      lineHeight: 26,
    },
    modalMeta: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 12,
      marginBottom: 16,
    },
    modalAmenBtn: {
      alignSelf: "stretch",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
    },
    modalAmenTxt: {
      ...uiText("base", "bold"),
    },
  });
}
