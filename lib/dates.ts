const DAY = 86_400_000;

/** YYYY-MM-DD in UTC. */
export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUTCDay(to).getTime() - startOfUTCDay(from).getTime()) / DAY);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
