import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import { addDays, diffDays, isValidKey } from '../lib/dates';
import { computeStats } from '../lib/stats';
import { uid } from '../lib/storage';
import { DRINK_WORD } from '../lib/standardDrinks';
import { TRIGGERS } from '../content/library';
import { resourcesFor } from '../content/resources';
import { recentHeavyPattern } from '../lib/stats';
import { Button, Card, ChipGroup, Field, Header, Segmented, Stepper } from '../components/ui';
import { navigate, useRoute } from '../router';

type Step = 'kind' | 'amount' | 'what' | 'next' | 'done';

export function Slip() {
  const { data, update } = useStore();
  const today = useToday();
  const route = useRoute();
  const p = data.profile!;
  const word = DRINK_WORD[p.region];
  const qDate = route.query.get('date');
  const alreadyLogged = route.query.get('logged') === '1';
  const initialDate = qDate && isValidKey(qDate) && diffDays(qDate, today) >= 0 && diffDays(qDate, today) <= 7 ? qDate : today;
  const qDrinks = Number(route.query.get('drinks'));

  const [step, setStep] = useState<Step>('kind');
  const [date, setDate] = useState(initialDate);
  const [drinks, setDrinks] = useState(qDrinks > 0 ? qDrinks : 2);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [nextTime, setNextTime] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const finish = () => {
    const at = new Date().toISOString();
    update((d) => {
      const prev = d.days[date];
      const days = alreadyLogged
        ? d.days
        : {
            ...d.days,
            [date]: {
              ...(prev ?? {}),
              date,
              drank: true,
              drinks: (prev?.drank ? prev.drinks : 0) + drinks,
              updatedAt: at,
            },
          };
      const feelingText = feelings.map((f) => TRIGGERS.find((t) => t.id === f)?.label ?? f).join(', ');
      return {
        ...d,
        days,
        lapses: [...d.lapses, { id: uid(), at, date, drinks, situation: situation.trim(), feeling: feelingText, thought: thought.trim(), nextTime: nextTime.trim() }],
        plans:
          nextTime.trim().length > 0
            ? [...d.plans, { id: uid(), ifText: situation.trim() || feelingText || 'I’m in that situation again', thenText: nextTime.trim(), createdAt: at }]
            : d.plans,
      };
    });
    setStep('done');
  };

  const stats = computeStats(data, today);
  const res = resourcesFor(p);
  const heavyNow = !!recentHeavyPattern(data, today);

  return (
    <main className="screen" aria-labelledby="slip-title">
      <Header title="I had a drink" back="#/" />

      {step === 'kind' && (
        <div className="stack">
          <Card tone="calm">
            <h2 id="slip-title" className="card-title with-icon">
              <HeartHandshake aria-hidden /> Thank you for being honest
            </h2>
            <p>
              A slip is <strong>not</strong> a failure, and it doesn’t wipe out what you’ve done. Most people who stop for good had slips along the way. What matters
              now is keeping this one small — and learning from it.
            </p>
            {stats && stats.phase === 'active' && (
              <p>
                <strong>Your progress is safe:</strong> {stats.totalAlcoholFreeDays} alcohol-free {stats.totalAlcoholFreeDays === 1 ? 'day' : 'days'} and a longest
                run of {stats.longestStreak}. Those stay.
              </p>
            )}
          </Card>
          <Card tone="warn">
            <h3 className="card-title">First, stay safe</h3>
            <ul className="tool-list">
              <li>Don’t drive. Drink some water and eat something.</li>
              <li>
                <strong>Your tolerance is lower after time off</strong> — the same amount hits harder. Don’t mix alcohol with sleeping pills, benzodiazepines or
                opioids. If someone can’t be woken or is breathing slowly, call <a href={`tel:${res.emergency}`}>{res.emergency}</a>.
              </li>
              <li>
                If you’ve been drinking daily for several days, stopping suddenly can bring on withdrawal. If you’ve had seizures or bad withdrawal before, talk to a
                doctor before stopping — and check the <a href="#/withdrawal">warning signs</a>.
              </li>
              <li>
                Feeling unsafe? Call <a href={`tel:${res.crisis?.tel ?? res.emergency}`}>{res.crisis?.tel ? res.crisis.name : res.emergency}</a>.
              </li>
            </ul>
          </Card>
          <Button block onClick={() => setStep(alreadyLogged ? 'what' : 'amount')}>
            Let’s learn from it
          </Button>
          <p className="fine center">Takes about a minute. The “what the hell” feeling after a slip is normal — this is how you beat it.</p>
        </div>
      )}

      {step === 'amount' && (
        <div className="stack">
          <h2 id="slip-title" className="lead">
            When, and roughly how much?
          </h2>
          <Segmented
            label="When"
            value={date}
            onChange={setDate}
            options={[
              { value: today, label: 'Today' },
              { value: addDays(today, -1), label: 'Yesterday' },
            ]}
          />
          <Stepper label={`Standard ${word.many}`} value={drinks} onChange={setDrinks} min={0.5} max={60} step={0.5} />
          <Button block onClick={() => setStep('what')}>
            Next
          </Button>
        </div>
      )}

      {step === 'what' && (
        <div className="stack">
          <h2 id="slip-title" className="lead">
            What happened just before?
          </h2>
          <Field label="Where were you, and what was going on?" value={situation} onChange={setSituation} placeholder="e.g. Friday after work, home alone, after a call with my ex" multiline />
          <p className="field-label">What were you feeling?</p>
          <ChipGroup label="Feelings" options={TRIGGERS} value={feelings} onChange={setFeelings} />
          <Field label="What did you tell yourself?" value={thought} onChange={setThought} placeholder="e.g. “I deserve it”, “just one”, “nobody will know”" />
          <Button block onClick={() => setStep('next')}>
            Next
          </Button>
        </div>
      )}

      {step === 'next' && (
        <div className="stack">
          <h2 id="slip-title" className="lead">
            If that happens again, what will you do instead?
          </h2>
          <p>Be specific. A plan made now, calmly, is far stronger than willpower in the moment.</p>
          {thought && (
            <Card tone="calm">
              <p className="fine">You told yourself: “{thought}”. Look in Toolkit → Thinking traps for a comeback to that thought.</p>
            </Card>
          )}
          <Field
            label="Next time, I will…"
            value={nextTime}
            onChange={setNextTime}
            placeholder="e.g. text Sam, go to the gym straight from work, leave the party by 9"
            multiline
            hint="This becomes an if-then plan in your Toolkit."
          />
          <Button block onClick={finish}>
            Save and move on
          </Button>
        </div>
      )}

      {step === 'done' && (
        <div className="stack">
          <Card tone="success">
            <h2 id="slip-title" className="card-title">
              Done. That took courage.
            </h2>
            <p>Your next alcohol-free day can start now — safely, and with more knowledge than you had yesterday.</p>
            {heavyNow && (
              <p data-testid="slip-withdrawal">
                <strong>Because you’ve been drinking for several days in a row (or heavily), withdrawal is possible when you stop.</strong> Tidewise will remind you
                to check your symptoms for the next week. If you’ve had seizures or bad withdrawal before, get medical advice first.
              </p>
            )}
            {nextTime.trim() && <p data-testid="slip-plan">Your new plan is saved in Toolkit → If-then plans.</p>}
          </Card>
          <Button block onClick={() => navigate('#/', { replace: true })}>
            Back to home
          </Button>
          <a className="btn btn-ghost" href="#/sos">
            Still craving? Ride the wave
          </a>
        </div>
      )}
    </main>
  );
}
