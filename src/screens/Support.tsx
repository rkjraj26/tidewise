import { useState } from 'react';
import { AlertTriangle, Copy, ExternalLink, MessageCircle, Phone, Printer, Share2, Stethoscope, Trash2 } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import { MUTUAL_HELP, resourcesFor, type Helpline } from '../content/resources';
import { LESSON_BY_ID, LESSONS } from '../content/lessons';
import { buildDoctorReport } from '../lib/doctorReport';
import { hasSuicideFlag, RED_FLAGS, SUICIDE_FLAG, triageWithdrawal, WITHDRAWAL_SYMPTOMS } from '../lib/safety';
import { uid } from '../lib/storage';
import type { WithdrawalLevel } from '../lib/types';
import { Button, CallButton, Card, Field, Header, LinkButton, NavCard } from '../components/ui';
import { smsHref, SUPPORT_TEXT } from './Sos';
import { useRoute } from '../router';

function HelplineCard({ h }: { h: Helpline }) {
  return (
    <Card>
      <h3 className="card-title">{h.name}</h3>
      <p>{h.what}</p>
      <p className="fine">{h.hours}</p>
      <div className="row-wrap">
        {h.tel && <CallButton tel={h.tel} label={`Call ${h.phone}`} variant="primary" />}
        {h.sms && (
          <a className="btn btn-secondary" href={`sms:${h.sms}`}>
            <MessageCircle size={18} aria-hidden /> Text {h.sms}
          </a>
        )}
        {h.url && (
          <a className="btn btn-secondary" href={h.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={18} aria-hidden /> Website
          </a>
        )}
      </div>
    </Card>
  );
}

export function Support() {
  const { data, update } = useStore();
  const p = data.profile!;
  const res = resourcesFor(p);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <main className="screen" aria-labelledby="sup-title">
      <Header title="Support" />
      <h2 id="sup-title" className="sr-only">
        Support
      </h2>
      <Card tone="danger" className="emergency">
        <p className="with-icon">
          <AlertTriangle aria-hidden /> <strong>In danger or a medical emergency?</strong>
        </p>
        <CallButton tel={res.emergency} label={`Call ${res.emergency}`} variant="danger" />
      </Card>

      {res.crisis && <HelplineCard h={res.crisis} />}

      <h2 className="section-title">My people</h2>
      <Card>
        {data.contacts.length === 0 && <p>Add someone you could call or text in a hard moment.</p>}
        <ul className="contact-list">
          {data.contacts.map((c) => (
            <li key={c.id} className="contact-row">
              <span className="contact-name">{c.name}</span>
              <a className="btn btn-secondary" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={`Call ${c.name}`}>
                <Phone size={16} aria-hidden /> Call
              </a>
              <a className="btn btn-secondary" href={smsHref(c.phone, SUPPORT_TEXT)} aria-label={`Text ${c.name}`}>
                <MessageCircle size={16} aria-hidden /> Text
              </a>
              <button type="button" className="icon-btn small" aria-label={`Remove ${c.name}`} onClick={() => update((d) => ({ ...d, contacts: d.contacts.filter((x) => x.id !== c.id) }))}>
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <details className="add-contact">
          <summary>Add a person</summary>
          <Field label="Name" value={name} onChange={setName} autoComplete="off" maxLength={40} />
          <Field label="Phone" value={phone} onChange={setPhone} type="tel" inputMode="tel" autoComplete="off" maxLength={25} />
          <Button
            disabled={!name.trim() || !/\d{3,}/.test(phone.replace(/\D/g, ''))}
            onClick={() => {
              update((d) => ({ ...d, contacts: [...d.contacts, { id: uid(), name: name.trim(), phone: phone.trim() }] }));
              setName('');
              setPhone('');
            }}
          >
            Save person
          </Button>
        </details>
        <p className="fine">“Text” opens your messages app with: “{SUPPORT_TEXT}”</p>
        <details>
          <summary>Share with your supporter: what to do in an emergency</summary>
          <ul className="tool-list">
            <li>
              <strong>If I have a seizure (fit):</strong> call {res.emergency}. Move hard objects away, cushion my head, don’t hold me down, put nothing in my
              mouth. When it stops, roll me onto my side and stay with me.
            </li>
            <li>
              <strong>If I’m confused, seeing things, or can’t be woken:</strong> call {res.emergency}.
            </li>
            <li>
              <strong>If I’ve been drinking and you can’t wake me, or my breathing is slow:</strong> call {res.emergency}, put me on my side, and stay with me.
            </li>
          </ul>
        </details>
      </Card>

      <h2 className="section-title">Professional help</h2>
      <NavCard to="#/support/doctor" icon={<Stethoscope />} title="Doctor-visit prep" text="A summary + the right questions, ready to show or share" />
      {res.lines.map((h) => (
        <HelplineCard key={h.name} h={h} />
      ))}

      <h2 className="section-title">Peer support groups</h2>
      <Card>
        <ul className="link-list">
          {MUTUAL_HELP.map((m) => (
            <li key={m.name}>
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                {m.name} <ExternalLink size={14} aria-hidden />
              </a>
              <span className="fine">{m.what}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className="fine center">Helplines change — if a number doesn’t work, use your emergency number or findahelpline.com.</p>
    </main>
  );
}

export function Doctor() {
  const { data } = useStore();
  const today = useToday();
  const text = buildDoctorReport(data, today);
  const [msg, setMsg] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  return (
    <main className="screen" aria-labelledby="doc-title">
      <Header title="Doctor-visit prep" back="#/support" />
      <p id="doc-title" className="lead">
        The hardest part is starting the conversation. Show this to your doctor, or read it out.
      </p>
      <Card tone="calm">
        <p>
          <strong>You can say:</strong> “I want to stop drinking and I’d like help to do it safely. I’ve written a few things down.”
        </p>
      </Card>
      <pre className="report" data-testid="doctor-report">
        {text}
      </pre>
      <div className="row-wrap no-print">
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setMsg('Copied to clipboard.');
            } catch {
              setMsg('Couldn’t copy — select the text and copy it manually.');
            }
          }}
        >
          <Copy size={18} aria-hidden /> Copy
        </Button>
        {canShare && (
          <Button variant="secondary" onClick={() => navigator.share({ title: 'Summary for my doctor', text }).catch(() => undefined)}>
            <Share2 size={18} aria-hidden /> Share
          </Button>
        )}
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={18} aria-hidden /> Print
        </Button>
      </div>
      {msg && (
        <p role="status" className="ok-text">
          {msg}
        </p>
      )}
      <LinkButton to="#/learn/meds" variant="ghost">
        Read: medicines that help
      </LinkButton>
    </main>
  );
}

export function LearnIndex() {
  return (
    <main className="screen" aria-labelledby="learn-title">
      <Header title="Learn" back="#/tools" />
      <h2 id="learn-title" className="sr-only">
        Lessons
      </h2>
      <div className="stack-sm">
        {LESSONS.map((l) => (
          <NavCard key={l.id} to={`#/learn/${l.id}`} title={l.title} text={`${l.minutes} min · ${l.summary}`} />
        ))}
      </div>
    </main>
  );
}

export function LessonView() {
  const route = useRoute();
  const l = LESSON_BY_ID[route.parts[1] ?? ''];
  if (!l)
    return (
      <main className="screen">
        <Header title="Lesson" back="#/learn" />
        <p>Lesson not found.</p>
      </main>
    );
  return (
    <main className="screen" aria-labelledby="lesson-title">
      <Header title="Learn" back="#/learn" />
      <article className="lesson">
        <h2 id="lesson-title">{l.title}</h2>
        <p className="fine">{l.minutes} min read</p>
        {l.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h3>{s.heading}</h3>}
            <p>{s.text}</p>
          </section>
        ))}
        <Card tone="calm">
          <p className="eyebrow">Key takeaway</p>
          <p>{l.takeaway}</p>
        </Card>
        <p className="fine">Sources: {l.sources.join('; ')}.</p>
      </article>
    </main>
  );
}

