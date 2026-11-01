import type { Baseline, Region, RiskLevel, SafetyAnswers, SafetyResult, WithdrawalCheck, WithdrawalLevel } from './types';
import { GRAMS_PER_STANDARD } from './standardDrinks';

/** ≈15 UK units on a drinking day — NICE: consider assisted withdrawal above this. */
export const HEAVY_DAY_GRAMS = 120;
/** ≈30 UK units a day — NICE: consider inpatient/residential withdrawal above this. */
export const VERY_HEAVY_DAY_GRAMS = 240;
/** Average grams per day above which medical advice before stopping is advised. */
export const MODERATE_AVG_GRAMS = 60;
/** AUDIT item 6 = "needed a first drink in the morning". */
const AUDIT_MORNING_ITEM = 5;

export function gramsFromBaseline(b: Baseline, region: Region) {
  const g = GRAMS_PER_STANDARD[region];
  const gramsPerDrinkingDay = Math.max(0, b.drinksPerDrinkingDay) * g;
  const days = Math.min(7, Math.max(0, b.drinkingDaysPerWeek));
  const gramsPerDayAverage = (gramsPerDrinkingDay * days) / 7;
  return { gramsPerDrinkingDay, gramsPerDayAverage };
}

/**
 * Withdrawal-risk screen. Conservative by design: physical dependence (daily drinking with
 * relief drinking or withdrawal, or daily heavy drinking) is treated as HIGH risk, because
 * people who drink all day often never notice withdrawal until they stop.
 * Thresholds follow NICE CG115/CG100. This is a triage aid, not a clinical assessment.
 */
export function assessWithdrawalRisk(
  a: SafetyAnswers,
  baseline: Baseline,
  region: Region,
  auditScore: number | null,
  auditAnswers: number[] | null = null,
): SafetyResult {
  const { gramsPerDrinkingDay, gramsPerDayAverage } = gramsFromBaseline(baseline, region);
  const daily = a.dailyDrinking || baseline.drinkingDaysPerWeek >= 6;
  const heavyDay = gramsPerDrinkingDay >= HEAVY_DAY_GRAMS;
  const morningDrinking = !!auditAnswers && (auditAnswers[AUDIT_MORNING_ITEM] ?? 0) > 0;
  const relief = a.withdrawalSymptoms || morningDrinking;
  const pregnant = !!a.pregnant;

  const high: string[] = [];
  if (a.pastSeizureOrDTs) high.push('You have had a seizure or severe confusion/hallucinations (DTs) when stopping before.');
  if (relief && (daily || heavyDay))
    high.push(
      morningDrinking && !a.withdrawalSymptoms
        ? 'You sometimes need a drink in the morning — a sign your body has become dependent on alcohol.'
        : 'You get withdrawal symptoms or drink to relieve them, and you drink daily or heavily — signs of physical dependence.',
    );
  if (daily && heavyDay) high.push('You drink a large amount every day or almost every day.');
  if (daily && auditScore !== null && auditScore >= 20) high.push('You drink daily and your AUDIT score suggests dependence.');
  if (a.pastMedicalDetox && (daily || relief)) high.push('You have needed medical help to stop before, and you are drinking regularly now.');
  if (a.sedatives && (daily || relief)) high.push('You use sedative medicines (or opioids) as well as drinking regularly — withdrawal can be more dangerous.');
  if (a.medicalConditions && (daily || relief)) high.push('You have a serious medical condition and drink regularly.');
  if (pregnant && (daily || relief)) high.push('You are pregnant and drink regularly — stopping is right, but needs your midwife or doctor involved.');
  if (high.length && daily && gramsPerDrinkingDay >= VERY_HEAVY_DAY_GRAMS)
    high.push('At your usual amount (over 30 UK units / 240 g a day), doctors often advise withdrawing in hospital or a detox unit.');

  if (high.length) return { level: 'high', reasons: unique(high), gramsPerDrinkingDay, gramsPerDayAverage };

  const moderate: string[] = [];
  if (daily) moderate.push('You drink every day or almost every day.');
  if (a.withdrawalSymptoms) moderate.push('You notice withdrawal symptoms (shakes, sweats, nausea, anxiety) when you stop.');
  if (morningDrinking) moderate.push('You have needed a drink in the morning after heavy drinking.');
  if (a.pastMedicalDetox) moderate.push('You have needed medical help to stop before.');
  if (a.sedatives) moderate.push('You use sedative medicines or opioids.');
  if (a.medicalConditions) moderate.push('You have a serious medical condition.');
  if (pregnant) moderate.push('You are pregnant — your midwife or doctor can support you.');
  if (heavyDay) moderate.push('You drink heavily on drinking days.');
  if (gramsPerDayAverage >= MODERATE_AVG_GRAMS) moderate.push('Your usual amount is high enough that your body may have adapted to alcohol.');
  if (auditScore !== null && auditScore >= 20) moderate.push('Your AUDIT score suggests possible dependence.');

  if (moderate.length) return { level: 'moderate', reasons: moderate, gramsPerDrinkingDay, gramsPerDayAverage };
  return { level: 'low', reasons: [], gramsPerDrinkingDay, gramsPerDayAverage };
}

