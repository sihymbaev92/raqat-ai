import { useCallback, useState } from "react";
import {
  getNotifEnabled,
  setNotifEnabled,
  getIftarEnabled,
  setIftarEnabled,
  getPrayerNotifSoundId,
  setPrayerNotifSoundId,
  type PrayerNotifSoundId,
} from "../storage/prefs";
import { loadPrayerCache } from "../storage/prayerCache";
import {
  requestNotificationPermissions,
  reschedulePrayerNotifications,
  getScheduledPrayerNotificationCount,
  getPrayerNotificationDiagnostics,
  type PrayerNotificationDiagnostics,
} from "../services/prayerNotifications";
import type { PrayerNotifWarn } from "../components/settings/SettingsPrayerNotificationsSection";

export function usePrayerSettingsSchedule() {
  const [notif, setNotif] = useState(true);
  const [iftar, setIftar] = useState(false);
  const [prayerSoundId, setPrayerSoundId] = useState<PrayerNotifSoundId>("adhan_haramain");
  const [notifWarn, setNotifWarn] = useState<PrayerNotifWarn>(null);
  const [diagnostics, setDiagnostics] = useState<PrayerNotificationDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const refreshDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      setDiagnostics(await getPrayerNotificationDiagnostics());
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  const loadNotifPrefs = useCallback(async () => {
    const [en, ift, sound] = await Promise.all([
      getNotifEnabled(),
      getIftarEnabled(),
      getPrayerNotifSoundId(),
    ]);
    setNotif(en);
    setIftar(ift);
    setPrayerSoundId(sound);
    await refreshDiagnostics();
  }, [refreshDiagnostics]);

  const rescheduleFromCache = useCallback(async () => {
    const cached = await loadPrayerCache();
    if (!cached || cached.error) {
      await refreshDiagnostics();
      return;
    }
    const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
    await reschedulePrayerNotifications(cached, {
      enabled: en,
      iftarExtra: ift,
    });
    await refreshDiagnostics();
  }, [refreshDiagnostics]);

  const onNotifToggle = useCallback(
    async (v: boolean) => {
      if (v) {
        const ok = await requestNotificationPermissions();
        if (!ok) {
          setNotifWarn("permission");
          return;
        }
        setNotif(true);
        await setNotifEnabled(true);
        await rescheduleFromCache();
        const scheduled = await getScheduledPrayerNotificationCount();
        setNotifWarn(scheduled === 0 ? "schedule" : null);
        await refreshDiagnostics();
        return;
      }
      setNotifWarn(null);
      setNotif(v);
      await setNotifEnabled(v);
      await rescheduleFromCache();
      await refreshDiagnostics();
    },
    [refreshDiagnostics, rescheduleFromCache]
  );

  const onIftarChange = useCallback(
    async (v: boolean) => {
      setIftar(v);
      await setIftarEnabled(v);
      await rescheduleFromCache();
      await refreshDiagnostics();
    },
    [refreshDiagnostics, rescheduleFromCache]
  );

  const onPrayerSoundIdChange = useCallback(
    async (id: PrayerNotifSoundId) => {
      setPrayerSoundId(id);
      await setPrayerNotifSoundId(id);
      const en = await getNotifEnabled();
      if (en) await rescheduleFromCache();
      await refreshDiagnostics();
    },
    [refreshDiagnostics, rescheduleFromCache]
  );

  return {
    notif,
    iftar,
    prayerSoundId,
    notifWarn,
    diagnostics,
    diagnosticsLoading,
    loadNotifPrefs,
    refreshDiagnostics,
    rescheduleFromCache,
    onNotifToggle,
    onIftarChange,
    onPrayerSoundIdChange,
  };
}
