import { describe, expect, it } from 'vitest';
import { addDays, diffDays, fromKey, isValidKey, rangeKeys, toKey } from '../../src/lib/dates';
import { AUDIT_QUESTIONS, interpretAudit, scoreAudit } from '../../src/lib/audit';
import { assessWithdrawalRisk, gramsFromBaseline, triageWithdrawal } from '../../src/lib/safety';
import { computeStats, dayStatus, taperSchedule, taperTarget, baselineRates, stepdownDay, holdStep, recentHeavyPattern, shouldWatchWithdrawal, stepdownMinDays } from '../../src/lib/stats';
import { buildInsights, cravingSeries, riskWindow, topCounts, urgeStats } from '../../src/lib/insights';
import { emptyData, exportJson, hashPin, importJson, isValidPin, loadData, normalise, saveData, STORAGE_KEY } from '../../src/lib/storage';
import { gramsOfAlcohol, standardDrinks } from '../../src/lib/standardDrinks';
import { buildDoctorReport } from '../../src/lib/doctorReport';
import type { AppData, Profile, SafetyAnswers } from '../../src/lib/types';

const NO: SafetyAnswers = {
  dailyDrinking: false,
  withdrawalSymptoms: false,
  pastSeizureOrDTs: false,
  pastMedicalDetox: false,
  sedatives: false,
  medicalConditions: false,
};

function profile(over: Partial<Profile> = {}): Profile {
  return {
    name: 'Sam',
    region: 'US',
    currency: '$',
    motives: ['stress', 'sleep'],
    reasons: ['Better sleep'],
    futureLetter: '',
    baseline: { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 4, spendPerWeek: 70 },
    audit: null,
    safety: null,
    plan: { approach: 'stop', quitDate: '2026-10-01', startedOn: '2026-10-01', medicalGuidance: false },
    ...over,
  };
}

function data(over: Partial<AppData> = {}): AppData {
  return { ...emptyData(new Date('2026-10-01T09:00:00')), profile: profile(), ...over };
}

