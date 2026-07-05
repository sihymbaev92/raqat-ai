import { useCallback, useEffect, useState } from "react";
import { buildDashboardKurbanAitNewsItems, type DashboardNewsItem } from "../content/dashboardNewsItems";

type State = {
  items: DashboardNewsItem[];
  loading: boolean;
  usingFallback: boolean;
};

/** Басты бет жаңалықтары — тек қолданба ішіндегі маусымдық хабарламалар (сыртқы KB/Муфтиат жоқ). */
export function useDashboardNewsItems(): State {
  const [items, setItems] = useState<DashboardNewsItem[]>(() => buildDashboardKurbanAitNewsItems());
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);

  const load = useCallback(async () => {
    setItems(buildDashboardKurbanAitNewsItems());
    setUsingFallback(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, usingFallback };
}
