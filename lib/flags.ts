/**
 * Feature flags. Everything is ON by default; a flag exists only so a feature can be switched off
 * quickly (for example during a rollback) by setting its variable to 0 / false / off.
 *
 * Read on the server only (never NEXT_PUBLIC_…). On Vercel, changing a variable needs a redeploy.
 */
const off = (name: string) => /^(0|false|off|no)$/i.test(process.env[name]?.trim() ?? "");

export const flags = {
  /** Stage 0 (letters and sounds) for learners starting from zero. Set STAGE0_ENABLED=0 to switch it off. */
  stage0: () => !off("STAGE0_ENABLED"),
};
