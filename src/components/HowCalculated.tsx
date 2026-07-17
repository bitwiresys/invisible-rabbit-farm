import { CONFIDENCE_WEIGHTS, confidencePercent } from '../model/engine';
import { EVENT_TYPES, SIGNAL_PROFILES } from '../model/profiles';
import type { Estimate, ModelParams } from '../model/types';
import { Icon } from './Icon';

interface HowCalculatedProps {
  open: boolean;
  onToggle: () => void;
  result: Estimate;
  params: ModelParams;
}

/**
 * Раскрывающаяся панель «Как это посчитано»: формулы модели
 * с подстановкой текущих чисел — процент никогда не показывается без «почему».
 */
export function HowCalculated({ open, onToggle, result, params }: HowCalculatedProps) {
  const top = result.contributions[0];
  const f = result.factors;

  return (
    <section className="card card--how" id="how-calculated" aria-labelledby="how-title">
      <button
        type="button"
        className="card__collapse-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <h2 className="card__title" id="how-title">Как это посчитано</h2>
        <Icon id="chevron" size={16} className={open ? 'chevron chevron--open' : 'chevron'} />
      </button>

      {open && (
        <div className="how__body">
          <div className="how__block">
            <h3 className="how__subtitle">1 · Вклад события</h3>
            <p className="formula mono">
              contribution = count × rabbitsPerUnit × reliability × intensityFactor × decay
            </p>
            <p className="how__note">
              intensityFactor = 0.6 + 0.08 × intensity (интенсивность 5 → ×1.0) ·
              decay = 0.5^(возраст / halfLife), halfLife = {params.halfLifeHours} ч,
              «сейчас» — время последнего события.
            </p>
            {top ? (
              <p className="formula mono">
                {SIGNAL_PROFILES[top.event.event].label} · {top.event.location}:{' '}
                {top.event.count} × {top.rabbitsPerUnit.toFixed(1)} × {top.reliability.toFixed(2)} ×{' '}
                {top.intensityFactor.toFixed(2)} × {top.decay.toFixed(2)} ={' '}
                {top.contribution.toFixed(2)}
              </p>
            ) : (
              <p className="how__note">Сейчас включённых событий нет — все вклады нулевые.</p>
            )}
          </div>

          <div className="how__block">
            <h3 className="how__subtitle">2 · Оценка по зоне</h3>
            <p className="formula mono">locEstimate = Σ contributions / √(число событий в зоне)</p>
            <p className="how__note">
              Поправка √n — против двойного счёта: сигналы в одной зоне частично описывают одних и
              тех же кроликов.
            </p>
            {result.locations.map((loc) => (
              <p key={loc.location} className="formula mono">
                {loc.location}: {loc.rawSum.toFixed(2)} / √{loc.eventCount} ={' '}
                {loc.estimate.toFixed(2)}
              </p>
            ))}
          </div>

          <div className="how__block">
            <h3 className="how__subtitle">3 · Итог и диапазон</h3>
            <p className="formula mono">
              total = Σ locEstimate = {result.total.toFixed(2)} → центр {result.central}
            </p>
            <p className="formula mono">
              диапазон = [total × conf … total × (2 − conf)] = [{result.low} … {result.high}]
            </p>
          </div>

          <div className="how__block">
            <h3 className="how__subtitle">4 · Уверенность</h3>
            <p className="formula mono">
              conf = {CONFIDENCE_WEIGHTS.reliability} × {f.reliability.toFixed(2)} (надёжность) +{' '}
              {CONFIDENCE_WEIGHTS.diversity} × {f.diversity.toFixed(2)} (разнообразие) +{' '}
              {CONFIDENCE_WEIGHTS.freshness} × {f.freshness.toFixed(2)} (свежесть) +{' '}
              {CONFIDENCE_WEIGHTS.corroboration} × {f.corroboration.toFixed(2)} (подтверждённость) ={' '}
              {result.confidence.toFixed(2)}
            </p>
            <p className="how__note">
              Отображается с округлением до 5%: {(result.confidence * 100).toFixed(1)}% →{' '}
              {confidencePercent(result.confidence)}%.
            </p>
          </div>

          <div className="how__block">
            <h3 className="how__subtitle">5 · Коэффициенты типов сигналов</h3>
            <div className="how__table-wrap">
              <table className="how__table">
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Надёжность</th>
                    <th>Кроликов/ед.</th>
                    <th>Почему</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENT_TYPES.map((type) => {
                    const profile = SIGNAL_PROFILES[type];
                    return (
                      <tr key={type}>
                        <td>
                          <span className="how__type">
                            <Icon id={profile.icon} size={14} /> {profile.label}
                          </span>
                        </td>
                        <td className="mono">{params.reliability[type].toFixed(2)}</td>
                        <td className="mono">{profile.rabbitsPerUnit.toFixed(1)}</td>
                        <td className="muted">{profile.rationale}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
