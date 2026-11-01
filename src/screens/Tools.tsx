import { useEffect, useState } from 'react';
import { BookOpen, Brain, CircleSlash, Compass, Hand, ListChecks, Scale as ScaleIcon, Sparkles, Trash2, Wind, Activity } from 'lucide-react';
import { useStore } from '../state/store';
import { MOTIVE_BY_ID, MOTIVES } from '../content/motives';
import { HALT, REFUSAL_SCRIPTS, REFUSAL_TIPS, THINKING_TRAPS, THOUGHT_CARDS } from '../content/library';
import { uid } from '../lib/storage';
import { Button, Card, Field, Header, LinkButton, NavCard, Segmented } from '../components/ui';

export function ToolsIndex() {
  return (
    <main className="screen" aria-labelledby="tools-title">
      <Header title="Toolkit" />
      <h2 id="tools-title" className="sr-only">
        Toolkit
      </h2>
      <div className="stack-sm">
        <NavCard to="#/tools/why" icon={<Compass />} title="Tools for why you drink" text="Replacements matched to the jobs alcohol does for you" />
        <NavCard to="#/tools/thoughts" icon={<Brain />} title="Thinking traps" text="Comebacks to “just one” and “I deserve it”" />
        <NavCard to="#/tools/plans" icon={<ListChecks />} title="If-then plans" text="Decide now what you’ll do in risky moments" />
        <NavCard to="#/tools/refuse" icon={<CircleSlash />} title="Saying no" text="Scripts for parties, pubs and pushy people" />
        <NavCard to="#/tools/breathe" icon={<Wind />} title="Breathing" text="Calm your body in two minutes" />
        <NavCard to="#/tools/ground" icon={<Hand />} title="5-4-3-2-1 grounding" text="Get out of your head and into the room" />
        <NavCard to="#/tools/halt" icon={<Sparkles />} title="HALT check" text="Hungry, Angry, Lonely or Tired?" />
        <NavCard to="#/tools/balance" icon={<ScaleIcon />} title="Weighing it up" text="An honest look at drinking vs stopping" />
        <NavCard to="#/learn" icon={<BookOpen />} title="Learn" text="Short lessons: cravings, withdrawal, medication, slips" />
        <NavCard to="#/withdrawal" icon={<Activity />} title="Withdrawal monitor" text="Check symptoms and red flags" />
      </div>
    </main>
  );
}

