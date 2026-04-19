/** Аладханға жіберетін ағылшынша атау → басты экранда көрсетілетін қазақша атау */
export function cityLabelKkForApiName(city: string): string {
  const c = (city ?? "").trim();
  if (!c) return city;
  const hit = KZ_CITY_PRESETS.find((p) => p.city === c);
  return hit?.label ?? c;
}

/** Жиі қолданылатын қала / ел жұптары (Аладхан API үшін ағылшынша атаулар) */
export const KZ_CITY_PRESETS: { city: string; country: string; label: string }[] = [
  { label: "Шымкент", city: "Shymkent", country: "Kazakhstan" },
  { label: "Алматы", city: "Almaty", country: "Kazakhstan" },
  { label: "Астана", city: "Astana", country: "Kazakhstan" },
  { label: "Қарағанды", city: "Karaganda", country: "Kazakhstan" },
  { label: "Ақтөбе", city: "Aktobe", country: "Kazakhstan" },
  { label: "Өскемен", city: "Oskemen", country: "Kazakhstan" },
  { label: "Атырау", city: "Atyrau", country: "Kazakhstan" },
  { label: "Тараз", city: "Taraz", country: "Kazakhstan" },
  { label: "Павлодар", city: "Pavlodar", country: "Kazakhstan" },
  { label: "Қостанай", city: "Kostanay", country: "Kazakhstan" },
];

/** Құбыла үшін қала орталығының шамамен координаталары (GPS болмағанда) */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Shymkent: { lat: 42.315, lon: 69.588 },
  Almaty: { lat: 43.238, lon: 76.945 },
  Astana: { lat: 51.169, lon: 71.449 },
  Karaganda: { lat: 49.804, lon: 73.109 },
  Aktobe: { lat: 50.283, lon: 57.167 },
  Oskemen: { lat: 49.948, lon: 82.628 },
  Atyrau: { lat: 47.116, lon: 51.883 },
  Taraz: { lat: 42.9, lon: 71.372 },
  Pavlodar: { lat: 52.283, lon: 76.978 },
  Kostanay: { lat: 53.214, lon: 63.625 },
};

export function getCityApproxCoords(city: string): { lat: number; lon: number } | null {
  const k = (city ?? "").trim();
  if (!k) return null;
  return CITY_COORDS[k] ?? null;
}
