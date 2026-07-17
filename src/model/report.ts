import { confidencePercent, pluralRu } from './engine';
import { SIGNAL_PROFILES } from './profiles';
import type { Estimate, Recommendation, ThreatLevel } from './types';

/** Человеческие названия ступеней угрозы для отчёта. */
const THREAT_LABELS: Record<ThreatLevel, string> = {
  calm: 'Спокойно',
  activity: 'Повышенная активность',
  invasion: 'Нашествие',
};

/**
 * Факты для отчёта смены — уже посчитанные числа модели.
 * Единый источник и для локального шаблона, и для ИИ-агронома:
 * ИИ ничего не считает, он только пересказывает эти цифры.
 */
export interface ReportFacts {
  enabledCount: number;
  zoneCount: number;
  /** Диапазон «4–7» или одиночное число строкой. */
  range: string;
  central: number;
  confidencePct: number;
  threatLabel: string;
  /** Зона с максимальной оценкой (null, если данных нет). */
  epicenter: string | null;
  /** Топ-3 сигнала по вкладу. */
  topSignals: { label: string; location: string; time: string }[];
  /** Заголовки приоритетных рекомендаций. */
  actions: string[];
}

export function buildFacts(
  result: Estimate,
  threat: ThreatLevel,
  recommendations: Recommendation[],
): ReportFacts {
  const low = Math.round(result.low);
  const high = Math.round(result.high);
  return {
    enabledCount: result.enabledCount,
    zoneCount: result.locations.length,
    range: low === high ? String(high) : `${low}–${high}`,
    central: result.central,
    confidencePct: confidencePercent(result.confidence),
    threatLabel: THREAT_LABELS[threat],
    epicenter: result.locations[0]?.location ?? null,
    topSignals: result.contributions.slice(0, 3).map((c) => ({
      label: SIGNAL_PROFILES[c.event.event].label,
      location: c.event.location,
      time: c.event.time,
    })),
    actions: recommendations.slice(0, 3).map((r) => r.title),
  };
}

/** Локальный отчёт по шаблону — работает без сети и без ключей. */
export function buildTemplateReport(f: ReportFacts): string {
  if (f.enabledCount === 0) {
    return [
      'Сигналов за смену не поступало. Ферма официально спокойна.',
      'Рекомендация одна: не расслабляться. Тишина — тоже данные.',
      'Подпись: дежурный алгоритм ПУХ.',
    ].join('\n');
  }

  const lines = [
    `Обстановка: ${f.threatLabel.toLowerCase()}. За смену обработано ` +
      `${f.enabledCount} ${pluralRu(f.enabledCount, ['сигнал', 'сигнала', 'сигналов'])} ` +
      `в ${f.zoneCount} ${pluralRu(f.zoneCount, ['зоне', 'зонах', 'зонах'])}.`,
    `Расчётное поголовье — ${f.range} невидимых ` +
      `${pluralRu(f.central, ['кролика', 'кроликов', 'кроликов'])}, уверенность ${f.confidencePct}%.`,
  ];
  if (f.epicenter) {
    lines.push(`Эпицентр активности — ${f.epicenter}.`);
  }
  if (f.topSignals[0]) {
    const s = f.topSignals[0];
    lines.push(`Самый весомый сигнал: ${s.label.toLowerCase()} (${s.location}, ${s.time}).`);
  }
  lines.push(
    f.actions.length > 0
      ? `Приоритетные действия: ${f.actions.slice(0, 2).join('; ').toLowerCase()}.`
      : 'Действий не требуется. Наблюдайте.',
  );
  lines.push('Подпись: дежурный алгоритм ПУХ.');
  return lines.join('\n');
}
