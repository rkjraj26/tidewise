import { useRef, useState } from 'react';
import { Download, Lock, Upload, Waves } from 'lucide-react';
import { useStore, useToday } from '../state/store';
import type { Approach, MotiveId, Region, SafetyAnswers } from '../lib/types';
import { MOTIVES } from '../content/motives';
import { REGIONS, RESOURCES, resourcesFor } from '../content/resources';
import { exportJson, hashPin, importJson, isValidPin, newSalt } from '../lib/storage';
import { addDays, diffDays, todayKey } from '../lib/dates';
import { scoreAudit } from '../lib/audit';
import { assessWithdrawalRisk } from '../lib/safety';
import { STEPDOWN_MAX_DAYS, stepdownMinDays } from '../lib/stats';
import { DRINK_WORD } from '../lib/standardDrinks';
import { AuditForm, AuditResult, SafetyForm, SafetyResultCard, SAFETY_QUESTIONS } from '../components/Clinical';
import { Button, Card, ChipGroup, Field, Header, LinkButton, Segmented, Stepper, Toggle } from '../components/ui';
import { navigate } from '../router';

export function Settings() {
  const { data, update, replace, reset, persistent } = useStore();
  const today = useToday();
  const p = data.profile!;
  const word = DRINK_WORD[p.region];
  const [newReason, setNewReason] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [dataMsg, setDataMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [approach, setApproach] = useState<Approach>(p.plan.approach);
  const [quitDate, setQuitDate] = useState(p.plan.quitDate);
  const [planMsg, setPlanMsg] = useState('');
  const [guided, setGuided] = useState(p.plan.medicalGuidance);
  const fileRef = useRef<HTMLInputElement>(null);

  const setProfile = (patch: Partial<typeof p>) => update((d) => ({ ...d, profile: { ...d.profile!, ...patch } }));

  const exportFile = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tidewise-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDataMsg('Backup downloaded. Keep it somewhere private.');
  };

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const next = importJson(await f.text());
      replace(next);
      setDataMsg('Backup restored.');
    } catch (e) {
      setDataMsg(`Couldn’t restore: ${(e as Error).message}`);
    }
  };

  const savePin = async () => {
    if (!isValidPin(pin)) return setPinMsg('Use 4–6 digits.');
    if (pin !== pin2) return setPinMsg('The PINs don’t match.');
    const salt = newSalt();
    const hash = await hashPin(pin, salt);
    update((d) => ({ ...d, settings: { ...d.settings, pinHash: hash, pinSalt: salt } }));
    setPin('');
    setPin2('');
    setPinMsg('PIN lock is on.');
  };

  const stepMin = stepdownMinDays(p.safety?.level ?? 'moderate');
  const bounds =
    approach === 'stepdown'
      ? { min: approach === p.plan.approach ? p.plan.startedOn : addDays(today, stepMin), max: addDays(today, STEPDOWN_MAX_DAYS) }
      : { min: addDays(today, -365), max: addDays(today, 30) };
  const planChanged = approach !== p.plan.approach || quitDate !== p.plan.quitDate || guided !== p.plan.medicalGuidance;
  const planDateOk = diffDays(bounds.min, quitDate) >= 0 && diffDays(quitDate, bounds.max) >= 0;
  const highRisk = p.safety?.level === 'high';
  const needsDoctor = highRisk && approach !== 'medical' && !guided;

  return (
    <main className="screen" aria-labelledby="set-title">
      <Header title="Settings" back="#/" />
      <h2 id="set-title" className="sr-only">
        Your preferences and data
      </h2>
      {!persistent && (
        <Card tone="warn" role="alert">
          <p>Your browser is blocking storage, so data will be lost when you close the app. Try opening Tidewise in a normal (not private) window, or install it to your home screen.</p>
        </Card>
      )}

      <Card>
        <h3 className="card-title">You</h3>
        <Field label="Name" value={p.name} onChange={(v) => setProfile({ name: v })} maxLength={40} />
        <label className="field-label" htmlFor="set-region">
          Country / region
        </label>
        <select id="set-region" className="input" value={p.region} onChange={(e) => setProfile({ region: e.target.value as Region })}>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {RESOURCES[r].label}
            </option>
          ))}
        </select>
        <Field label="Currency symbol" value={p.currency} onChange={(v) => setProfile({ currency: v.slice(0, 3) })} maxLength={3} />
        <Field
          label="Local emergency number"
          hint={`Used for every emergency button. Leave blank to use ${RESOURCES[p.region].emergency}.`}
          value={p.emergencyNumber ?? ''}
          onChange={(v) => setProfile({ emergencyNumber: v.replace(/[^\d+]/g, '').slice(0, 8) || undefined })}
          type="tel"
          inputMode="tel"
          placeholder={RESOURCES[p.region].emergency}
          maxLength={8}
        />
      </Card>

      <Card>
        <h3 className="card-title">Your plan</h3>
        <Segmented
          label="Approach"
          value={approach}
          onChange={(v) => {
            setApproach(v);
            setPlanMsg('');
            if (v === 'stepdown' && p.plan.approach !== 'stepdown') setQuitDate(addDays(today, 14));
          }}
          options={[
            { value: 'stop', label: 'Set day' },
            { value: 'medical', label: 'Medical' },
            { value: 'stepdown', label: 'Step down' },
          ]}
        />
        <label className="field-label" htmlFor="set-quit">
          {approach === 'stepdown' ? 'Zero day' : 'Quit day'}
        </label>
        <input id="set-quit" className="input" type="date" value={quitDate} min={bounds.min} max={bounds.max} onChange={(e) => setQuitDate(e.target.value)} />
        {highRisk && approach !== 'medical' && (
          <>
            <p className="error">Your safety check shows a high withdrawal risk. Please only stop or step down on your own if a doctor is supporting you.</p>
            <Toggle checked={guided} onChange={setGuided} label="A doctor is supporting my withdrawal" />
          </>
        )}
        {!planDateOk && <p className="error">Pick a date within the allowed range.</p>}
        <Button
          variant="secondary"
          disabled={!planChanged || !planDateOk || needsDoctor}
          onClick={() => {
            const switchingToStepdown = approach === 'stepdown' && p.plan.approach !== 'stepdown';
            setProfile({ plan: { ...p.plan, approach, quitDate, medicalGuidance: guided, startedOn: switchingToStepdown ? today : p.plan.startedOn, holdDays: switchingToStepdown ? 0 : p.plan.holdDays } });
            setPlanMsg('Plan updated.');
          }}
        >
          Update plan
        </Button>
        {planMsg && <p role="status" className="ok-text">{planMsg}</p>}
      </Card>

      <Card>
        <h3 className="card-title">Usual drinking (before you started)</h3>
        <p className="fine">Used to work out money saved and drinks avoided.</p>
        <Stepper label="Drinking days per week" value={p.baseline.drinkingDaysPerWeek} min={0} max={7} onChange={(v) => setProfile({ baseline: { ...p.baseline, drinkingDaysPerWeek: v } })} />
        <Stepper label={`${word.many} per drinking day`} value={p.baseline.drinksPerDrinkingDay} min={0} max={60} step={0.5} onChange={(v) => setProfile({ baseline: { ...p.baseline, drinksPerDrinkingDay: v } })} />
        <Stepper label={`Spend per week (${p.currency})`} value={p.baseline.spendPerWeek} min={0} max={100000} step={5} onChange={(v) => setProfile({ baseline: { ...p.baseline, spendPerWeek: v } })} />
      </Card>

      <Card>
        <h3 className="card-title">What drinking does for you</h3>
        <ChipGroup<MotiveId> label="What drinking does for you" options={MOTIVES.map((m) => ({ id: m.id, label: m.label }))} value={p.motives} onChange={(v) => setProfile({ motives: v })} />
      </Card>

      <Card>
        <h3 className="card-title">Your reasons</h3>
        <ul className="saved-list">
          {p.reasons.map((r) => (
            <li key={r}>
              <p>{r}</p>
              <button type="button" className="icon-btn small" aria-label={`Remove reason ${r}`} onClick={() => setProfile({ reasons: p.reasons.filter((x) => x !== r) })}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <Field label="Add a reason" value={newReason} onChange={setNewReason} maxLength={200} />
        <Button
          variant="secondary"
          disabled={!newReason.trim()}
          onClick={() => {
            setProfile({ reasons: [...p.reasons, newReason.trim()] });
            setNewReason('');
          }}
        >
          Add
        </Button>
        <Field label="Note to yourself for hard moments" value={p.futureLetter} onChange={(v) => setProfile({ futureLetter: v })} multiline maxLength={1500} />
      </Card>

      <Card>
        <h3 className="card-title">Safety check & AUDIT</h3>
        <p className="fine">
          Withdrawal risk: <strong>{p.safety?.level ?? 'not checked'}</strong>
          {p.audit ? ` · AUDIT ${p.audit.score}/40` : ''}
        </p>
        <LinkButton to="#/screening">Retake</LinkButton>
      </Card>

      <Card>
        <h3 className="card-title">Appearance</h3>
        <Segmented
          label="Theme"
          value={data.settings.theme}
          onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, theme: v } }))}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Card>
        <h3 className="card-title with-icon">
          <Lock size={18} aria-hidden /> Privacy lock
        </h3>
        <p className="fine">A PIN keeps casual eyes out if someone picks up your phone. Your data never leaves this device either way.</p>
        {data.settings.pinHash ? (
          <>
            <p>PIN lock is on.</p>
            <Button
              variant="secondary"
              onClick={() => {
                update((d) => ({ ...d, settings: { ...d.settings, pinHash: null, pinSalt: null } }));
                setPinMsg('PIN lock is off.');
              }}
            >
              Turn off PIN
            </Button>
          </>
        ) : (
          <>
            <Field label="New PIN (4–6 digits)" value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))} type="password" inputMode="numeric" autoComplete="new-password" />
            <Field label="Confirm PIN" value={pin2} onChange={(v) => setPin2(v.replace(/\D/g, '').slice(0, 6))} type="password" inputMode="numeric" autoComplete="new-password" />
            <Button onClick={savePin}>Set PIN</Button>
          </>
        )}
        {pinMsg && <p role="status" className="ok-text">{pinMsg}</p>}
      </Card>

      <Card>
        <h3 className="card-title">Your data</h3>
        <p className="fine">Everything is stored only on this device. Back it up before changing phones.</p>
        <div className="row-wrap">
          <Button variant="secondary" onClick={exportFile}>
            <Download size={18} aria-hidden /> Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={18} aria-hidden /> Restore backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="settings-import" onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        {dataMsg && <p role="status" className="ok-text">{dataMsg}</p>}
        <hr />
        {confirmDelete ? (
          <div className="stack-sm">
            <p className="error">This permanently deletes everything in Tidewise on this device. Export a backup first if you might want it.</p>
            <div className="row-wrap">
              <Button
                variant="danger"
                onClick={() => {
                  reset();
                  navigate('#/', { replace: true });
                }}
              >
                Yes, delete everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete all data
          </Button>
        )}
      </Card>

      <Card tone="calm">
        <h3 className="card-title with-icon">
          <Waves size={18} aria-hidden /> About Tidewise
        </h3>
        <p className="fine">
          Version 1.0. Tidewise is a self-help tool based on cognitive behavioural therapy, motivational interviewing, mindfulness-based relapse prevention and the WHO
          AUDIT. It is not a medical device and does not replace professional care. If you are unwell or in danger, contact a doctor or emergency services.
        </p>
      </Card>
    </main>
  );
}

