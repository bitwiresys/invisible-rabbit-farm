import { confidenceLabel, confidencePercent } from '../model/engine';
import { WEAK_RELIABILITY_THRESHOLD } from '../model/profiles';
import type { ConfidenceFactors, Estimate } from '../model/types';
import { useCountUp } from '../hooks/useCountUp';
import { useFlash } from '../hooks/useFlash';
import { Icon } from './Icon';

/** Длина дуги полукольца радиусом 50 (π × r) — для stroke-dasharray. */
const ARC_LENGTH = Math.PI * 50;

const FACTOR_META: { key: keyof ConfidenceFactors; label: string; tip: string }[] = [
  {
    key: 'reliability',
    label: 'Надёжность сигналов',
    tip: 'Средняя надёжность типов сигналов, взвешенная по их вкладу. Вес в уверенности — 35%.',
  },
  {
    key: 'diversity',
    label: 'Разнообразие',
    tip: 'Сколько разных типов сигналов из 5 задействовано. Разные источники подтверждают друг друга. Вес — 25%.',
  },
  {
    key: 'freshness',
    label: 'Свежесть',
    tip: 'Средний коэффициент затухания: свежие наблюдения весят больше устаревших. Вес — 20%.',
  },
  {
    key: 'corroboration',
    label: 'Подтверждённость',
    tip: 'Доля зон, где сигналов два и больше — одиночный сигнал легко оказывается ложным. Вес — 20%.',
  },
];

/** Подсказка «Оценку усилит: …» — мостик от проседающего фактора к действию. */
function improvementHint(result: Estimate): string | null {
  if (result.enabledCount === 0) return null;

  const { factors, locations } = result;
  const weakest = FACTOR_META.reduce((min, meta) =>
    factors[meta.key] < factors[min.key] ? meta : min,
  );
  if (factors[weakest.key] >= 0.5) return null;

  switch (weakest.key) {
    case 'reliability': {
      const weakLocation =
        locations.find((l) =>
          l.contributions.every((c) => c.reliability < WEAK_RELIABILITY_THRESHOLD),
        ) ?? locations[0];
      return weakLocation ? `датчик движения — ${weakLocation.location}` : null;
    }
    case 'diversity':
      return 'сигнал нового типа';
    case 'freshness':
      return 'свежее наблюдение';
    case 'corroboration': {
      const lonely = locations.find((l) => l.eventCount === 1);
      return lonely ? `второй сигнал — ${lonely.location}` : 'повторный сигнал в той же зоне';
    }
  }
}

interface ConfidenceCardProps {
  result: Estimate;
  onShowHow: () => void;
}

/** Gauge уверенности (округление до 5%) + 4 фактора + кнопка «Как посчитано». */
export function ConfidenceCard({ result, onShowHow }: ConfidenceCardProps) {
  const percent = confidencePercent(result.confidence);
  const animated = Math.round(useCountUp(percent));
  const flashing = useFlash(percent);
  const hint = improvementHint(result);

  return (
    <section className="card card--confidence" aria-labelledby="confidence-title">
      <h2 className="card__title" id="confidence-title">Уверенность</h2>

      <div className="gauge">
        <svg viewBox="0 0 120 64" className="gauge__svg" aria-hidden="true">
          <path
            d="M10 58a50 50 0 0 1 100 0"
            fill="none" stroke="var(--panel-2)" strokeWidth="9" strokeLinecap="round"
          />
          <path
            d="M10 58a50 50 0 0 1 100 0"
            fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
            className="gauge__progress"
          />
        </svg>
        <div className="gauge__center" aria-live="polite">
          <span className={flashing ? 'gauge__value flash' : 'gauge__value'}>{animated}%</span>
          <span className="gauge__word">{confidenceLabel(result.confidence)}</span>
        </div>
      </div>

      <ul className="factors">
        {FACTOR_META.map((meta) => {
          const value = result.factors[meta.key];
          return (
            <li key={meta.key} className="factors__row tip" data-tip={meta.tip} tabIndex={0}>
              <span className="factors__label">{meta.label}</span>
              <span className="factors__track">
                <span className="factors__fill" style={{ width: `${Math.round(value * 100)}%` }} />
              </span>
              <span className="factors__value mono">{Math.round(value * 100)}%</span>
            </li>
          );
        })}
      </ul>

      {hint && (
        <p className="confidence__hint">
          Оценку усилит: <span>{hint}</span>
        </p>
      )}

      <button type="button" className="btn btn--ghost confidence__how" onClick={onShowHow}>
        Как посчитано
        <Icon id="chevron" size={14} />
      </button>
    </section>
  );
}
