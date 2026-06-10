/**
 * halaldamu.kz ұйым карточкаларындағы `map_link` (2GIS, Google Maps т.б.)
 * ішінен { lat, lng } шығару — API-дағы lat/lon null болған кезде.
 */

function finiteLatLng(lat: number, lng: number): { lat: number; lng: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

/**
 * 2GIS URL-інде әдетте `m=lng,lat` немесе жол соңында `/lng,lat` болады.
 * Google Maps: `@lat,lng` немесе `@lat,lng,zoomz`.
 */
export function parseLatLngFromMapServiceUrl(url: string | null | undefined): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  let u = url.trim();
  try {
    u = decodeURIComponent(u);
  } catch {
    /* қалдырамыз */
  }

  const host2gis = /2gis\./i.test(u);

  const mParam = u.match(/[?&]m=([0-9.+-]+)[,%]([0-9.+-]+)/i);
  if (mParam) {
    const a = parseFloat(mParam[1]);
    const b = parseFloat(mParam[2]);
    if (host2gis) {
      return finiteLatLng(b, a);
    }
    if (Math.abs(a) > 40 && Math.abs(a) < 90 && Math.abs(b) > 40 && Math.abs(b) < 90) {
      return finiteLatLng(a, b);
    }
    return finiteLatLng(b, a);
  }

  const at = u.match(/@([0-9.+-]+),([0-9.+-]+)(?:,|\d|z|$)/i);
  if (at) {
    const lat = parseFloat(at[1]);
    const lng = parseFloat(at[2]);
    return finiteLatLng(lat, lng);
  }

  const pathPair = u.match(/\/([0-9]{1,3}\.[0-9]+)[,%]([0-9]{1,3}\.[0-9]+)(?=\?|\/|$)/);
  if (pathPair) {
    const a = parseFloat(pathPair[1]);
    const b = parseFloat(pathPair[2]);
    if (host2gis || (Math.abs(a) > 45 && Math.abs(a) < 90 && Math.abs(b) > 35 && Math.abs(b) < 56)) {
      return finiteLatLng(b, a);
    }
    return finiteLatLng(a, b);
  }

  const qEq = u.match(/[?&]q=([0-9.+-]+)[,%]([0-9.+-]+)/i);
  if (qEq) {
    const lat = parseFloat(qEq[1]);
    const lng = parseFloat(qEq[2]);
    return finiteLatLng(lat, lng);
  }

  return null;
}