const LEVEL_COPY: Record<WithdrawalLevel, { tone: 'success' | 'calm' | 'warn' | 'danger'; title: string; text: string }> = {
  ok: { tone: 'success', title: 'No symptoms right now', text: 'Good. Check again later today — withdrawal usually starts 6–24 hours after the last drink and peaks around days 1–3.' },
  selfcare: {
    tone: 'calm',
    title: 'Mild symptoms — look after yourself',
    text: 'Drink plenty of water, eat small regular meals, rest, avoid caffeine, and have someone around if you can. Check again in a few hours. If you’ve had a seizure or DTs before, or symptoms are getting worse, call a doctor today — don’t wait.',
  },
  urgent: {
    tone: 'warn',
    title: 'Call a doctor or helpline today',
    text: 'Your symptoms suggest moderate withdrawal. Please get medical advice today — medication can make this much safer and easier. Don’t stay alone, and don’t drive.',
  },
  emergency: {
    tone: 'danger',
    title: 'This is an emergency — call now',
    text: 'These symptoms can be signs of severe withdrawal, which can be life-threatening. Call emergency services now. Don’t stay alone. Unlock your door if you can.',
  },
  crisis: {
    tone: 'danger',
    title: 'You matter. Please reach out now.',
    text: 'If you’re thinking about ending your life, call a crisis line or emergency services right now. Alcohol makes these thoughts stronger and more dangerous. If you can, put distance between you and alcohol, medicines or anything you could use to hurt yourself, and stay with or call someone now. You don’t have to go through this alone.',
  },
};

