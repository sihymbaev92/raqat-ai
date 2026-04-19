import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getOrCreateClientId } from "../storage/clientId";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchCommunityDuas,
  postCommunityDua,
  postCommunityDuaAmen,
  type CommunityDuaRow,
} from "../services/platformApiClient";
import { menuIconAssets } from "../theme/menuIconAssets";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "CommunityDua">;
};

export function CommunityDuaScreen(_props: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardOffset = useKeyboardOffset();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const composePadBottom =
    10 +
    Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) +
    (Platform.OS === "android" ? keyboardOffset : 0);
  const [rows, setRows] = useState<CommunityDuaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setErr(kk.communityDua.apiMissing);
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? undefined;
      const j = await fetchCommunityDuas(base, {
        limit: 50,
        authorizationBearer: bearer,
        timeoutMs: 22_000,
      });
      if (j?.ok && Array.isArray(j.duas)) {
        setRows(j.duas);
        setErr(null);
      } else if (j?.detail === "network") {
        setErr(kk.communityDua.loadErrorNetwork);
      } else if (j?.status != null) {
        setErr(kk.communityDua.loadErrorWithStatus(j.status));
      } else {
        setErr(kk.communityDua.loadError);
      }
    } catch {
      setErr(kk.communityDua.loadErrorNetwork);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        const cid = await getOrCreateClientId();
        if (!alive) return;
        setClientId(cid);
        setLoading(true);
        await load();
      })();
      return () => {
        alive = false;
      };
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
    const cid = clientId || (await getOrCreateClientId());
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

  const onAmen = async (id: number) => {
    const base = getRaqatApiBase();
    const cid = clientId || (await getOrCreateClientId());
    if (!base || !cid) return;
    const bearer = (await getValidAccessToken())?.trim() ?? undefined;
    const r = await postCommunityDuaAmen(base, id, cid, { authorizationBearer: bearer });
    if (r.ok && typeof r.amen_count === "number") {
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, amen_count: r.amen_count as number } : row
        )
      );
    }
  };

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
      ListHeaderComponent={
        <View>
          <View style={styles.heroWrap}>
            <Image
              source={menuIconAssets.communityDuaHero}
              style={styles.heroImg}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessibilityRole="image"
              accessibilityLabel={kk.communityDua.heroA11y}
            />
          </View>
          <Text style={styles.hint}>{kk.communityDua.listIntro}</Text>
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.empty}>{kk.communityDua.empty}</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.body}>{item.body}</Text>
          <View style={styles.rowFoot}>
            <Text style={styles.meta}>{kk.communityDua.countAmen(item.amen_count)}</Text>
            <Pressable
              style={({ pressed }) => [styles.amenBtn, pressed && { opacity: 0.9 }]}
              onPress={() => void onAmen(item.id)}
            >
              <Text style={styles.amenTxt}>{kk.communityDua.amen}</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {err ? <Text style={styles.bannerErr}>{err}</Text> : null}
      {loading && !rows.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
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
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    list: { flex: 1 },
    listPad: { paddingHorizontal: 14, paddingBottom: 12 },
    heroWrap: {
      alignItems: "center",
      marginTop: -6,
      marginBottom: 6,
      overflow: "visible",
    },
    /** Тәж үстіге сәл көтерілгендей: PNG ішіндегі бос орынды төменге ығыстырамыз */
    heroImg: {
      width: "100%",
      maxWidth: 320,
      height: 200,
      transform: [{ translateY: -10 }],
    },
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
    body: { color: colors.text, fontSize: 16, lineHeight: 24 },
    rowFoot: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    meta: { color: colors.muted, fontSize: 13 },
    amenBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${colors.accent}22`,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    amenTxt: { color: colors.accent, fontWeight: "800", fontSize: 14 },
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
  });
}
