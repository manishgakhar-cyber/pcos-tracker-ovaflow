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

// Scientific cycle ranges based on medical research
// Reference: American College of Obstetricians and Gynecologists (ACOG)
const MIN_CYCLE = 21; // days - Shorter cycles may indicate hormonal issues
const MAX_CYCLE = 35; // days - Standard upper limit for regular cycles
const EXTENDED_MAX_CYCLE = 45; // days - Allow for slightly irregular cycles (PCOS context)

// Luteal phase is typically 12-14 days and fairly consistent
// Reference: Reed & Carr, 2018, "The Normal Menstrual Cycle and the Control of Ovulation"
const TYPICAL_LUTEAL_PHASE = 14; // days

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
    // Accept cycles in normal range (21-35) or extended range (up to 45 for PCOS tracking)
    if (len >= MIN_CYCLE && len <= EXTENDED_MAX_CYCLE) {
      derivedLengths.push(len);
    }
  }

  // Fallback: if we didn't get any derived lengths but DB provided some valid ones, use them
  if (derivedLengths.length === 0) {
    const dbLengths = sorted
      .map((c) => (typeof c.cycle_length === 'number' ? c.cycle_length : null))
      .filter((n): n is number => n !== null && n >= MIN_CYCLE && n <= EXTENDED_MAX_CYCLE);
    derivedLengths.push(...dbLengths);
  }

  // Determine average cycle length using scientifically-backed methods
  let avgCycleLength: number;
  if (derivedLengths.length === 0) {
    // If at least one cycle exists but we couldn't derive lengths, use median cycle length
    // Reference: WHO multi-country study on menstrual patterns (28 days median)
    avgCycleLength = 28;
  } else if (derivedLengths.length === 1) {
    avgCycleLength = derivedLengths[0];
  } else if (derivedLengths.length <= 3) {
    // For 2-3 cycles, use simple average (not enough data for weighted)
    avgCycleLength = Math.round(
      derivedLengths.reduce((sum, len) => sum + len, 0) / derivedLengths.length
    );
  } else {
    // For 4+ cycles: Use weighted average emphasizing recent cycles
    // This method is supported by fertility tracking research (Fehring et al., 2006)
    // Recent cycles are weighted more heavily as they better predict the next cycle
    const weights = [0.4, 0.3, 0.2, 0.1];
    const toUse = derivedLengths.slice(0, 4);

    let weightedSum = 0;
    let totalWeight = 0;
    toUse.forEach((len, idx) => {
      const w = weights[idx] ?? 0.1;
      weightedSum += len * w;
      totalWeight += w;
    });

    avgCycleLength = Math.round(weightedSum / totalWeight);
  }

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