describe('dates', () => {
  it('round-trips keys and handles month/year boundaries', () => {
    expect(toKey(fromKey('2026-02-28'))).toBe('2026-02-28');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
    expect(diffDays('2026-10-01', '2026-10-31')).toBe(30);
    expect(diffDays('2026-10-31', '2026-10-01')).toBe(-30);
  });
  it('survives DST transitions', () => {
    // US DST ends 2026-11-01, EU 2026-10-25 — noon anchoring keeps whole days
    expect(diffDays('2026-10-20', '2026-11-05')).toBe(16);
    expect(rangeKeys('2026-10-24', '2026-10-26')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
  });
  it('validates keys', () => {
    expect(isValidKey('2026-02-30')).toBe(false);
    expect(isValidKey('2026-2-3')).toBe(false);
    expect(isValidKey('2026-02-03')).toBe(true);
    expect(rangeKeys('2026-10-05', '2026-10-01')).toEqual([]);
  });
});

describe('AUDIT', () => {
  it('has 10 WHO items', () => {
    expect(AUDIT_QUESTIONS).toHaveLength(10);
    expect(AUDIT_QUESTIONS[8].options.map((o) => o.score)).toEqual([0, 2, 4]);
  });
  it('scores and bands correctly', () => {
    expect(scoreAudit([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(scoreAudit([4, 4, 4, 4, 4, 4, 4, 4, 4, 4])).toBe(40);
    expect(interpretAudit(7).zone).toBe(1);
    expect(interpretAudit(8).zone).toBe(2);
    expect(interpretAudit(15).zone).toBe(2);
    expect(interpretAudit(16).zone).toBe(3);
    expect(interpretAudit(19).zone).toBe(3);
    expect(interpretAudit(20).zone).toBe(4);
  });
  it('rejects invalid answers', () => {
    expect(() => scoreAudit([0, 0, 0])).toThrow();
    expect(() => scoreAudit([0, 0, 0, 0, 0, 0, 0, 0, 1, 0])).toThrow(); // item 9 only allows 0/2/4
  });
});

describe('withdrawal safety screen', () => {
  const light = { drinkingDaysPerWeek: 2, drinksPerDrinkingDay: 2, spendPerWeek: 20 };
  const heavyDaily = { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 10, spendPerWeek: 150 };

  it('low risk for light drinking with no flags', () => {
    expect(assessWithdrawalRisk(NO, light, 'US', 5).level).toBe('low');
  });
  it('past seizure/DTs is always high', () => {
    expect(assessWithdrawalRisk({ ...NO, pastSeizureOrDTs: true }, light, 'US', 3).level).toBe('high');
  });
  it('daily heavy drinking with withdrawal symptoms is high', () => {
    const r = assessWithdrawalRisk({ ...NO, dailyDrinking: true, withdrawalSymptoms: true }, heavyDaily, 'US', null);
    expect(r.level).toBe('high');
    expect(r.gramsPerDrinkingDay).toBe(140);
  });
  it('sedatives + daily drinking is high', () => {
    expect(assessWithdrawalRisk({ ...NO, dailyDrinking: true, sedatives: true }, light, 'US', null).level).toBe('high');
  });
  it('daily drinking alone is moderate', () => {
    expect(assessWithdrawalRisk({ ...NO, dailyDrinking: true }, light, 'US', null).level).toBe('moderate');
  });
  it('6+ drinking days per week counts as daily', () => {
    const r = assessWithdrawalRisk(NO, { ...light, drinkingDaysPerWeek: 6 }, 'US', null);
    expect(r.level).toBe('moderate');
  });
  it('AUDIT ≥ 20 escalates to moderate', () => {
    expect(assessWithdrawalRisk(NO, light, 'US', 20).level).toBe('moderate');
    expect(assessWithdrawalRisk(NO, light, 'US', 19).level).toBe('low');
  });
  it('physical dependence is HIGH even without noticed withdrawal (daily ≥120 g)', () => {
    const r = assessWithdrawalRisk(NO, { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 9, spendPerWeek: 100 }, 'US', null);
    expect(r.level).toBe('high'); // 126 g/day
  });
  it('daily drinking + relief drinking is HIGH at any amount', () => {
    expect(assessWithdrawalRisk({ ...NO, dailyDrinking: true, withdrawalSymptoms: true }, light, 'US', null).level).toBe('high');
  });
  it('AUDIT item 6 (morning drinking) counts as relief drinking', () => {
    const answers = [4, 1, 1, 1, 0, 2, 0, 0, 0, 0];
    expect(assessWithdrawalRisk({ ...NO, dailyDrinking: true }, light, 'US', 9, answers).level).toBe('high');
    expect(assessWithdrawalRisk(NO, light, 'US', 9, answers).level).toBe('moderate');
  });
  it('daily + AUDIT ≥ 20 is HIGH', () => {
    expect(assessWithdrawalRisk({ ...NO, dailyDrinking: true }, light, 'US', 20).level).toBe('high');
  });
  it('pregnancy: daily → HIGH, otherwise MODERATE', () => {
    expect(assessWithdrawalRisk({ ...NO, pregnant: true, dailyDrinking: true }, light, 'US', null).level).toBe('high');
    expect(assessWithdrawalRisk({ ...NO, pregnant: true }, light, 'US', null).level).toBe('moderate');
  });
  it('very heavy daily drinking mentions inpatient withdrawal', () => {
    const r = assessWithdrawalRisk({ ...NO, dailyDrinking: true }, { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 18, spendPerWeek: 0 }, 'US', null);
    expect(r.level).toBe('high');
    expect(r.reasons.join(' ')).toMatch(/hospital or a detox unit/);
  });
  it('heavy but non-daily drinking is MODERATE', () => {
    expect(assessWithdrawalRisk(NO, { drinkingDaysPerWeek: 2, drinksPerDrinkingDay: 10, spendPerWeek: 0 }, 'US', null).level).toBe('moderate');
  });
  it('high average grams escalates to moderate; UK units are 8 g', () => {
    // 5 days × 12 units × 8 g / 7 = 68.6 g/day
    expect(assessWithdrawalRisk(NO, { drinkingDaysPerWeek: 5, drinksPerDrinkingDay: 12, spendPerWeek: 50 }, 'UK', null).level).toBe('moderate');
    expect(gramsFromBaseline({ drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 15, spendPerWeek: 0 }, 'UK').gramsPerDrinkingDay).toBe(120);
  });
});

describe('withdrawal triage', () => {
  it('red flags → emergency, suicidal → crisis', () => {
    expect(triageWithdrawal([], ['seizure'])).toBe('emergency');
    expect(triageWithdrawal(['tremor'], ['suicidal'])).toBe('crisis');
    expect(triageWithdrawal([], ['suicidal', 'hallucinations'])).toBe('emergency');
  });
  it('symptom counts', () => {
    expect(triageWithdrawal([], [])).toBe('ok');
    expect(triageWithdrawal(['headache'], [])).toBe('selfcare');
    expect(triageWithdrawal(['headache', 'sweats'], [])).toBe('selfcare');
    expect(triageWithdrawal(['headache', 'sweats', 'tremor'], [])).toBe('urgent');
    expect(triageWithdrawal(['vomiting'], [])).toBe('urgent');
    expect(triageWithdrawal(['heart'], [])).toBe('urgent');
  });
  it('escalates for high-risk people, the tremor+sweats pattern, and worsening symptoms', () => {
    expect(triageWithdrawal(['headache'], [], 'high')).toBe('urgent');
    expect(triageWithdrawal(['tremor', 'sweats'], [], 'low')).toBe('urgent');
    const now = new Date('2026-10-02T12:00:00');
    expect(triageWithdrawal(['tremor', 'headache'], [], 'low', { at: '2026-10-02T06:00:00', symptoms: ['tremor'] }, now)).toBe('urgent');
    expect(triageWithdrawal(['tremor', 'headache'], [], 'low', { at: '2026-09-30T06:00:00', symptoms: ['tremor'] }, now)).toBe('selfcare');
  });
});

describe('stats', () => {
  it('prep phase before quit date', () => {
    const d = data({ profile: profile({ plan: { approach: 'stop', quitDate: '2026-10-10', startedOn: '2026-10-01', medicalGuidance: false } }) });
    const s = computeStats(d, '2026-10-07')!;
    expect(s.phase).toBe('prep');
    expect(s.daysUntilStart).toBe(3);
  });
  it('quit day is Day 1, unlogged days presumed alcohol-free', () => {
    const d = data();
    expect(computeStats(d, '2026-10-01')!.currentStreak).toBe(1);
    const s = computeStats(d, '2026-10-10')!;
    expect(s.currentStreak).toBe(10);
    expect(s.totalAlcoholFreeDays).toBe(10);
    expect(s.moneySaved).toBeCloseTo(100); // $10/day × 10
    expect(s.drinksAvoided).toBeCloseTo(40); // 4/day × 10
    expect(s.earnedMilestones).toEqual([1, 3, 7]);
    expect(s.nextMilestone).toBe(14);
  });
  it('a slip resets the current run but never erases totals or longest run', () => {
    const d = data({
      days: { '2026-10-08': { date: '2026-10-08', drank: true, drinks: 3, updatedAt: '' } },
    });
    const s = computeStats(d, '2026-10-12')!;
    expect(s.currentStreak).toBe(4); // 9,10,11,12
    expect(s.longestStreak).toBe(7);
    expect(s.totalAlcoholFreeDays).toBe(11);
    expect(s.drinkDays).toBe(1);
    expect(s.drinksLogged).toBe(3);
    expect(s.drinksAvoided).toBeCloseTo(12 * 4 - 3);
    // cost per drink = 70 / 28 = 2.5
    expect(s.moneySaved).toBeCloseTo(12 * 10 - 3 * 2.5);
    expect(s.earnedMilestones).toContain(7);
    expect(s.lastDrinkDay).toBe('2026-10-08');
  });
  it('drinking today makes current run 0', () => {
    const d = data({ days: { '2026-10-05': { date: '2026-10-05', drank: true, drinks: 1, updatedAt: '' } } });
    expect(computeStats(d, '2026-10-05')!.currentStreak).toBe(0);
  });
  it('a logged day with drank=true but 0 drinks is not a drink day', () => {
    const d = data({ days: { '2026-10-05': { date: '2026-10-05', drank: true, drinks: 0, updatedAt: '' } } });
    expect(computeStats(d, '2026-10-05')!.currentStreak).toBe(5);
  });
  it('money saved never goes negative', () => {
    const d = data({ days: { '2026-10-01': { date: '2026-10-01', drank: true, drinks: 30, updatedAt: '' } } });
    const s = computeStats(d, '2026-10-01')!;
    expect(s.moneySaved).toBe(0);
    expect(s.drinksAvoided).toBe(0);
  });
  it('baseline rates handle zero drinks', () => {
    expect(baselineRates({ drinkingDaysPerWeek: 0, drinksPerDrinkingDay: 0, spendPerWeek: 0 }).costPerDrink).toBe(0);
  });
});

describe('step-down plan (weekly budget)', () => {
  const plan = { approach: 'stepdown' as const, startedOn: '2026-10-01', quitDate: '2026-10-11', medicalGuidance: false };
  const base = { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 10, spendPerWeek: 100 };
  it('caps decline to zero on the zero day', () => {
    expect(taperTarget(plan, base, '2026-10-01')).toBe(10);
    expect(taperTarget(plan, base, '2026-10-06')).toBe(5);
    expect(taperTarget(plan, base, '2026-10-11')).toBe(0);
    expect(taperTarget(plan, base, '2026-10-20')).toBe(0);
    const sched = taperSchedule(plan, base);
    expect(sched).toHaveLength(11);
    for (let i = 1; i < sched.length; i++) expect(sched[i].limit).toBeLessThanOrEqual(sched[i - 1].limit);
  });
  it('never adds drinking days for a binge pattern (2 days × 10)', () => {
    const binge = { drinkingDaysPerWeek: 2, drinksPerDrinkingDay: 10, spendPerWeek: 60 };
    const p14 = { ...plan, quitDate: '2026-10-15' };
    const days = {
      '2026-10-01': { date: '2026-10-01', drank: true, drinks: 10, updatedAt: '' },
      '2026-10-02': { date: '2026-10-02', drank: true, drinks: 9, updatedAt: '' },
    };
    expect(taperTarget(p14, binge, '2026-10-01')).toBe(10);
    const d3 = stepdownDay(p14, binge, '2026-10-03', days)!;
    expect(d3.drinkingDaysLast6).toBe(2);
    expect(d3.limit).toBe(0); // both drinking days already used this week
    // a whole week at the old daily-cap rule would have allowed ~60 drinks; weekly budget keeps it ≤ 20
    expect(stepdownDay(p14, binge, '2026-10-01')!.weeklyBudget).toBe(20);
  });
  it('weekly budget limits daily drinkers', () => {
    const daily = { drinkingDaysPerWeek: 7, drinksPerDrinkingDay: 4, spendPerWeek: 50 };
    const p14 = { ...plan, quitDate: '2026-10-15' };
    const days: Record<string, any> = {};
    for (let i = 1; i <= 7; i++) {
      const k = `2026-10-0${i}`;
      days[k] = { date: k, drank: true, drinks: 3, updatedAt: '' };
    }
    const d = stepdownDay(p14, daily, '2026-10-08', days)!; // halfway: cap 2, weekly 14, used 18
    expect(d.cap).toBe(2);
    expect(d.weeklyBudget).toBe(14);
    expect(d.limit).toBe(0);
  });
  it('“hold this step” restores an earlier level and moves the zero day', () => {
    const held = holdStep(plan);
    expect(held.quitDate).toBe('2026-10-15');
    expect(held.holdDays).toBe(4);
    // holding on 6 Oct restores the level from 4 days earlier
    expect(taperTarget(held, base, '2026-10-06')).toBe(taperTarget(plan, base, '2026-10-02'));
    expect(taperTarget(held, base, '2026-10-06')).toBe(9);
    expect(taperTarget(held, base, '2026-10-15')).toBe(0);
  });
  it('dependent drinkers get a slower minimum', () => {
    expect(stepdownMinDays('low')).toBe(7);
    expect(stepdownMinDays('moderate')).toBe(21);
    expect(stepdownMinDays('high')).toBe(21);
  });
  it('not on step-down → null', () => {
    expect(taperTarget({ ...plan, approach: 'stop' }, base, '2026-10-03')).toBeNull();
  });
  it('step-down counts from the start date and marks on-plan days', () => {
    const d = data({
      profile: profile({ plan, baseline: base }),
      days: { '2026-10-02': { date: '2026-10-02', drank: true, drinks: 8, updatedAt: '' } },
    });
    expect(dayStatus(d, '2026-10-02', '2026-10-05')).toBe('onplan');
    expect(dayStatus(d, '2026-10-03', '2026-10-05')).toBe('af');
    expect(dayStatus(d, '2026-10-06', '2026-10-05')).toBe('future');
    expect(dayStatus(d, '2026-09-30', '2026-10-05')).toBe('before');
    expect(computeStats(d, '2026-10-05')!.currentStreak).toBe(3);
  });
});

describe('withdrawal watch', () => {
  it('flags 3+ drinking days in a row and keeps watching for a week', () => {
    const days: Record<string, any> = {};
    for (const k of ['2026-10-10', '2026-10-11', '2026-10-12']) days[k] = { date: k, drank: true, drinks: 2, updatedAt: '' };
    const d = data({ profile: profile({ safety: { ...NO, level: 'low', assessedAt: '' } }), days });
    expect(recentHeavyPattern(d, '2026-10-13')).toBe('2026-10-12');
    expect(shouldWatchWithdrawal(d, '2026-10-19')).toBe(true);
    expect(shouldWatchWithdrawal(d, '2026-10-20')).toBe(false);
  });
  it('flags a single very heavy day', () => {
    const d = data({ days: { '2026-10-10': { date: '2026-10-10', drank: true, drinks: 9, updatedAt: '' } } });
    expect(recentHeavyPattern(d, '2026-10-11')).toBe('2026-10-10');
  });
  it('watches the first week for moderate risk, and a missing screen counts as moderate', () => {
    const d = data(); // quit 2026-10-01, no safety screen
    expect(shouldWatchWithdrawal(d, '2026-10-05')).toBe(true);
    expect(shouldWatchWithdrawal(d, '2026-10-12')).toBe(false);
  });
});

describe('insights', () => {
  const urges = [
    { id: '1', at: '2026-10-02T18:30:00', before: 8, after: 3, triggers: ['stress', 'time'], durationSec: 900, outcome: 'rode' as const },
    { id: '2', at: '2026-10-09T19:10:00', before: 7, after: 2, triggers: ['stress'], durationSec: 600, outcome: 'rode' as const },
    { id: '3', at: '2026-10-16T20:00:00', before: 9, after: null, triggers: ['bored'], durationSec: 0, outcome: 'drank' as const },
  ];
  it('urge stats', () => {
    const s = urgeStats(urges);
    expect(s.total).toBe(3);
    expect(s.ridden).toBe(2);
    expect(s.avgBefore).toBe(7.5);
    expect(s.avgAfter).toBe(2.5);
    expect(s.avgDrop).toBe(5);
    expect(s.avgMinutes).toBe(12.5);
  });
  it('top counts + risk window (all Fridays 6–9pm local)', () => {
    expect(topCounts(['a', 'b', 'a'])[0]).toEqual({ key: 'a', count: 2 });
    const rw = riskWindow(data({ urges }));
    expect(rw.weekday).toBe('Friday');
    expect(rw.hourStart).toBe(18);
    expect(rw.label).toBe('Fridays, 6pm–9pm');
  });
  it('needs ≥3 events for a risk window', () => {
    expect(riskWindow(data({ urges: urges.slice(0, 2) })).label).toBeNull();
  });
  it('craving series takes the daily peak', () => {
    const d = data({
      urges,
      days: { '2026-10-09': { date: '2026-10-09', drank: false, drinks: 0, craving: 4, updatedAt: '' } },
    });
    const series = cravingSeries(d, 10, '2026-10-10');
    expect(series).toHaveLength(10);
    expect(series.find((x) => x.date === '2026-10-09')!.value).toBe(7);
    expect(series.find((x) => x.date === '2026-10-08')!.value).toBeNull();
  });
  it('builds personal insights', () => {
    const ins = buildInsights(data({ urges }), { stress: 'Stress' });
    const ids = ins.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['drop', 'ridden', 'window', 'trigger']));
    expect(ins.find((i) => i.id === 'trigger')!.text).toContain('Stress');
  });
});

describe('storage', () => {
  it('saves and loads', () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    const d = data();
    expect(saveData(store, d)).toBe(true);
    expect(loadData(store).profile?.name).toBe('Sam');
  });
  it('keeps a copy of corrupt data instead of destroying it', () => {
    const m = new Map<string, string>([[STORAGE_KEY, '{not json']]);
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    expect(loadData(store).profile).toBeNull();
    expect([...m.keys()].some((k) => k.startsWith(`${STORAGE_KEY}:corrupt:`))).toBe(true);
  });
  it('export → import round trip', () => {
    const d = data({ days: { '2026-10-03': { date: '2026-10-03', drank: false, drinks: 0, mood: 4, updatedAt: 'x' } } });
    const back = importJson(exportJson(d));
    expect(back.profile?.baseline.spendPerWeek).toBe(70);
    expect(back.days['2026-10-03'].mood).toBe(4);
  });
  it('import rejects junk and sanitises bad days', () => {
    expect(() => importJson('nope')).toThrow(/valid JSON/);
    expect(() => importJson('{"version":2}')).toThrow();
    expect(() => importJson('[]')).toThrow();
    const n = normalise({ version: 1, days: { 'bad-key': {}, '2026-10-03': { drank: 1, drinks: -5 } }, urges: 'x' });
    expect(Object.keys(n.days)).toEqual(['2026-10-03']);
    expect(n.days['2026-10-03'].drinks).toBe(0);
    expect(n.days['2026-10-03'].drank).toBe(true);
    expect(n.urges).toEqual([]);
    expect(n.settings.theme).toBe('system');
  });
  it('import rejects a profile with an invalid plan', () => {
    expect(() => normalise({ version: 1, profile: { plan: { quitDate: 'x', startedOn: 'y' }, baseline: {} } })).toThrow(/plan/);
  });
  it('PIN hashing is salted and deterministic', async () => {
    const a = await hashPin('1234', 'salt1');
    expect(a).toHaveLength(64);
    expect(await hashPin('1234', 'salt1')).toBe(a);
    expect(await hashPin('1234', 'salt2')).not.toBe(a);
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('123')).toBe(false);
  });
});

