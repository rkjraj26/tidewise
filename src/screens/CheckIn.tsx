import { useState } from 'react';
import { useStore, useToday } from '../state/store';
import { addDays, diffDays, formatDay, isValidKey } from '../lib/dates';
import { HALT } from '../content/library';
import { DRINK_WORD } from '../lib/standardDrinks';
import { computeStats, taperTarget } from '../lib/stats';
import { resourcesFor } from '../content/resources';
import { Button, CallButton, Card, ChipGroup, Field, Header, Scale, Segmented, Stepper } from '../components/ui';
import { navigate, useRoute } from '../router';

const MOOD = ['Awful', 'Low', 'OK', 'Good', 'Great'];
const SLEEP = ['Terrible', 'Poor', 'OK', 'Good', 'Great'];

export function CheckIn() {
  const { data, update } = useStore();
  const today = useToday();
  const route = useRoute();
  const p = data.profile!;
  const word = DRINK_WORD[p.region];
  const q = route.query.get('date');
  const date = q && isValidKey(q) && diffDays(q, today) >= 0 && diffDays(q, today) <= 7 ? q : today;
  const existing = data.days[date];

  const [drank, setDrank] = useState<boolean | null>(existing ? existing.drank && existing.drinks > 0 : null);
  const [drinks, setDrinks] = useState(existing?.drinks || 1);
  const [mood, setMood] = useState<number | undefined>(existing?.mood);
  const [craving, setCraving] = useState<number | undefined>(existing?.craving);
  const [sleep, setSleep] = useState<number | undefined>(existing?.sleep);
  const [halt, setHalt] = useState<string[]>(existing?.halt ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const target = taperTarget(p.plan, p.baseline, date, data.days);

  const save = () => {
    const wasDrink = !!existing && existing.drank && existing.drinks > 0;
    update((d) => ({
      ...d,
      days: {
        ...d.days,
        [date]: {
          date,
          drank: !!drank,
          drinks: drank ? drinks : 0,
          mood,
          craving,
          sleep,
          halt,
          note: note.trim() || undefined,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    // A new slip (not on a step-down plan within limits) gets the compassionate debrief.
    if (drank && !wasDrink && !(target !== null && target > 0 && drinks <= target)) {
      navigate(`#/slip?date=${date}&drinks=${drinks}&logged=1`);
      return;
    }
    setSaved(true);
  };

  if (saved) {
    const s = computeStats(data, today);
    const res = resourcesFor(p);
    const recentMoods = [0, 1, 2].map((i) => data.days[addDays(date, -i)]?.mood);
    const struggling = mood === 1 || recentMoods.every((m) => typeof m === 'number' && m <= 2);
    return (
      <main className="screen" aria-labelledby="ci-title">
        <Header title="Check-in saved" back="#/" />
        <Card tone="success">
          <h2 id="ci-title" className="card-title">
            Saved. Thank you for checking in.
          </h2>
          <p>{drank ? 'Logging honestly is how you learn what works. Tomorrow is a fresh start.' : 'Another alcohol-free day on the board.'}</p>
          {s && s.phase === 'active' && <p className="fine">Alcohol-free days so far: {s.totalAlcoholFreeDays}</p>}
          <Button onClick={() => navigate('#/')}>Done</Button>
        </Card>
        {struggling && (
          <Card tone="calm" data-testid="mood-support">
            <h3 className="card-title">Having a really hard time?</h3>
            <p>Low days are common in early recovery, but you don’t have to carry them alone. Talking to someone today can help.</p>
            <div className="row-wrap">
              {res.crisis?.tel && <CallButton tel={res.crisis.tel} label={`Call ${res.crisis.name}`} variant="primary" />}
              <a className="btn btn-secondary" href="#/support">
                My people
              </a>
            </div>
            <p className="fine">If you’re thinking about harming yourself, call {res.emergency} now.</p>
          </Card>
        )}
      </main>
    );
  }

  return (
    <main className="screen" aria-labelledby="ci-title">
      <Header title="Daily check-in" back="#/" />
      <h2 id="ci-title" className="sr-only">
        Check-in for {formatDay(date)}
      </h2>
      <Segmented
        label="Which day"
        value={date}
        onChange={(v) => navigate(`#/checkin?date=${v}`, { replace: true })}
        options={[
          { value: addDays(today, -1), label: 'Yesterday' },
          { value: today, label: 'Today' },
        ]}
        className="day-switch"
      />
      <Card>
        <h3 className="card-title">Did you drink {date === today ? 'today' : `on ${formatDay(date)}`}?</h3>
        <Segmented
          label="Did you drink"
          value={drank === null ? null : drank ? 'yes' : 'no'}
          onChange={(v) => setDrank(v === 'yes')}
          options={[
            { value: 'no', label: 'No — alcohol-free' },
            { value: 'yes', label: 'Yes' },
          ]}
        />
        {drank && (
          <>
            <Stepper label={`How many standard ${word.many}?`} value={drinks} onChange={setDrinks} min={0.5} max={60} step={0.5} />
            {target !== null && target > 0 && <p className="fine">Your step-down limit for this day: {target}.</p>}
          </>
        )}
      </Card>
      <Card>
        <h3 className="card-title">Mood</h3>
        <Segmented label="Mood" value={mood} onChange={setMood} options={MOOD.map((m, i) => ({ value: i + 1, label: m }))} className="seg-5" />
      </Card>
      <Card>
        <h3 className="card-title">Strongest craving today</h3>
        <Scale label="Strongest craving" value={craving} onChange={setCraving} />
      </Card>
      <Card>
        <h3 className="card-title">Last night’s sleep</h3>
        <Segmented label="Sleep" value={sleep} onChange={setSleep} options={SLEEP.map((m, i) => ({ value: i + 1, label: m }))} className="seg-5" />
      </Card>
      <Card>
        <h3 className="card-title">Are you… (HALT)</h3>
        <ChipGroup label="HALT" options={HALT.map((h) => ({ id: h.id, label: h.label }))} value={halt} onChange={setHalt} />
        {halt.length > 0 && (
          <ul className="tool-list">
            {HALT.filter((h) => halt.includes(h.id)).map((h) => (
              <li key={h.id}>
                <strong>{h.label}:</strong> {h.fix}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Field label="Anything on your mind? (optional)" value={note} onChange={setNote} multiline placeholder="A win, a worry, something you’re grateful for…" />
      <Button block onClick={save} disabled={drank === null}>
        Save check-in
      </Button>
    </main>
  );
}
