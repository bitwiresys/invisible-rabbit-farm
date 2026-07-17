import { useMemo, useState } from 'react';
import { SIGNAL_PROFILES } from '../model/profiles';
import type { Estimate, FarmEvent } from '../model/types';
import { IconShape } from './Icon';

/**
 * Line-art схема участка (вид сверху): четыре канонические зоны,
 * маркеры-глифы сигналов, «тепловое» свечение по локальной оценке.
 * Клик по зоне — фильтр для баров и списка сигналов.
 */

interface Zone {
  name: string;
  /** Позиция подписи зоны. */
  label: [number, number];
  /** Эллипс теплового свечения. */
  heat: { cx: number; cy: number; rx: number; ry: number };
  /** Слоты для маркеров событий (по кругу, если событий больше). */
  anchors: [number, number][];
}

const ZONES: Zone[] = [
  {
    name: 'Огород',
    label: [48, 200],
    heat: { cx: 178, cy: 285, rx: 150, ry: 90 },
    anchors: [
      [120, 260], [220, 320], [160, 340], [260, 250], [90, 320],
    ],
  },
  {
    name: 'Сарай',
    label: [482, 188],
    heat: { cx: 560, cy: 115, rx: 115, ry: 75 },
    anchors: [
      [520, 130], [590, 150], [550, 108], [612, 115], [505, 155],
    ],
  },
  {
    name: 'Теплица',
    label: [362, 240],
    heat: { cx: 500, cy: 320, rx: 165, ry: 70 },
    anchors: [
      [420, 330], [520, 340], [590, 312], [450, 300], [560, 355],
    ],
  },
  {
    name: 'У забора',
    label: [40, 52],
    heat: { cx: 240, cy: 42, rx: 260, ry: 30 },
    anchors: [
      [140, 60], [320, 56], [80, 150], [646, 250], [200, 384],
    ],
  },
];

const ZONE_NAMES = ZONES.map((z) => z.name);

/** Размер маркера 16–28px по интенсивности. */
function markerSize(intensity: number): number {
  return 16 + ((Math.min(10, Math.max(1, intensity)) - 1) / 9) * 12;
}

interface FarmMapProps {
  result: Estimate;
  events: FarmEvent[];
  filter: string | null;
  onFilter: (location: string | null) => void;
}

