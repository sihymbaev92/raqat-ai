import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useTasbihDevice } from "./TasbihDeviceContext";

type Props = {
  colors: ThemeColors;
};

export function TasbihDevicePanel({ colors }: Props) {
  const { supported, state, device, discovered, startScan, stopScan, connect, disconnect, lastError } =
    useTasbihDevice();
  const [busyId, setBusyId] = useState<string | null>(null);
  const styles = makeStyles(colors);

  const onScan = useCallback(async () => {
    if (state === "scanning") {
      stopScan();
      return;
    }
    await startScan();
  }, [startScan, state, stopScan]);

  const onConnect = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        stopScan();
        await connect(id);
      } finally {
        setBusyId(null);
      }
    },
    [connect, stopScan]
  );

  if (!supported) {
    return (
      <View style={styles.box}>
        <MaterialIcons name="bluetooth-disabled" size={18} color={colors.muted} />
        <Text style={styles.hint}>{kk.tasbih.bleUnsupported}</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <MaterialIcons
          name={state === "connected" ? "bluetooth-connected" : "bluetooth"}
          size={20}
          color={state === "connected" ? colors.success : colors.accent}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{kk.tasbih.bleTitle}</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {state === "connected" && device
              ? kk.tasbih.bleConnected(device.name)
              : kk.tasbih.bleHint}
          </Text>
        </View>
        {state === "connected" ? (
          <Pressable oyuBackdrop={false} onPress={() => void disconnect()} style={styles.chipBtn}>
            <Text style={styles.chipTxt}>{kk.tasbih.bleDisconnect}</Text>
          </Pressable>
        ) : (
          <Pressable
            oyuBackdrop={false}
            onPress={() => void onScan()}
            disabled={state === "connecting"}
            style={styles.chipBtn}
          >
            {state === "scanning" || state === "connecting" ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={styles.chipTxt}>
                {state === "scanning" ? kk.tasbih.bleStopScan : kk.tasbih.bleScan}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {lastError ? <Text style={styles.err}>{kk.tasbih.bleError}</Text> : null}

      {state === "scanning" && discovered.length ? (
        <View style={styles.list}>
          {discovered.slice(0, 8).map((d) => (
            <Pressable
              key={d.id}
              oyuBackdrop={false}
              disabled={busyId === d.id}
              onPress={() => void onConnect(d.id)}
              style={styles.deviceRow}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.deviceName} numberOfLines={1}>
                  {d.name}
                </Text>
                {d.driverHint ? (
                  <Text style={styles.deviceHint} numberOfLines={1}>
                    {d.driverHint}
                  </Text>
                ) : null}
              </View>
              {busyId === d.id ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              )}
            </Pressable>
          ))}
        </View>
      ) : null}

      {state === "scanning" && !discovered.length ? (
        <Text style={styles.hint}>{kk.tasbih.bleScanning}</Text>
      ) : null}

      {Platform.OS === "android" ? (
        <Text style={styles.foot}>{kk.tasbih.bleAndroidFootnote}</Text>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 12,
      gap: 8,
      marginBottom: 12,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    title: { fontSize: 13, fontWeight: "900", color: colors.text },
    sub: { fontSize: 11, lineHeight: 15, color: colors.muted, marginTop: 2 },
    chipBtn: {
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 7,
      minWidth: 72,
      alignItems: "center",
    },
    chipTxt: { fontSize: 11, fontWeight: "800", color: colors.accent },
    hint: { fontSize: 11, lineHeight: 16, color: colors.muted },
    err: { fontSize: 11, color: colors.danger, fontWeight: "700" },
    list: { gap: 6 },
    deviceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.bg,
    },
    deviceName: { fontSize: 12, fontWeight: "800", color: colors.text },
    deviceHint: { fontSize: 10, color: colors.muted, marginTop: 1 },
    foot: { fontSize: 10, lineHeight: 14, color: colors.muted },
  });
}
