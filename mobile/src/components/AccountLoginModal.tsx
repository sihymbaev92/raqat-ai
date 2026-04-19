import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getExpoExtra } from "../config/expoExtra";
import {
  postAuthLogin,
  postAuthOauthApple,
  postAuthOauthGoogle,
  postAuthPhoneStart,
  postAuthPhoneVerify,
  type AuthLoginResponse,
} from "../services/platformApiClient";
import { saveLoginTokens, clearLoginTokens, getStoredPlatformUserId } from "../storage/authTokens";
import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { kk } from "../i18n/kk";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: HomeTabCompositeNavigation;
};

function normalizePhoneInput(raw: string): string {
  let t = raw.trim().replace(/\s/g, "");
  if (!t) return t;
  if (!t.startsWith("+")) {
    if (t.startsWith("8") && t.length >= 10) t = `+7${t.slice(1)}`;
    else if (/^\d+$/.test(t)) t = `+${t}`;
  }
  return t;
}

function apiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return null;
}

async function applyAuthSuccess(r: AuthLoginResponse): Promise<boolean> {
  if (!r.ok || !r.access_token || !r.refresh_token) return false;
  await saveLoginTokens({
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_in: r.expires_in,
    platform_user_id: r.platform_user_id,
  });
  await syncHatimWithServerBidirectional();
  return true;
}

function GoogleSignInUnconfigured() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable style={[styles.oauthBtn, styles.oauthGoogle, { opacity: 0.45 }]} disabled>
      <Text style={styles.oauthBtnTxt}>{kk.account.signInGoogle}</Text>
      <Text style={styles.oauthHint}>{kk.account.oauthGoogleNotConfigured}</Text>
    </Pressable>
  );
}

function GoogleSignInWithRequest({
  busy,
  onError,
  onSuccess,
  cfg,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
  cfg: {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
  };
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(cfg);
  const successRef = useRef(onSuccess);
  successRef.current = onSuccess;
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    if (response?.type !== "success") return;
    const id = response.params?.id_token;
    if (typeof id !== "string" || !id.trim()) {
      errRef.current(kk.account.loginFail);
      return;
    }
    const base = getRaqatApiBase();
    if (!base) {
      errRef.current(kk.account.apiMissing);
      return;
    }
    void (async () => {
      const r = await postAuthOauthGoogle(base, id);
      if (await applyAuthSuccess(r)) {
        successRef.current();
        return;
      }
      errRef.current(apiErrorMessage(r) ?? kk.account.loginFail);
    })();
  }, [response]);

  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  return (
    <Pressable
      style={[styles.oauthBtn, styles.oauthGoogle, (busy || !request) && { opacity: 0.45 }]}
      disabled={busy || !request}
      onPress={() => void promptAsync()}
    >
      <Text style={styles.oauthBtnTxt}>{kk.account.signInGoogle}</Text>
    </Pressable>
  );
}

/** OAuth хукі тек Google client id қойылғанда шақырылады (бос конфигте кей құрылғыларда құлау болмауы үшін). */
export function GoogleSignInBlock({
  busy,
  onError,
  onSuccess,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
}) {
  const extra = getExpoExtra();
  const web = typeof extra?.googleWebClientId === "string" ? extra.googleWebClientId.trim() : "";
  const ios = typeof extra?.googleIosClientId === "string" ? extra.googleIosClientId.trim() : "";
  const android =
    typeof extra?.googleAndroidClientId === "string" ? extra.googleAndroidClientId.trim() : "";

  const cfg = useMemo(
    () => ({
      webClientId: web || undefined,
      iosClientId: ios || undefined,
      androidClientId: android || undefined,
    }),
    [web, ios, android],
  );

  const configured = Boolean(web || ios || android);
  if (!configured) {
    return <GoogleSignInUnconfigured />;
  }

  return <GoogleSignInWithRequest busy={busy} onError={onError} onSuccess={onSuccess} cfg={cfg} />;
}

