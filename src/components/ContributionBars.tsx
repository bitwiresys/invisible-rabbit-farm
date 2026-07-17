import { useState } from 'react';
import { pluralRu } from '../model/engine';
import { SIGNAL_PROFILES } from '../model/profiles';
import type { Estimate, FarmEvent } from '../model/types';
import { Icon } from './Icon';

/** Сколько баров показывается сразу; хвост схлопывается. */
const TOP_COUNT = 7;

interface ContributionBarsProps {
  result: Estimate;
  events: FarmEvent[];
  filter: string | null;
}

/**
 * Ranked bars «Вклад сигналов»: один тон акцента, топ-7 + схлопнутый хвост,
 * tooltip с разложением формулы contribution — ключевая фича объяснимости.
 */
export function ContributionBars({ result, events, filter }: ContributionBarsProps) {
  const [expanded, setExpanded] = useState(false);

  const contribs = filter
    ? result.contributions.filter((c) => c.event.location === filter)
    : result.contributions;
  const disabledEvents = events.filter(
    (e) => !e.enabled && (!filter || e.location === filter),
  );

  const maxContribution = contribs[0]?.contribution ?? 0;
  const shown = expanded ? contribs : contribs.slice(0, TOP_COUNT);
  const tail = contribs.length - TOP_COUNT;

  return (
    <section className="card card--bars" aria-labelledby="bars-title">
      <div className="card__head-row">
        <h2 className="card__title" id="bars-title">Вклад сигналов</h2>
        {filter && <span className="pill">Фильтр: {filter}</span>}
      </div>

      {contribs.length === 0 && disabledEvents.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">Вкладов нет.</p>
          <p className="empty-state__hint">Ни один сигнал не участвует в расчёте.</p>
        </div>
      ) : (
        <ul className="bars">
          {shown.map((c) => {
            const profile = SIGNAL_PROFILES[c.event.event];
            const width = maxContribution > 0 ? (c.contribution / maxContribution) * 100 : 0;
            return (
              <li key={c.event.id} className="bar-row" tabIndex={0}>
                <span className="bar-row__label">
                  <Icon id={profile.icon} size={14} />
                  <span className="bar-row__text">
                    {profile.label} · {c.event.location} · <span className="mono">{c.event.time}</span>
                  </span>
                </span>
                <span className="bar-row__value mono">{c.contribution.toFixed(2)}</span>
                <span className="bar-row__track">
                  <span className="bar-row__fill" style={{ width: `${width}%` }} />
                </span>
                <span className="bar-row__tip mono" role="tooltip">
                  {c.event.count} × {c.rabbitsPerUnit.toFixed(1)} (кроликов/ед.) ×{' '}
                  {c.reliability.toFixed(2)} (надёжность) × {c.intensityFactor.toFixed(2)}{' '}
                  (интенсивность) × {c.decay.toFixed(2)} (свежесть) = {c.contribution.toFixed(2)}
                </span>
              </li>
            );
          })}

          {!expanded && tail > 0 && (
            <li>
              <button type="button" className="btn btn--ghost bars__tail" onClick={() => setExpanded(true)}>
                + {tail} {pluralRu(tail, ['слабый сигнал', 'слабых сигнала', 'слабых сигналов'])}
              </button>
            </li>
          )}

          {disabledEvents.map((event) => {
            const profile = SIGNAL_PROFILES[event.event];
            return (
              <li key={event.id} className="bar-row bar-row--off">
                <span className="bar-row__label">
                  <Icon id={profile.icon} size={14} />
                  <span className="bar-row__text bar-row__text--struck">
                    {profile.label} · {event.location} · <span className="mono">{event.time}</span>
                  </span>
                </span>
                <span className="bar-row__value mono muted">выкл</span>
                <span className="bar-row__track bar-row__track--off" />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
