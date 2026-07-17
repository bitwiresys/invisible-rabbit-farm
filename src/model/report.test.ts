import { describe, expect, it } from 'vitest';
import { estimate, recommend, threatLevel } from './engine';
import { START_EVENTS, clonePresetEvents, defaultParams } from './presets';
import { buildFacts, buildTemplateReport } from './report';

function factsFromStart() {
  const params = defaultParams();
  const result = estimate(clonePresetEvents(START_EVENTS), params);
  const threat = threatLevel(result.central, params.thresholds);
  return buildFacts(result, threat, recommend(result));
}

describe('buildFacts', () => {
  it('собирает факты из стартовых данных', () => {
    const f = factsFromStart();
    expect(f.enabledCount).toBe(5);
    expect(f.zoneCount).toBeGreaterThan(0);
    expect(f.range).toMatch(/^\d+(–\d+)?$/);
    expect(f.confidencePct).toBeGreaterThan(0);
    expect(f.epicenter).toBeTruthy();
    expect(f.topSignals.length).toBeGreaterThan(0);
  });

  it('пустые данные дают нулевые факты', () => {
    const params = defaultParams();
    const result = estimate([], params);
    const f = buildFacts(result, threatLevel(result.central, params.thresholds), []);
    expect(f.enabledCount).toBe(0);
    expect(f.epicenter).toBeNull();
    expect(f.topSignals).toHaveLength(0);
  });
});

describe('buildTemplateReport', () => {
  it('пустая смена — спокойный отчёт', () => {
    const params = defaultParams();
    const result = estimate([], params);
    const f = buildFacts(result, threatLevel(result.central, params.thresholds), []);
    const text = buildTemplateReport(f);
    expect(text).toContain('Сигналов за смену не поступало');
    expect(text).toContain('Подпись');
  });

  it('обычная смена — отчёт с цифрами и эпицентром', () => {
    const f = factsFromStart();
    const text = buildTemplateReport(f);
    expect(text).toContain(f.range);
    expect(text).toContain(String(f.confidencePct));
    expect(text).toContain(f.epicenter as string);
    expect(text).toContain('Подпись');
  });

  it('без рекомендаций — «действий не требуется»', () => {
    const f = { ...factsFromStart(), actions: [] };
    expect(buildTemplateReport(f)).toContain('Действий не требуется');
  });
});
