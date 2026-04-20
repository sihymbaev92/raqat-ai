import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus, InteractionManager, Platform } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCityApproxCoords } from "../constants/kzCities";
import { getSelectedCity } from "../storage/prefs";
import { angleDiff, bearingToKaaba } from "../lib/qibla";

export type QiblaPerm = "unknown" | "granted" | "denied" | "services_disabled";

export type LocationSource = "gps" | "city" | "none";

export type QiblaStableValue = {
  perm: QiblaPerm;
  bearing: number | null;
  /** Рұқсат бар, бірақ координата алынбады (таймаут, ішкі бөлме т.б.) */
  positionFailed: boolean;
  /** GPS немесе таңдалған қала орталығы бойынша */
  locationSource: LocationSource;
  refreshBearing: () => Promise<void>;
};

export type QiblaMotionValue = {
  heading: number;
  /** Қағбаға бұру үшін телефонды бұрау бұрышы (градус) */
  rotateDeg: number;
  motionMode: "balanced" | "fast";
  setMotionMode: (mode: "balanced" | "fast") => void;
};

/** Толық мәлімет — құбыла экраны сияқты жиі жаңартылатын UI үшін */
export type QiblaSensorValue = QiblaStableValue & QiblaMotionValue;

const QiblaStableContext = createContext<QiblaStableValue | null>(null);
const QiblaMotionContext = createContext<QiblaMotionValue | null>(null);

function normalizeHeadingDeg(v: number): number {
  return ((v % 360) + 360) % 360;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(null), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch(() => {
      clearTimeout(id);
      resolve(null);
    });
  });
}

type ResolveCoordsOpts = {
  /** getCurrentPosition үшін әр әрекеттің макс. күтуі (мс) */
  positionTimeoutMs?: number;
  /** GPS дәлдік кезегінің ұзындығы (1–3) */
  maxAttempts?: number;
};