/** Баптаулар экранында да қолдануға (Gmail / iCloud OAuth). */
export function AppleSignInButton({
  busy,
  onError,
  onSuccess,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [pending, setPending] = useState(false);
  const locked = busy || pending;

  const onApple = async () => {
    if (Platform.OS !== "ios") {
      onError(kk.account.oauthAppleUnavailable);
      return;
    }
    const base = getRaqatApiBase();
    if (!base) {
      onError(kk.account.apiMissing);
      return;
    }
    setPending(true);
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      const token = cred.identityToken;
      if (!token) {
        onError(kk.account.loginFail);
        return;
      }
      const r = await postAuthOauthApple(base, token);
      if (await applyAuthSuccess(r)) {
        onSuccess();
        return;
      }
      onError(apiErrorMessage(r) ?? kk.account.loginFail);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "ERR_CANCELED") return;
      onError(kk.account.loginFail);
    } finally {
      setPending(false);
    }
  };

  if (Platform.OS !== "ios") return null;

  return (
    <Pressable
      style={[styles.oauthBtn, styles.oauthApple, locked && { opacity: 0.7 }]}
      onPress={() => void onApple()}
      disabled={locked}
    >
      {pending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.oauthBtnTxtDark}>{kk.account.signInApple}</Text>
      )}
    </Pressable>
  );
}

