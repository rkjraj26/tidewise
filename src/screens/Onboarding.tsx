import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, HeartHandshake, Lock, Waves, FlaskConical, Upload } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import type { Approach, Baseline, MotiveId, Profile, Region, SafetyAnswers } from '../lib/types';
import { MOTIVES, MOTIVE_BY_ID } from '../content/motives';
import { REASON_SUGGESTIONS } from '../content/library';
import { REGIONS, RESOURCES, resourcesFor } from '../content/resources';
import { scoreAudit } from '../lib/audit';
import { assessWithdrawalRisk } from '../lib/safety';
import { addDays, diffDays, formatDay } from '../lib/dates';
import { STEPDOWN_MAX_DAYS, stepdownMinDays, taperSchedule } from '../lib/stats';
import { DRINK_WORD } from '../lib/standardDrinks';
import { importJson, uid } from '../lib/storage';
import { AuditForm, AuditResult, DrinkHelper, RedFlagList, SafetyForm, SafetyResultCard, SAFETY_QUESTIONS } from '../components/Clinical';
import { Button, Card, Chip, Field, Stepper, Toggle } from '../components/ui';
import { navigate } from '../router';

const STEPS = ['welcome', 'you', 'motives', 'truth', 'baseline', 'audit', 'safety', 'plan', 'reasons', 'people'] as const;
type Step = (typeof STEPS)[number];