/** Соңғы белгілі орын (жылдам), содан дәлдік бойынша кезек; әр шақыруға таймаут */
async function resolveCoordinates(opts?: ResolveCoordsOpts): Promise<{ latitude: number; longitude: number } | null> {
  const positionTimeoutMs = opts?.positionTimeoutMs ?? 16_000;
  const maxAttempts = Math.min(3, Math.max(1, opts?.maxAttempts ?? 3));

  const servicesOk = await Location.hasServicesEnabledAsync();
  if (!servicesOk) return null;

  try {
    const last = await withTimeout(
      Location.getLastKnownPositionAsync({
        maxAge: 600_000,
        requiredAccuracy: 5000,
      }),
      4000
    );
    if (last?.coords) {
      return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    }
  } catch {
    /* келесі қадам */
  }

  const attempts: Location.LocationOptions[] = [
    { accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: true },
    { accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: true },
    { accuracy: Location.Accuracy.Low, mayShowUserSettingsDialog: true },
  ].slice(0, maxAttempts);

  for (const locOpts of attempts) {
    try {
      const loc = await withTimeout(Location.getCurrentPositionAsync(locOpts), positionTimeoutMs);
      if (loc?.coords) {
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch {
      /* келесі дәлдік */
    }
  }

  if (Platform.OS === "android") {
    try {
      await Location.enableNetworkProviderAsync();
      const loc = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        }),
        positionTimeoutMs
      );
      if (loc?.coords) {
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch {
      /* жоқ */
    }
  }

  return null;
}

async function resolveGpsOrCity(
  coordsOpts?: ResolveCoordsOpts
): Promise<{ lat: number; lon: number; source: LocationSource } | null> {
  const gps = await resolveCoordinates(coordsOpts);
  if (gps) return { lat: gps.latitude, lon: gps.longitude, source: "gps" };
  const { city } = await getSelectedCity();
  const approx = getCityApproxCoords(city);
  if (approx) return { lat: approx.lat, lon: approx.lon, source: "city" };
  return null;
}

type QiblaMotionConfig = {
  updateIntervalMs: number;
  minEmitIntervalMs: number;
  minDeltaDeg: number;
  emaAlpha: number;
};

const QIBLA_MODE_KEY = "qibla_motion_mode_v1";
const QIBLA_MOTION_CONFIG: Record<"balanced" | "fast", QiblaMotionConfig> = {
  balanced: {
    updateIntervalMs: 80,
    minEmitIntervalMs: 60,
    minDeltaDeg: 0.52,
    emaAlpha: 0.34,
  },
  fast: {
    updateIntervalMs: 16,
    minEmitIntervalMs: 16,
    minDeltaDeg: 0.12,
    emaAlpha: 0.58,
  },
};

export function QiblaSensorProvider({ children }: { children: React.ReactNode }) {
  const [perm, setPerm] = useState<QiblaPerm>("unknown");
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [positionFailed, setPositionFailed] = useState(false);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [motionMode, setMotionModeState] = useState<"balanced" | "fast">("balanced");
  const magRef = useRef<{ remove: () => void } | null>(null);
  const headingWatchRef = useRef<Location.LocationSubscription | null>(null);
  const lastHeadingPushMs = useRef(0);
  const lastHeadingEmitted = useRef(0);
  const emaCos = useRef<number | null>(null);
  const emaSin = useRef<number | null>(null);
  /** GPS/рұқсат дайын болғанда магнитометрді қайта қосуға болады (фонда listener алынып тасталады) */
  const magMayUseRef = useRef(false);

  const setMotionMode = useCallback((mode: "balanced" | "fast") => {
    setMotionModeState(mode);
    void AsyncStorage.setItem(QIBLA_MODE_KEY, mode).catch(() => {});
  }, []);

  const emitHeading = useCallback((rawHeading: number) => {
    const raw = normalizeHeadingDeg(rawHeading);
    const rad = (raw * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const cfg = QIBLA_MOTION_CONFIG[motionMode];
    const a = cfg.emaAlpha;
    if (emaCos.current == null || emaSin.current == null) {
      emaCos.current = c;
      emaSin.current = s;
    } else {
      emaCos.current = (1 - a) * emaCos.current + a * c;
      emaSin.current = (1 - a) * emaSin.current + a * s;
    }
    let h = Math.atan2(emaSin.current, emaCos.current) * (180 / Math.PI);
    h = normalizeHeadingDeg(h);
    const now = Date.now();
    const delta = Math.abs(angleDiff(lastHeadingEmitted.current, h));
    const elapsed = now - lastHeadingPushMs.current;
    if (elapsed < cfg.minEmitIntervalMs && delta < cfg.minDeltaDeg) {
      return;
    }
    lastHeadingEmitted.current = h;
    lastHeadingPushMs.current = now;
    setHeading(h);
  }, [motionMode]);

  const clearHeadingSubs = useCallback(() => {
    headingWatchRef.current?.remove();
    headingWatchRef.current = null;
    magRef.current?.remove();
    magRef.current = null;
  }, []);

  const subscribeMagnetometer = useCallback(() => {
    const cfg = QIBLA_MOTION_CONFIG[motionMode];
    Magnetometer.setUpdateInterval(cfg.updateIntervalMs);
    magRef.current?.remove();
    lastHeadingPushMs.current = 0;
    lastHeadingEmitted.current = 0;
    emaCos.current = null;
    emaSin.current = null;
    magRef.current = Magnetometer.addListener((data) => {
      // Fallback-only: heading stream жоқ құрылғылар үшін қарапайым магнитометр.
      const raw = 90 - Math.atan2(data.y, data.x) * (180 / Math.PI);
      emitHeading(raw);
    });
  }, [emitHeading, motionMode]);

  const subscribeHeading = useCallback(async () => {
    clearHeadingSubs();
    lastHeadingPushMs.current = 0;
    lastHeadingEmitted.current = 0;
    emaCos.current = null;
    emaSin.current = null;
    try {
      const sub = await Location.watchHeadingAsync((h) => {
        const src =
          Number.isFinite(h.trueHeading) && h.trueHeading >= 0
            ? h.trueHeading
            : h.magHeading;
        if (typeof src === "number" && Number.isFinite(src)) {
          emitHeading(src);
        }
      });
      headingWatchRef.current = sub;
    } catch {
      subscribeMagnetometer();
    }
  }, [clearHeadingSubs, emitHeading, subscribeMagnetometer]);

  const applyCoords = useCallback((latitude: number, longitude: number, source: LocationSource) => {
    setBearing(bearingToKaaba(latitude, longitude));
    setPositionFailed(false);
    setLocationSource(source);
  }, []);

  const refreshBearing = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    const servicesOk = await Location.hasServicesEnabledAsync();
    if (!servicesOk) {
      setPerm("services_disabled");
      setBearing(null);
      setPositionFailed(false);
      setLocationSource("none");
      return;
    }

    const pos = await resolveGpsOrCity();
    if (pos) {
      setPerm("granted");
      applyCoords(pos.lat, pos.lon, pos.source);
    } else {
      setPerm("granted");
      setBearing(null);
      setPositionFailed(true);
      setLocationSource("none");
    }
  }, [applyCoords]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const savedMode = (await AsyncStorage.getItem(QIBLA_MODE_KEY))?.trim();
        if (alive && (savedMode === "balanced" || savedMode === "fast")) {
          setMotionModeState(savedMode);
        }
        /* Алғашқы кадр + onboarding/сплэш сызылсын; рұқсат+GPS бірден UI-ды ұзақ бұғаттамауы үшін */
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        });
        await new Promise<void>((r) => setTimeout(r, 320));
        if (!alive) return;

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
        }
        if (!alive) return;

        if (status !== "granted") {
          setPerm("denied");
          return;
        }

        const servicesOk = await Location.hasServicesEnabledAsync();
        if (!alive) return;
        if (!servicesOk) {
          setPerm("services_disabled");
          setBearing(null);
          setPositionFailed(false);
          setLocationSource("none");
          return;
        }

        const pos = await resolveGpsOrCity({ positionTimeoutMs: 9000, maxAttempts: 2 });
        if (!alive) return;
        if (pos) {
          setPerm("granted");
          applyCoords(pos.lat, pos.lon, pos.source);
        } else {
          setPerm("granted");
          setBearing(null);
          setPositionFailed(true);
          setLocationSource("none");
        }

        magMayUseRef.current = true;
        if (AppState.currentState === "active") {
          void subscribeHeading();
        }
      } catch {
        if (alive) {
          setPerm("denied");
          setBearing(null);
        }
      }
    })();

    return () => {
      alive = false;
      magMayUseRef.current = false;
      clearHeadingSubs();
    };
  }, [applyCoords, clearHeadingSubs, subscribeHeading]);

  /** Қолданба фонда тұрғанда магнитометрді тоқтату — қайта кіргенде JS қатып қалмасын */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        if (magMayUseRef.current) {
          void subscribeHeading();
        }
      } else {
        clearHeadingSubs();
      }
    });
    return () => sub.remove();
  }, [clearHeadingSubs, subscribeHeading]);

  const rotateDeg = bearing != null ? angleDiff(heading, bearing) : 0;

  const stableValue = useMemo<QiblaStableValue>(
    () => ({
      perm,
      bearing,
      positionFailed,
      locationSource,
      refreshBearing,
    }),
    [perm, bearing, positionFailed, locationSource, refreshBearing]
  );

  const motionValue = useMemo<QiblaMotionValue>(
    () => ({
      heading,
      rotateDeg,
      motionMode,
      setMotionMode,
    }),
    [heading, rotateDeg, motionMode, setMotionMode]
  );

  return (
    <QiblaStableContext.Provider value={stableValue}>
      <QiblaMotionContext.Provider value={motionValue}>{children}</QiblaMotionContext.Provider>
    </QiblaStableContext.Provider>
  );
}

/** GPS/бағыт — сирек өзгереді; басты бет осыны ғана тыңдаса, магнитометр JS-ті қатырмайды */
export function useQiblaStable(): QiblaStableValue {
  const v = useContext(QiblaStableContext);
  if (!v) {
    throw new Error("useQiblaStable: QiblaSensorProvider жоқ");
  }
  return v;
}

/** Компас бұрышы — жиі жаңартады; тек кіші құраушыларда қолданыңыз */
export function useQiblaMotion(): QiblaMotionValue {
  const v = useContext(QiblaMotionContext);
  if (!v) {
    throw new Error("useQiblaMotion: QiblaSensorProvider жоқ");
  }
  return v;
}

export function useQiblaSensor(): QiblaSensorValue {
  const stable = useQiblaStable();
  const motion = useQiblaMotion();
  return useMemo(
    () => ({ ...stable, ...motion }),
    [stable, motion]
  );
}
