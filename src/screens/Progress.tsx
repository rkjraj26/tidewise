import { Award, Lock as LockIcon } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import { computeStats, MILESTONES, milestoneLabel } from '../lib/stats';
import { cravingSeries, urgeStats } from '../lib/insights';
import { HEALTH_TIMELINE } from '../content/library';
import { DRINK_WORD } from '../lib/standardDrinks';
import { Calendar, CravingChart } from '../components/Charts';
import { Card, fmtMoney, fmtNum, Header, StatTile } from '../components/ui';

export function Progress() {
  const { data } = useStore();
  const today = useToday();
  const p = data.profile!;
  const s = computeStats(data, today)!;
  const u = urgeStats(data.urges);
  const word = DRINK_WORD[p.region];

  return (
    <main className="screen" aria-labelledby="prog-title">
      <Header title="Progress" />
      <h2 id="prog-title" className="sr-only">
        Your progress
      </h2>
      {s.phase === 'prep' ? (
        <Card tone="calm">
          <p>Your progress starts on your quit day — {s.daysUntilStart} {s.daysUntilStart === 1 ? 'day' : 'days'} to go. Use the time to prepare.</p>
        </Card>
      ) : (
        <>
          <div className="stat-grid stat-grid-3">
            <StatTile value={String(s.currentStreak)} label="current run (days)" />
            <StatTile value={String(s.longestStreak)} label="longest run" />
            <StatTile value={String(s.totalAlcoholFreeDays)} label="alcohol-free days" />
            <StatTile value={fmtMoney(s.moneySaved, p.currency)} label="money saved" />
            <StatTile value={fmtNum(s.drinksAvoided)} label={`${word.many} not drunk`} />
            <StatTile value={String(u.ridden)} label="cravings ridden out" />
          </div>
          <p className="fine center">A slip never erases these totals. Every alcohol-free day counts.</p>
        </>
      )}

      <Card>
        <h3 className="card-title">Your days</h3>
        <Calendar data={data} today={today} />
      </Card>

      <Card>
        <h3 className="card-title">Peak craving, last 30 days</h3>
        <CravingChart series={cravingSeries(data, 30, today)} />
        {u.avgDrop !== null && u.avgBefore !== null && u.avgAfter !== null && (
          <p data-testid="urge-drop">
            When you ride out a craving, it drops from <strong>{u.avgBefore.toFixed(1)}</strong> to <strong>{u.avgAfter.toFixed(1)}</strong> on average
            {u.avgMinutes !== null ? `, in about ${Math.max(1, Math.round(u.avgMinutes))} minutes` : ''}.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="card-title">Milestones</h3>
        <ul className="milestones">
          {MILESTONES.slice(0, 9).map((m) => {
            const earned = s.earnedMilestones.includes(m);
            return (
              <li key={m} className={earned ? 'ms-earned' : 'ms-locked'}>
                {earned ? <Award size={18} aria-hidden /> : <LockIcon size={16} aria-hidden />}
                <span>{milestoneLabel(m)}</span>
                <span className="sr-only">{earned ? 'earned' : 'not yet'}</span>
              </li>
            );
          })}
        </ul>
        <p className="fine">Milestones are earned by your longest run — once earned, they’re yours to keep.</p>
      </Card>

      <Card>
        <h3 className="card-title">Your body and mind</h3>
        <ol className="timeline">
          {HEALTH_TIMELINE.map((t) => {
            const reached = s.phase === 'active' && s.currentStreak >= t.day;
            return (
              <li key={t.day} className={reached ? 'tl-reached' : ''}>
                <span className="tl-day">Day {t.day}</span>
                <span className="tl-title">
                  {t.title}
                  {reached && <span className="sr-only"> (reached)</span>}
                </span>
                <span className="tl-text">{t.text}</span>
              </li>
            );
          })}
        </ol>
        <p className="fine">General information based on research — everyone’s body is different. Not medical advice.</p>
      </Card>
    </main>
  );
}
