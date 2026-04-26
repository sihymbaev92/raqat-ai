import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { angleDiff, bearingToKaaba } from "../lib/qibla";
import { getRootNavReady, getRootNavState, subscribeRootNavState } from "../voice/rootNavStateStore";
import { shouldRunQiblaMotionSensors } from "../voice/deriveGlobalVoiceEntry";

export type QiblaPerm = "unknown" | "granted" | "denied" | "services_disabled";

export type LocationSource = "gps" | "city" | "none";

export type QiblaStableValue = {
  perm: QiblaPerm;
  bearing: number | null;
  positionFailed: boolean;
  locationSource: LocationSource;
  refreshBearing: () => Promise<void>;
  resumeHeadingSubscription: () => void;
};

export type QiblaMotionValue = {
  heading: number;
  rotateDeg: number;
  motionMode: "balanced" | "fast";
  setMotionMode: (mode: "balanced" | "fast") => void;
};

export type QiblaSensorValue = QiblaStableValue & QiblaMotionValue;

const QiblaStableContext = createContext<QiblaStableValue | null>(null);
const QiblaMotionDataContext = createContext<QiblaMotionValue | null>(null);

function shouldRunSensorsFromStore(): boolean {
  return shouldRunQiblaMotionSensors(getRootNavState(), getRootNavReady());
}

function smoothHeading(
  mode: "balanced" | "fast",
  prev: number,
  next: number
): number {
  const a = mode === "fast" ? 0.4 : 0.14;
  if (!Number.isFinite(next)) {
    return prev;
  }
  if (!Number.isFinite(prev)) {
    return ((next % 360) + 360) % 360;
  }
  /** 359° -> 1° шекарасында "кері секіру" болмауы үшін шеңберлік тегістеу. */
  const step = angleDiff(prev, next);
  const blended = prev + step * a;
  return ((blended % 360) + 360) % 360;
}

function headingFromMagnetometer(m: { x: number; y: number; z: number }): number {
  const { x, y, z: _z } = m;
  let a: number;
  if (Platform.OS === "ios") {
    a = Math.atan2(x, y) * (180 / Math.PI) + 180;
  } else {
    a = Math.atan2(-y, x) * (180 / Math.PI);
  }
  return (a + 360) % 360;
}

/** expo-location компасы: trueHeading (iOS) / magHeading — Magnetometer-ден дәлірек. */
function headingFromLocationHeading(h: Location.LocationHeadingObject): number {
  const t = h.trueHeading;
  const m = h.magHeading;
  /**
   * Android-та trueHeading кей құрылғыларда сенімсіз/тұрақсыз келеді.
   * Сол үшін iOS + жақсы калибровкада ғана trueHeading аламыз, әйтпесе magHeading.
   */
  const useTrue =
    Platform.OS === "ios" &&
    typeof t === "number" &&
    t >= 0 &&
    typeof h.accuracy === "number" &&
    h.accuracy >= 2;
  const v = useTrue ? t : m;
  if (!Number.isFinite(v)) {
    return 0;
  }
  return ((v % 360) + 360) % 360;
}

const WEB_MOTION: QiblaMotionValue = {
  heading: 0,
  rotateDeg: 0,
  motionMode: "balanced",
  setMotionMode: () => {},
};

const WEB_STABLE: QiblaStableValue = {
  perm: "granted",
  bearing: null,
  positionFailed: true,
  locationSource: "none",
  refreshBearing: async () => {},
  resumeHeadingSubscription: () => {},
};

function QiblaWebProvider({ children }: { children: React.ReactNode }) {
  return (
    <QiblaStableContext.Provider value={WEB_STABLE}>
      <QiblaMotionDataContext.Provider value={WEB_MOTION}>{children}</QiblaMotionDataContext.Provider>
    </QiblaStableContext.Provider>
  );
}

