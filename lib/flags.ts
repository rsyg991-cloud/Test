/**
 * Feature flags for the curriculum redesign. Everything new a learner can see stays behind a flag,
 * off by default, so production behaves exactly as before until a flag is switched on.
 *
 * Read on the server only (never NEXT_PUBLIC_…): a public variable is fixed at build time, so
 * switching it would need a rebuild. A server variable on Vercel still needs a redeploy to change;
 * moving these to a database row or Edge Config (switchable instantly, for rollback) is planned
 * before launch.
 */
const on = (name: string) => /^(1|true|on|yes)$/i.test(process.env[name]?.trim() ?? "");

export const flags = {
  /** Stage 0 (letters and sounds) for new learners starting from zero. */
  stage0: () => on("STAGE0_ENABLED"),
};
