/**
 * Saudi mobile numbers only. Accepts 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX and
 * 009665XXXXXXXX, with spaces, dashes or brackets, in Latin, Arabic-Indic or Persian digits.
 * Returns the number as +9665XXXXXXXX, or null when it isn't a Saudi mobile.
 */
export function normalizeSaudiMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().‎‏‪-‮]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("966")) s = s.slice(3);
  else if (s.startsWith("0")) s = s.slice(1);
  return /^5\d{8}$/.test(s) ? `+966${s}` : null;
}