export function Screening() {
  const { data, update } = useStore();
  const p = data.profile!;
  const [audit, setAudit] = useState<(number | null)[]>(p.audit?.answers ?? Array(10).fill(null));
  const [safety, setSafety] = useState<Partial<SafetyAnswers>>(p.safety ?? {});
  const [saved, setSaved] = useState(false);
  const auditDone = audit.every((a) => a !== null);
  const score = auditDone ? scoreAudit(audit as number[]) : null;
  const safetyDone = SAFETY_QUESTIONS.every((q) => safety[q.key] !== undefined);
  const risk = safetyDone ? assessWithdrawalRisk(safety as SafetyAnswers, p.baseline, p.region, score, auditDone ? (audit as number[]) : null) : null;

  return (
    <main className="screen" aria-labelledby="scr-title">
      <Header title="Safety check & AUDIT" back="#/settings" />
      <h2 id="scr-title" className="section-title">
        Withdrawal safety check
      </h2>
      <SafetyForm
        answers={safety}
        onChange={(a) => {
          setSaved(false);
          setSafety(a);
        }}
      />
      {risk && <SafetyResultCard level={risk.level} reasons={risk.reasons} res={resourcesFor(p)} />}
      <h2 className="section-title">AUDIT (last 12 months)</h2>
      <AuditForm
        answers={audit}
        onChange={(a) => {
          setSaved(false);
          setAudit(a);
        }}
      />
      {score !== null && <AuditResult score={score} />}
      <Button
        block
        disabled={!safetyDone}
        onClick={() => {
          const now = new Date().toISOString();
          update((d) => ({
            ...d,
            profile: {
              ...d.profile!,
              safety: risk ? { ...(safety as SafetyAnswers), level: risk.level, assessedAt: now } : d.profile!.safety,
              audit: auditDone ? { answers: audit as number[], score: score as number, takenAt: now } : d.profile!.audit,
            },
          }));
          setSaved(true);
        }}
      >
        Save results
      </Button>
      {saved && <p role="status" className="ok-text">Saved.</p>}
    </main>
  );
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { data } = useStore();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const tryPin = async (value: string) => {
    if (!data.settings.pinHash || !data.settings.pinSalt) return onUnlock();
    setBusy(true);
    const h = await hashPin(value, data.settings.pinSalt);
    setBusy(false);
    if (h === data.settings.pinHash) onUnlock();
    else {
      setErr('That PIN isn’t right. Try again.');
      setPin('');
    }
  };
  return (
    <main className="lock" aria-labelledby="lock-title">
      <div className="logo-mark" aria-hidden>
        <Waves size={40} />
      </div>
      <h1 id="lock-title">Tidewise is locked</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tryPin(pin);
        }}
        className="stack-sm"
      >
        <label htmlFor="pin" className="field-label">
          Enter your PIN
        </label>
        <input
          id="pin"
          className="input pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          autoFocus
          onChange={(e) => {
            setErr('');
            setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
          }}
        />
        <Button type="submit" block disabled={pin.length < 4 || busy}>
          Unlock
        </Button>
        {err && (
          <p role="alert" className="error">
            {err}
          </p>
        )}
      </form>
      <p className="fine center">Forgot your PIN? For your privacy it can’t be recovered. You can reinstall and restore from a backup.</p>
    </main>
  );
}
