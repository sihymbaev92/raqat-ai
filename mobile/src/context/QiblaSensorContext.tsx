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
import { Accelerometer, Magnetometer } from "expo-sensors";
import { angleDiff, bearingToKaaba } from "../lib/qibla";
import { headingFromLocationHeading, normHeadingDeg } from "../lib/qiblaLocationHeading";
import { magneticDeclinationEastDeg } from "../lib/qiblaDeclinationApprox";
import { magnetometerHeadingDeg, type Vec3 } from "../lib/qiblaHeadingFromSensors";
import { getCityApproxCoords } from "../constants/kzCities";
import { getQiblaMotionMode, getSelectedCity, setQiblaMotionMode } from "../storage/prefs";
import { pushAndroidWidgetQiblaHeading } from "../storage/prayerCache";
import { getRootNavReady, getRootNavState, subscribeRootNavState } from "../voice/rootNavStateStore";
import { shouldRunQiblaMotionSensors } from "../voice/deriveGlobalVoiceEntry";
import { canUseNativeDeviceHeading, startNativeDeviceHeading, stopNativeDeviceHeading } from "../lib/qiblaNativeDeviceHeading";

export type QiblaPerm = "unknown" | "granted" | "denied" | "services_disabled";

export type LocationSource = "gps" | "city" | "none";
export type QiblaCompassQuality = "unknown" | "high" | "medium" | "low";

export type QiblaStableValue = {
  perm: QiblaPerm;
  bearing: number | null;
  positionFailed: boolean;
  locationSource: LocationSource;
  locationAccuracyM: number | null;
  refreshBearing: () => Promise<void>;
  resumeHeadingSubscription: () => void;
};

export type QiblaMotionValue = {
  heading: number;
  /** Бірінші магнит/Location heading үлгісі келгенше false — rotateDeg сенімді емес (0° жалған «тура» болмауы үшін). */
  headingHasSample: boolean;
  headingAccuracyDeg: number | null;
  compassQuality: QiblaCompassQuality;
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
  if (!Number.isFinite(next)) {
    return prev;
  }
  if (!Number.isFinite(prev)) {
    return ((next % 360) + 360) % 360;
  }
  /** 359° -> 1° шекарасында "кері секіру" болмауы үшін шеңберлік тегістеу. */
  const rawStep = angleDiff(prev, next);
  const absStep = Math.abs(rawStep);
  /** Fast режим: стрелка қолға бірден ерсін; balanced — dashboard-та жеңіл тұрақтылық. */
  const deadZone = mode === "fast" ? 0.06 : 0.16;
  if (absStep <= deadZone) {
    return prev;
  }
  /** Бір кадрда тым үлкен секіруді шектейміз (магнит шу/қолдың дірілі). */
  const maxStep = mode === "fast" ? 96 : 22;
  const clampedStep = Math.max(-maxStep, Math.min(maxStep, rawStep));
  const alpha = mode === "fast" ? 0.88 : 0.5;
  const blended = prev + clampedStep * alpha;
  return ((blended % 360) + 360) % 360;
}

function compassQualityFromHeadingAccuracy(acc?: number): QiblaCompassQuality {
  if (typeof acc !== "number" || !Number.isFinite(acc) || acc <= 0) {
    return "unknown";
  }
  if (acc <= 5) return "high";
  if (acc <= 18) return "medium";
  return "low";
}

function compassQualityFromMagneticField(m: Vec3): QiblaCompassQuality {
  const strength = Math.hypot(m.x, m.y, m.z);
  if (!Number.isFinite(strength) || strength <= 0) {
    return "unknown";
  }
  /** Жер магнит өрісі әдетте шамамен 25–65 µT; сыртында болса металл/шу болуы мүмкін. */
  if (strength >= 25 && strength <= 65) return "high";
  if (strength >= 15 && strength <= 90) return "medium";
  return "low";
}

type WebDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

type WebDeviceOrientationEventConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function browserOrientationHeading(ev: WebDeviceOrientationEvent): {
  heading: number | null;
  accuracy: number | null;
} {
  if (typeof ev.webkitCompassHeading === "number" && Number.isFinite(ev.webkitCompassHeading)) {
    return {
      heading: normHeadingDeg(ev.webkitCompassHeading),
      accuracy:
        typeof ev.webkitCompassAccuracy === "number" && Number.isFinite(ev.webkitCompassAccuracy)
          ? ev.webkitCompassAccuracy
          : null,
    };
  }
  if (typeof ev.alpha === "number" && Number.isFinite(ev.alpha)) {
    /** Android Chrome: alpha өсі Z бойынша айналу; compass heading үшін кері бағытқа нормалаймыз. */
    return { heading: normHeadingDeg(360 - ev.alpha), accuracy: null };
  }
  return { heading: null, accuracy: null };
}

async function requestWebOrientationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof window.DeviceOrientationEvent === "undefined") {
    return false;
  }
  const ctor = window.DeviceOrientationEvent as WebDeviceOrientationEventConstructor;
  if (typeof ctor.requestPermission !== "function") {
    return true;
  }
  try {
    return (await ctor.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function QiblaWebProvider({ children }: { children: React.ReactNode }) {
  const [perm, setPerm] = useState<QiblaPerm>("unknown");
  const [bearing, setBearing] = useState<number | null>(null);
  const [positionFailed, setPositionFailed] = useState(false);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [locationAccuracyM, setLocationAccuracyM] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [headingHasSample, setHeadingHasSample] = useState(false);
  const [headingAccuracyDeg, setHeadingAccuracyDeg] = useState<number | null>(null);
  const [compassQuality, setCompassQuality] = useState<QiblaCompassQuality>("unknown");
  const [motionMode, setMotionModeState] = useState<"balanced" | "fast">("balanced");
  const [resumeTick, setResumeTick] = useState(0);

  const bearingRef = useRef<number | null>(null);
  bearingRef.current = bearing;
  const smHeadRef = useRef(Number.NaN);
  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  const refreshBearing = useCallback(async () => {
    setPositionFailed(false);
    void requestWebOrientationPermission().then((allowed) => {
      if (allowed) {
        setResumeTick((t) => t + 1);
      }
    });

    const apply = (lat: number, lng: number, source: LocationSource, accuracyM?: number | null) => {
      setBearing(bearingToKaaba(lat, lng));
      setLocationSource(source);
      setLocationAccuracyM(source === "gps" && typeof accuracyM === "number" ? accuracyM : null);
      setPerm("granted");
      setPositionFailed(false);
    };

    const applyCityFallback = async () => {
      try {
        const { city } = await getSelectedCity();
        const cityCoords = getCityApproxCoords(city);
        if (cityCoords) {
          apply(cityCoords.lat, cityCoords.lon, "city");
          return true;
        }
      } catch {
        /* fallback below */
      }
      return false;
    };

    const hasApprox = await applyCityFallback();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (!hasApprox) {
        setPerm("services_disabled");
        setPositionFailed(true);
        setBearing(null);
        setLocationSource("none");
      }
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 5 * 60_000,
        });
      });
      apply(pos.coords.latitude, pos.coords.longitude, "gps", pos.coords.accuracy);
    } catch (err) {
      if (hasApprox || bearingRef.current != null) {
        setPerm("granted");
        return;
      }
      /** Browser settings can't be opened reliably; keep the retry UI available on web. */
      setPerm("granted");
      setPositionFailed(true);
      setBearing(null);
      setLocationSource("none");
      setLocationAccuracyM(null);
    }
  }, []);

  const resumeHeadingSubscription = useCallback(() => {
    setResumeTick((t) => t + 1);
  }, []);

  const setMotionMode = useCallback((m: "balanced" | "fast") => {
    const next = m === "fast" ? "balanced" : m;
    setMotionModeState(next);
    void setQiblaMotionMode(next);
  }, []);

  useEffect(() => {
    void getQiblaMotionMode().then(setMotionModeState);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { city } = await getSelectedCity();
        const cityCoords = getCityApproxCoords(city);
        if (!alive) return;
        if (cityCoords) {
          setBearing(bearingToKaaba(cityCoords.lat, cityCoords.lon));
          setLocationSource("city");
          setLocationAccuracyM(null);
        }
      } catch {
        /* Құбыла бетіне кіргенде нақты рұқсат сұралады. */
      } finally {
        if (alive) setPerm("granted");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (resumeTick <= 0) {
      return;
    }
    let alive = true;
    let remove: (() => void) | null = null;

    void (async () => {
      if (typeof window === "undefined") {
        return;
      }
      const allowed = await requestWebOrientationPermission();
      if (!alive || !allowed) {
        setHeadingHasSample(false);
        setCompassQuality("unknown");
        return;
      }

      smHeadRef.current = Number.NaN;
      const onOrientation = (event: DeviceOrientationEvent) => {
        const { heading: rawHeading, accuracy } = browserOrientationHeading(event as WebDeviceOrientationEvent);
        if (rawHeading == null) {
          return;
        }
        const mode = motionModeRef.current;
        smHeadRef.current = smoothHeading(mode, smHeadRef.current, rawHeading);
        setHeading(smHeadRef.current);
        setHeadingHasSample(true);
        setHeadingAccuracyDeg(accuracy);
        setCompassQuality(accuracy == null ? "medium" : compassQualityFromHeadingAccuracy(accuracy));
      };

      window.addEventListener("deviceorientationabsolute", onOrientation);
      window.addEventListener("deviceorientation", onOrientation);
      remove = () => {
        window.removeEventListener("deviceorientationabsolute", onOrientation);
        window.removeEventListener("deviceorientation", onOrientation);
      };
    })();

    return () => {
      alive = false;
      remove?.();
    };
  }, [resumeTick, motionMode]);

  const motionValue = useMemo<QiblaMotionValue>(
    () => ({
      heading,
      headingHasSample,
      headingAccuracyDeg,
      compassQuality,
      rotateDeg: bearing == null || !headingHasSample ? 0 : angleDiff(heading, bearing),
      motionMode,
      setMotionMode,
    }),
    [heading, headingHasSample, headingAccuracyDeg, compassQuality, bearing, motionMode, setMotionMode]
  );

  const stable = useMemo<QiblaStableValue>(
    () => ({
      perm,
      bearing,
      positionFailed,
      locationSource,
      locationAccuracyM,
      refreshBearing,
      resumeHeadingSubscription,
    }),
    [perm, bearing, positionFailed, locationSource, locationAccuracyM, refreshBearing, resumeHeadingSubscription]
  );

  return (
    <QiblaStableContext.Provider value={stable}>
      <QiblaMotionDataContext.Provider value={motionValue}>{children}</QiblaMotionDataContext.Provider>
    </QiblaStableContext.Provider>
  );
}

