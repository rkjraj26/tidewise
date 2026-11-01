import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react';
import { AUDIT_QUESTIONS, interpretAudit } from '../lib/audit';
import { RED_FLAGS } from '../lib/safety';
import type { Region, RiskLevel, SafetyAnswers } from '../lib/types';
import { DRINK_WORD, GRAMS_PER_STANDARD, presetsFor, roundHalf, standardDrinks, STANDARD_LABEL } from '../lib/standardDrinks';
import type { RegionResources } from '../content/resources';
import { Button, CallButton, Card, LinkButton, Segmented, Stepper } from './ui';

export function AuditForm({ answers, onChange }: { answers: (number | null)[]; onChange: (a: (number | null)[]) => void }) {
  return (
    <>
    <p className="fine">In these questions, “a drink” means one standard drink of about 10 g of alcohol — a small glass of wine, a half-pint of ordinary beer, or a single measure of spirits.</p>
    <ol className="audit">
      {AUDIT_QUESTIONS.map((q, i) => (
        <li key={q.id} className="audit-q">
          <p className="audit-text" id={`audit-${q.id}`}>
            {q.text}
          </p>
          <div className="audit-options" role="radiogroup" aria-labelledby={`audit-${q.id}`}>
            {q.options.map((o) => (
              <button
                type="button"
                key={o.label}
                role="radio"
                aria-checked={answers[i] === o.score}
                className={`opt${answers[i] === o.score ? ' opt-on' : ''}`}
                onClick={() => {
                  const next = [...answers];
                  next[i] = o.score;
                  onChange(next);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ol>
    </>
  );
}

export function AuditResult({ score }: { score: number }) {
  const r = interpretAudit(score);
  return (
    <Card tone={r.zone >= 3 ? 'warn' : 'calm'} aria-live="polite">
      <p className="eyebrow">Your AUDIT score</p>
      <p className="big-score">
        {score}
        <span>/40</span>
      </p>
      <h3>{r.title}</h3>
      <p>{r.message}</p>
      <p className="fine">AUDIT is the World Health Organization’s screening questionnaire. It’s information, not a diagnosis.</p>
    </Card>
  );
}

export const SAFETY_QUESTIONS: { key: keyof SafetyAnswers; text: string; hint?: string }[] = [
  { key: 'dailyDrinking', text: 'Do you drink every day, or almost every day?' },
  { key: 'withdrawalSymptoms', text: 'When you stop or cut down, do you get shaky, sweaty, sick or anxious — or do you drink in the morning to feel better?' },
  { key: 'pastSeizureOrDTs', text: 'Have you ever had a seizure (fit), or become confused or seen things that weren’t there, when you stopped drinking?' },
  { key: 'pastMedicalDetox', text: 'Have you ever needed medical help or a detox to stop drinking?' },
  { key: 'sedatives', text: 'Do you also take sleeping pills, benzodiazepines (like diazepam or Xanax), or opioid painkillers?' },
  { key: 'medicalConditions', text: 'Do you have liver disease, heart disease, epilepsy or another serious health condition?' },
  { key: 'pregnant', text: 'Are you pregnant, or could you be?' },
];

export function SafetyForm({ answers, onChange }: { answers: Partial<SafetyAnswers>; onChange: (a: Partial<SafetyAnswers>) => void }) {
  return (
    <div className="stack">
      {SAFETY_QUESTIONS.map((q) => (
        <div key={q.key} className="safety-q">
          <p id={`sq-${q.key}`}>{q.text}</p>
          <Segmented
            label={q.text}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
            value={answers[q.key] === undefined ? null : answers[q.key] ? 'yes' : 'no'}
            onChange={(v) => onChange({ ...answers, [q.key]: v === 'yes' })}
          />
        </div>
      ))}
    </div>
  );
}

export function RedFlagList() {
  return (
    <ul className="flag-list">
      {RED_FLAGS.map((f) => (
        <li key={f.id}>{f.label}</li>
      ))}
    </ul>
  );
}

export function SafetyResultCard({ level, reasons, res }: { level: RiskLevel; reasons: string[]; res: RegionResources }) {
  const main = res.lines.find((l) => l.tel) ?? null;
  const med = res.medical;
  if (level === 'high')
    return (
      <Card tone="danger" aria-live="polite" data-testid="risk-high">
        <h3 className="with-icon">
          <AlertTriangle aria-hidden /> Please don’t stop suddenly on your own
        </h3>
        <p>
          Your answers suggest a <strong>higher risk of serious withdrawal</strong>, which can include seizures. That doesn’t mean you can’t stop — it means you
          should stop <strong>with medical support</strong>. Depending on your history, that may be at home with daily check-ins or in a hospital or detox unit —
          your doctor will decide what’s safest. <strong>Until you have a plan, don’t suddenly stop or sharply cut down.</strong>
        </p>
        <ul className="reason-list">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p>
          <strong>Next step:</strong> talk to {med.name} or call a helpline before your quit day. Tidewise will prepare a summary for your doctor.
        </p>
        <div className="row-wrap">
          {med.tel && <CallButton tel={med.tel} label={`Call ${med.name}`} variant="primary" />}
          {main?.tel && <CallButton tel={main.tel} label={`Call ${main.name}`} variant={med.tel ? 'secondary' : 'primary'} />}
          <LinkButton to="#/support/doctor">
            <Stethoscope size={18} aria-hidden /> Doctor prep sheet
          </LinkButton>
        </div>
      </Card>
    );
  if (level === 'moderate')
    return (
      <Card tone="warn" aria-live="polite" data-testid="risk-moderate">
        <h3 className="with-icon">
          <Stethoscope aria-hidden /> Talk to a doctor before you stop
        </h3>
        <p>Your body may have adapted to alcohol, so stopping could cause withdrawal symptoms. A quick conversation with a doctor or helpline can make stopping safer and easier.</p>
        <ul className="reason-list">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="fine">Tidewise will turn on the withdrawal monitor for your first week.</p>
      </Card>
    );
  return (
    <Card tone="success" aria-live="polite" data-testid="risk-low">
      <h3 className="with-icon">
        <ShieldCheck aria-hidden /> Stopping looks generally safe for you
      </h3>
      <p>Based on your answers, dangerous withdrawal is unlikely. Still, everyone should know the warning signs below — if any happen, call {res.emergency}.</p>
    </Card>
  );
}

/** Helps people convert real drinks into standard drinks. */
export function DrinkHelper({ region, onAdd }: { region: Region; onAdd: (n: number) => void }) {
  const presets = presetsFor(region);
  const word = DRINK_WORD[region];
  const [preset, setPreset] = useState(presets[0].id);
  const [qty, setQty] = useState(1);
  const p = presets.find((d) => d.id === preset)!;
  const each = standardDrinks(p.volumeMl, p.abv, region);
  const total = roundHalf(each * qty);
  return (
    <div className="helper">
      <p className="fine">
        1 = one {STANDARD_LABEL[region]}. Add each kind of drink you have on a typical day — they add up.
      </p>
      <label className="field-label" htmlFor="preset">
        What do you drink?
      </label>
      <select id="preset" className="input" value={preset} onChange={(e) => setPreset(e.target.value)}>
        {presets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <Stepper label="How many?" value={qty} onChange={setQty} min={1} max={30} />
      <p>
        = <strong>{total}</strong> {total === 1 ? word.one : word.many} ({each.toFixed(1)} each, {Math.round(each * GRAMS_PER_STANDARD[region])} g alcohol)
      </p>
      <Button variant="secondary" onClick={() => onAdd(total)}>
        Add {total} {total === 1 ? word.one : word.many}
      </Button>
    </div>
  );
}
