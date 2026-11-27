import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

export interface CountryOption {
  code: string;
  dial: string;
  name: string;
  flag: string;
}

/** Shown first, in this order: the Gulf, then the wider Arab world. Everything else follows A–Z. */
const PINNED = ["SA", "AE", "KW", "QA", "BH", "OM", "YE", "EG", "JO", "IQ", "SY", "LB", "PS", "SD", "LY", "TN", "DZ", "MA", "MR"];

export const isCountry = (code: unknown): code is CountryCode => typeof code === "string" && (getCountries() as string[]).includes(code);

const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** Every country with a phone numbering plan, named in the interface language. */
export function countryOptions(locale: string): CountryOption[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const all: CountryOption[] = getCountries().map((code) => ({ code, dial: getCountryCallingCode(code), name: names.of(code) ?? code, flag: flagOf(code) }));
  const pinned = PINNED.map((c) => all.find((o) => o.code === c)).filter((o): o is CountryOption => !!o);
  const rest = all.filter((o) => !PINNED.includes(o.code)).sort((a, b) => a.name.localeCompare(b.name, locale));
  return [...pinned, ...rest];
}