export function Withdrawal() {
  const { data, update } = useStore();
  const p = data.profile!;
  const res = resourcesFor(p);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [result, setResult] = useState<WithdrawalLevel | null>(null);
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => {
    setResult(null);
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };
  const check = () => {
    const previous = [...data.withdrawal].sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
    const level = triageWithdrawal(symptoms, flags, p.safety?.level ?? 'moderate', previous);
    setResult(level);
    update((d) => ({ ...d, withdrawal: [...d.withdrawal, { id: uid(), at: new Date().toISOString(), symptoms, redFlags: flags, level }] }));
  };
  const copy = result ? LEVEL_COPY[result] : null;
  const med = res.medical;
  const alsoCrisis = result === 'emergency' && hasSuicideFlag(flags);

  return (
    <main className="screen" aria-labelledby="wd-title">
      <Header title="Withdrawal monitor" back="#/" />
      <p id="wd-title" className="lead">
        Tick anything you’re experiencing right now.
      </p>
      <Card tone="danger">
        <h3 className="card-title">Red flags</h3>
        <div className="stack-sm">
          {[...RED_FLAGS, { id: SUICIDE_FLAG, label: 'Thoughts of harming yourself or ending your life' }].map((f) => (
            <label key={f.id} className="check">
              <input type="checkbox" checked={flags.includes(f.id)} onChange={() => toggle(flags, setFlags, f.id)} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="card-title">Other symptoms</h3>
        <div className="stack-sm">
          {WITHDRAWAL_SYMPTOMS.map((s) => (
            <label key={s.id} className="check">
              <input type="checkbox" checked={symptoms.includes(s.id)} onChange={() => toggle(symptoms, setSymptoms, s.id)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </Card>
      <Button block onClick={check}>
        Check
      </Button>
      {copy && result && (
        <Card tone={copy.tone} aria-live="assertive" data-testid={`wd-${result}`}>
          <h3 className="card-title">{copy.title}</h3>
          <p>{copy.text}</p>
          <div className="row-wrap">
            {result === 'emergency' && <CallButton tel={res.emergency} label={`Call ${res.emergency}`} variant="danger" />}
            {result === 'crisis' && res.crisis?.tel && <CallButton tel={res.crisis.tel} label={`Call ${res.crisis.name}`} variant="danger" />}
            {result === 'crisis' && <CallButton tel={res.emergency} label={`Call ${res.emergency}`} />}
            {result === 'crisis' && !res.crisis?.tel && res.crisis?.url && (
              <a className="btn btn-secondary" href={res.crisis.url} target="_blank" rel="noopener noreferrer">
                Find a crisis line
              </a>
            )}
            {result === 'urgent' && med.tel && <CallButton tel={med.tel} label={`Call ${med.name}`} variant="primary" />}
            {(result === 'urgent' || result === 'selfcare') && <LinkButton to="#/support/doctor">Doctor prep sheet</LinkButton>}
          </div>
          {result === 'urgent' && !med.tel && <p className="fine">Contact {med.name} today. {med.what}</p>}
        </Card>
      )}
      {alsoCrisis && (
        <Card tone="danger" data-testid="wd-crisis">
          <h3 className="card-title">{LEVEL_COPY.crisis.title}</h3>
          <p>{LEVEL_COPY.crisis.text}</p>
          {res.crisis?.tel && <CallButton tel={res.crisis.tel} label={`Call ${res.crisis.name}`} variant="danger" />}
        </Card>
      )}
      <p className="fine">This is a guide, not a diagnosis. If you’re worried, always call — that’s what helplines and doctors are for.</p>
    </main>
  );
}