function QiblaNativeProvider({ children }: { children: React.ReactNode }) {
  const [perm, setPerm] = useState<QiblaPerm>("unknown");
  const [bearing, setBearing] = useState<number | null>(null);
  const [positionFailed, setPositionFailed] = useState(false);
  const [locationSource, setLocationSource] = useState<"gps" | "city" | "none">("none");
  const [resumeTick, setResumeTick] = useState(0);

  const [heading, setHeading] = useState(0);
  const [motionMode, setMotionModeState] = useState<"balanced" | "fast">("balanced");
  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  const smHeadRef = useRef(0);
  const lastAutoBearingAtRef = useRef(0);

  const refreshBearing = useCallback(async () => {
    setPositionFailed(false);
    if (perm === "denied" || perm === "services_disabled") {
      return;
    }
    const fg0 = await Location.getForegroundPermissionsAsync();
    if (!fg0.granted) {
      const r = await Location.requestForegroundPermissionsAsync();
      if (!r.granted) {
        setPerm("denied");
        setBearing(null);
        setLocationSource("none");
        return;
      }
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      setPerm("services_disabled");
      setBearing(null);
      setLocationSource("none");
      return;
    }
    setPerm("granted");

    const apply = (lat: number, lng: number, source: "gps" | "city") => {
      setBearing(bearingToKaaba(lat, lng));
      setLocationSource(source);
      setPositionFailed(false);
    };

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.High,
        mayShowUserSettingsDialog: true,
      });
      const acc = pos.coords.accuracy;
      if (acc != null && acc > 1500) {
        setPositionFailed(true);
        setBearing(null);
        setLocationSource("none");
        return;
      }
      apply(pos.coords.latitude, pos.coords.longitude, "gps");
      return;
    } catch {
      /* next */
    }
    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 10 * 60_000,
        requiredAccuracy: 8_000,
      });
      if (last) {
        apply(last.coords.latitude, last.coords.longitude, "gps");
        return;
      }
    } catch {
      /* next */
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });
      const acc = pos.coords.accuracy;
      if (acc != null && acc > 3000) {
        setPositionFailed(true);
        setBearing(null);
        setLocationSource("none");
        return;
      }
      apply(pos.coords.latitude, pos.coords.longitude, "gps");
      return;
    } catch {
      /* last */
    }
    setPositionFailed(true);
    setBearing(null);
    setLocationSource("none");
  }, [perm]);

  const resumeHeadingSubscription = useCallback(() => {
    setResumeTick((t) => t + 1);
  }, []);

  useEffect(() => {
    void (async () => {
      if (perm !== "unknown") {
        return;
      }
      const r0 = await Location.getForegroundPermissionsAsync();
      if (!r0.granted) {
        const r = await Location.requestForegroundPermissionsAsync();
        if (!r.granted) {
          setPerm("denied");
          return;
        }
      } else {
        if (!(await Location.hasServicesEnabledAsync())) {
          setPerm("services_disabled");
          return;
        }
        setPerm("granted");
        void refreshBearing();
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setPerm("services_disabled");
        return;
      }
      setPerm("granted");
      void refreshBearing();
    })();
  }, [perm, refreshBearing]);

  /** Басты бет/Qibla ашық кезде bearing автоматты жаңарып тұрсын. */
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    const maybeRefresh = () => {
      if (!shouldRunSensorsFromStore()) {
        return;
      }
      const now = Date.now();
      if (now - lastAutoBearingAtRef.current < 60_000) {
        return;
      }
      lastAutoBearingAtRef.current = now;
      void refreshBearing();
    };

    maybeRefresh();
    const unNav = subscribeRootNavState(() => {
      maybeRefresh();
    });
    const iv = setInterval(maybeRefresh, 60_000);
    return () => {
      unNav();
      clearInterval(iv);
    };
  }, [refreshBearing]);

  useEffect(() => {
    const s = (next: AppStateStatus) => {
      if (next === "active") {
        resumeHeadingSubscription();
      }
    };
    const sub = AppState.addEventListener("change", s);
    return () => sub.remove();
  }, [resumeHeadingSubscription]);

  const setMotionMode = useCallback((m: "balanced" | "fast") => {
    setMotionModeState(m);
  }, []);

  const motionValue = useMemo<QiblaMotionValue>(
    () => ({
      heading,
      rotateDeg: bearing == null ? 0 : angleDiff(heading, bearing),
      motionMode,
      setMotionMode,
    }),
    [heading, bearing, motionMode, setMotionMode]
  );

  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const magSubRef = useRef<ReturnType<typeof Magnetometer.addListener> | null>(null);
  const lastSubscribed = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const canRun = () => perm === "granted" && shouldRunSensorsFromStore();

    const off = () => {
      headingSubRef.current?.remove();
      headingSubRef.current = null;
      magSubRef.current?.remove();
      magSubRef.current = null;
      lastSubscribed.current = false;
    };

    const startMagnetometerFallback = async () => {
      if (!(await Magnetometer.isAvailableAsync())) {
        return;
      }
      Magnetometer.setUpdateInterval(motionModeRef.current === "fast" ? 80 : 200);
      smHeadRef.current = Number.NaN;
      const sub = Magnetometer.addListener((e) => {
        const raw = headingFromMagnetometer(e);
        const mode = motionModeRef.current;
        smHeadRef.current = smoothHeading(mode, smHeadRef.current, raw);
        setHeading(smHeadRef.current);
      });
      magSubRef.current = sub;
      lastSubscribed.current = true;
    };

    const on = () => {
      if (!canRun()) {
        off();
        return;
      }
      if (bearing == null) {
        void refreshBearing();
      }
      void (async () => {
        if (lastSubscribed.current) {
          if (headingSubRef.current) {
            return;
          }
          if (magSubRef.current) {
            Magnetometer.setUpdateInterval(motionModeRef.current === "fast" ? 80 : 200);
            return;
          }
        }
        off();
        smHeadRef.current = Number.NaN;
        try {
          const sub = await Location.watchHeadingAsync((ev) => {
            const raw = headingFromLocationHeading(ev);
            const mode = motionModeRef.current;
            smHeadRef.current = smoothHeading(mode, smHeadRef.current, raw);
            setHeading(smHeadRef.current);
          });
          headingSubRef.current = sub;
          lastSubscribed.current = true;
        } catch {
          await startMagnetometerFallback();
        }
      })();
    };

    on();
    const unNav = subscribeRootNavState(() => {
      on();
    });

    return () => {
      unNav();
      off();
    };
  }, [perm, resumeTick, motionMode, bearing, refreshBearing]);

  useEffect(() => {
    if (magSubRef.current) {
      Magnetometer.setUpdateInterval(motionMode === "fast" ? 80 : 200);
    }
  }, [motionMode]);

  const stable = useMemo<QiblaStableValue>(
    () => ({
      perm,
      bearing,
      positionFailed,
      locationSource,
      refreshBearing,
      resumeHeadingSubscription,
    }),
    [perm, bearing, positionFailed, locationSource, refreshBearing, resumeHeadingSubscription]
  );

  return (
    <QiblaStableContext.Provider value={stable}>
      <QiblaMotionDataContext.Provider value={motionValue}>{children}</QiblaMotionDataContext.Provider>
    </QiblaStableContext.Provider>
  );
}

export function QiblaSensorProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return <QiblaWebProvider>{children}</QiblaWebProvider>;
  }
  return <QiblaNativeProvider>{children}</QiblaNativeProvider>;
}

export function useQiblaStable(): QiblaStableValue {
  const v = useContext(QiblaStableContext);
  if (!v) {
    throw new Error("useQiblaStable: QiblaSensorProvider жоқ");
  }
  return v;
}

export function useQiblaMotion(): QiblaMotionValue {
  const v = useContext(QiblaMotionDataContext);
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
