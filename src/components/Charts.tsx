import { useState } from 'react';
import type { AppData } from '../lib/types';
import { addDays, diffDays, formatDay, fromKey } from '../lib/dates';
import { countStart, dayStatus, type CalendarStatus } from '../lib/stats';

const STATUS_TEXT: Record<CalendarStatus, string> = {
  af: 'Alcohol-free',
  drank: 'Drank',
  onplan: 'Within step-down limit',
  future: 'Future',
  before: 'Before your start',
  'today-open': 'Today (not logged yet)',
};

const STATUS_MARK: Partial<Record<CalendarStatus, string>> = { af: '✓', drank: '•', onplan: '–' };

/** 8-week calendar. Identity is never colour-alone: each cell carries a symbol + an accessible label. */
export function Calendar({ data, today, maxWeeks = 8 }: { data: AppData; today: string; maxWeeks?: number }) {
  // Grid ends on the Saturday of this week, starts on a Sunday. Shows 4–8 weeks depending on how long you've been going.
  const end = addDays(today, 6 - fromKey(today).getDay());
  const start0 = data.profile ? countStart(data.profile.plan) : today;
  const weeks = Math.min(maxWeeks, Math.max(4, Math.ceil((diffDays(start0, end) + 1) / 7)));
  const start = addDays(end, -(weeks * 7 - 1));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  return (
    <div>
      <div className="cal-head" aria-hidden>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="cal" role="grid" aria-label={`Last ${weeks} weeks`}>
        {Array.from({ length: weeks }, (_, w) => (
          <div role="row" className="cal-row" key={w}>
            {cells.slice(w * 7, w * 7 + 7).map((k) => {
              const st = dayStatus(data, k, today);
              return (
                <span
                  role="gridcell"
                  key={k}
                  className={`cal-cell cal-${st}${k === today ? ' cal-today' : ''}`}
                  aria-label={`${formatDay(k, { weekday: 'long', day: 'numeric', month: 'long' })}: ${STATUS_TEXT[st]}`}
                  title={`${formatDay(k)}: ${STATUS_TEXT[st]}`}
                >
                  <span aria-hidden>{STATUS_MARK[st] ?? ''}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="legend" aria-label="Legend">
        <li>
          <span className="swatch cal-af" aria-hidden>✓</span> Alcohol-free
        </li>
        <li>
          <span className="swatch cal-drank" aria-hidden>•</span> Drank
        </li>
        {data.profile?.plan.approach === 'stepdown' && (
          <li>
            <span className="swatch cal-onplan" aria-hidden>–</span> Within limit
          </li>
        )}
      </ul>
    </div>
  );
}

/** Daily peak craving, 0–10, as thin bars anchored to the baseline. Tap a bar for its value. */
export function CravingChart({ series }: { series: { date: string; value: number | null }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 320;
  const H = 120;
  const padL = 22;
  const padB = 18;
  const padT = 8;
  const plotW = W - padL - 4;
  const plotH = H - padB - padT;
  const n = series.length;
  const slot = plotW / n;
  const barW = Math.max(3, Math.min(10, slot - 2)); // ≥2px surface gap
  const y = (v: number) => padT + plotH - (v / 10) * plotH;
  const logged = series.filter((s) => s.value !== null);
  const a = active !== null ? series[active] : null;

  return (
    <figure className="chart">
      <div className="chart-tip" aria-live="polite">
        {a ? (
          <>
            <strong>{formatDay(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</strong> · {a.value === null ? 'nothing logged' : `peak craving ${a.value}/10`}
          </>
        ) : logged.length ? (
          <span className="muted">Tap a bar for details</span>
        ) : (
          <span className="muted">Log cravings in check-ins or SOS to see your trend.</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Peak craving per day for the last ${n} days`} className="chart-svg">
        {[0, 5, 10].map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - 4} y1={y(g)} y2={y(g)} className="grid" />
            <text x={padL - 6} y={y(g) + 3} className="axis" textAnchor="end">
              {g}
            </text>
          </g>
        ))}
        {series.map((s, i) => {
          const cx = padL + slot * i + slot / 2;
          const h = s.value === null ? 0 : Math.max(2, (s.value / 10) * plotH);
          const r = Math.min(4, barW / 2, h / 2);
          const top = padT + plotH - h;
          const x0 = cx - barW / 2;
          // Rounded data-end on top only, square at the baseline.
          const d =
            s.value === null
              ? ''
              : `M${x0},${padT + plotH} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${padT + plotH} Z`;
          return (
            <g key={s.date}>
              {d && <path d={d} className={`bar-mark${active === i ? ' bar-active' : ''}`} />}
              <rect
                x={padL + slot * i}
                y={padT}
                width={slot}
                height={plotH + padB}
                className="hit"
                onClick={() => setActive(active === i ? null : i)}
                onMouseEnter={() => setActive(i)}
              />
            </g>
          );
        })}
        <text x={padL} y={H - 4} className="axis">
          {formatDay(series[0].date, { day: 'numeric', month: 'short' })}
        </text>
        <text x={W - 4} y={H - 4} className="axis" textAnchor="end">
          Today
        </text>
      </svg>
      <table className="sr-only">
        <caption>Peak craving by day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Peak craving (0–10)</th>
          </tr>
        </thead>
        <tbody>
          {logged.map((s) => (
            <tr key={s.date}>
              <td>{formatDay(s.date)}</td>
              <td>{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
