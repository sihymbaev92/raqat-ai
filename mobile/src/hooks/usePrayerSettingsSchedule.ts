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
import {
  reschedulePrayerNotificationsFromCache,
  getScheduledPrayerNotificationCount,
  getPrayerNotificationDiagnostics,
  type PrayerNotificationDiagnostics,
} from "../services/prayerNotifications";
import { ensurePrayerAzanPermissions } from "../services/prayerAzanPermissions";
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
    await reschedulePrayerNotificationsFromCache();
    await refreshDiagnostics();
  }, [refreshDiagnostics]);

  const onNotifToggle = useCallback(
    async (v: boolean) => {
      if (v) {
        const perm = await ensurePrayerAzanPermissions({ openAndroidSystemScreens: true });
        if (!perm.notificationsGranted) {
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
