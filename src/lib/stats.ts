import type { AppData, Baseline, DayLog, Plan, RiskLevel } from './types';
import { GRAMS_PER_STANDARD } from './standardDrinks';
import { HEAVY_DAY_GRAMS } from './safety';
import { addDays, diffDays, rangeKeys, todayKey } from './dates';

export const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730, 1000];

export function milestoneLabel(days: number): string {
  if (days === 1) return '1 day';
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  if (days === 30) return '30 days';
  if (days === 60) return '60 days';
  if (days === 90) return '90 days';
  if (days === 180) return '6 months';
  if (days === 365) return '1 year';
  if (days === 730) return '2 years';
  return `${days} days`;
}

/** The first day that counts toward alcohol-free stats. */
export function countStart(plan: Plan): string {
  return plan.approach === 'stepdown' ? plan.startedOn : plan.quitDate;
}

export function isDrinkDay(log: DayLog | undefined): boolean {
  return !!log && log.drank && log.drinks > 0;
}

export function baselineRates(b: Baseline) {
  const drinksPerWeek = Math.max(0, b.drinkingDaysPerWeek) * Math.max(0, b.drinksPerDrinkingDay);
  const dailyDrinks = drinksPerWeek / 7;
  const dailySpend = Math.max(0, b.spendPerWeek) / 7;
  const costPerDrink = drinksPerWeek > 0 ? Math.max(0, b.spendPerWeek) / drinksPerWeek : 0;
  return { drinksPerWeek, dailyDrinks, dailySpend, costPerDrink };
}

export interface Stats {
  phase: 'prep' | 'active';
  daysUntilStart: number;
  start: string;
  elapsedDays: number;
  currentStreak: number;
  longestStreak: number;
  totalAlcoholFreeDays: number;
  drinkDays: number;
  drinksLogged: number;
  drinksAvoided: number;
  moneySaved: number;
  lastDrinkDay: string | null;
  nextMilestone: number | null;
  earnedMilestones: number[];
}

/**
 * Days with no logged drinks are presumed alcohol-free (like a sobriety clock),
 * but a logged slip never erases totals: total alcohol-free days, longest run,
 * money saved and drinks avoided all persist.
 */
export function computeStats(data: AppData, today: string = todayKey()): Stats | null {
  const p = data.profile;
  if (!p) return null;
  const start = countStart(p.plan);
  const until = diffDays(today, start);
  if (until > 0) {
    return {
      phase: 'prep',
      daysUntilStart: until,
      start,
      elapsedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalAlcoholFreeDays: 0,
      drinkDays: 0,
      drinksLogged: 0,
      drinksAvoided: 0,
      moneySaved: 0,
      lastDrinkDay: null,
      nextMilestone: MILESTONES[0],
      earnedMilestones: [],
    };
  }

  const keys = rangeKeys(start, today);
  let run = 0;
  let longest = 0;
  let af = 0;
  let drinkDays = 0;
  let drinks = 0;
  let lastDrinkDay: string | null = null;
  for (const k of keys) {
    const log = data.days[k];
    if (isDrinkDay(log)) {
      drinkDays++;
      drinks += log!.drinks;
      lastDrinkDay = k;
      run = 0;
    } else {
      af++;
      run++;
      longest = Math.max(longest, run);
    }
  }
  const current = run;
  const rates = baselineRates(p.baseline);
  const elapsed = keys.length;
  const drinksAvoided = Math.max(0, elapsed * rates.dailyDrinks - drinks);
  const moneySaved = Math.max(0, elapsed * rates.dailySpend - drinks * rates.costPerDrink);

  return {
    phase: 'active',
    daysUntilStart: 0,
    start,
    elapsedDays: elapsed,
    currentStreak: current,
    longestStreak: longest,
    totalAlcoholFreeDays: af,
    drinkDays,
    drinksLogged: drinks,
    drinksAvoided,
    moneySaved,
    lastDrinkDay,
    nextMilestone: MILESTONES.find((m) => m > current) ?? null,
    earnedMilestones: MILESTONES.filter((m) => m <= longest),
  };
}

/* ------------------------------------------------------------------ */
/* Step-down plan                                                       */
/* ------------------------------------------------------------------ */

export const STEPDOWN_MIN_DAYS = 7;
/** Slower minimum for anyone with moderate/high withdrawal risk (NHS self-taper guidance ≈10% every few days). */
export const STEPDOWN_MIN_DAYS_DEPENDENT = 21;
export const STEPDOWN_MAX_DAYS = 42;
export const HOLD_STEP_DAYS = 4;

export function stepdownMinDays(risk: RiskLevel | undefined): number {
  return risk === 'low' ? STEPDOWN_MIN_DAYS : STEPDOWN_MIN_DAYS_DEPENDENT;
}

/** Remaining fraction of the step-down (1 at the start, 0 on the zero day). */
export function taperFraction(plan: Plan, day: string): number {
  if (diffDays(plan.quitDate, day) >= 0) return 0;
  const start = addDays(plan.startedOn, plan.holdDays ?? 0);
  const total = diffDays(start, plan.quitDate);
  if (total <= 0) return 0;
  const i = Math.min(total, Math.max(0, diffDays(start, day)));
  return (total - i) / total;
}

