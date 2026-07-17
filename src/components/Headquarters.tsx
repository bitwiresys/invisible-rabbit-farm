import { useState } from 'react';
import { EVENT_TYPES, SIGNAL_PROFILES } from '../model/profiles';
import { defaultParams } from '../model/presets';
import type { EventType, ModelParams } from '../model/types';
import { Icon } from './Icon';

interface HeadquartersProps {
  params: ModelParams;
  onChange: (params: ModelParams) => void;
}

/**
 * «Штаб»: сворачиваемые параметры модели с человеческими подписями.
 * Текущие значения видны пилюлями даже в свёрнутом виде.
 */
export function Headquarters({ params, onChange }: HeadquartersProps) {
  const [open, setOpen] = useState(false);

  const setHalfLife = (halfLifeHours: number) => onChange({ ...params, halfLifeHours });

  // Пороги не могут пересекаться: «спокойно» всегда ниже «нашествия».
  const setCalm = (calm: number) =>
    onChange({ ...params, thresholds: { ...params.thresholds, calm: Math.min(calm, params.thresholds.invasion) } });
  const setInvasion = (invasion: number) =>
    onChange({ ...params, thresholds: { ...params.thresholds, invasion: Math.max(invasion, params.thresholds.calm) } });

  const setReliability = (type: EventType, value: number) =>
    onChange({ ...params, reliability: { ...params.reliability, [type]: value } });

  return (
    <section className="card card--hq" aria-labelledby="hq-title">
      <div className="hq__head">
        <button
          type="button"
          className="card__collapse-head"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <h2 className="card__title" id="hq-title">Штаб · параметры модели</h2>
          <Icon id="chevron" size={16} className={open ? 'chevron chevron--open' : 'chevron'} />
        </button>
        <div className="hq__pills">
          <span className="pill">полураспад {params.halfLifeHours} ч</span>
          <span className="pill">
            пороги {params.thresholds.calm} / {params.thresholds.invasion}
          </span>
        </div>
      </div>

      {open && (
        <div className="hq__body">
          <div className="hq__grid">
            <div className="hq-param">
              <p className="hq-param__label">Период полураспада сигнала</p>
              <p className="hq-param__hint">как быстро наблюдения устаревают</p>
              <div className="hq-param__control">
                <input
                  className="slider"
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={params.halfLifeHours}
                  onChange={(e) => setHalfLife(Number(e.target.value))}
                  aria-label="Период полураспада сигнала в часах"
                />
                <span className="mono hq-param__value">{params.halfLifeHours} ч</span>
              </div>
            </div>

            <div className="hq-param">
              <p className="hq-param__label">Порог «Повышенная активность»</p>
              <p className="hq-param__hint">ниже — на ферме спокойно</p>
              <div className="hq-param__control">
                <input
                  className="slider"
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={params.thresholds.calm}
                  onChange={(e) => setCalm(Number(e.target.value))}
                  aria-label="Порог повышенной активности"
                />
                <span className="mono hq-param__value">{params.thresholds.calm}</span>
              </div>
            </div>

            <div className="hq-param">
              <p className="hq-param__label">Порог «Нашествие»</p>
              <p className="hq-param__hint">выше — пора действовать</p>
              <div className="hq-param__control">
                <input
                  className="slider"
                  type="range"
                  min={2}
                  max={15}
                  step={0.5}
                  value={params.thresholds.invasion}
                  onChange={(e) => setInvasion(Number(e.target.value))}
                  aria-label="Порог нашествия"
                />
                <span className="mono hq-param__value">{params.thresholds.invasion}</span>
              </div>
            </div>
          </div>

          <details className="hq__advanced">
            <summary>Продвинутые: надёжность типов сигналов</summary>
            <div className="hq__grid">
              {EVENT_TYPES.map((type) => (
                <div key={type} className="hq-param">
                  <p className="hq-param__label hq-param__label--type">
                    <Icon id={SIGNAL_PROFILES[type].icon} size={14} />
                    {SIGNAL_PROFILES[type].label}
                  </p>
                  <div className="hq-param__control">
                    <input
                      className="slider"
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={params.reliability[type]}
                      onChange={(e) => setReliability(type, Number(e.target.value))}
                      aria-label={`Надёжность: ${SIGNAL_PROFILES[type].label}`}
                    />
                    <span className="mono hq-param__value">{params.reliability[type].toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <button type="button" className="btn hq__reset" onClick={() => onChange(defaultParams())}>
            <Icon id="reset" size={14} />
            Сбросить параметры
          </button>
        </div>
      )}
    </section>
  );
}
