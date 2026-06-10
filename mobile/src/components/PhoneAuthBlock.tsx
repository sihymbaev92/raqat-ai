import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { getRaqatApiBase } from "../config/raqatApiBase";
import {
  postAuthPhoneStart,
  postAuthPhoneVerify,
  type AuthLoginResponse,
} from "../services/platformApiClient";
import { saveLoginTokens } from "../storage/authTokens";
import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

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

type Props = {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSuccess: () => void;
  onError: (m: string) => void;
  /** Баптаулар: қысқа жолдар, телефон/код бір қатарда */
  compact?: boolean;
};

/**
 * Телефон + SMS код (серверде аккаунт байланыстырылады; Gmail/Apple сияқты).
 */
export function PhoneAuthBlock({ busy, setBusy, onSuccess, onError, compact }: Props) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  const onSendOtp = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) {
      onError(kk.account.apiMissing);
      return;
    }
    const p = normalizePhoneInput(phone);
    if (!p || p.length < 8) {
      onError(kk.settings.phoneInvalidHint);
      return;
    }
    setBusy(true);
    setLocalMsg(null);
    try {
      const r = await postAuthPhoneStart(base, p);
      if (r.status === 503) {
        const m = apiErrorMessage(r);
        onError(m ?? kk.account.phoneSmsUnavailable);
        setChallengeId(null);
        return;
      }
      if (!r.ok || !r.challenge_id) {
        onError(apiErrorMessage(r) ?? kk.account.loginFail);
        setChallengeId(null);
        return;
      }
      setChallengeId(r.challenge_id);
      if (r.dev_otp) {
        setLocalMsg(`Dev: код ${r.dev_otp}`);
      } else {
        setLocalMsg(kk.settings.phoneCodeSentHint);
      }
    } catch {
      onError(kk.account.loginFail);
    } finally {
      setBusy(false);
    }
  }, [phone, setBusy, onError]);

  const onVerifyPhone = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base || !challengeId) {
      onError(challengeId ? kk.account.apiMissing : kk.settings.phoneNeedCodeHint);
      return;
    }
    setBusy(true);
    try {
      const r = await postAuthPhoneVerify(base, challengeId, otp);
      if (await applyAuthSuccess(r)) {
        setOtp("");
        setChallengeId(null);
        setLocalMsg(null);
        onSuccess();
        return;
      }
      onError(apiErrorMessage(r) ?? kk.account.loginFail);
    } catch {
      onError(kk.account.loginFail);
    } finally {
      setBusy(false);
    }
  }, [challengeId, otp, setBusy, onError, onSuccess]);

  if (compact) {
    return (
      <View style={styles.wrapCompact}>
        <View style={styles.inlineRow}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            style={[styles.input, styles.inputFlex]}
            placeholder={kk.account.phonePlaceholder}
            placeholderTextColor={colors.muted}
            editable={!busy}
          />
          <Pressable
            style={[styles.btnInline, busy && { opacity: 0.7 }]}
            onPress={() => void onSendOtp()}
            disabled={busy}
          >
            <Text style={styles.btnInlineTxt}>{kk.account.sendOtp}</Text>
          </Pressable>
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={8}
            style={[styles.input, styles.inputFlex]}
            placeholder={kk.account.otpPlaceholder}
            placeholderTextColor={colors.muted}
            editable={!busy}
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
          />
          <Pressable
            style={[styles.btnInlinePrimary, (busy || !challengeId) && { opacity: 0.55 }]}
            onPress={() => void onVerifyPhone()}
            disabled={busy || !challengeId}
          >
            {busy ? (
              <RaqatOrnamentSpinner size={20} />
            ) : (
              <Text style={styles.btnInlinePrimaryTxt}>{kk.account.verifyPhone}</Text>
            )}
          </Pressable>
        </View>
        {localMsg ? <Text style={styles.msgOk}>{localMsg}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{kk.account.phoneE164}</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        style={styles.input}
        placeholder={kk.account.phonePlaceholder}
        placeholderTextColor={colors.muted}
        editable={!busy}
      />
      <Pressable
        style={[styles.btnSecondary, busy && { opacity: 0.7 }]}
        onPress={() => void onSendOtp()}
        disabled={busy}
      >
        <Text style={styles.btnSecondaryTxt}>{kk.account.sendOtp}</Text>
      </Pressable>

      <Text style={[styles.label, { marginTop: 10 }]}>{kk.account.otpCode}</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={8}
        style={styles.input}
        placeholder={kk.account.otpPlaceholder}
        placeholderTextColor={colors.muted}
        editable={!busy}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
      />
      <Pressable
        style={[styles.btnPrimary, busy && { opacity: 0.7 }]}
        onPress={() => void onVerifyPhone()}
        disabled={busy || !challengeId}
      >
        {busy ? (
          <RaqatOrnamentSpinner size={24} />
        ) : (
          <Text style={styles.btnPrimaryTxt}>{kk.account.verifyPhone}</Text>
        )}
      </Pressable>
      {localMsg ? <Text style={styles.msgOk}>{localMsg}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 8 },
    wrapCompact: { gap: 8, marginBottom: 0 },
    inlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    inputFlex: { flex: 1, minWidth: 0, marginBottom: 0 },
    btnInline: {
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexShrink: 0,
    },
    btnInlineTxt: { color: colors.accent, fontWeight: "700", fontSize: 13 },
    btnInlinePrimary: {
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      flexShrink: 0,
      minWidth: 72,
      alignItems: "center",
    },
    btnInlinePrimaryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
    label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      color: colors.text,
      fontSize: 16,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    btnPrimary: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
    },
    btnPrimaryTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
    btnSecondary: {
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    btnSecondaryTxt: { color: colors.accent, fontWeight: "700", fontSize: 14 },
    msgOk: { color: colors.accent, fontSize: 13, marginTop: 8, lineHeight: 18 },
  });
}
