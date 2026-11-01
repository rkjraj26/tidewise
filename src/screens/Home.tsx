import { useMemo } from 'react';
import { Activity, CalendarCheck, Check, Lightbulb, PiggyBank, Settings as Gear, Sparkles, Waves, Wine } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import { computeStats, holdStep, HOLD_STEP_DAYS, milestoneLabel, shouldWatchWithdrawal, stepdownDay } from '../lib/stats';
import { buildInsights } from '../lib/insights';
import { formatDay } from '../lib/dates';
import { MOTIVE_BY_ID, MOTIVES } from '../content/motives';
import { HEALTH_TIMELINE, PREP_CHECKLIST, TRIGGER_LABELS } from '../content/library';
import { DRINK_WORD } from '../lib/standardDrinks';
import { Button, Card, fmtMoney, fmtNum, LinkButton, Progress, StatTile, Toggle } from '../components/ui';
import { navigate } from '../router';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function Home() {
  const { data, update } = useStore();
  const today = useToday();
  const p = data.profile!;
  const s = computeStats(data, today)!;
  const todayLog = data.days[today];
  const word = DRINK_WORD[p.region];
  const insights = useMemo(() => buildInsights(data, TRIGGER_LABELS), [data]);

  const toolOfDay = useMemo(() => {
    const pool = (p.motives.length ? p.motives.map((m) => MOTIVE_BY_ID[m]) : MOTIVES.slice(0, 3)).flatMap((m) => m.tools.map((t) => ({ ...t, motive: m.label })));
    return pool[hashStr(today) % pool.length];
  }, [p.motives, today]);

  const reason = p.reasons.length ? p.reasons[hashStr(today + 'r') % p.reasons.length] : null;
  const sd = stepdownDay(p.plan, p.baseline, today, data.days);
  const taper = sd ? sd.limit : null;
  const showWithdrawal = shouldWatchWithdrawal(data, today);
  const nextTimeline = HEALTH_TIMELINE.find((t) => t.day > s.currentStreak);

  const quickAlcoholFree = () =>
    update((d) => ({
      ...d,
      days: { ...d.days, [today]: { ...(d.days[today] ?? {}), date: today, drank: false, drinks: 0, updatedAt: new Date().toISOString() } },
    }));

  const prepDone = data.settings.prepDone;

  return (
    <main className="screen" aria-labelledby="home-title">
      <header className="home-head">
        <div>
          <p className="eyebrow">{formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 id="home-title" className="home-title">
            {greeting()}
            {p.name ? `, ${p.name}` : ''}
          </h1>
        </div>
        <a href="#/settings" className="icon-btn" aria-label="Settings">
          <Gear aria-hidden />
        </a>
      </header>

      {s.phase === 'prep' ? (
        <Card className="hero" tone="calm">
          <p className="hero-num" data-testid="countdown">
            {s.daysUntilStart}
          </p>
          <p className="hero-label">{s.daysUntilStart === 1 ? 'day until your quit day' : 'days until your quit day'}</p>
          <p className="fine">{formatDay(p.plan.quitDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </Card>
      ) : (
        <Card className="hero">
          <p className="hero-num" data-testid="streak">
            {s.currentStreak}
          </p>
          <p className="hero-label">
            {s.currentStreak === 0 ? 'Today is a fresh start' : s.currentStreak === 1 ? 'day alcohol-free' : 'days alcohol-free'}
          </p>
          <p className="hero-sub" data-testid="hero-sub">
            {s.totalAlcoholFreeDays} alcohol-free {s.totalAlcoholFreeDays === 1 ? 'day' : 'days'} in total · longest run {s.longestStreak}
          </p>
          {s.nextMilestone && (
            <div className="milestone-next">
              <Progress value={s.currentStreak / s.nextMilestone} label={`Progress to ${milestoneLabel(s.nextMilestone)}`} />
              <span className="fine">Next: {milestoneLabel(s.nextMilestone)}</span>
            </div>
          )}
        </Card>
      )}

      <Button variant="sos" block onClick={() => navigate('#/sos')} className="sos-big">
        <Waves aria-hidden /> Craving? Ride the wave
      </Button>

      {sd && taper !== null && s.phase === 'active' && today < p.plan.quitDate && (
        <Card tone="accent" data-testid="taper-card">
          <p className="eyebrow">Step-down plan</p>
          <p className="taper-today">
            Today’s limit: <strong>{taper}</strong> {taper === 1 ? word.one : word.many}
          </p>
          <p className="fine">
            {taper === 0 && sd.cap > 0
              ? `You’ve used this week’s allowance (${sd.weeklyBudget} ${word.many} or ${p.baseline.drinkingDaysPerWeek} drinking days). Today is alcohol-free.`
              : `This week: up to ${sd.weeklyBudget} ${word.many} in total. Zero day: ${formatDay(p.plan.quitDate)}. Fewer is always a win.`}
          </p>
          <details>
            <summary>Shaky, sweaty, sick or very anxious?</summary>
            <p>
              That may be withdrawal. Go back to the last amount that didn’t cause symptoms and hold there for a few days — and get medical advice today.
            </p>
            <Button variant="secondary" onClick={() => update((d) => ({ ...d, profile: { ...d.profile!, plan: holdStep(d.profile!.plan) } }))}>
              Hold this step ({HOLD_STEP_DAYS} days)
            </Button>
          </details>
        </Card>
      )}

      {showWithdrawal && (
        <Card tone="warn">
          <h2 className="card-title with-icon">
            <Activity aria-hidden /> Withdrawal check
          </h2>
          <p>The first days after stopping are when withdrawal happens. Check your symptoms once or twice a day.</p>
          <LinkButton to="#/withdrawal" variant="primary">
            Check my symptoms
          </LinkButton>
        </Card>
      )}

      {s.phase === 'active' && (
        <Card>
          <h2 className="card-title with-icon">
            <CalendarCheck aria-hidden /> Today
          </h2>
          {todayLog ? (
            <>
              <p data-testid="today-status">
                {todayLog.drank && todayLog.drinks > 0 ? (
                  <>Logged: {todayLog.drinks} {todayLog.drinks === 1 ? word.one : word.many}. Tomorrow is a new day — and your progress is still here.</>
                ) : (
                  <>
                    <Check size={16} aria-hidden className="inline-ok" /> Logged as alcohol-free. Well done.
                  </>
                )}
              </p>
              <LinkButton to={`#/checkin?date=${today}`}>Edit check-in</LinkButton>
            </>
          ) : (
            <>
              <p>How’s today going?</p>
              <div className="row-wrap">
                <Button onClick={quickAlcoholFree}>Alcohol-free so far</Button>
                <LinkButton to={`#/checkin?date=${today}`}>Full check-in</LinkButton>
                <LinkButton to="#/slip" variant="ghost">
                  I had a drink
                </LinkButton>
              </div>
            </>
          )}
        </Card>
      )}

      {s.phase === 'prep' && (
        <Card>
          <h2 className="card-title">Get ready</h2>
          <p className="fine">People who prepare do better. Tick these off before your quit day.</p>
          <div className="stack-sm">
            {PREP_CHECKLIST.map((item) => (
              <Toggle
                key={item.id}
                checked={prepDone.includes(item.id)}
                label={item.label}
                description={item.detail}
                onChange={(on) =>
                  update((d) => ({
                    ...d,
                    settings: { ...d.settings, prepDone: on ? [...d.settings.prepDone, item.id] : d.settings.prepDone.filter((x) => x !== item.id) },
                  }))
                }
              />
            ))}
          </div>
        </Card>
      )}

      {s.phase === 'active' && (
        <div className="stat-grid">
          <StatTile icon={<PiggyBank size={18} />} value={fmtMoney(s.moneySaved, p.currency)} label="saved" />
          <StatTile icon={<Wine size={18} />} value={fmtNum(s.drinksAvoided)} label={`${word.many} not drunk`} />
          <StatTile icon={<Waves size={18} />} value={String(data.urges.filter((u) => u.outcome === 'rode').length)} label="waves ridden" />
        </div>
      )}

      {reason && (
        <Card tone="calm">
          <p className="eyebrow">Remember why</p>
          <p className="quote">“{reason}”</p>
        </Card>
      )}

      {toolOfDay && (
        <Card>
          <p className="eyebrow with-icon">
            <Sparkles size={14} aria-hidden /> Tool for today · {toolOfDay.motive}
          </p>
          <h2 className="card-title">{toolOfDay.title}</h2>
          <p>{toolOfDay.how}</p>
          {toolOfDay.link && <LinkButton to={toolOfDay.link}>Try it</LinkButton>}
        </Card>
      )}

      {insights.length > 0 && (
        <Card>
          <p className="eyebrow with-icon">
            <Lightbulb size={14} aria-hidden /> What your data says
          </p>
          <ul className="insights">
            {insights.slice(0, 3).map((i) => (
              <li key={i.id}>{i.text}</li>
            ))}
          </ul>
        </Card>
      )}

      {s.phase === 'active' && nextTimeline && (
        <Card>
          <p className="eyebrow">Coming up for your body · day {nextTimeline.day}</p>
          <h2 className="card-title">{nextTimeline.title}</h2>
          <p>{nextTimeline.text}</p>
          <LinkButton to="#/progress">See your progress</LinkButton>
        </Card>
      )}
    </main>
  );
}
