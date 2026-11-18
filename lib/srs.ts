/** SM-2 spaced repetition. Grade: 0 = forgot, 3 = hard, 4 = good, 5 = easy. */
export interface CardState {
  ease: number;
  interval: number; // days
  reps: number;
}

export function review(card: CardState, grade: 0 | 3 | 4 | 5): CardState {
  if (grade < 3) {
    return { ease: Math.max(1.3, card.ease - 0.2), interval: 1, reps: 0 };
  }
  const reps = card.reps + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = grade === 5 ? 4 : 3;
  else interval = Math.round(card.interval * card.ease * (grade === 3 ? 0.8 : grade === 5 ? 1.3 : 1));
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  return { ease, interval: Math.max(1, interval), reps };
}
