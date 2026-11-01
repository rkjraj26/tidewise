import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { navigate } from '../router';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sos';

export function Button({
  variant = 'primary',
  block,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button type="button" className={`btn btn-${variant}${block ? ' btn-block' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ to, variant = 'secondary', block, children }: { to: string; variant?: Variant; block?: boolean; children: ReactNode }) {
  return (
    <a href={to} className={`btn btn-${variant}${block ? ' btn-block' : ''}`}>
      {children}
    </a>
  );
}

export function Header({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      {back ? (
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(back)}>
          <ChevronLeft aria-hidden />
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      <h1 className="topbar-title">{title}</h1>
      {right ?? <span className="icon-spacer" />}
    </header>
  );
}

export function Card({ children, className = '', tone, ...rest }: { children: ReactNode; className?: string; tone?: 'calm' | 'warn' | 'danger' | 'accent' | 'success' } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`card${tone ? ` card-${tone}` : ''} ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function NavCard({ to, icon, title, text }: { to: string; icon?: ReactNode; title: string; text?: string }) {
  return (
    <a className="navcard" href={to}>
      {icon && <span className="navcard-icon" aria-hidden>{icon}</span>}
      <span className="navcard-body">
        <span className="navcard-title">{title}</span>
        {text && <span className="navcard-text">{text}</span>}
      </span>
      <ChevronRight className="navcard-chev" aria-hidden />
    </a>
  );
}

export function Chip({ selected, onToggle, children }: { selected: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip${selected ? ' chip-on' : ''}`} aria-pressed={selected} onClick={onToggle}>
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <Chip key={o.id} selected={value.includes(o.id)} onToggle={() => onChange(value.includes(o.id) ? value.filter((x) => x !== o.id) : [...value, o.id])}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

/** Single-choice segmented control (radio semantics). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: { value: T; label: string }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`segmented ${className}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={String(o.value)}
          className={`seg${value === o.value ? ' seg-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 0–10 intensity scale. */
export function Scale({ value, onChange, label, low = 'None', high = 'Overwhelming' }: { value: number | null | undefined; onChange: (v: number) => void; label: string; low?: string; high?: string }) {
  return (
    <div className="scale-wrap">
      <div className="scale" role="radiogroup" aria-label={label}>
        {Array.from({ length: 11 }, (_, i) => (
          <button
            type="button"
            key={i}
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} out of 10`}
            className={`scale-btn${value === i ? ' scale-on' : ''}`}
            style={{ ['--lvl' as any]: i }}
            onClick={() => onChange(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="scale-ends" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  suffix?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  return (
    <div className="stepper">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="stepper-row">
        <button type="button" className="stepper-btn" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
          −
        </button>
        <input
          id={id}
          className="stepper-input"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
          }}
        />
        <button type="button" className="stepper-btn" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + step))} disabled={value >= max}>
          +
        </button>
        {suffix && <span className="stepper-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline,
  hint,
  inputMode,
  autoComplete,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      {multiline ? (
        <textarea id={id} className="input" rows={3} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          id={id}
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-box" aria-hidden />
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {description && <span className="toggle-desc">{description}</span>}
      </span>
    </label>
  );
}

export function StatTile({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <div className="stat">
      {icon && <span className="stat-icon" aria-hidden>{icon}</span>}
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function CallButton({ tel, label, variant = 'secondary' }: { tel: string; label: string; variant?: Variant }) {
  return (
    <a className={`btn btn-${variant}`} href={`tel:${tel}`}>
      <Phone size={18} aria-hidden /> {label}
    </a>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function fmtMoney(n: number, currency: string): string {
  const v = n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(n % 1 === 0 ? 0 : 2);
  return `${currency}${v}`;
}

export function fmtNum(n: number): string {
  return n >= 10 ? Math.round(n).toLocaleString() : String(Math.round(n * 10) / 10);
}
