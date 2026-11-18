/**
 * Raw score (out of 40) → band, using the widely published IELTS conversion tables.
 * Official note: the exact cut-offs vary slightly between test versions, so treat results as estimates.
 */
type Row = [minRaw: number, band: number];

const LISTENING: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

const ACADEMIC_READING: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

const lookup = (table: Row[], raw: number) => table.find(([min]) => raw >= min)?.[1] ?? 0;

export const listeningBand = (raw: number) => lookup(LISTENING, raw);
export const academicReadingBand = (raw: number) => lookup(ACADEMIC_READING, raw);

/** Writing: Task 2 counts twice as much as Task 1. */
export function writingBand(task1: number | null, task2: number | null): number | null {
  if (task1 === null && task2 === null) return null;
  if (task1 === null) return task2;
  if (task2 === null) return task1;
  return Math.floor(((task1 + 2 * task2) / 3) * 2 + 0.5 + 1e-9) / 2;
}
