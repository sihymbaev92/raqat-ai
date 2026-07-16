import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getExpoExtra } from "../config/expoExtra";
import { postAuthOauthApple, postAuthOauthGoogle, type AuthLoginResponse } from "../services/platformApiClient";
import { saveLoginTokens } from "../storage/authTokens";
import { syncAccountDataWithServerBidirectional } from "../services/accountSync";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";

WebBrowser.maybeCompleteAuthSession();

function apiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  const clean = (m: string): string | null => {
    const t = m.trim();
    if (!t) return null;
    if (/(twilio|server|api|env|config|raqat_|expo_|platform|token|jwt|http|port)/i.test(t)) return null;
    return t;
  };
  if (typeof detail === "string") return clean(detail);
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === "string") return clean(m);
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
  await syncAccountDataWithServerBidirectional();
  return true;
}

export function isGoogleSignInConfigured(): boolean {
  const extra = getExpoExtra();
  const web = typeof extra?.googleWebClientId === "string" ? extra.googleWebClientId.trim() : "";
  const ios = typeof extra?.googleIosClientId === "string" ? extra.googleIosClientId.trim() : "";
  const android =
    typeof extra?.googleAndroidClientId === "string" ? extra.googleAndroidClientId.trim() : "";
  return Boolean(web || ios || android);
}

function GoogleSignInWithRequest({
  busy,
  onError,
  onSuccess,
  cfg,
  compact,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
  compact?: boolean;
  cfg: {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
  };
}) {
  useAppLocale();
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
      style={[
        styles.oauthBtn,
        styles.oauthGoogle,
        compact && styles.oauthBtnCompact,
        (busy || !request) && { opacity: 0.45 },
      ]}
      disabled={busy || !request}
      onPress={() => void promptAsync()}
    >
      <Text style={[styles.oauthBtnTxt, compact && styles.oauthBtnTxtCompact]} numberOfLines={1}>
        {compact ? "Gmail" : kk.account.signInGoogle}
      </Text>
    </Pressable>
  );
}

/** OAuth хукі тек Google client id қойылғанда шақырылады (бос конфигте кей құрылғыларда құлау болмауы үшін). */
export function GoogleSignInBlock({
  busy,
  onError,
  onSuccess,
  compact,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
  compact?: boolean;
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
    return null;
  }

  return (
    <GoogleSignInWithRequest
      busy={busy}
      onError={onError}
      onSuccess={onSuccess}
      cfg={cfg}
      compact={compact}
    />
  );
}

/** Баптаулар экранында да қолдануға (Gmail / iCloud OAuth). */
export function AppleSignInButton({
  busy,
  onError,
  onSuccess,
  compact,
}: {
  busy: boolean;
  onError: (m: string) => void;
  onSuccess: () => void;
  compact?: boolean;
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
      style={[styles.oauthBtn, styles.oauthApple, compact && styles.oauthBtnCompact, locked && { opacity: 0.7 }]}
      onPress={() => void onApple()}
      disabled={locked}
    >
      {pending ? (
        <RaqatOrnamentSpinner size={20} />
      ) : (
        <Text style={[styles.oauthBtnTxtDark, compact && styles.oauthBtnTxtCompact]} numberOfLines={1}>
          {compact ? "Apple" : kk.account.signInApple}
        </Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    oauthBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    oauthBtnCompact: {
      marginBottom: 0,
      paddingVertical: 11,
      width: "100%",
    },
    oauthBtnTxtCompact: { fontSize: 13 },
    oauthGoogle: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
    oauthApple: { backgroundColor: "#000" },
    oauthBtnTxt: { color: "#1a1a1a", fontWeight: "800", fontSize: 15 },
    oauthBtnTxtDark: { color: "#fff", fontWeight: "800", fontSize: 15 },
  });
}
