import { confidencePercent, pluralRu } from '../model/engine';
import type { Estimate } from '../model/types';
import { useCountUp } from '../hooks/useCountUp';
import { useFlash } from '../hooks/useFlash';
import { RabbitIcon } from './RabbitIcon';

/** Максимум силуэтов в ряду; дальше — подпись «×N». */
const MAX_SILHOUETTES = 8;

interface HeroPopulationProps {
  result: Estimate;
  /** Пасхалка: на секунду «показать» одного из возможных кроликов. */
  spotted?: boolean;
}

/**
 * Hero «Поголовье»: диапазон [min…max] и призрачные кролики.
 * Залитые силуэты — подтверждённый минимум, контурные — возможные сверх него.
 */
export function HeroPopulation({ result, spotted = false }: HeroPopulationProps) {
  const low = Math.round(useCountUp(result.low));
  const high = Math.round(useCountUp(result.high));
  const rangeKey = `${result.low}-${result.high}`;
  const flashing = useFlash(rangeKey);
  const isEmpty = result.enabledCount === 0;

  const solidCount = Math.min(result.low, MAX_SILHOUETTES);
  const ghostCount = Math.min(result.high, MAX_SILHOUETTES) - solidCount;
  // Пасхалка срабатывает, только если есть кого «показывать».
  const showSpotted = spotted && ghostCount > 0;

  return (
    <section className="card card--population" aria-labelledby="population-title">
      <h2 className="card__title" id="population-title">Поголовье</h2>

      {isEmpty ? (
        <div className="empty-state">
          <svg width="88" height="52" viewBox="0 0 88 52" aria-hidden="true" className="empty-state__pen">
            <rect
              x="4" y="10" width="80" height="36" rx="9"
              fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="6 5"
            />
            <path d="M36 46h16" stroke="var(--bg-0)" strokeWidth="4" />
            <path d="M36 41v7M52 41v7" stroke="var(--muted)" strokeWidth="1.5" />
          </svg>
          <p className="empty-state__title">Кроликов не обнаружено.</p>
          <p className="empty-state__hint">Либо их нет, либо они очень хороши.</p>
        </div>
      ) : (
        <>
          <p className="hero__value" aria-live="polite">
            <span className={flashing ? 'hero__range flash' : 'hero__range'}>
              {low}–{high}
            </span>
          </p>
          <p className="hero__caption">
            {pluralRu(high, ['кролик', 'кролика', 'кроликов'])} на ферме · уверенность{' '}
            {confidencePercent(result.confidence)}%
          </p>
          <div className="hero__rabbits" key={rangeKey} aria-hidden="true">
            {Array.from({ length: solidCount + ghostCount }, (_, i) => {
              const isSpottedOne = showSpotted && i === solidCount;
              return (
                <span
                  key={i}
                  className={isSpottedOne ? 'hero__rabbit hero__rabbit--spotted' : 'hero__rabbit'}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <RabbitIcon variant={i < solidCount || isSpottedOne ? 'solid' : 'ghost'} />
                </span>
              );
            })}
            {result.high > MAX_SILHOUETTES && <span className="pill hero__more">×{result.high}</span>}
          </div>
          <p className="hero__legend muted">
            {showSpotted
              ? 'вы это видели?! …и снова невидим'
              : 'заливка — подтверждённые · контур — возможные'}
          </p>
        </>
      )}
    </section>
  );
}
