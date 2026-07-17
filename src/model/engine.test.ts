import { describe, expect, it } from 'vitest';
import {
  confidencePercent,
  contributions,
  decayFactor,
  estimate,
  intensityFactor,
  opsSummary,
  recommend,
  threatLevel,
} from './engine';
import { clonePresetEvents, defaultParams, INVASION_EVENTS, START_EVENTS } from './presets';
import type { FarmEvent } from './types';

/** Проверяет, что во всех числовых полях результата нет NaN/Infinity. */
function expectFinite(result: ReturnType<typeof estimate>): void {
  const numbers = [
    result.total,
    result.central,
    result.low,
    result.high,
    result.confidence,
    ...Object.values(result.factors),
    ...result.locations.map((l) => l.estimate),
    ...result.contributions.map((c) => c.contribution),
  ];
  for (const n of numbers) {
    expect(Number.isFinite(n)).toBe(true);
  }
}

describe('estimate: sanity', () => {
  it('стартовые данные дают разумную оценку ~4–7 кроликов', () => {
    const result = estimate(START_EVENTS, defaultParams());
    expect(result.central).toBeGreaterThanOrEqual(4);
    expect(result.central).toBeLessThanOrEqual(7);
    expect(result.low).toBeLessThanOrEqual(result.central);
    expect(result.high).toBeGreaterThanOrEqual(result.central);
    expectFinite(result);
  });

  it('0 событий → оценка 0 и уверенность 0%', () => {
    const result = estimate([], defaultParams());
    expect(result.total).toBe(0);
    expect(result.central).toBe(0);
    expect(result.low).toBe(0);
    expect(result.high).toBe(0);
    expect(result.confidence).toBe(0);
    expect(confidencePercent(result.confidence)).toBe(0);
    expectFinite(result);
  });

  it('все события выключены → как при 0 событий, без NaN', () => {
    const events = clonePresetEvents(START_EVENTS).map((e) => ({ ...e, enabled: false }));
    const result = estimate(events, defaultParams());
    expect(result.central).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.enabledCount).toBe(0);
    expectFinite(result);
  });

  it('отключение самого надёжного сигнала (датчик) снижает уверенность', () => {
    const params = defaultParams();
    const full = estimate(START_EVENTS, params);
    const withoutSensor = clonePresetEvents(START_EVENTS).map((e) =>
      e.event === 'motion_sensor' ? { ...e, enabled: false } : e,
    );
    const reduced = estimate(withoutSensor, params);
    expect(reduced.confidence).toBeLessThan(full.confidence);
  });
});

describe('estimate: крайние случаи', () => {
  it('экстремумы слайдеров (intensity 1 и 10, halfLife 1 и 24) не ломают расчёт', () => {
    const extremes: FarmEvent[] = [
      { id: 'x1', event: 'motion_sensor', location: 'Сарай', count: 99, intensity: 10, time: '23:59', enabled: true },
      { id: 'x2', event: 'missing_carrot', location: 'Огород', count: 1, intensity: 1, time: '00:00', enabled: true },
    ];
    for (const halfLifeHours of [1, 24]) {
      const result = estimate(extremes, { ...defaultParams(), halfLifeHours });
      expectFinite(result);
      expect(result.total).toBeGreaterThan(0);
    }
  });

  it('20+ событий обрабатываются без NaN, «Нашествие» даёт высокий уровень угрозы', () => {
    const many: FarmEvent[] = Array.from({ length: 25 }, (_, i) => ({
      id: `bulk_${i}`,
      event: INVASION_EVENTS[i % INVASION_EVENTS.length].event,
      location: ['Огород', 'Сарай', 'Теплица', 'У забора'][i % 4],
      count: (i % 7) + 1,
      intensity: (i % 10) + 1,
      time: `${String(i % 24).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
      enabled: true,
    }));
    const params = defaultParams();
    const result = estimate(many, params);
    expectFinite(result);
    expect(threatLevel(result.central, params.thresholds)).toBe('invasion');
  });

  it('нулевой и отрицательный halfLife не дают деления на ноль', () => {
    expect(decayFactor(3, 0)).toBe(0);
    expect(decayFactor(3, -1)).toBe(0);
  });
});

describe('формулы', () => {
  it('intensityFactor: интенсивность 5 → ×1.0', () => {
    expect(intensityFactor(5)).toBeCloseTo(1.0);
  });

  it('decay: возраст, равный halfLife, → ×0.5', () => {
    expect(decayFactor(6, 6)).toBeCloseTo(0.5);
  });

  it('contribution = count × rabbitsPerUnit × reliability × intensityFactor × decay', () => {
    const params = defaultParams();
    const [c] = contributions(
      [{ id: 's1', event: 'motion_sensor', location: 'Сарай', count: 2, intensity: 8, time: '10:00', enabled: true }],
      params,
    );
    // Единственное событие — самое свежее, поэтому decay = 1.
    expect(c.contribution).toBeCloseTo(2 * 1.0 * 0.9 * (0.6 + 0.08 * 8) * 1);
  });

  it('confidencePercent округляет до 5%', () => {
    expect(confidencePercent(0.624)).toBe(60);
    expect(confidencePercent(0.63)).toBe(65);
  });
});

describe('рекомендации и сводка', () => {
  it('для стартовых данных есть рекомендации с приоритетом и причиной', () => {
    const result = estimate(START_EVENTS, defaultParams());
    const recs = recommend(result);
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.reason.length).toBeGreaterThan(0);
    }
  });

  it('пустая ферма → сводка без эпицентра и NaN', () => {
    const result = estimate([], defaultParams());
    expect(recommend(result)).toHaveLength(0);
    expect(opsSummary(result, 0)).toContain('0 сигналов');
  });
});