export function Onboarding() {
  const { update, replace } = useStore();
  const today = useToday();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [region, setRegion] = useState<Region>('US');
  const [currency, setCurrency] = useState(RESOURCES.US.currency);
  const [motives, setMotives] = useState<MotiveId[]>([]);
  const [baseline, setBaseline] = useState<Baseline>({ drinkingDaysPerWeek: 0, drinksPerDrinkingDay: 0, spendPerWeek: 0 });
  const [showHelper, setShowHelper] = useState(false);
  const [audit, setAudit] = useState<(number | null)[]>(Array(10).fill(null));
  const [auditSkipped, setAuditSkipped] = useState(false);
  const [safety, setSafety] = useState<Partial<SafetyAnswers>>({});
  const [approach, setApproach] = useState<Approach | null>(null);
  const [quitDate, setQuitDate] = useState(today);
  const [medicalGuidance, setMedicalGuidance] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [letter, setLetter] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)]);
  const prev = () => setStep(STEPS[Math.max(0, idx - 1)]);

  const auditComplete = audit.every((a) => a !== null);
  const auditScore = auditComplete ? scoreAudit(audit as number[]) : null;
  const safetyComplete = SAFETY_QUESTIONS.every((q) => safety[q.key] !== undefined);
  const risk = useMemo(
    () => (safetyComplete ? assessWithdrawalRisk(safety as SafetyAnswers, baseline, region, auditScore, auditComplete && !auditSkipped ? (audit as number[]) : null) : null),
    [safetyComplete, safety, baseline, region, auditScore, auditComplete, auditSkipped, audit],
  );
  const word = DRINK_WORD[region];

  const chooseApproach = (a: Approach) => {
    setApproach(a);
    if (a === 'stepdown') setQuitDate(addDays(today, Math.max(14, stepdownMinDays(risk?.level))));
    else if (a === 'medical') setQuitDate(addDays(today, 3));
    else setQuitDate(today);
  };

  const minStep = stepdownMinDays(risk?.level);
  const res = resourcesFor({ region, emergencyNumber });
  const dateBounds = approach === 'stepdown' ? { min: addDays(today, minStep), max: addDays(today, STEPDOWN_MAX_DAYS) } : { min: today, max: addDays(today, 30) };
  const dateOk = diffDays(dateBounds.min, quitDate) >= 0 && diffDays(quitDate, dateBounds.max) >= 0;
  // High risk: going it alone (stop or step-down) requires confirming a doctor is involved.
  const stepdownBlocked = (approach === 'stepdown' || approach === 'stop') && risk?.level === 'high' && !medicalGuidance;
  const baselineOk = baseline.drinkingDaysPerWeek > 0 && baseline.drinksPerDrinkingDay > 0;

  // Default high-risk users to the medical path.
  useEffect(() => {
    if (step === 'plan' && approach === null && risk?.level === 'high') {
      setApproach('medical');
      setQuitDate(addDays(today, 3));
    }
  }, [step, approach, risk?.level, today]);
  const planOk = approach !== null && dateOk && !stepdownBlocked;

  const finish = () => {
    const allReasons = [...reasons, ...(customReason.trim() ? [customReason.trim()] : [])];
    const now = new Date().toISOString();
    const profile: Profile = {
      name: name.trim(),
      region,
      currency,
      motives,
      reasons: allReasons,
      futureLetter: letter.trim(),
      baseline,
      audit: auditComplete && !auditSkipped ? { answers: audit as number[], score: auditScore as number, takenAt: now } : null,
      safety: risk ? { ...(safety as SafetyAnswers), level: risk.level, assessedAt: now } : null,
      plan: { approach: approach ?? 'stop', quitDate, startedOn: today, medicalGuidance },
      emergencyNumber: emergencyNumber || undefined,
    };
    update((d) => ({
      ...d,
      profile,
      contacts: contactName.trim() && contactPhone.trim() ? [...d.contacts, { id: uid(), name: contactName.trim(), phone: contactPhone.trim() }] : d.contacts,
    }));
    navigate('#/', { replace: true });
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      replace(importJson(await f.text()));
      navigate('#/', { replace: true });
    } catch (e) {
      setImportError((e as Error).message);
    }
  };

  return (
    <main className="onboarding" aria-labelledby="ob-title">
      {step !== 'welcome' && (
        <div className="ob-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS.length - 1} aria-valuenow={idx} aria-valuetext={`Step ${idx} of ${STEPS.length - 1}`}>
          <div className="ob-progress-fill" style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} />
        </div>
      )}

      {step === 'welcome' && (
        <div className="ob-welcome">
          <div className="logo-mark" aria-hidden>
            <Waves size={44} />
          </div>
          <h1 id="ob-title">Tidewise</h1>
          <p className="lead">Cravings are waves. Learn to ride them.</p>
          <p>A private companion for stopping drinking — built on addiction science, designed for the hard moments, and free of judgement.</p>
          <ul className="promise">
            <li>
              <Lock aria-hidden /> <span><strong>Completely private.</strong> No account. Nothing leaves your phone.</span>
            </li>
            <li>
              <HeartHandshake aria-hidden /> <span><strong>No labels, no shame.</strong> Slips don’t erase your progress.</span>
            </li>
            <li>
              <FlaskConical aria-hidden /> <span><strong>Evidence-based.</strong> CBT, urge surfing, motivational interviewing, and medical safety checks.</span>
            </li>
          </ul>
          <Button block onClick={next}>
            Let’s begin <ArrowRight size={18} aria-hidden />
          </Button>
          <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Restore from a backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="import-file" onChange={(e) => onImport(e.target.files?.[0])} />
          {importError && <p className="error" role="alert">{importError}</p>}
          <p className="fine center">Tidewise is a self-help tool, not medical care. In an emergency, call your local emergency number.</p>
        </div>
      )}

      {step === 'you' && (
        <Section title="First, a little about you" onBack={prev} onNext={next}>
          <Field label="What should we call you? (optional)" value={name} onChange={setName} placeholder="First name or nickname" autoComplete="given-name" maxLength={40} />
          <label className="field-label" htmlFor="region">
            Where do you live?
          </label>
          <p className="field-hint">So we can show the right helplines and drink sizes.</p>
          <select
            id="region"
            className="input"
            value={region}
            onChange={(e) => {
              const r = e.target.value as Region;
              setRegion(r);
              setCurrency(RESOURCES[r].currency);
            }}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {RESOURCES[r].label}
              </option>
            ))}
          </select>
          <Field label="Currency symbol" value={currency} onChange={(v) => setCurrency(v.slice(0, 3))} maxLength={3} />
          {region === 'OTHER' && (
            <Field
              label="Your local emergency number"
              hint="Emergency numbers differ by country (for example 112, 911, 999, 000, 119). We’ll use this for every emergency button."
              value={emergencyNumber}
              onChange={(v) => setEmergencyNumber(v.replace(/[^\d+]/g, '').slice(0, 8))}
              type="tel"
              inputMode="tel"
              maxLength={8}
            />
          )}
        </Section>
      )}

      {step === 'motives' && (
        <Section title="What does drinking do for you?" onBack={prev} onNext={next} nextLabel={motives.length ? 'Next' : 'Skip for now'}>
          <p>
            Alcohol does real jobs for people — that’s why stopping is hard. Pick everything that’s true for you. <strong>Your answers decide which tools Tidewise gives you.</strong>
          </p>
          <div className="chips" role="group" aria-label="What drinking does for you">
            {MOTIVES.map((m) => (
              <Chip key={m.id} selected={motives.includes(m.id)} onToggle={() => setMotives(motives.includes(m.id) ? motives.filter((x) => x !== m.id) : [...motives, m.id])}>
                {m.label}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {step === 'truth' && (
        <Section title={motives.length ? 'Here’s the honest deal' : 'Every drink has a job'} onBack={prev} onNext={next}>
          {motives.length === 0 ? (
            <p>You can come back to this any time in Settings. Knowing why you drink is the most useful thing you can learn about your drinking.</p>
          ) : (
            <>
              <p>Alcohol <em>does</em> help with these — at first. Here’s what it does over time, and what Tidewise will help you replace it with.</p>
              {motives.map((id) => (
                <Card key={id}>
                  <p className="eyebrow">{MOTIVE_BY_ID[id].label}</p>
                  <p className="quote">{MOTIVE_BY_ID[id].voice}</p>
                  <p>{MOTIVE_BY_ID[id].truth}</p>
                  <p className="fine">
                    Your replacement tools: {MOTIVE_BY_ID[id].tools.slice(0, 3).map((t) => t.title.toLowerCase()).join(' · ')}
                  </p>
                </Card>
              ))}
            </>
          )}
        </Section>
      )}

      {step === 'baseline' && (
        <Section title="Your usual drinking" onBack={prev} onNext={next} nextDisabled={!baselineOk}>
          <p>Be as honest as you can — this stays on your phone. It helps us check your safety and show what you save. Think about a typical week recently.</p>
          <Stepper label="Drinking days in a typical week" value={baseline.drinkingDaysPerWeek} min={0} max={7} onChange={(v) => setBaseline({ ...baseline, drinkingDaysPerWeek: v })} />
          <Stepper
            label={`Standard ${word.many} on a typical drinking day`}
            value={baseline.drinksPerDrinkingDay}
            min={0}
            max={60}
            step={0.5}
            onChange={(v) => setBaseline({ ...baseline, drinksPerDrinkingDay: v })}
          />
          <button type="button" className="link-btn" aria-expanded={showHelper} onClick={() => setShowHelper(!showHelper)}>
            {showHelper ? 'Hide the counter' : `Not sure? Help me count ${word.many}`}
          </button>
          {showHelper && (
            <DrinkHelper
              region={region}
              onAdd={(n) => setBaseline({ ...baseline, drinksPerDrinkingDay: Math.min(60, baseline.drinksPerDrinkingDay + n) })}
            />
          )}
          {showHelper && baseline.drinksPerDrinkingDay > 0 && (
            <button type="button" className="link-btn" onClick={() => setBaseline({ ...baseline, drinksPerDrinkingDay: 0 })}>
              Start the count again
            </button>
          )}
          <Stepper label={`Money spent on alcohol per week (${currency})`} value={baseline.spendPerWeek} min={0} max={100000} step={5} onChange={(v) => setBaseline({ ...baseline, spendPerWeek: v })} />
        </Section>
      )}

      {step === 'audit' && (
        <Section
          title="A quick check-up (2 minutes)"
          onBack={prev}
          onNext={() => {
            setAuditSkipped(!auditComplete);
            next();
          }}
          nextLabel={auditComplete ? 'Next' : 'Skip this'}
        >
          <p>These 10 questions are the World Health Organization’s AUDIT screen. They help you — and your doctor — understand where you are. Think about the last 12 months.</p>
          <AuditForm answers={audit} onChange={setAudit} />
          {auditScore !== null && <AuditResult score={auditScore} />}
        </Section>
      )}

      {step === 'safety' && (
        <Section title="Your safety comes first" onBack={prev} onNext={next} nextDisabled={!safetyComplete}>
          <p>
            For some people, stopping alcohol suddenly can be <strong>dangerous</strong>. A few quick questions tell us if you should get medical support first.
          </p>
          <SafetyForm answers={safety} onChange={setSafety} />
          {risk && <SafetyResultCard level={risk.level} reasons={risk.reasons} res={res} />}
          {risk && (
            <Card>
              <h3>Red flags — call {res.emergency} if any happen</h3>
              <RedFlagList />
            </Card>
          )}
        </Section>
      )}

      {step === 'plan' && (
        <Section title="Choose your path" onBack={prev} onNext={next} nextDisabled={!planOk}>
          <div className="choice-list" role="radiogroup" aria-label="Your path">
            <Choice
              selected={approach === 'stop'}
              onSelect={() => chooseApproach('stop')}
              title="Stop on a set day"
              text="Pick a quit day — today or soon — and stop completely."
              badge={risk?.level === 'low' ? 'Good fit' : undefined}
            />
            <Choice
              selected={approach === 'medical'}
              onSelect={() => chooseApproach('medical')}
              title="Stop with medical support"
              text="See a doctor first for a safe withdrawal plan and craving medication."
              badge={risk && risk.level !== 'low' ? 'Recommended for you' : undefined}
            />
            <Choice
              selected={approach === 'stepdown'}
              onSelect={() => chooseApproach('stepdown')}
              title="Step down to zero"
              text={`Cut down gradually with a weekly limit that shrinks to zero on your zero day (${minStep}–${STEPDOWN_MAX_DAYS} days).`}
            />
          </div>
          {approach && (
            <>
              <label className="field-label" htmlFor="quitdate">
                {approach === 'stepdown' ? 'Your zero day' : approach === 'medical' ? 'Your planned quit day (you can change it after seeing your doctor)' : 'Your quit day'}
              </label>
              <input id="quitdate" className="input" type="date" value={quitDate} min={dateBounds.min} max={dateBounds.max} onChange={(e) => setQuitDate(e.target.value)} />
              {!dateOk && <p className="error" role="alert">Pick a date between {formatDay(dateBounds.min)} and {formatDay(dateBounds.max)}.</p>}
            </>
          )}
          {approach === 'stepdown' && risk?.level === 'high' && (
            <Card tone="danger" data-testid="gate-high">
              <p>
                <strong>With your risk level, reducing on your own isn’t safe.</strong> Withdrawal can start even while cutting down. Please choose “Stop with medical
                support”, or only continue if a doctor is guiding your plan.
              </p>
              <Toggle checked={medicalGuidance} onChange={setMedicalGuidance} label="A doctor is guiding my step-down plan" />
            </Card>
          )}
          {approach === 'stop' && risk?.level === 'high' && (
            <Card tone="danger" data-testid="gate-high">
              <p>
                <strong>With your answers, stopping suddenly on your own could cause seizures or severe withdrawal.</strong> Please choose “Stop with medical support”,
                or only continue if a doctor has told you it’s safe.
              </p>
              <Toggle checked={medicalGuidance} onChange={setMedicalGuidance} label="A doctor is supporting my withdrawal" />
            </Card>
          )}
          {approach === 'stop' && risk?.level === 'moderate' && (
            <Card tone="warn">
              <p>
                Before your quit day, check with a doctor{res.medical.tel ? ` or call ${res.medical.name} (${res.medical.phone})` : ''}. If you get shaky, sweaty,
                sick or very anxious after stopping, use the withdrawal monitor and get advice the same day.
              </p>
            </Card>
          )}
          {approach === 'stepdown' && risk?.level === 'moderate' && (
            <Card tone="warn">
              <p>
                If you’ve had withdrawal symptoms, agree this plan with a doctor first. If you get shaky, sweaty, sick or very anxious, use “Hold this step” on the
                Home screen to go back to the last amount that didn’t cause symptoms — and get advice the same day.
              </p>
            </Card>
          )}
          {approach === 'stepdown' && dateOk && !stepdownBlocked && (
            <Card>
              <p className="eyebrow">Your step-down preview</p>
              <p className="taper-preview">
                {taperSchedule({ approach, quitDate, startedOn: today, medicalGuidance }, baseline)
                  .filter((_, i, a) => i % Math.ceil(a.length / 6) === 0 || i === a.length - 1)
                  .map((d) => `${formatDay(d.date, { day: 'numeric', month: 'short' })}: ${d.limit}`)
                  .join('  ·  ')}
              </p>
              <p className="fine">
                Most {word.many} on any one day. Your weekly total also shrinks, and you’ll never have more drinking days than you do now. Fewer is always fine — and
                alcohol-free days count toward your progress.
              </p>
            </Card>
          )}
        </Section>
      )}

      {step === 'reasons' && (
        <Section title="Why do you want to stop?" onBack={prev} onNext={next}>
          <p>In a craving, your own reasons are more powerful than anything we could say. Pick some, or write your own.</p>
          <div className="chips" role="group" aria-label="Reasons to stop">
            {REASON_SUGGESTIONS.map((r) => (
              <Chip key={r} selected={reasons.includes(r)} onToggle={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}>
                {r}
              </Chip>
            ))}
          </div>
          <Field label="In your own words" value={customReason} onChange={setCustomReason} placeholder="e.g. I want my daughter to see me sober at her wedding" maxLength={200} />
          <Field
            label="A note to yourself for a hard moment (optional)"
            value={letter}
            onChange={setLetter}
            multiline
            placeholder="When you read this, you’re having a craving. Remember…"
            maxLength={1500}
          />
        </Section>
      )}

      {step === 'people' && (
        <Section title="Who’s in your corner?" onBack={prev} onNext={finish} nextLabel="Start my plan">
          <p>People who tell one person they trust do better. Add someone you could call or text in a hard moment. (Optional — you can add people later.)</p>
          <Field label="Their name" value={contactName} onChange={setContactName} autoComplete="off" maxLength={40} />
          <Field label="Their phone number" value={contactPhone} onChange={setContactPhone} type="tel" inputMode="tel" autoComplete="off" maxLength={25} />
          <Card tone="calm">
            <p>
              <strong>Your plan:</strong>{' '}
              {approach === 'stepdown'
                ? `step down to zero by ${formatDay(quitDate)}`
                : approach === 'medical'
                  ? `stop with medical support, planned for ${formatDay(quitDate)}`
                  : `stop on ${quitDate === today ? 'today' : formatDay(quitDate)}`}
              .
            </p>
          </Card>
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="ob-step">
      <h1 id="ob-title" className="ob-title">
        {title}
      </h1>
      <div className="stack">{children}</div>
      <div className="ob-nav">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

function Choice({ selected, onSelect, title, text, badge }: { selected: boolean; onSelect: () => void; title: string; text: string; badge?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={`choice${selected ? ' choice-on' : ''}`} onClick={onSelect}>
      <span className="choice-title">
        {title} {badge && <span className="badge">{badge}</span>}
      </span>
      <span className="choice-text">{text}</span>
    </button>
  );
}
