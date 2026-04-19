import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus, InteractionManager, Platform } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
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
};

/** Толық мәлімет — құбыла экраны сияқты жиі жаңартылатын UI үшін */
export type QiblaSensorValue = QiblaStableValue & QiblaMotionValue;

const QiblaStableContext = createContext<QiblaStableValue | null>(null);
const QiblaMotionContext = createContext<QiblaMotionValue | null>(null);

function headingFromMagnetometer(x: number, y: number): number {
  let h = Math.atan2(y, x) * (180 / Math.PI);
  h = 90 - h;
  if (Platform.OS === "android") h = -h;
  return (h + 360) % 360;
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

/** UI жиі қатып қалмас үшін; құбыла «қуып қалмау» үшін аралық пен өзгеріс шегін теңдестіреміз. */
const MAG_HEADING_MIN_INTERVAL_MS = 55;
const MAG_HEADING_MIN_DELTA_DEG = 0.55;
/** sin/cos бойынша EMA — дірілді азайтып, бұруды ілесірерлік сақтайды */
const HEADING_EMA_ALPHA = 0.32;

export function QiblaSensorProvider({ children }: { children: React.ReactNode }) {
  const [perm, setPerm] = useState<QiblaPerm>("unknown");
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [positionFailed, setPositionFailed] = useState(false);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const magRef = useRef<{ remove: () => void } | null>(null);
  const lastHeadingPushMs = useRef(0);
  const lastHeadingEmitted = useRef(0);
  const emaCos = useRef<number | null>(null);
  const emaSin = useRef<number | null>(null);
  /** GPS/рұқсат дайын болғанда магнитометрді қайта қосуға болады (фонда listener алынып тасталады) */
  const magMayUseRef = useRef(false);

  const subscribeMagnetometer = useCallback(() => {
    Magnetometer.setUpdateInterval(80);
    magRef.current?.remove();
    lastHeadingPushMs.current = 0;
    lastHeadingEmitted.current = 0;
    emaCos.current = null;
    emaSin.current = null;
    magRef.current = Magnetometer.addListener((data) => {
      const raw = headingFromMagnetometer(data.x, data.y);
      const rad = (raw * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      const a = HEADING_EMA_ALPHA;
      if (emaCos.current == null || emaSin.current == null) {
        emaCos.current = c;
        emaSin.current = s;
      } else {
        emaCos.current = (1 - a) * emaCos.current + a * c;
        emaSin.current = (1 - a) * emaSin.current + a * s;
      }
      let h = Math.atan2(emaSin.current, emaCos.current) * (180 / Math.PI);
      h = (h + 360) % 360;
      const now = Date.now();
      const delta = Math.abs(angleDiff(lastHeadingEmitted.current, h));
      const elapsed = now - lastHeadingPushMs.current;
      if (elapsed < MAG_HEADING_MIN_INTERVAL_MS && delta < MAG_HEADING_MIN_DELTA_DEG) {
        return;
      }
      lastHeadingEmitted.current = h;
      lastHeadingPushMs.current = now;
      setHeading(h);
    });
  }, []);

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
          subscribeMagnetometer();
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
      magRef.current?.remove();
      magRef.current = null;
    };
  }, [applyCoords, subscribeMagnetometer]);

  /** Қолданба фонда тұрғанда магнитометрді тоқтату — қайта кіргенде JS қатып қалмасын */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        if (magMayUseRef.current) {
          subscribeMagnetometer();
        }
      } else {
        magRef.current?.remove();
        magRef.current = null;
      }
    });
    return () => sub.remove();
  }, [subscribeMagnetometer]);

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
    }),
    [heading, rotateDeg]
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
