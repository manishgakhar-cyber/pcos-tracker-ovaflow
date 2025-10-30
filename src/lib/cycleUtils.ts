import { differenceInDays, addDays } from 'date-fns';

export type CycleRecord = {
  period_start_date: string;
  period_end_date?: string | null;
  cycle_length?: number | null;
};

export type CycleInsights = {
  cycleDay: number | null;
  avgCycleLength: number | null;
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number | null;
  nextPeriodLabel: string | null;
};

// Acceptable physiological range to filter outliers
const MIN_CYCLE = 15; // days
const MAX_CYCLE = 60; // days

export function computeCycleInsights(cycles: CycleRecord[], todayInput: Date = new Date()): CycleInsights {
  if (!Array.isArray(cycles) || cycles.length === 0) {
    return {
      cycleDay: null,
      avgCycleLength: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: null,
      nextPeriodLabel: null,
    };
  }

  // Normalize today to start of day
  const today = new Date(todayInput);
  today.setHours(0, 0, 0, 0);

  // Sort by most recent start first
  const sorted = [...cycles].sort(
    (a, b) => new Date(b.period_start_date).getTime() - new Date(a.period_start_date).getTime()
  );

  const mostRecentStart = new Date(sorted[0].period_start_date);
  mostRecentStart.setHours(0, 0, 0, 0);

  // Cycle day (start counting at 1). Clamp to at least 1.
  const diffFromMostRecent = differenceInDays(today, mostRecentStart) + 1;
  const cycleDay = Math.max(1, diffFromMostRecent);

  // Derive cycle lengths from consecutive start dates (more robust than relying on stored cycle_length)
  const derivedLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const startA = new Date(sorted[i].period_start_date);
    const startB = new Date(sorted[i + 1].period_start_date);
    startA.setHours(0, 0, 0, 0);
    startB.setHours(0, 0, 0, 0);

    const len = differenceInDays(startA, startB);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) {
      derivedLengths.push(len);
    }
  }

  // Fallback: if we didn't get any derived lengths but DB provided some valid ones, use them
  if (derivedLengths.length === 0) {
    const dbLengths = sorted
      .map((c) => (typeof c.cycle_length === 'number' ? c.cycle_length : null))
      .filter((n): n is number => n !== null && n >= MIN_CYCLE && n <= MAX_CYCLE);
    derivedLengths.push(...dbLengths);
  }

  if (derivedLengths.length === 0) {
    // Not enough info to predict yet
    return {
      cycleDay,
      avgCycleLength: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: null,
      nextPeriodLabel: null,
    };
  }

  // Weighted average using last up to 4 cycles: [0.4, 0.3, 0.2, 0.1]
  const weights = [0.4, 0.3, 0.2, 0.1];
  const toUse = derivedLengths.slice(0, 4);

  let weightedSum = 0;
  let totalWeight = 0;
  toUse.forEach((len, idx) => {
    const w = weights[idx] ?? 0.1;
    weightedSum += len * w;
    totalWeight += w;
  });

  const avgCycleLength = Math.round(weightedSum / totalWeight);

  // Predict next period start
  const nextPeriodDate = addDays(mostRecentStart, avgCycleLength);
  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, today);

  let nextPeriodLabel: string;
  if (daysUntilNextPeriod > 0) {
    nextPeriodLabel = `${daysUntilNextPeriod} days`;
  } else if (daysUntilNextPeriod === 0) {
    nextPeriodLabel = 'Today';
  } else {
    nextPeriodLabel = `${Math.abs(daysUntilNextPeriod)} days overdue`;
  }

  return {
    cycleDay,
    avgCycleLength,
    nextPeriodDate,
    daysUntilNextPeriod,
    nextPeriodLabel,
  };
}
