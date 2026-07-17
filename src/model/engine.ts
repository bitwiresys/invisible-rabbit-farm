import { SIGNAL_PROFILES, WEAK_RELIABILITY_THRESHOLD, EVENT_TYPES } from './profiles';
import type {
  ConfidenceFactors,
  Estimate,
  EventContribution,
  FarmEvent,
  LocationEstimate,
  ModelParams,
  Recommendation,
  ThreatLevel,
  ThreatThresholds,
} from './types';

/**
 * Движок модели. Только чистые функции: (events, params) → результат.
 * Ни одна функция не возвращает NaN/Infinity — пустой ввод даёт нули.
 */

/** Веса факторов уверенности. В сумме дают 1. */
export const CONFIDENCE_WEIGHTS = {
  reliability: 0.35, // качеству сигналов верим больше всего
  diversity: 0.25, // разные типы сигналов подтверждают друг друга
  freshness: 0.2, // свежие данные надёжнее устаревших
  corroboration: 0.2, // несколько сигналов в одной точке — взаимное подтверждение
} as const;

/** "HH:MM" → минуты от полуночи. Некорректная строка считается полуночью. */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** Интенсивность 1..10 → множитель. При интенсивности 5 множитель равен 1. */
export function intensityFactor(intensity: number): number {
  return 0.6 + 0.08 * intensity;
}

/** Затухание по возрасту: через halfLife часов вес сигнала падает вдвое. */
export function decayFactor(ageHours: number, halfLifeHours: number): number {
  if (halfLifeHours <= 0) return 0;
  return Math.pow(0.5, Math.max(0, ageHours) / halfLifeHours);
}

/** «Сейчас» модели — время самого позднего включённого события. */
function latestEventMinutes(events: FarmEvent[]): number {
  return events.reduce((max, e) => Math.max(max, parseTimeToMinutes(e.time)), 0);
}

/**
 * Вклад каждого включённого события в общую оценку:
 * contribution = count × rabbitsPerUnit × reliability × intensityFactor × decay.
 * Возвращает список по убыванию вклада.
 */