export interface StepdownDay {
  /** most on any single day — never above the usual amount on a drinking day */
  cap: number;
  /** total allowed in any rolling 7 days */
  weeklyBudget: number;
  usedLast6: number;
  drinkingDaysLast6: number;
  /** what's allowed today, given the last 6 days */
  limit: number;
}

/**
 * Step-down limits use a shrinking WEEKLY budget, so someone who drinks heavily on two days
 * a week is never pushed into drinking more often. Daily cap ≤ usual amount per drinking day;
 * drinking days per week ≤ usual drinking days.
 */
export function stepdownDay(plan: Plan, baseline: Baseline, day: string, days: Record<string, DayLog> = {}): StepdownDay | null {
  if (plan.approach !== 'stepdown') return null;
  const f = taperFraction(plan, day);
  const perDay = Math.max(0, baseline.drinksPerDrinkingDay);
  const cap = Math.round(perDay * f);
  const weeklyBudget = Math.round(Math.max(0, baseline.drinkingDaysPerWeek) * perDay * f);
  let usedLast6 = 0;
  let drinkingDaysLast6 = 0;
  for (let i = 1; i <= 6; i++) {
    const log = days[addDays(day, -i)];
    if (isDrinkDay(log)) {
      usedLast6 += log!.drinks;
      drinkingDaysLast6++;
    }
  }
  const limit = drinkingDaysLast6 >= baseline.drinkingDaysPerWeek ? 0 : Math.max(0, Math.min(cap, weeklyBudget - usedLast6));
  return { cap, weeklyBudget, usedLast6, drinkingDaysLast6, limit };
}

/** Today's allowed amount on a step-down plan; null if not on step-down. */
export function taperTarget(plan: Plan, baseline: Baseline, day: string, days: Record<string, DayLog> = {}): number | null {
  return stepdownDay(plan, baseline, day, days)?.limit ?? null;
}

/** Preview of the daily cap (without history). */
export function taperSchedule(plan: Plan, baseline: Baseline): { date: string; limit: number }[] {
  if (plan.approach !== 'stepdown') return [];
  const n = diffDays(plan.startedOn, plan.quitDate);
  const out: { date: string; limit: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const date = addDays(plan.startedOn, i);
    out.push({ date, limit: stepdownDay(plan, baseline, date)?.cap ?? 0 });
  }
  return out;
}

/** Pause the step-down: go back to the level of a few days ago and push the zero day back. */
export function holdStep(plan: Plan): Plan {
  return { ...plan, holdDays: (plan.holdDays ?? 0) + HOLD_STEP_DAYS, quitDate: addDays(plan.quitDate, HOLD_STEP_DAYS) };
}

/* ------------------------------------------------------------------ */
/* Withdrawal watch                                                     */
/* ------------------------------------------------------------------ */

/**
 * Last drink day if the recent pattern could cause withdrawal on stopping:
 * 3+ drinking days in a row, or any day ≥120 g, within the last 14 days.
 */
export function recentHeavyPattern(data: AppData, today: string): string | null {
  const p = data.profile;
  if (!p) return null;
  const g = GRAMS_PER_STANDARD[p.region];
  let run = 0;
  let flagged = false;
  let last: string | null = null;
  for (let i = 14; i >= 0; i--) {
    const k = addDays(today, -i);
    const log = data.days[k];
    if (isDrinkDay(log)) {
      run++;
      last = k;
      if (run >= 3 || log!.drinks * g >= HEAVY_DAY_GRAMS) flagged = true;
    } else run = 0;
  }
  return flagged ? last : null;
}

/** Should Home prompt a withdrawal check today? */
export function shouldWatchWithdrawal(data: AppData, today: string): boolean {
  const p = data.profile;
  if (!p) return false;
  const risk = p.safety?.level ?? 'moderate';
  const sinceQuit = diffDays(p.plan.quitDate, today);
  if (risk !== 'low' && sinceQuit >= -1 && sinceQuit <= 7) return true;
  if (risk !== 'low' && p.plan.approach === 'stepdown' && sinceQuit < 0) return true;
  const heavy = recentHeavyPattern(data, today);
  return !!heavy && diffDays(heavy, today) <= 7;
}

/* ------------------------------------------------------------------ */
/* Calendar                                                             */
/* ------------------------------------------------------------------ */

export type CalendarStatus = 'af' | 'drank' | 'onplan' | 'future' | 'before' | 'today-open';

export function dayStatus(data: AppData, key: string, today: string = todayKey()): CalendarStatus {
  const p = data.profile;
  if (!p) return 'before';
  const start = countStart(p.plan);
  if (diffDays(key, today) < 0) return 'future';
  if (diffDays(start, key) < 0) return 'before';
  const log = data.days[key];
  if (isDrinkDay(log)) {
    const target = taperTarget(p.plan, p.baseline, key, data.days);
    if (target !== null && target > 0 && log!.drinks <= target) return 'onplan';
    return 'drank';
  }
  if (key === today && !log) return 'today-open';
  return 'af';
}
