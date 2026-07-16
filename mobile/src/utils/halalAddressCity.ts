import { KZ_CITY_PRESETS_LIST, type KzCityPreset } from "../constants/kzCityPresetsList";

/** Сақталған / қысқартылған атаулар → preset.city */
const CITY_KEY_ALIASES: Record<string, string> = {
  "nur-sultan": "Astana",
  nursultan: "Astana",
  "ust-kamenogorsk": "Oskemen",
  ustkamenogorsk: "Oskemen",
  uralsk: "Oral",
  chimkent: "Shymkent",
  "alma-ata": "Almaty",
  almaata: "Almaty",
  "нұр-сұлтан": "Astana",
  нұрсұлтан: "Astana",
  астана: "Astana",
  алматы: "Almaty",
  шымкент: "Shymkent",
  ақтау: "Aktau",
  ақтөбе: "Aktobe",
  атырау: "Atyrau",
  қарағанды: "Karaganda",
  қызылорда: "Kyzylorda",
  қостанай: "Kostanay",
  орал: "Oral",
  өскемен: "Oskemen",
  павлодар: "Pavlodar",
  семей: "Semey",
  тараз: "Taraz",
  түркістан: "Turkistan",
};

let addressCityMatchers: Array<{ needle: string; preset: KzCityPreset }> | null = null;

function getAddressCityMatchers(): Array<{ needle: string; preset: KzCityPreset }> {
  if (addressCityMatchers) return addressCityMatchers;
  const rows: Array<{ needle: string; preset: KzCityPreset }> = [];
  for (const preset of KZ_CITY_PRESETS_LIST) {
    rows.push({ needle: preset.label.toLowerCase(), preset });
    rows.push({ needle: preset.city.toLowerCase(), preset });
  }
  for (const [alias, cityKey] of Object.entries(CITY_KEY_ALIASES)) {
    const preset = KZ_CITY_PRESETS_LIST.find((p) => p.city === cityKey);
    if (preset && alias.length >= 3) rows.push({ needle: alias, preset });
  }
  rows.sort((a, b) => b.needle.length - a.needle.length);
  addressCityMatchers = rows;
  return rows;
}

/**
 * halaldamu мекенжайынан ҚР қаласын табу.
 * «Астана қаласы, Алматы ауданы» сияқты жалған сәйкестікті болдырмау үшін
 * алдымен «X қаласы» / «г. X» ізделеді.
 */
export function matchKzCityFromHalalAddress(address: string | null | undefined): KzCityPreset | null {
  const addr = (address ?? "").trim().toLowerCase();
  if (addr.length < 3) return null;

  let bestCity: { preset: KzCityPreset; idx: number } | null = null;
  for (const preset of KZ_CITY_PRESETS_LIST) {
    const label = preset.label.toLowerCase();
    const eng = preset.city.toLowerCase();
    for (const needle of [`${label} қаласы`, `${label} каласы`, `г. ${label}`, `г.${label}`, `г. ${eng}`]) {
      const idx = addr.indexOf(needle);
      if (idx >= 0 && (!bestCity || idx < bestCity.idx)) {
        bestCity = { preset, idx };
      }
    }
  }
  if (bestCity) return bestCity.preset;

  for (const { needle, preset } of getAddressCityMatchers()) {
    if (needle.length >= 3 && addr.includes(needle)) return preset;
  }
  return null;
}
