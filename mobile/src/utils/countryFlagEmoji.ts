/** ISO 3166-1 alpha-2 → 🇰🇿 сияқты regional indicator emoji */
export function countryFlagEmoji(iso3166Alpha2: string): string {
  const code = iso3166Alpha2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...code].map((c) => base + c.charCodeAt(0) - 65));
}

export function labelWithCountryFlag(iso3166Alpha2: string, label: string): string {
  const flag = countryFlagEmoji(iso3166Alpha2);
  return flag ? `${flag} ${label}` : label;
}
