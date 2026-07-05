import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getTasbihBleHub } from "./tasbihBleHub";
import type {
  TasbihBleDeviceSummary,
  TasbihDeviceConnectionState,
  TasbihDeviceCounterEvent,
} from "./types";

type TasbihDeviceContextValue = {
  supported: boolean;
  state: TasbihDeviceConnectionState;
  device: TasbihBleDeviceSummary | null;
  discovered: TasbihBleDeviceSummary[];
  startScan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnectSaved: () => Promise<boolean>;
  lastError: string | null;
};

const TasbihDeviceContext = createContext<TasbihDeviceContextValue | null>(null);

export function TasbihDeviceProvider({ children }: { children: React.ReactNode }) {
  const hub = useMemo(() => getTasbihBleHub(), []);
  const [state, setState] = useState<TasbihDeviceConnectionState>(hub.getState());
  const [device, setDevice] = useState<TasbihBleDeviceSummary | null>(hub.getDevice());
  const [discovered, setDiscovered] = useState<TasbihBleDeviceSummary[]>(hub.getDiscoveredDevices());
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    return hub.onState((s, d) => {
      setState(s);
      setDevice(d);
      setDiscovered(hub.getDiscoveredDevices());
    });
  }, [hub]);

  const startScan = useCallback(async () => {
    setLastError(null);
    try {
      await hub.startScan();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "scan-failed");
      throw e;
    }
  }, [hub]);

  const stopScan = useCallback(() => hub.stopScan(), [hub]);

  const connect = useCallback(
    async (deviceId: string) => {
      setLastError(null);
      try {
        await hub.connect(deviceId);
      } catch {
        setLastError("connect-failed");
        throw new Error("connect-failed");
      }
    },
    [hub]
  );

  const disconnect = useCallback(async () => {
    setLastError(null);
    await hub.disconnect();
  }, [hub]);

  const reconnectSaved = useCallback(async () => hub.reconnectSaved(), [hub]);

  const value = useMemo(
    () => ({
      supported: hub.isSupported(),
      state,
      device,
      discovered,
      startScan,
      stopScan,
      connect,
      disconnect,
      reconnectSaved,
      lastError,
    }),
    [hub, state, device, discovered, startScan, stopScan, connect, disconnect, reconnectSaved, lastError]
  );

  return <TasbihDeviceContext.Provider value={value}>{children}</TasbihDeviceContext.Provider>;
}

export function useTasbihDevice(): TasbihDeviceContextValue {
  const ctx = useContext(TasbihDeviceContext);
  if (!ctx) throw new Error("useTasbihDevice outside provider");
  return ctx;
}

export function useTasbihDeviceCounter(onEvent: (event: TasbihDeviceCounterEvent) => void): void {
  const hub = useMemo(() => getTasbihBleHub(), []);
  useEffect(() => hub.onCounter(onEvent), [hub, onEvent]);
}