export function contributions(events: FarmEvent[], params: ModelParams): EventContribution[] {
  const enabled = events.filter((e) => e.enabled);
  const nowMinutes = latestEventMinutes(enabled);

  return enabled
    .map((event) => {
      const profile = SIGNAL_PROFILES[event.event];
      const reliability = params.reliability[event.event];
      const rabbitsPerUnit = profile.rabbitsPerUnit;
      const ageHours = (nowMinutes - parseTimeToMinutes(event.time)) / 60;
      const iFactor = intensityFactor(event.intensity);
      const decay = decayFactor(ageHours, params.halfLifeHours);
      const contribution = event.count * rabbitsPerUnit * reliability * iFactor * decay;

      return {
        event,
        contribution,
        intensityFactor: iFactor,
        decay,
        ageHours,
        reliability,
        rabbitsPerUnit,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

/**
 * Оценка по локациям: locEstimate = (Σ contributions) / √n.
 * Поправка √n — против двойного счёта: несколько сигналов в одной локации
 * частично описывают одних и тех же кроликов.
 */
export function locationEstimates(contribs: EventContribution[]): LocationEstimate[] {
  const byLocation = new Map<string, EventContribution[]>();
  for (const c of contribs) {
    const key = c.event.location.trim() || 'Без локации';
    const list = byLocation.get(key) ?? [];
    list.push(c);
    byLocation.set(key, list);
  }

  return [...byLocation.entries()]
    .map(([location, list]) => {
      const rawSum = list.reduce((sum, c) => sum + c.contribution, 0);
      return {
        location,
        rawSum,
        eventCount: list.length,
        estimate: rawSum / Math.sqrt(list.length),
        contributions: list,
      };
    })
    .sort((a, b) => b.estimate - a.estimate);
}

/**
 * Уверенность системы — взвешенная сумма четырёх факторов (веса — CONFIDENCE_WEIGHTS):
 * надёжность сигналов, разнообразие типов, свежесть, подтверждённость локаций.
 */
export function confidenceFactors(
  contribs: EventContribution[],
  locations: LocationEstimate[],
): ConfidenceFactors {
  if (contribs.length === 0) {
    return { reliability: 0, diversity: 0, freshness: 0, corroboration: 0 };
  }

  const totalContribution = contribs.reduce((sum, c) => sum + c.contribution, 0);
  // Средняя надёжность, взвешенная по вкладу: чем больше сигнал влияет, тем важнее его качество.
  const reliability =
    totalContribution > 0
      ? contribs.reduce((sum, c) => sum + c.reliability * c.contribution, 0) / totalContribution
      : 0;

  const uniqueTypes = new Set(contribs.map((c) => c.event.event)).size;
  const diversity = uniqueTypes / EVENT_TYPES.length;

  const freshness = contribs.reduce((sum, c) => sum + c.decay, 0) / contribs.length;

  const corroborated = locations.filter((l) => l.eventCount >= 2).length;
  const corroboration = locations.length > 0 ? corroborated / locations.length : 0;

  return { reliability, diversity, freshness, corroboration };
}

/** Сводит факторы в одно число 0..1. */
export function confidence(factors: ConfidenceFactors): number {
  return (
    CONFIDENCE_WEIGHTS.reliability * factors.reliability +
    CONFIDENCE_WEIGHTS.diversity * factors.diversity +
    CONFIDENCE_WEIGHTS.freshness * factors.freshness +
    CONFIDENCE_WEIGHTS.corroboration * factors.corroboration
  );
}

/**
 * Полный расчёт: события + параметры → оценка, диапазон, уверенность, разложение.
 * 0 включённых событий → все нули, без NaN.
 */
export function estimate(events: FarmEvent[], params: ModelParams): Estimate {
  const contribs = contributions(events, params);
  const locations = locationEstimates(contribs);
  const factors = confidenceFactors(contribs, locations);
  const conf = confidence(factors);

  const total = locations.reduce((sum, l) => sum + l.estimate, 0);
  const central = Math.round(total);
  // Диапазон честности: чем ниже уверенность, тем шире вилка вокруг total.
  const low = Math.min(central, Math.round(total * conf));
  const high = Math.max(central, Math.round(total * (2 - conf)));

  return {
    total,
    central,
    low,
    high,
    confidence: conf,
    factors,
    locations,
    contributions: contribs,
    enabledCount: contribs.length,
  };
}

/** Проценты уверенности округляются до 5: ложная точность разрушает доверие (62.4% → 60%). */
export function confidencePercent(conf: number): number {
  return Math.round((conf * 100) / 5) * 5;
}

/** Словесный уровень уверенности для gauge: низкая / средняя / высокая. */
export function confidenceLabel(conf: number): string {
  if (conf < 0.4) return 'низкая';
  if (conf < 0.7) return 'средняя';
  return 'высокая';
}

/** Уровень угрозы по центру диапазона. Пороги — параметры модели. */
export function threatLevel(central: number, thresholds: ThreatThresholds): ThreatLevel {
  if (central < thresholds.calm) return 'calm';
  if (central > thresholds.invasion) return 'invasion';
  return 'activity';
}

/** Русские формы: pluralRu(3, ['сигнал', 'сигнала', 'сигналов']) → «сигнала». */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n));
  const d10 = abs % 10;
  const d100 = abs % 100;
  if (d10 === 1 && d100 !== 11) return forms[0];
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return forms[1];
  return forms[2];
}

/**
 * Оперативная сводка одной строкой:
 * «За смену: 5 сигналов в 4 зонах. Эпицентр — Сарай. Рекомендованных действий: 3.»
 */
export function opsSummary(result: Estimate, recommendationCount: number): string {
  if (result.enabledCount === 0) {
    return 'За смену: 0 сигналов. Наблюдение продолжается.';
  }
  const n = result.enabledCount;
  const z = result.locations.length;
  const signals = `${n} ${pluralRu(n, ['сигнал', 'сигнала', 'сигналов'])}`;
  const zones = `${z} ${pluralRu(z, ['зоне', 'зонах', 'зонах'])}`;
  const epicenter = result.locations[0]?.location ?? '—';
  return `За смену: ${signals} в ${zones}. Эпицентр — ${epicenter}. Рекомендованных действий: ${recommendationCount}.`;
}

/**
 * Rule-based рекомендации. У каждой — приоритет и причина,
 * чтобы фермер видел не только «что делать», но и «почему».
 */
export function recommend(result: Estimate): Recommendation[] {
  const recs: Recommendation[] = [];
  const { locations, contributions: contribs, confidence: conf } = result;

  // 1. Самая «населённая» локация — туда в первую очередь смотреть.
  const top = locations[0];
  if (top && top.estimate > 0) {
    recs.push({
      id: 'watch-top-location',
      icon: 'eye',
      priority: 'high',
      title: `Установите наблюдение: ${top.location}`,
      reason: `Максимальная оценка по ферме — ≈${top.estimate.toFixed(1)} кролика по ${top.eventCount} ${pluralRu(top.eventCount, ['сигналу', 'сигналам', 'сигналам'])}.`,
    });
  }

  // 2. Локация, где есть только слабые сигналы, — нужен надёжный источник данных.
  const weakOnly = locations.find(
    (l) => l.contributions.every((c) => c.reliability < WEAK_RELIABILITY_THRESHOLD),
  );
  if (weakOnly) {
    recs.push({
      id: 'add-sensor',
      icon: 'sensor',
      priority: 'medium',
      title: `Поставьте датчик движения: ${weakOnly.location}`,
      reason: `Все сигналы в локации — с надёжностью ниже ${WEAK_RELIABILITY_THRESHOLD}; нужен надёжный источник для подтверждения.`,
    });
  }

  // 3. Ямки — признак подкопа: проверить забор там, где они появились.
  const holeLocations = [
    ...new Set(
      contribs.filter((c) => c.event.event === 'new_hole').map((c) => c.event.location),
    ),
  ];
  if (holeLocations.length > 0) {
    recs.push({
      id: 'check-fence',
      icon: 'fence',
      priority: 'medium',
      title: `Проверьте целостность забора: ${holeLocations.join(', ')}`,
      reason: 'Новые ямки — типичный признак подкопа под ограждение.',
    });
  }

  // 4. Морковь пропадает массово (≥5 штук) — проще спрятать, чем охранять.
  const missingCarrots = contribs
    .filter((c) => c.event.event === 'missing_carrot')
    .reduce((sum, c) => sum + c.event.count, 0);
  if (missingCarrots >= 5) {
    recs.push({
      id: 'protect-carrots',
      icon: 'storage',
      priority: 'low',
      title: 'Перенесите морковь в защищённое хранилище',
      reason: `Пропало уже ${missingCarrots} морковок — приманка работает против вас.`,
    });
  }

  // 5. Низкая уверенность — сначала собрать данные, потом действовать.
  if (result.enabledCount > 0 && conf < 0.5) {
    recs.push({
      id: 'need-more-data',
      icon: 'chart',
      priority: 'high',
      title: 'Данных мало — добавьте наблюдений',
      reason: `Уверенность ${confidencePercent(conf)}% — ниже порога 50%. Любые выводы пока предварительные.`,
    });
  }

  const order: Record<Recommendation['priority'], number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}