export function FarmMap({ result, events, filter, onFilter }: FarmMapProps) {
  // На мобильных по умолчанию режим «Список» — доступный эквивалент схемы.
  const [view, setView] = useState<'map' | 'list'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'list'
      : 'map',
  );
  // Радар-свип рисуется один раз при первой загрузке, дальше карта статична.
  const [sweepDone, setSweepDone] = useState(false);

  const estimateByLocation = useMemo(
    () => new Map(result.locations.map((l) => [l.location, l])),
    [result],
  );
  const maxEstimate = result.locations[0]?.estimate ?? 0;

  const enabledEvents = events.filter((e) => e.enabled);
  const offSchemaCount = enabledEvents.filter((e) => !ZONE_NAMES.includes(e.location.trim())).length;

  // Все зоны для списка: канонические + любые локации из данных, по убыванию оценки.
  const listRows = useMemo(() => {
    const names = new Set([...ZONE_NAMES, ...result.locations.map((l) => l.location)]);
    return [...names]
      .map((name) => ({
        name,
        estimate: estimateByLocation.get(name)?.estimate ?? 0,
        eventCount: estimateByLocation.get(name)?.eventCount ?? 0,
      }))
      .sort((a, b) => b.estimate - a.estimate);
  }, [estimateByLocation, result]);

  const toggleFilter = (name: string) => onFilter(filter === name ? null : name);

  const zoneClass = (name: string): string => {
    const classes = ['zone'];
    if (filter === name) classes.push('zone--active');
    if (filter !== null && filter !== name) classes.push('zone--dim');
    return classes.join(' ');
  };

  const zoneAria = (name: string): string => {
    const loc = estimateByLocation.get(name);
    return loc
      ? `Зона ${name}: оценка ${loc.estimate.toFixed(1)}, сигналов: ${loc.eventCount}. Нажмите для фильтра`
      : `Зона ${name}: сигналов нет. Нажмите для фильтра`;
  };

  return (
    <section className="card card--map" aria-labelledby="map-title">
      <div className="card__head-row">
        <h2 className="card__title" id="map-title">Карта фермы</h2>
        <div className="segmented" role="group" aria-label="Режим карты">
          <button
            type="button"
            className={view === 'map' ? 'segmented__btn segmented__btn--active' : 'segmented__btn'}
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
          >
            Схема
          </button>
          <button
            type="button"
            className={view === 'list' ? 'segmented__btn segmented__btn--active' : 'segmented__btn'}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            Список
          </button>
        </div>
      </div>

      {view === 'map' ? (
        <div className="map__wrap">
          <svg
            viewBox="0 0 700 420"
            className="map__svg"
            role="img"
            aria-label="Схема фермы с зонами и маркерами сигналов; эквивалент — режим «Список»"
          >
            <defs>
              <pattern id="mm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0v20" fill="none" stroke="var(--ink)" strokeOpacity="0.05" />
              </pattern>
              <radialGradient id="heat-glow">
                <stop offset="0%" stopColor="#b7ff3c" stopOpacity="1" />
                <stop offset="100%" stopColor="#b7ff3c" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Фон-миллиметровка и контур участка */}
            <rect x="12" y="12" width="676" height="396" rx="14" fill="url(#mm-grid)" stroke="var(--line)" />

            {/* Тепло зон: свечение пропорционально локальной оценке */}
            {ZONES.map((zone) => {
              const est = estimateByLocation.get(zone.name)?.estimate ?? 0;
              const opacity = maxEstimate > 0 ? 0.25 * (est / maxEstimate) : 0;
              return opacity > 0 ? (
                <ellipse
                  key={zone.name}
                  cx={zone.heat.cx}
                  cy={zone.heat.cy}
                  rx={zone.heat.rx}
                  ry={zone.heat.ry}
                  fill="url(#heat-glow)"
                  opacity={opacity}
                  className="map__heat"
                />
              ) : null;
            })}

            {/* Зона «У забора»: пунктир периметра */}
            <g
              className={zoneClass('У забора')}
              role="button"
              tabIndex={0}
              aria-label={zoneAria('У забора')}
              onClick={() => toggleFilter('У забора')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleFilter('У забора');
                }
              }}
            >
              <rect
                x="28" y="28" width="644" height="364" rx="12"
                fill="none" strokeDasharray="8 7" className="zone__stroke"
              />
              <rect
                x="28" y="28" width="644" height="364" rx="12"
                fill="none" stroke="transparent" strokeWidth="22" pointerEvents="stroke"
              />
              <text x={ZONES[3].label[0]} y={ZONES[3].label[1]} className="zone__label">
                У ЗАБОРА
              </text>
            </g>

            {/* Огород: грядки-штриховка */}
            <g
              className={zoneClass('Огород')}
              role="button"
              tabIndex={0}
              aria-label={zoneAria('Огород')}
              onClick={() => toggleFilter('Огород')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleFilter('Огород');
                }
              }}
            >
              <rect x="48" y="210" width="260" height="150" rx="10" fill="transparent" className="zone__stroke" />
              {[236, 262, 288, 314, 340].map((y) => (
                <path key={y} d={`M64 ${y}h228`} className="zone__stroke zone__hatch" />
              ))}
              <text x={ZONES[0].label[0]} y={ZONES[0].label[1]} className="zone__label">
                ОГОРОД
              </text>
            </g>

            {/* Сарай: домик */}
            <g
              className={zoneClass('Сарай')}
              role="button"
              tabIndex={0}
              aria-label={zoneAria('Сарай')}
              onClick={() => toggleFilter('Сарай')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleFilter('Сарай');
                }
              }}
            >
              <rect x="484" y="96" width="152" height="72" fill="transparent" className="zone__stroke" />
              <path d="M476 96 560 54l84 42" fill="none" className="zone__stroke" />
              <rect x="548" y="128" width="24" height="40" fill="none" className="zone__stroke" />
              <text x={ZONES[1].label[0]} y={ZONES[1].label[1]} className="zone__label">
                САРАЙ
              </text>
            </g>

            {/* Теплица: арки */}
            <g
              className={zoneClass('Теплица')}
              role="button"
              tabIndex={0}
              aria-label={zoneAria('Теплица')}
              onClick={() => toggleFilter('Теплица')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleFilter('Теплица');
                }
              }}
            >
              <rect x="360" y="290" width="280" height="80" fill="transparent" className="zone__stroke" />
              <path
                d="M360 290a35 35 0 0 1 70 0a35 35 0 0 1 70 0a35 35 0 0 1 70 0a35 35 0 0 1 70 0"
                fill="none"
                className="zone__stroke"
              />
              <text x={ZONES[2].label[0]} y={ZONES[2].label[1]} className="zone__label">
                ТЕПЛИЦА
              </text>
            </g>

            {/* Маркеры сигналов: глиф в кружке, размер = интенсивность */}
            {ZONES.map((zone) => {
              const zoneEvents = enabledEvents.filter((e) => e.location.trim() === zone.name);
              return zoneEvents.map((event, i) => {
                const [x, y] = zone.anchors[i % zone.anchors.length];
                const size = markerSize(event.intensity);
                const dimmed = filter !== null && filter !== zone.name;
                return (
                  <g key={event.id} className={dimmed ? 'map-marker map-marker--dim' : 'map-marker'}>
                    {event.intensity >= 7 && (
                      <circle
                        cx={x} cy={y} r={size / 2 + 8}
                        fill="none" stroke="var(--accent)" className="map-marker__halo"
                      />
                    )}
                    <circle
                      cx={x} cy={y} r={size / 2 + 5}
                      fill="var(--panel)" stroke="var(--line-strong)"
                    />
                    <svg
                      x={x - size / 2} y={y - size / 2} width={size} height={size}
                      viewBox="0 0 24 24" fill="none" stroke="var(--ink)"
                      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                    >
                      <IconShape id={SIGNAL_PROFILES[event.event].icon} />
                    </svg>
                    <title>
                      {`${SIGNAL_PROFILES[event.event].label} · ${event.location} · ${event.time}`}
                    </title>
                  </g>
                );
              });
            })}
          </svg>

          {!sweepDone && (
            <div className="map__sweep" onAnimationEnd={() => setSweepDone(true)} aria-hidden="true" />
          )}
        </div>
      ) : (
        <ul className="map-list">
          {listRows.map((row) => (
            <li key={row.name}>
              <button
                type="button"
                className={filter === row.name ? 'map-list__row map-list__row--active' : 'map-list__row'}
                onClick={() => toggleFilter(row.name)}
                aria-pressed={filter === row.name}
              >
                <span className="map-list__name">{row.name}</span>
                <span className="map-list__count muted">
                  {row.eventCount > 0 ? `${row.eventCount} сигн.` : 'тихо'}
                </span>
                <span className="map-list__track" aria-hidden="true">
                  <span
                    className="map-list__fill"
                    style={{ width: maxEstimate > 0 ? `${(row.estimate / maxEstimate) * 100}%` : '0%' }}
                  />
                </span>
                <span className="map-list__value mono">≈{row.estimate.toFixed(1)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="map__footer">
        {filter && (
          <button type="button" className="pill pill--accent map__filter-chip" onClick={() => onFilter(null)}>
            Фильтр: {filter} ✕
          </button>
        )}
        {view === 'map' && offSchemaCount > 0 && (
          <span className="muted map__note">
            {offSchemaCount} сигн. вне схемы — см. «Список»
          </span>
        )}
      </div>
    </section>
  );
}
