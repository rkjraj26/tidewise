import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Phone, Plus, X } from 'lucide-react';
import { useStore } from '../state/store';
import { DISTRACTIONS, SURF_PROMPTS, TAPE_FORWARD, TRIGGERS } from '../content/library';
import { MOTIVE_BY_ID } from '../content/motives';
import { resourcesFor } from '../content/resources';
import { uid } from '../lib/storage';
import { urgeStats } from '../lib/insights';
import { Button, Card, Chip, Scale, Segmented } from '../components/ui';
import { navigate } from '../router';

type Step = 'rate' | 'ride' | 'after' | 'done';
type Tab = 'reasons' | 'forward' | 'do' | 'reach';

const CYCLE_MS = 10_000; // 4 s in, 6 s out
const INHALE_MS = 4_000;

export const SUPPORT_TEXT = 'Hey, I’m having a tough craving right now. Could you call or text me back?';

export function smsHref(phone: string, body: string) {
  return `sms:${phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(body)}`;
}

export function Sos() {
  const { data, update } = useStore();
  const p = data.profile!;
  const res = resourcesFor(p);
  const [step, setStep] = useState<Step>('rate');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(10);
  const [startAt, setStartAt] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>('reasons');
  const [timeUp, setTimeUp] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (step !== 'ride') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  const remaining = Math.max(0, endAt - now);
  useEffect(() => {
    if (step === 'ride' && endAt > 0 && remaining === 0) {
      setTimeUp(true);
      setStep('after');
    }
  }, [step, endAt, remaining]);

  const elapsed = Math.max(0, now - startAt);
  const breathingIn = elapsed % CYCLE_MS < INHALE_MS;
  const prompt = SURF_PROMPTS[Math.floor(elapsed / 20_000) % SURF_PROMPTS.length];

  const start = () => {
    const t = Date.now();
    setStartAt(t);
    setEndAt(t + minutes * 60_000);
    setNow(t);
    setStep('ride');
  };

  const save = (outcome: 'rode' | 'drank', afterVal: number | null) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const t = Date.now();
    update((d) => ({
      ...d,
      urges: [
        ...d.urges,
        {
          id: uid(),
          at: new Date(startAt || t).toISOString(),
          before: before ?? 0,
          after: afterVal,
          triggers,
          durationSec: startAt ? Math.round((t - startAt) / 1000) : 0,
          outcome,
        },
      ],
    }));
  };

  const drank = () => {
    save('drank', null);
    navigate('#/slip');
  };

  const matchedTools = useMemo(() => {
    const ids = new Set(p.motives);
    return [...ids].slice(0, 3).map((id) => MOTIVE_BY_ID[id].tools[0]);
  }, [p.motives]);

  const stats = urgeStats(data.urges);
  const mm = String(Math.floor(remaining / 60_000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0');

  return (
    <main className="screen sos" aria-labelledby="sos-title">
      <header className="topbar">
        <span className="icon-spacer" />
        <h1 id="sos-title" className="topbar-title">
          Ride the wave
        </h1>
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => navigate('#/')}>
          <X aria-hidden />
        </button>
      </header>

      {step === 'rate' && (
        <div className="stack">
          <p className="lead">You opened this instead of opening a bottle. That’s already the hardest part.</p>
          <Card>
            <h2 className="card-title">How strong is the urge right now?</h2>
            <Scale label="Urge strength" value={before} onChange={setBefore} />
          </Card>
          <Card>
            <h2 className="card-title">What set it off? (optional)</h2>
            <div className="chips" role="group" aria-label="Triggers">
              {TRIGGERS.map((t) => (
                <Chip key={t.id} selected={triggers.includes(t.id)} onToggle={() => setTriggers(triggers.includes(t.id) ? triggers.filter((x) => x !== t.id) : [...triggers, t.id])}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </Card>
          {triggers.includes('body') && (
            <Card tone="warn" data-testid="sos-withdrawal">
              <p>
                <strong>Feeling shaky, sweaty or sick?</strong> That may be withdrawal, not just a craving. Check your symptoms first — withdrawal can need medical
                help.
              </p>
              <a className="btn btn-primary" href="#/withdrawal">
                Check my symptoms
              </a>
            </Card>
          )}
          <Card>
            <h2 className="card-title">Ride it for</h2>
            <Segmented
              label="Minutes"
              value={minutes}
              onChange={setMinutes}
              options={[5, 10, 15, 20].map((m) => ({ value: m, label: `${m} min` }))}
            />
            <p className="fine">Most cravings peak and fade within 15–30 minutes.</p>
          </Card>
          <Button variant="sos" block onClick={start} disabled={before === null}>
            Start riding the wave
          </Button>
          <div className="row-wrap center">
            <button type="button" className="link-btn" onClick={drank}>
              I’ve already had a drink
            </button>
          </div>
          <p className="fine center">
            In danger, or thinking of harming yourself?{' '}
            <a href={`tel:${res.crisis?.tel ?? res.emergency}`}>Call {res.crisis ? `${res.crisis.name} (${res.crisis.phone})` : res.emergency}</a>
          </p>
        </div>
      )}

      {step === 'ride' && (
        <div className="stack">
          <div className="wave-wrap" aria-hidden>
            <div className="wave-circle" />
          </div>
          <p className="breath-text" aria-live="polite">
            {breathingIn ? 'Breathe in…' : 'Breathe out slowly…'}
          </p>
          <p className="timer" aria-label={`${mm} minutes ${ss} seconds remaining`} data-testid="timer">
            {mm}:{ss}
          </p>
          <p className="surf-prompt">{prompt}</p>

          <div className="row-wrap center">
            <Button variant="ghost" onClick={() => setEndAt(endAt + 5 * 60_000)}>
              <Plus size={16} aria-hidden /> 5 min
            </Button>
            <Button variant="secondary" onClick={() => setStep('after')}>
              I’m through it
            </Button>
          </div>

          <div className="tabs" role="tablist" aria-label="Craving tools">
            {(
              [
                ['reasons', 'My reasons'],
                ['forward', 'Play it forward'],
                ['do', 'Do this'],
                ['reach', 'Reach out'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button type="button" key={id} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} id={`tab-${id}`} className={`tab${tab === id ? ' tab-on' : ''}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel">
            {tab === 'reasons' && (
              <Card tone="calm">
                {p.reasons.length ? (
                  <ul className="reasons">
                    {p.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Add your reasons in Settings — they’ll show here when you need them most.</p>
                )}
                {p.futureLetter && (
                  <>
                    <p className="eyebrow">Your note to yourself</p>
                    <p className="letter">{p.futureLetter}</p>
                  </>
                )}
              </Card>
            )}
            {tab === 'forward' && (
              <Card>
                <p>Don’t stop the movie at the first sip. Play it all the way through:</p>
                <ol className="tape">
                  {TAPE_FORWARD.map((t) => (
                    <li key={t.label}>
                      <strong>{t.label}.</strong> {t.prompt}
                    </li>
                  ))}
                </ol>
              </Card>
            )}
            {tab === 'do' && (
              <Card>
                {matchedTools.length > 0 && (
                  <>
                    <p className="eyebrow">Matched to why you drink</p>
                    <ul className="tool-list">
                      {matchedTools.map((t) => (
                        <li key={t.title}>
                          <strong>{t.title}.</strong> {t.how}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="eyebrow">Quick distractions</p>
                <ul className="tool-list">
                  {DISTRACTIONS.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </Card>
            )}
            {tab === 'reach' && (
              <Card>
                {data.contacts.length === 0 && <p>You haven’t added anyone yet. You can add people in Support.</p>}
                {data.contacts.map((c) => (
                  <div key={c.id} className="contact-row">
                    <span className="contact-name">{c.name}</span>
                    <a className="btn btn-secondary" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>
                      <Phone size={16} aria-hidden /> Call
                    </a>
                    <a className="btn btn-secondary" href={smsHref(c.phone, SUPPORT_TEXT)}>
                      <MessageCircle size={16} aria-hidden /> Text
                    </a>
                  </div>
                ))}
                {res.lines
                  .filter((l) => l.tel)
                  .slice(0, 1)
                  .map((l) => (
                    <p key={l.name}>
                      Or call <a href={`tel:${l.tel}`}>{l.name} ({l.phone})</a> — {l.hours}.
                    </p>
                  ))}
              </Card>
            )}
          </div>

          <div className="row-wrap center">
            <button type="button" className="link-btn" onClick={drank}>
              I drank
            </button>
          </div>
        </div>
      )}

      {step === 'after' && (
        <div className="stack">
          <h2 className="lead">{timeUp ? 'Time’s up — the wave has passed its peak.' : 'Nice work staying with it.'}</h2>
          <Card>
            <h3 className="card-title">How strong is the urge now?</h3>
            <Scale label="Urge strength now" value={after} onChange={setAfter} />
          </Card>
          <Button
            block
            disabled={after === null}
            onClick={() => {
              save('rode', after);
              setStep('done');
            }}
          >
            Save
          </Button>
          {after !== null && after >= 6 && (
            <Card tone="calm">
              <p>Still strong? That’s OK. Ride another wave, reach out to someone, or eat something and get moving.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  save('rode', after);
                  savedRef.current = false;
                  setBefore(after);
                  setAfter(null);
                  setTimeUp(false);
                  start();
                }}
              >
                Ride another wave
              </Button>
            </Card>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="stack center-text">
          <div className="done-burst" aria-hidden>
            🌊
          </div>
          <h2 className="lead" data-testid="sos-done">
            {before !== null && after !== null && after < before
              ? `From ${before} down to ${after}. You rode the wave.`
              : 'You stayed with it without drinking. That counts.'}
          </h2>
          <p>
            That’s {stats.ridden} {stats.ridden === 1 ? 'wave' : 'waves'} ridden. Every one weakens the link between the trigger and the drink.
          </p>
          <Button block onClick={() => navigate('#/')}>
            Back to home
          </Button>
          <a className="btn btn-ghost" href="#/tools/plans">
            Make an if-then plan for next time
          </a>
        </div>
      )}
    </main>
  );
}
