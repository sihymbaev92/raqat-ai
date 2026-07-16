import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  prayerDaylightTimesFromRows,
  prayerHeroSkyLookFor,
  type PrayerDaylightTimes,
} from "../theme/prayerHeroDaylight";

type Props = {
  times?: PrayerDaylightTimes;
  rows?: readonly { key: string; time: string }[];
};

/**
 * Тәулік жарығы тек суреттің жоғарғы аспан жолағында —
 * мешіт/Қағба төменде өз түсінде қалады.
 */
export function PrayerHeroDaylightOverlay({ times, rows }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const look = useMemo(() => {
    const resolved = times ?? (rows ? prayerDaylightTimesFromRows(rows) : {});
    return prayerHeroSkyLookFor(resolved, now);
  }, [times, rows, now]);

  return (
    <View pointerEvents="none" style={styles.root} accessibilityElementsHidden>
      <LinearGradient
        colors={look.colors}
        locations={look.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.skyBand, { height: `${Math.round(look.skyBandHeight * 100)}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  skyBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
