import type { NavigationState, PartialState } from "@react-navigation/native";

/** Схемасыз жол: `more/surah/2/10`, `more/mushaf-surah/2` т.б. */
export function normalizeDeepLinkPath(raw: string): string {
  let p = raw.trim();
  if (!p) return p;
  const schemeIdx = p.indexOf("://");
  if (schemeIdx !== -1) p = p.slice(schemeIdx + 3);
  p = p.replace(/^\/+/, "");
  const q = p.indexOf("?");
  if (q !== -1) p = p.slice(0, q);
  return p.replace(/\/+$/, "");
}

export type ParsedMushafSurahLink = { surahNumber: number; initialAyah?: number };

/** `more/` префиксінсіз де қабылдайды (кейбір платформалар). */
export function parseQuranSurahDeepPath(normalizedPath: string): ParsedMushafSurahLink | null {
  const p = normalizedPath.replace(/^\/+/, "");
  const mMushaf = p.match(/^(?:more\/)?mushaf-surah\/(\d+)(?:\/(\d+))?$/);
  if (mMushaf) {
    const surahNumber = parseInt(mMushaf[1]!, 10);
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;
    const ay = mMushaf[2] != null ? parseInt(mMushaf[2], 10) : undefined;
    if (ay != null && (!Number.isFinite(ay) || ay < 1)) return null;
    return { surahNumber, initialAyah: ay };
  }
  const mTrail = p.match(/^(?:more\/)?surah\/(\d+)\/(\d+)\/mushaf$/);
  if (mTrail) {
    const surahNumber = parseInt(mTrail[1]!, 10);
    const initialAyah = parseInt(mTrail[2]!, 10);
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;
    if (!Number.isFinite(initialAyah) || initialAyah < 1) return null;
    return { surahNumber, initialAyah };
  }
  return null;
}

function clonePatchQuranSurahParams<S extends NavigationState | PartialState<NavigationState>>(
  state: S,
  extra: { mushafLayout?: boolean; initialAyah?: number; surahNumber?: number }
): S {
  if (!state?.routes?.length) return state;
  const routes = state.routes.map((route) => {
    const r = route as { name: string; state?: NavigationState; params?: Record<string, unknown> };
    if (r.name === "MoreStack" && r.state?.routes?.length) {
      const innerRoutes = r.state.routes.map((inner) => {
        const ir = inner as { name: string; params?: Record<string, unknown> };
        if (ir.name === "QuranSurah") {
          return {
            ...ir,
            params: { ...ir.params, ...extra },
          };
        }
        return inner;
      });
      return {
        ...r,
        state: {
          ...r.state,
          routes: innerRoutes,
        },
      };
    }
    if (r.state) {
      return { ...r, state: clonePatchQuranSurahParams(r.state as NavigationState, extra) };
    }
    return route;
  });
  return { ...state, routes } as S;
}

/** getStateFromPath нәтижесіндегі QuranSurah params: mushafLayout + сүре/аят. */
export function applyQuranSurahParamsFromDeepLink<S extends NavigationState | PartialState<NavigationState>>(
  state: S | undefined,
  parsed: ParsedMushafSurahLink
): S | undefined {
  if (!state) return state;
  return clonePatchQuranSurahParams(state, {
    surahNumber: parsed.surahNumber,
    initialAyah: parsed.initialAyah,
    mushafLayout: true,
  });
}

export function rewriteMushafSurahPathToRouterPath(normalizedPath: string): string | null {
  const parsed = parseQuranSurahDeepPath(normalizedPath);
  if (!parsed) return null;
  const ay = parsed.initialAyah;
  return ay != null ? `more/surah/${parsed.surahNumber}/${ay}` : `more/surah/${parsed.surahNumber}`;
}

export type MushafBookLinkParams = {
  initialPage?: number;
  focusSurah?: number;
  focusAyah?: number;
};