describe('standard drinks', () => {
  it('computes grams and regional standard drinks', () => {
    expect(gramsOfAlcohol(355, 5)).toBeCloseTo(14.0, 0);
    expect(standardDrinks(355, 5, 'US')).toBeCloseTo(1.0, 1);
    expect(standardDrinks(750, 13, 'AU')).toBeCloseTo(7.7, 1);
    expect(standardDrinks(568, 5, 'UK')).toBeCloseTo(2.8, 1);
    expect(gramsOfAlcohol(-1, 5)).toBe(0);
  });
});

describe('doctor report', () => {
  it('includes the key clinical facts and questions', () => {
    const d = data({
      profile: profile({
        audit: { answers: [], score: 23, takenAt: '' },
        safety: { ...NO, dailyDrinking: true, withdrawalSymptoms: true, level: 'high', assessedAt: '' },
      }),
    });
    const r = buildDoctorReport(d, '2026-10-05');
    expect(r).toContain('AUDIT score: 23/40 (Possible dependence)');
    expect(r).toContain('HIGH risk');
    expect(r).toContain('Drinks daily or almost daily');
    expect(r).toContain('naltrexone');
    expect(r).toContain('thiamine');
    expect(r).toContain('Days with no drinking logged: 5 of 5');
    expect(r).toContain('Last drinking day logged: none since starting');
  });
  it('is empty without a profile', () => {
    expect(buildDoctorReport(emptyData())).toBe('');
  });
});