function QiblaNativeProvider({ children }: { children: React.ReactNode }) {
  const [perm, setPerm] = useState<QiblaPerm>("unknown");
  const [bearing, setBearing] = useState<number | null>(null);
  const [positionFailed, setPositionFailed] = useState(false);
  const [locationSource, setLocationSource] = useState<"gps" | "city" | "none">("none");
  const [locationAccuracyM, setLocationAccuracyM] = useState<number | null>(null);
  const [resumeTick, setResumeTick] = useState(0);

  const [heading, setHeading] = useState(0);
  const [headingHasSample, setHeadingHasSample] = useState(false);
  const [headingAccuracyDeg, setHeadingAccuracyDeg] = useState<number | null>(null);
  const [compassQuality, setCompassQuality] = useState<QiblaCompassQuality>("unknown");
  const [motionMode, setMotionModeState] = useState<"balanced" | "fast">("balanced");
  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  const bearingRef = useRef<number | null>(null);
  bearingRef.current = bearing;

  const smHeadRef = useRef(0);
  const lastAutoBearingAtRef = useRef(0);
  /** Орын белгілі болғанда: магниттік→гео түзету (° шығыс оң). */
  const declRef = useRef(0);

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
        declRef.current = 0;
        setBearing(null);
        setLocationSource("none");
        return;
      }
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      setPerm("services_disabled");
      declRef.current = 0;
      setBearing(null);
      setLocationSource("none");
      return;
    }
    setPerm("granted");

    const apply = (lat: number, lng: number, source: "gps" | "city", accuracyM?: number | null) => {
      declRef.current = magneticDeclinationEastDeg(lat, lng);
      setBearing(bearingToKaaba(lat, lng));
      setLocationSource(source);
      setLocationAccuracyM(source === "gps" && typeof accuracyM === "number" ? accuracyM : null);
      setPositionFailed(false);
    };

    const applyCityFallback = async () => {
      try {
        const { city } = await getSelectedCity();
        const cityCoords = getCityApproxCoords(city);
        if (cityCoords) {
          apply(cityCoords.lat, cityCoords.lon, "city");
          return true;
        }
      } catch {
        /* next */
      }
      return false;
    };

    /** Алдымен экранда бірден бағыт болсын, кейін GPS нақтылап жаңартады. */
    const hasApprox = await applyCityFallback();

    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: 15 * 60_000,
        requiredAccuracy: 3_000,
      });
      if (last) {
        const la = last.coords.accuracy;
        /** Соңғы нақты орын болса, GPS күткенше бірден сол бойынша көрсетеміз. */
        if (la == null || la <= 2_500) {
          apply(last.coords.latitude, last.coords.longitude, "gps", la);
        }
      }
    } catch {
      /* next */
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        /** Алғашқы live fix тез келсін — кейін BestForNavigation нақтылайды. */
        accuracy: Location.LocationAccuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });
      apply(pos.coords.latitude, pos.coords.longitude, "gps", pos.coords.accuracy);
      if (pos.coords.accuracy != null && pos.coords.accuracy <= 80) {
        return;
      }
    } catch {
      /* next */
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        /** Навигациялық ең жоғары дәлдік — құбыла азимутын соңынан нақтылау үшін. */
        accuracy: Location.LocationAccuracy.BestForNavigation,
        mayShowUserSettingsDialog: true,
      });
      apply(pos.coords.latitude, pos.coords.longitude, "gps", pos.coords.accuracy);
      return;
    } catch {
      /* last */
    }

    if (hasApprox || bearingRef.current != null) {
      return;
    }
    declRef.current = 0;
    setPositionFailed(true);
    setBearing(null);
    setLocationSource("none");
    setLocationAccuracyM(null);
  }, [perm]);

  const resumeHeadingSubscription = useCallback(() => {
    setResumeTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (perm !== "unknown") {
        return;
      }
      try {
        const { city } = await getSelectedCity();
        const cityCoords = getCityApproxCoords(city);
        if (!alive) return;
        if (cityCoords) {
          declRef.current = magneticDeclinationEastDeg(cityCoords.lat, cityCoords.lon);
          setBearing(bearingToKaaba(cityCoords.lat, cityCoords.lon));
          setLocationSource("city");
          setLocationAccuracyM(null);
        }
      } catch {
        /* Qibla экранына кіргенде нақты GPS сұралады. */
      }

      const r0 = await Location.getForegroundPermissionsAsync();
      if (!alive) return;
      if (r0.granted) {
        if (!(await Location.hasServicesEnabledAsync())) {
          if (!alive) return;
          setPerm("services_disabled");
          return;
        }
        if (!alive) return;
        setPerm("granted");
        void refreshBearing();
        return;
      }
      setPerm("unknown");
    })();
    return () => {
      alive = false;
    };
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

  useEffect(() => {
    void getQiblaMotionMode().then(setMotionModeState);
  }, []);

  const setMotionMode = useCallback((m: "balanced" | "fast") => {
    const next = m === "fast" ? "balanced" : m;
    setMotionModeState(next);
    void setQiblaMotionMode(next);
  }, []);

  const motionValue = useMemo<QiblaMotionValue>(
    () => ({
      heading,
      headingHasSample,
      headingAccuracyDeg,
      compassQuality,
      rotateDeg:
        bearing == null || !headingHasSample ? 0 : angleDiff(heading, bearing),
      motionMode,
      setMotionMode,
    }),
    [heading, headingHasSample, headingAccuracyDeg, compassQuality, bearing, motionMode, setMotionMode]
  );

  const lastWidgetHeadingPushRef = useRef(0);

  /** Android home widget: құбыла стрелкасын қолданба ашық кезде жаңарту. */
  useEffect(() => {
    if (Platform.OS !== "android" || !headingHasSample) {
      return;
    }
    const now = Date.now();
    if (now - lastWidgetHeadingPushRef.current < 200) {
      return;
    }
    lastWidgetHeadingPushRef.current = now;
    pushAndroidWidgetQiblaHeading(heading);
  }, [heading, headingHasSample]);

  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const nativeHeadingStopRef = useRef<(() => void) | null>(null);
  const magSubRef = useRef<ReturnType<typeof Magnetometer.addListener> | null>(null);
  const accelSubRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const accelRef = useRef<Vec3>({ x: 0, y: 0, z: 9.81 });
  const accelReadyRef = useRef(false);
  const lastSubscribed = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    let disposed = false;
    let startSeq = 0;

    const canRun = () => perm === "granted" && shouldRunSensorsFromStore();

    const off = () => {
      startSeq += 1;
      headingSubRef.current?.remove();
      headingSubRef.current = null;
      nativeHeadingStopRef.current?.();
      nativeHeadingStopRef.current = null;
      stopNativeDeviceHeading();
      magSubRef.current?.remove();
      magSubRef.current = null;
      accelSubRef.current?.remove();
      accelSubRef.current = null;
      accelReadyRef.current = false;
      lastSubscribed.current = false;
      setHeadingHasSample(false);
      setHeadingAccuracyDeg(null);
      setCompassQuality("unknown");
    };

    const startMagnetometerFallback = async (seq: number) => {
      if (!(await Magnetometer.isAvailableAsync())) {
        return;
      }
      if (disposed || seq !== startSeq || !canRun()) return;
      const interval = motionModeRef.current === "fast" ? 30 : 70;
      Magnetometer.setUpdateInterval(interval);
      if (await Accelerometer.isAvailableAsync()) {
        Accelerometer.setUpdateInterval(interval);
      }
      if (disposed || seq !== startSeq || !canRun()) return;
      smHeadRef.current = Number.NaN;
      accelRef.current = { x: 0, y: 0, z: 9.81 };
      accelReadyRef.current = false;
      if (await Accelerometer.isAvailableAsync()) {
        if (disposed || seq !== startSeq || !canRun()) return;
        accelSubRef.current = Accelerometer.addListener((a) => {
          if (disposed || seq !== startSeq) return;
          const v: Vec3 = { x: a.x, y: a.y, z: a.z };
          if (Math.hypot(v.x, v.y, v.z) > 0.35) {
            const prev = accelRef.current;
            accelRef.current = {
              x: prev.x * 0.86 + v.x * 0.14,
              y: prev.y * 0.86 + v.y * 0.14,
              z: prev.z * 0.86 + v.z * 0.14,
            };
            accelReadyRef.current = true;
          }
        });
      }
      if (disposed || seq !== startSeq || !canRun()) return;
      const sub = Magnetometer.addListener((e) => {
        if (disposed || seq !== startSeq) return;
        const m: Vec3 = { x: e.x, y: e.y, z: e.z };
        const rawMag = magnetometerHeadingDeg(m, accelRef.current, accelReadyRef.current, Platform.OS);
        const raw = normHeadingDeg(rawMag + declRef.current);
        const mode = motionModeRef.current;
        smHeadRef.current = smoothHeading(mode, smHeadRef.current, raw);
        setHeading(smHeadRef.current);
        setHeadingHasSample(true);
        setHeadingAccuracyDeg(null);
        setCompassQuality(compassQualityFromMagneticField(m));
      });
      magSubRef.current = sub;
      lastSubscribed.current = true;
    };

    const applyHeadingSample = (raw: number, accuracy: number | null, quality: QiblaCompassQuality) => {
      const mode = motionModeRef.current;
      smHeadRef.current = smoothHeading(mode, smHeadRef.current, raw);
      setHeading(smHeadRef.current);
      setHeadingHasSample(true);
      setHeadingAccuracyDeg(accuracy);
      setCompassQuality(quality);
    };

    const startNativeHeading = async (seq: number): Promise<boolean> => {
      if (!canUseNativeDeviceHeading()) {
        return false;
      }
      if (disposed || seq !== startSeq || !canRun()) return false;
      const stop =
        (await startNativeDeviceHeading((magneticHeadingDeg) => {
          if (disposed || seq !== startSeq) return;
          const raw = normHeadingDeg(magneticHeadingDeg + declRef.current);
          applyHeadingSample(raw, null, "high");
        })) ?? (() => undefined);
      if (disposed || seq !== startSeq || !canRun()) {
        stop();
        return false;
      }
      nativeHeadingStopRef.current = stop;
      lastSubscribed.current = true;
      return true;
    };

    const on = () => {
      if (!canRun()) {
        off();
        return;
      }
      void (async () => {
        if (lastSubscribed.current) {
          if (headingSubRef.current || nativeHeadingStopRef.current) {
            return;
          }
          if (magSubRef.current) {
            const iv = motionModeRef.current === "fast" ? 30 : 70;
            Magnetometer.setUpdateInterval(iv);
            if (accelSubRef.current) {
              Accelerometer.setUpdateInterval(iv);
            }
            return;
          }
        }
        off();
        const seq = startSeq;
        smHeadRef.current = Number.NaN;
        /** Орын+деклинация дайын болмай тұрып компас жазу — mag+0° race болдырмаймыз. */
        if (bearingRef.current == null) {
          await refreshBearing();
        }
        if (disposed || seq !== startSeq || !canRun()) {
          return;
        }
        if (await startNativeHeading(seq)) {
          return;
        }
        try {
          const sub = await Location.watchHeadingAsync((ev) => {
            if (disposed || seq !== startSeq) return;
            const raw = headingFromLocationHeading(ev, declRef.current, Platform.OS);
            applyHeadingSample(
              raw,
              typeof ev.accuracy === "number" ? ev.accuracy : null,
              compassQualityFromHeadingAccuracy(ev.accuracy)
            );
          });
          if (disposed || seq !== startSeq || !canRun()) {
            sub.remove();
            return;
          }
          headingSubRef.current = sub;
          lastSubscribed.current = true;
        } catch {
          await startMagnetometerFallback(seq);
        }
      })();
    };

    on();
    const unNav = subscribeRootNavState(() => {
      on();
    });

    return () => {
      disposed = true;
      unNav();
      off();
    };
  }, [perm, resumeTick, motionMode, bearing, refreshBearing]);

  useEffect(() => {
    const interval = motionMode === "fast" ? 30 : 70;
    if (magSubRef.current) {
      Magnetometer.setUpdateInterval(interval);
    }
    if (accelSubRef.current) {
      Accelerometer.setUpdateInterval(interval);
    }
  }, [motionMode]);

  const stable = useMemo<QiblaStableValue>(
    () => ({
      perm,
      bearing,
      positionFailed,
      locationSource,
      locationAccuracyM,
      refreshBearing,
      resumeHeadingSubscription,
    }),
    [perm, bearing, positionFailed, locationSource, locationAccuracyM, refreshBearing, resumeHeadingSubscription]
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
