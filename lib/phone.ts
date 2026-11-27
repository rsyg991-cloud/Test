import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";

/** Arabic-Indic and Persian digits to Latin; drop spaces, dashes, brackets, dots and direction marks. */
function clean(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().‎‏‪-‮]/g, "");
}

/**
 * Saudi mobile numbers only. Accepts 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX and
 * 009665XXXXXXXX, with spaces, dashes or brackets, in Latin, Arabic-Indic or Persian digits.
 * Returns the number as +9665XXXXXXXX, or null when it isn't a Saudi mobile.
 */
export function normalizeSaudiMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = clean(input);
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("966")) s = s.slice(3);
  else if (s.startsWith("0")) s = s.slice(1);
  return /^5\d{8}$/.test(s) ? `+966${s}` : null;
}

export const DEFAULT_COUNTRY: CountryCode = "SA";

/** Number types that can be a personal mobile. Some countries (the US, for one) can't tell mobiles from landlines. */
const MOBILE_TYPES = new Set(["MOBILE", "FIXED_LINE_OR_MOBILE", "PERSONAL_NUMBER"]);

/**
 * A mobile number from any country, returned in E.164 (+<country code><number>), or null.
 * `country` (ISO 3166 code, e.g. "SA", "AE", "EG") is used when the number is written without its
 * international prefix; a number starting with + or 00 carries its own country. Saudi numbers keep
 * the exact rules and format they always had, so existing accounts log in unchanged.
 */
export function normalizePhone(input: unknown, country: string = DEFAULT_COUNTRY): string | null {
  if (typeof input !== "string") return null;
  let s = clean(input);
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!/^\+?\d{4,17}$/.test(s)) return null;
  const international = s.startsWith("+");
  if (country === "SA" || (international && s.startsWith("+966"))) {
    const saudi = normalizeSaudiMobile(s);
    if (saudi || !international) return saudi;
  }
  const parsed = parsePhoneNumberFromString(s, international ? undefined : (country as CountryCode));
  if (!parsed || !parsed.isValid()) return null;
  const type = parsed.getType();
  return type && MOBILE_TYPES.has(type) ? parsed.number : null;
}