/** `mushaf-book?focusSurah=2&focusAyah=1` — query React Navigation path-те жиі жоғалады. */
export function parseMushafBookQueryParams(rawPath: string): MushafBookLinkParams {
  const q = rawPath.indexOf("?");
  if (q === -1) return {};
  const out: MushafBookLinkParams = {};
  const sp = new URLSearchParams(rawPath.slice(q));
  const fs = sp.get("focusSurah");
  if (fs != null && fs !== "") {
    const n = parseInt(fs, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 114) out.focusSurah = n;
  }
  const fa = sp.get("focusAyah");
  if (fa != null && fa !== "") {
    const n = parseInt(fa, 10);
    if (Number.isFinite(n) && n >= 1) out.focusAyah = n;
  }
  const ip = sp.get("initialPage");
  if (ip != null && ip !== "") {
    const n = parseInt(ip, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 604) out.initialPage = n;
  }
  return out;
}

type FocusedRoute = { name: string; params?: Record<string, unknown> };

function patchRouteParams<S extends NavigationState | PartialState<NavigationState>>(
  state: S,
  screenName: string,
  extra: Record<string, unknown>
): S {
  if (!state?.routes?.length) return state;
  const routes = state.routes.map((route) => {
    const r = route as { name: string; state?: NavigationState; params?: Record<string, unknown> };
    if (r.name === screenName) {
      return { ...r, params: { ...r.params, ...extra } };
    }
    if (r.state) {
      return { ...r, state: patchRouteParams(r.state as NavigationState, screenName, extra) };
    }
    return route;
  });
  return { ...state, routes } as S;
}

/** getStateFromPath: QuranMushafBook params (query + mushaf-surah). */
export function applyQuranMushafBookParamsFromDeepLink<S extends NavigationState | PartialState<NavigationState>>(
  state: S | undefined,
  params: MushafBookLinkParams
): S | undefined {
  if (!state || (!params.focusSurah && !params.focusAyah && !params.initialPage)) return state;
  const extra: Record<string, unknown> = {};
  if (params.focusSurah != null) extra.focusSurah = params.focusSurah;
  if (params.focusAyah != null) extra.focusAyah = params.focusAyah;
  if (params.initialPage != null) extra.initialPage = params.initialPage;
  return patchRouteParams(state, "QuranMushafBook", extra);
}

export function mushafBookParamsFromSurahLink(parsed: ParsedMushafSurahLink): MushafBookLinkParams {
  return {
    focusSurah: parsed.surahNumber,
    focusAyah: parsed.initialAyah ?? 1,
  };
}

function getFocusedLeaf(state: NavigationState | PartialState<NavigationState> | undefined): FocusedRoute | null {
  if (!state?.routes?.length) return null;
  const idx = state.index ?? state.routes.length - 1;
  const r = state.routes[idx] as { name: string; state?: NavigationState; params?: Record<string, unknown> };
  if (!r) return null;
  if (r.state) {
    const inner = getFocusedLeaf(r.state);
    if (inner) return inner;
  }
  return { name: String(r.name), params: r.params };
}

/** getPathFromState: фокуста QuranMushafBook params. */
export function getFocusedMushafBookParams(
  state: NavigationState | PartialState<NavigationState> | undefined
): MushafBookLinkParams | null {
  const leaf = getFocusedLeaf(state);
  if (leaf?.name !== "QuranMushafBook" || !leaf.params) return null;
  const fs = leaf.params.focusSurah;
  const fa = leaf.params.focusAyah;
  const ip = leaf.params.initialPage;
  const out: MushafBookLinkParams = {};
  if (typeof fs === "number" && fs >= 1 && fs <= 114) out.focusSurah = fs;
  if (typeof fa === "number" && fa >= 1) out.focusAyah = fa;
  if (typeof ip === "number" && ip >= 1 && ip <= 604) out.initialPage = ip;
  return Object.keys(out).length ? out : null;
}

/** getPathFromState үшін: фокуста QuranSurah болса params оқу. */
export function getFocusedQuranSurahParams(
  state: NavigationState | PartialState<NavigationState> | undefined
): { surahNumber: number; initialAyah?: number; mushafLayout?: boolean } | null {
  const leaf = getFocusedLeaf(state);
  if (leaf?.name !== "QuranSurah" || !leaf.params) return null;
  const sn = leaf.params.surahNumber;
  if (typeof sn !== "number" || sn < 1 || sn > 114) return null;
  const ia = leaf.params.initialAyah;
  const initialAyah = typeof ia === "number" && ia > 0 ? ia : undefined;
  const mushafLayout = leaf.params.mushafLayout === true;
  return { surahNumber: sn, initialAyah, mushafLayout };
}