const unique = (xs: string[]) => [...new Set(xs)];

/* ------------------------------------------------------------------ */
/* Withdrawal monitor triage                                            */
/* ------------------------------------------------------------------ */

export interface SymptomDef {
  id: string;
  label: string;
}

export const WITHDRAWAL_SYMPTOMS: SymptomDef[] = [
  { id: 'tremor', label: 'Shaky hands or body' },
  { id: 'sweats', label: 'Sweating, especially at night' },
  { id: 'nausea', label: 'Nausea or no appetite' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'anxiety', label: 'Anxious, jumpy or restless' },
  { id: 'heart', label: 'Racing or pounding heart' },
  { id: 'headache', label: 'Headache' },
  { id: 'insomnia', label: 'Can’t sleep / vivid dreams' },
  { id: 'irritable', label: 'Irritable or low mood' },
];

export const RED_FLAGS: SymptomDef[] = [
  { id: 'seizure', label: 'A seizure (fit), or passing out / can’t be woken' },
  { id: 'hallucinations', label: 'Seeing, hearing or feeling things that aren’t there' },
  { id: 'confusion', label: 'Confused — not sure where you are, what day it is' },
  { id: 'wernicke', label: 'Very unsteady on your feet, double vision, or eyes moving strangely' },
  { id: 'chest', label: 'Chest pain or trouble breathing' },
  { id: 'fever', label: 'High temperature with heavy sweating or severe shaking' },
  { id: 'bleeding', label: 'Vomiting blood or “coffee grounds”, or black, tarry poo' },
  { id: 'abdo', label: 'Severe stomach pain' },
  { id: 'head', label: 'A fall or blow to the head' },
  { id: 'fluids', label: 'Can’t keep any fluids down' },
];

export const SUICIDE_FLAG = 'suicidal';

/**
 * Triage a symptom check. Escalates when the person is high-risk, when the classic early
 * withdrawal pattern appears (tremor with sweating or racing heart), or when symptoms are
 * increasing compared with a check in the last 24 hours.
 */
export function triageWithdrawal(
  symptoms: string[],
  redFlags: string[],
  risk: RiskLevel = 'low',
  previous: Pick<WithdrawalCheck, 'at' | 'symptoms'> | null = null,
  now: Date = new Date(),
): WithdrawalLevel {
  const medicalRed = redFlags.filter((f) => f !== SUICIDE_FLAG);
  if (medicalRed.length > 0) return 'emergency';
  if (redFlags.includes(SUICIDE_FLAG)) return 'crisis';
  if (symptoms.length === 0) return 'ok';
  const has = (id: string) => symptoms.includes(id);
  const worsening =
    !!previous && now.getTime() - new Date(previous.at).getTime() <= 24 * 3_600_000 && symptoms.length > previous.symptoms.length;
  if (
    risk === 'high' ||
    symptoms.length >= 3 ||
    has('vomiting') ||
    has('heart') ||
    (has('tremor') && has('sweats')) ||
    worsening
  )
    return 'urgent';
  return 'selfcare';
}

/** True when the person also ticked the suicide flag (shown alongside any medical result). */
export function hasSuicideFlag(redFlags: string[]): boolean {
  return redFlags.includes(SUICIDE_FLAG);
}