export function WhyTools() {
  const { data } = useStore();
  const mine = data.profile!.motives;
  const [showAll, setShowAll] = useState(mine.length === 0);
  const list = showAll ? MOTIVES : mine.map((m) => MOTIVE_BY_ID[m]);
  return (
    <main className="screen" aria-labelledby="why-title">
      <Header title="Tools for your why" back="#/tools" />
      <h2 id="why-title" className="sr-only">
        Tools matched to why you drink
      </h2>
      {mine.length > 0 && (
        <Segmented
          label="Show"
          value={showAll ? 'all' : 'mine'}
          onChange={(v) => setShowAll(v === 'all')}
          options={[
            { value: 'mine', label: 'My reasons' },
            { value: 'all', label: 'All' },
          ]}
        />
      )}
      {list.map((m) => (
        <Card key={m.id}>
          <p className="eyebrow">{m.label}</p>
          <p className="quote">{m.voice}</p>
          <details>
            <summary>What alcohol really does here</summary>
            <p>{m.truth}</p>
          </details>
          <ul className="tool-list">
            {m.tools.map((t) => (
              <li key={t.title}>
                <strong>{t.title}.</strong> {t.how}{' '}
                {t.link && (
                  <a href={t.link} className="inline-link">
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </main>
  );
}

export function Thoughts() {
  const { data, update } = useStore();
  const [thought, setThought] = useState('');
  const [trap, setTrap] = useState<string>('permission');
  const [balanced, setBalanced] = useState('');
  const trapName = (id: string) => THINKING_TRAPS.find((t) => t.id === id)?.name ?? id;

  const save = () => {
    update((d) => ({ ...d, thoughts: [{ id: uid(), at: new Date().toISOString(), thought: thought.trim(), trapId: trap, balanced: balanced.trim() }, ...d.thoughts] }));
    setThought('');
    setBalanced('');
  };

  return (
    <main className="screen" aria-labelledby="th-title">
      <Header title="Thinking traps" back="#/tools" />
      <p id="th-title" className="lead">
        Cravings talk. Here’s what they say — and what you can say back.
      </p>
      {THOUGHT_CARDS.map((c) => (
        <Card key={c.thought}>
          <p className="trap-thought">“{c.thought}”</p>
          <p className="eyebrow">{trapName(c.trap)}</p>
          <p className="trap-reframe">{c.reframe}</p>
        </Card>
      ))}
      <Card tone="calm">
        <h3 className="card-title">Catch one of your own</h3>
        <Field label="The thought" value={thought} onChange={setThought} placeholder="e.g. I’ll just have one at the wedding" />
        <label className="field-label" htmlFor="trap">
          Which trap is it?
        </label>
        <select id="trap" className="input" value={trap} onChange={(e) => setTrap(e.target.value)}>
          {THINKING_TRAPS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.description}
            </option>
          ))}
        </select>
        <Field label="A more helpful, honest response" value={balanced} onChange={setBalanced} multiline />
        <Button onClick={save} disabled={!thought.trim() || !balanced.trim()}>
          Save
        </Button>
      </Card>
      {data.thoughts.length > 0 && (
        <Card>
          <h3 className="card-title">Your saved comebacks</h3>
          <ul className="saved-list">
            {data.thoughts.map((t) => (
              <li key={t.id}>
                <p className="trap-thought">“{t.thought}”</p>
                <p className="trap-reframe">{t.balanced}</p>
                <button
                  type="button"
                  className="icon-btn small"
                  aria-label={`Delete “${t.thought}”`}
                  onClick={() => update((d) => ({ ...d, thoughts: d.thoughts.filter((x) => x.id !== t.id) }))}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}

const PLAN_TEMPLATES = [
  { ifText: 'It’s 6 pm and I’m heading home from work', thenText: 'I’ll go straight to the gym or for a walk, and have a cold soda water when I get in.' },
  { ifText: 'Someone offers me a drink', thenText: 'I’ll say “No thanks, I’m good with this” and hold up my drink.' },
  { ifText: 'I feel stressed or angry', thenText: 'I’ll do 5 physiological sighs and open Ride the wave before deciding anything.' },
  { ifText: 'It’s Friday night and I have nothing planned', thenText: 'I’ll book something in advance — a film, dinner, a call with a friend.' },
  { ifText: 'I can’t sleep', thenText: 'I’ll get up, read something dull in low light, and go back when sleepy.' },
];

export function Plans() {
  const { data, update } = useStore();
  const [ifText, setIf] = useState('');
  const [thenText, setThen] = useState('');
  const add = (i: string, t: string) => update((d) => ({ ...d, plans: [{ id: uid(), ifText: i.trim(), thenText: t.trim(), createdAt: new Date().toISOString() }, ...d.plans] }));

  return (
    <main className="screen" aria-labelledby="plans-title">
      <Header title="If-then plans" back="#/tools" />
      <p id="plans-title" className="lead">
        Decide now, while you’re calm, what you’ll do in a risky moment. Pre-made decisions are much stronger than willpower.
      </p>
      <Card tone="calm">
        <Field label="If…" value={ifText} onChange={setIf} placeholder="the situation, time, feeling or person" />
        <Field label="Then I will…" value={thenText} onChange={setThen} placeholder="a specific action" />
        <Button
          onClick={() => {
            add(ifText, thenText);
            setIf('');
            setThen('');
          }}
          disabled={!ifText.trim() || !thenText.trim()}
        >
          Add plan
        </Button>
      </Card>
      {data.plans.length > 0 ? (
        <Card>
          <h3 className="card-title">Your plans</h3>
          <ul className="saved-list" data-testid="plan-list">
            {data.plans.map((pl) => (
              <li key={pl.id}>
                <p>
                  <strong>If</strong> {pl.ifText}, <strong>then</strong> {pl.thenText}
                </p>
                <button type="button" className="icon-btn small" aria-label="Delete plan" onClick={() => update((d) => ({ ...d, plans: d.plans.filter((x) => x.id !== pl.id) }))}>
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <h3 className="card-title">Ideas to start from</h3>
        <ul className="saved-list">
          {PLAN_TEMPLATES.map((t) => (
            <li key={t.ifText}>
              <p>
                <strong>If</strong> {t.ifText}, <strong>then</strong> {t.thenText}
              </p>
              <Button variant="ghost" onClick={() => add(t.ifText, t.thenText)} aria-label={`Use plan: ${t.ifText}`}>
                Use
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

export function Refuse() {
  return (
    <main className="screen" aria-labelledby="ref-title">
      <Header title="Saying no" back="#/tools" />
      <p id="ref-title" className="lead">
        You don’t owe anyone an explanation. But having a line ready makes it easy.
      </p>
      {REFUSAL_SCRIPTS.map((s) => (
        <Card key={s.situation}>
          <h3 className="card-title">{s.situation}</h3>
          <ul className="script-list">
            {s.lines.map((l) => (
              <li key={l}>“{l}”</li>
            ))}
          </ul>
        </Card>
      ))}
      <Card tone="calm">
        <h3 className="card-title">Tips</h3>
        <ul className="tool-list">
          {REFUSAL_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

export function Breathe() {
  const [on, setOn] = useState(false);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [on]);
  const el = now - t0;
  const inhale = el % 10_000 < 4_000;
  const cycles = Math.floor(el / 10_000);
  return (
    <main className="screen" aria-labelledby="br-title">
      <Header title="Breathing" back="#/tools" />
      <p id="br-title" className="lead">
        Breathe in for 4, out for 6. A longer out-breath tells your body it’s safe.
      </p>
      {on ? (
        <>
          <div className="wave-wrap" aria-hidden>
            <div className="wave-circle" />
          </div>
          <p className="breath-text" aria-live="polite">
            {inhale ? 'Breathe in…' : 'Breathe out slowly…'}
          </p>
          <p className="fine center">{cycles} breaths</p>
          <Button variant="secondary" block onClick={() => setOn(false)}>
            Stop
          </Button>
        </>
      ) : (
        <Button
          block
          onClick={() => {
            const t = Date.now();
            setT0(t);
            setNow(t);
            setOn(true);
          }}
        >
          Start
        </Button>
      )}
      <Card tone="calm">
        <h3 className="card-title">Physiological sigh</h3>
        <p>Two quick inhales through the nose (the second tops up your lungs), then one long, slow exhale through the mouth. Three to five rounds can take the edge off stress fast.</p>
      </Card>
    </main>
  );
}

const GROUND_STEPS = [
  { n: 5, sense: 'things you can see' },
  { n: 4, sense: 'things you can touch' },
  { n: 3, sense: 'things you can hear' },
  { n: 2, sense: 'things you can smell' },
  { n: 1, sense: 'thing you can taste' },
];

export function Ground() {
  const [i, setI] = useState(0);
  const done = i >= GROUND_STEPS.length;
  return (
    <main className="screen" aria-labelledby="gr-title">
      <Header title="5-4-3-2-1 grounding" back="#/tools" />
      <p id="gr-title" className="lead">
        Slowly notice each one. Say them out loud if you can.
      </p>
      {done ? (
        <Card tone="success">
          <p>Well done. Notice how you feel now compared with a few minutes ago.</p>
          <div className="row-wrap">
            <Button onClick={() => setI(0)}>Again</Button>
            <LinkButton to="#/sos">Ride the wave</LinkButton>
          </div>
        </Card>
      ) : (
        <Card className="ground">
          <p className="ground-n" aria-hidden>
            {GROUND_STEPS[i].n}
          </p>
          <p className="ground-text" aria-live="polite">
            Name {GROUND_STEPS[i].n} {GROUND_STEPS[i].sense}
          </p>
          <Button block onClick={() => setI(i + 1)}>
            Done — next
          </Button>
        </Card>
      )}
    </main>
  );
}

export function HaltCheck() {
  const [sel, setSel] = useState<string[]>([]);
  return (
    <main className="screen" aria-labelledby="halt-title">
      <Header title="HALT check" back="#/tools" />
      <p id="halt-title" className="lead">
        Cravings are much stronger when you’re Hungry, Angry, Lonely or Tired. Which of these are true right now?
      </p>
      <div className="stack-sm">
        {HALT.map((h) => (
          <Card key={h.id} className={sel.includes(h.id) ? 'card-accent' : ''}>
            <button type="button" className="halt-btn" aria-pressed={sel.includes(h.id)} onClick={() => setSel(sel.includes(h.id) ? sel.filter((x) => x !== h.id) : [...sel, h.id])}>
              <span className="halt-letter" aria-hidden>
                {h.label[0]}
              </span>
              <span>{h.label}</span>
            </button>
            {sel.includes(h.id) && <p>{h.fix}</p>}
          </Card>
        ))}
      </div>
    </main>
  );
}

export function Balance() {
  const { data, update } = useStore();
  const d0 = data.decisional;
  const [v, setV] = useState({
    drinkingGood: d0?.drinkingGood ?? '',
    drinkingBad: d0?.drinkingBad ?? '',
    stoppingGood: d0?.stoppingGood ?? '',
    stoppingHard: d0?.stoppingHard ?? '',
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof v) => (s: string) => {
    setSaved(false);
    setV({ ...v, [k]: s });
  };
  return (
    <main className="screen" aria-labelledby="bal-title">
      <Header title="Weighing it up" back="#/tools" />
      <p id="bal-title" className="lead">
        It’s normal to feel two ways about drinking. Be honest about both sides — including what you’ll miss.
      </p>
      <Card>
        <Field label="What I get from drinking" value={v.drinkingGood} onChange={set('drinkingGood')} multiline />
        <Field label="What drinking costs me" value={v.drinkingBad} onChange={set('drinkingBad')} multiline />
        <Field label="What I’ll gain by stopping" value={v.stoppingGood} onChange={set('stoppingGood')} multiline />
        <Field label="What will be hard about stopping" value={v.stoppingHard} onChange={set('stoppingHard')} multiline />
        <Button
          onClick={() => {
            update((d) => ({ ...d, decisional: { ...v, updatedAt: new Date().toISOString() } }));
            setSaved(true);
          }}
        >
          Save
        </Button>
        {saved && (
          <p role="status" className="ok-text">
            Saved.
          </p>
        )}
      </Card>
      <Card tone="calm">
        <p>Look at “what I get from drinking”. For each one, is there a tool in “Tools for your why” that could do that job instead?</p>
        <LinkButton to="#/tools/why">Open tools for your why</LinkButton>
      </Card>
    </main>
  );
}
