import type { AppData } from './types';
import { interpretAudit } from './audit';
import { gramsFromBaseline } from './safety';
import { baselineRates, computeStats } from './stats';
import { STANDARD_LABEL } from './standardDrinks';
import { addDays, diffDays, formatDay, todayKey } from './dates';
import { RED_FLAGS, WITHDRAWAL_SYMPTOMS } from './safety';

const APPROACH_TEXT = {
  stop: 'Stop completely on a set date',
  medical: 'Stop with medical support',
  stepdown: 'Reduce step by step to zero',
};

const SAFETY_TEXT: Record<string, string> = {
  dailyDrinking: 'Drinks daily or almost daily',
  withdrawalSymptoms: 'Gets withdrawal symptoms (shakes, sweats, nausea, anxiety) or drinks in the morning',
  pastSeizureOrDTs: 'Has had a withdrawal seizure or delirium tremens',
  pastMedicalDetox: 'Has needed medically managed withdrawal before',
  sedatives: 'Also uses sedatives (benzodiazepines, sleeping pills) or opioids',
  medicalConditions: 'Has a serious medical condition (e.g. liver, heart, epilepsy)',
  pregnant: 'Is pregnant or may be pregnant',
};

export function buildDoctorReport(data: AppData, today: string = todayKey()): string {
  const p = data.profile;
  if (!p) return '';
  const lines: string[] = [];
  const { gramsPerDayAverage, gramsPerDrinkingDay } = gramsFromBaseline(p.baseline, p.region);
  lines.push(`Summary for my doctor — ${formatDay(today, { day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push('');
  lines.push('MY GOAL: To stop drinking alcohol.');
  lines.push(`Planned approach: ${APPROACH_TEXT[p.plan.approach]} (quit date ${formatDay(p.plan.quitDate, { day: 'numeric', month: 'long', year: 'numeric' })}).`);
  lines.push('');
  lines.push('MY USUAL DRINKING (before starting):');
  lines.push(`• ${p.baseline.drinkingDaysPerWeek} drinking day(s) per week, about ${p.baseline.drinksPerDrinkingDay} per drinking day [1 = one ${STANDARD_LABEL[p.region]}].`);
  lines.push(`• ≈ ${Math.round(gramsPerDrinkingDay)} g alcohol on a drinking day; ≈ ${Math.round(gramsPerDayAverage)} g/day on average; ≈ ${Math.round(baselineRates(p.baseline).drinksPerWeek * 10) / 10} per week.`);
  if (p.audit) {
    const ai = interpretAudit(p.audit.score);
    lines.push(`• AUDIT score: ${p.audit.score}/40 (${ai.title}).`);
  }
  if (p.safety) {
    const flags = Object.entries(SAFETY_TEXT)
      .filter(([k]) => (p.safety as any)[k])
      .map(([, v]) => `• ${v}`);
    lines.push('');
    lines.push(`WITHDRAWAL SAFETY SCREEN (self-reported): ${p.safety.level.toUpperCase()} risk`);
    lines.push(...(flags.length ? flags : ['• No risk factors reported']));
  }
  const s = computeStats(data, today);
  if (s && s.phase === 'active') {
    const since = addDays(today, -29);
    const recent = Object.values(data.days).filter((d) => diffDays(since, d.date) >= 0 && diffDays(d.date, today) >= 0 && d.drank);
    lines.push('');
    lines.push('PROGRESS SO FAR:');
    lines.push(`• Days with no drinking logged: ${s.totalAlcoholFreeDays} of ${s.elapsedDays} since ${formatDay(s.start, { day: 'numeric', month: 'short' })}.`);
    lines.push(`• Last drinking day logged: ${s.lastDrinkDay ? formatDay(s.lastDrinkDay, { weekday: 'short', day: 'numeric', month: 'long' }) : 'none since starting'}.`);
    lines.push(`• Drinking days logged in the last 30 days: ${recent.length} (${recent.reduce((a, d) => a + d.drinks, 0)} drinks).`);
  }
  const lastCheck = [...data.withdrawal].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (lastCheck && (lastCheck.symptoms.length || lastCheck.redFlags.length)) {
    const label = (id: string) => [...WITHDRAWAL_SYMPTOMS, ...RED_FLAGS].find((x) => x.id === id)?.label ?? id;
    lines.push('');
    lines.push(`MOST RECENT WITHDRAWAL SYMPTOMS (${new Date(lastCheck.at).toLocaleString()}):`);
    lines.push(...[...lastCheck.redFlags, ...lastCheck.symptoms].map((x) => `• ${label(x)}`));
  }
  lines.push('');
  lines.push('QUESTIONS I’D LIKE TO ASK:');
  lines.push('• Do I need medical support to stop safely? Should I take thiamine (vitamin B1)?');
  lines.push('• Could a medication such as naltrexone or acamprosate help me stay stopped?');
  lines.push('• Should I have blood tests (for example liver function)?');
  lines.push('• Can you refer me to counselling, a treatment service or a support group?');
  lines.push('• Do any of my current medicines interact with alcohol or with withdrawal?');
  lines.push('');
  lines.push('(Prepared with the Tidewise app. Self-reported information — not a diagnosis.)');
  return lines.join('\n');
}
