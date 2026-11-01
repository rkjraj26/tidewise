import type { AppData, UrgeLog } from './types';
import { addDays, hourLabel, todayKey, toKey, WEEKDAYS } from './dates';

export interface UrgeStats {
  total: number;
  ridden: number;
  avgBefore: number | null;
  avgAfter: number | null;
  avgDrop: number | null;
  avgMinutes: number | null;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function urgeStats(urges: UrgeLog[]): UrgeStats {
  const completed = urges.filter((u) => u.after !== null);
  return {
    total: urges.length,
    ridden: urges.filter((u) => u.outcome === 'rode').length,
    avgBefore: mean(completed.map((u) => u.before)),
    avgAfter: mean(completed.map((u) => u.after as number)),
    avgDrop: mean(completed.map((u) => u.before - (u.after as number))),
    avgMinutes: mean(urges.filter((u) => u.durationSec > 0).map((u) => u.durationSec / 60)),
  };
}

export function topCounts(items: string[], n = 3): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return [...m.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, n);
}

export interface RiskWindow {
  weekday: string | null;
  hourStart: number | null;
  label: string | null;
}

/** Find the riskiest weekday and 3-hour window from cravings and slips. Needs ≥3 events. */
export function riskWindow(data: AppData): RiskWindow {
  const events: Date[] = [
    ...data.urges.map((u) => new Date(u.at)),
    ...data.lapses.map((l) => new Date(l.at)),
  ].filter((d) => !Number.isNaN(d.getTime()));
  if (events.length < 3) return { weekday: null, hourStart: null, label: null };

  const wd = topCounts(events.map((d) => String(d.getDay())), 1)[0];
  const blocks = topCounts(events.map((d) => String(Math.floor(d.getHours() / 3) * 3)), 1)[0];
  const weekday = WEEKDAYS[Number(wd.key)];
  const hourStart = Number(blocks.key);
  return {
    weekday,
    hourStart,
    label: `${weekday}s, ${hourLabel(hourStart)}–${hourLabel((hourStart + 3) % 24)}`,
  };
}

/** Peak craving per day for the last `n` days (null = nothing logged). */
export function cravingSeries(data: AppData, n = 30, today: string = todayKey()): { date: string; value: number | null }[] {
  const byDay = new Map<string, number>();
  const bump = (k: string, v: number) => byDay.set(k, Math.max(byDay.get(k) ?? 0, v));
  for (const d of Object.values(data.days)) if (typeof d.craving === 'number') bump(d.date, d.craving);
  for (const u of data.urges) bump(toKey(new Date(u.at)), u.before);
  const out: { date: string; value: number | null }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ date: k, value: byDay.has(k) ? (byDay.get(k) as number) : null });
  }
  return out;
}

export interface Insight {
  id: string;
  text: string;
}

export function buildInsights(data: AppData, triggerLabels: Record<string, string>): Insight[] {
  const out: Insight[] = [];
  const s = urgeStats(data.urges);
  if (s.total >= 1 && s.avgDrop !== null && s.avgBefore !== null && s.avgAfter !== null) {
    out.push({
      id: 'drop',
      text: `Your cravings drop from ${s.avgBefore.toFixed(1)} to ${s.avgAfter.toFixed(1)} on average when you ride them out. Waves pass — your own data proves it.`,
    });
  }
  if (s.ridden >= 1) {
    out.push({ id: 'ridden', text: `You’ve ridden out ${s.ridden} craving${s.ridden === 1 ? '' : 's'} without drinking. Each one weakens the habit loop.` });
  }
  const rw = riskWindow(data);
  if (rw.label) out.push({ id: 'window', text: `Your riskiest time looks like ${rw.label}. Make an if-then plan for it.` });
  const trig = topCounts(data.urges.flatMap((u) => u.triggers), 1)[0];
  if (trig && trig.count >= 2) {
    out.push({ id: 'trigger', text: `Your most common trigger is “${triggerLabels[trig.key] ?? trig.key}”. The Toolkit has tools for exactly that.` });
  }
  const recent = Object.values(data.days).filter((d) => typeof d.sleep === 'number' && typeof d.craving === 'number');
  if (recent.length >= 5) {
    const poor = recent.filter((d) => (d.sleep as number) <= 2).map((d) => d.craving as number);
    const good = recent.filter((d) => (d.sleep as number) >= 4).map((d) => d.craving as number);
    const mp = mean(poor);
    const mg = mean(good);
    if (mp !== null && mg !== null && mp - mg >= 1.5) {
      out.push({ id: 'sleep', text: `Cravings run higher after poor sleep (${mp.toFixed(1)} vs ${mg.toFixed(1)}). Protecting sleep protects your quit.` });
    }
  }
  return out;
}
