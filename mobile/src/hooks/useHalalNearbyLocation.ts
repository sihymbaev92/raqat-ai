import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { findNearestKzCityPreset } from "../constants/kzCities";
import { extractLocalCityTokens } from "../utils/halalCompanyLocalFilter";

/** Жақын жергілікті мекемелер — 5 км әдепкі, 10/15 км кеңейту. */
export const HALAL_LOCAL_RADIUS_OPTIONS_KM = [5, 10, 15] as const;
export const HALAL_DEFAULT_LOCAL_RADIUS_KM = HALAL_LOCAL_RADIUS_OPTIONS_KM[0];

export type HalalNearbyLocationState = {
  centerLat: number | null;
  centerLon: number | null;
  cityTokens: string[];
  locationLabel: string | null;
  locationDenied: boolean;
  locationBusy: boolean;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
};

type Options = {
  /** false — GPS сұрауды тоқтату (экран жабылғанда). */
  enabled?: boolean;
};

/** Halal экраны ашылғанда GPS + қала анықтау — каталог/кarta ортақ. */
export function useHalalNearbyLocation(opts?: Options): HalalNearbyLocationState {
  const enabled = opts?.enabled !== false;
  const [radiusKm, setRadiusKm] = useState<number>(HALAL_DEFAULT_LOCAL_RADIUS_KM);
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLon, setCenterLon] = useState<number | null>(null);
  const [cityTokens, setCityTokens] = useState<string[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let gen = 0;
    setLocationBusy(true);

    void (async () => {
      const myGen = ++gen;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled || myGen !== gen) return;
        if (perm.status !== "granted") {
          setLocationDenied(true);
          setLocationBusy(false);
          return;
        }
        setLocationDenied(false);

        const last = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60_000,
          requiredAccuracy: 8000,
        });
        if (cancelled || myGen !== gen) return;
        if (last?.coords) {
          setCenterLat(last.coords.latitude);
          setCenterLon(last.coords.longitude);
          const nearest = findNearestKzCityPreset(last.coords.latitude, last.coords.longitude);
          if (nearest && nearest.distanceM <= 40_000) {
            setLocationLabel(nearest.label);
            setCityTokens((prev) => {
              const next = new Set(prev);
              next.add(nearest.label.toLowerCase());
              next.add(nearest.city.toLowerCase());
              return [...next];
            });
          }
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled || myGen !== gen) return;
        setCenterLat(pos.coords.latitude);
        setCenterLon(pos.coords.longitude);
        const nearest = findNearestKzCityPreset(pos.coords.latitude, pos.coords.longitude);
        if (nearest && nearest.distanceM <= 40_000) {
          setLocationLabel(nearest.label);
          setCityTokens((prev) => {
            const next = new Set(prev);
            next.add(nearest.label.toLowerCase());
            next.add(nearest.city.toLowerCase());
            return [...next];
          });
        }

        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (cancelled || myGen !== gen) return;
          const tokens = extractLocalCityTokens(geo);
          if (tokens.length) {
            setCityTokens((prev) => [...new Set([...prev, ...tokens])]);
          }
          const label = geo[0]?.city ?? geo[0]?.subregion ?? geo[0]?.region ?? null;
          if (label) setLocationLabel(label);
        } catch {
          /* nearest city label жеткілікті */
        }
      } catch {
        if (!cancelled) setLocationDenied(true);
      } finally {
        if (!cancelled) setLocationBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      gen += 1;
    };
  }, [enabled]);

  return {
    centerLat,
    centerLon,
    cityTokens,
    locationLabel,
    locationDenied,
    locationBusy,
    radiusKm,
    setRadiusKm,
  };
}