export function AccountLoginModal({ visible, onClose, navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const loadPid = useCallback(async () => {
    setPid(await getStoredPlatformUserId());
  }, []);

  useEffect(() => {
    if (visible) void loadPid();
  }, [visible, loadPid]);

  const afterLoginOk = useCallback(async () => {
    setMsg(kk.account.loginOk);
    setPid(await getStoredPlatformUserId());
    setOtp("");
    setChallengeId(null);
    setPass("");
  }, []);

  const onSendOtp = async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setMsg(kk.account.apiMissing);
      return;
    }
    const p = normalizePhoneInput(phone);
    setBusy(true);
    setMsg(null);
    try {
      const r = await postAuthPhoneStart(base, p);
      if (r.status === 503) {
        const m = apiErrorMessage(r);
        setMsg(m ?? kk.account.phoneSmsUnavailable);
        setChallengeId(null);
        return;
      }
      if (!r.ok || !r.challenge_id) {
        setMsg(apiErrorMessage(r) ?? kk.account.loginFail);
        setChallengeId(null);
        return;
      }
      setChallengeId(r.challenge_id);
      if (r.dev_otp) {
        setMsg(`Dev: код ${r.dev_otp}`);
      } else {
        setMsg("SMS жіберілді (кодты енгізіңіз).");
      }
    } catch {
      setMsg(kk.account.loginFail);
    } finally {
      setBusy(false);
    }
  };

  const onVerifyPhone = async () => {
    const base = getRaqatApiBase();
    if (!base || !challengeId) {
      setMsg(challengeId ? kk.account.apiMissing : "Алдымен код алыңыз.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await postAuthPhoneVerify(base, challengeId, otp);
      if (await applyAuthSuccess(r)) {
        await afterLoginOk();
      } else {
        setMsg(apiErrorMessage(r) ?? kk.account.loginFail);
      }
    } catch {
      setMsg(kk.account.loginFail);
    } finally {
      setBusy(false);
    }
  };

  const onAdminLogin = async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setMsg(kk.account.apiMissing);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await postAuthLogin(base, user, pass);
      if (await applyAuthSuccess(r)) {
        await afterLoginOk();
      } else {
        setMsg(kk.account.loginFail);
      }
    } catch {
      setMsg(kk.account.loginFail);
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await clearLoginTokens();
      setPid(null);
      setMsg(kk.account.loggedOut);
    } finally {
      setBusy(false);
    }
  };

  const goSettings = () => {
    onClose();
    navigation.navigate("MoreStack", { screen: "Settings" });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{kk.account.title}</Text>
            {pid ? (
              <Text style={styles.pid}>
                {kk.account.userId}: {pid}
              </Text>
            ) : (
              <Text style={styles.hint}>{kk.account.guestHint}</Text>
            )}

            <Text style={styles.section}>{kk.account.phoneE164}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={styles.input}
              placeholder={kk.account.phonePlaceholder}
              placeholderTextColor={colors.muted}
              editable={!busy}
            />
            <View style={styles.row}>
              <Pressable
                style={[styles.secondary, styles.rowBtn, busy && { opacity: 0.7 }]}
                onPress={() => void onSendOtp()}
                disabled={busy}
              >
                <Text style={styles.secondaryTxt}>{kk.account.sendOtp}</Text>
              </Pressable>
            </View>

            <Text style={styles.section}>{kk.account.otpCode}</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={8}
              style={styles.input}
              placeholder={kk.account.otpPlaceholder}
              placeholderTextColor={colors.muted}
              editable={!busy}
            />
            <Pressable
              style={[styles.primary, busy && { opacity: 0.7 }]}
              onPress={() => void onVerifyPhone()}
              disabled={busy || !challengeId}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryTxt}>{kk.account.verifyPhone}</Text>
              )}
            </Pressable>

            <Text style={styles.divider}>— немесе —</Text>

            <GoogleSignInBlock
              busy={busy}
              onError={setMsg}
              onSuccess={() => void afterLoginOk()}
            />

            <AppleSignInButton
              busy={busy}
              onError={setMsg}
              onSuccess={() => void afterLoginOk()}
            />

            {msg ? <Text style={styles.msg}>{msg}</Text> : null}

            <Pressable style={styles.expand} onPress={() => setShowAdmin((v) => !v)}>
              <Text style={styles.expandTxt}>
                {showAdmin ? kk.account.collapseAdminLogin : kk.account.expandAdminLogin}
              </Text>
            </Pressable>

            {showAdmin ? (
              <>
                <Text style={styles.label}>{kk.account.username}</Text>
                <TextInput
                  value={user}
                  onChangeText={setUser}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  placeholderTextColor={colors.muted}
                  editable={!busy}
                />
                <Text style={styles.label}>{kk.account.password}</Text>
                <TextInput
                  value={pass}
                  onChangeText={setPass}
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor={colors.muted}
                  editable={!busy}
                />
                <Pressable
                  style={[styles.primary, busy && { opacity: 0.7 }]}
                  onPress={() => void onAdminLogin()}
                  disabled={busy || !user.trim() || !pass}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryTxt}>{kk.account.signIn}</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {pid ? (
              <Pressable style={styles.secondary} onPress={() => void onLogout()} disabled={busy}>
                <Text style={styles.secondaryTxt}>{kk.account.signOut}</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.secondary} onPress={goSettings}>
              <Text style={styles.secondaryTxt}>{kk.settings.title}</Text>
            </Pressable>

            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeTxt}>{kk.common.cancel}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "92%",
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 28 : 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 },
    pid: { color: colors.accent, fontSize: 12, marginBottom: 8 },
    hint: { color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
    section: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 4 },
    label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      color: colors.text,
      marginBottom: 10,
      backgroundColor: colors.bg,
    },
    row: { flexDirection: "row", gap: 8 },
    rowBtn: { flex: 1, marginTop: 0, marginBottom: 8 },
    msg: { color: colors.accent, fontSize: 13, marginBottom: 10, marginTop: 6 },
    primary: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
    secondary: {
      marginTop: 10,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryTxt: { color: colors.text, fontWeight: "700" },
    divider: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      marginVertical: 14,
    },
    oauthBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    oauthGoogle: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
    oauthApple: { backgroundColor: "#000" },
    oauthBtnTxt: { color: "#1a1a1a", fontWeight: "800", fontSize: 15 },
    oauthBtnTxtDark: { color: "#fff", fontWeight: "800", fontSize: 15 },
    oauthHint: { color: colors.muted, fontSize: 11, marginTop: 6, textAlign: "center", paddingHorizontal: 8 },
    expand: { marginTop: 6, paddingVertical: 8 },
    expandTxt: { color: colors.muted, fontWeight: "600", textAlign: "center", fontSize: 13 },
    close: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
    closeTxt: { color: colors.muted, fontWeight: "600" },
  });
}
