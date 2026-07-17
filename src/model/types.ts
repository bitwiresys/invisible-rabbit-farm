/** Тип косвенного сигнала, по которому детектируются кролики. */
export type EventType =
  | 'missing_carrot'
  | 'new_hole'
  | 'motion_sensor'
  | 'rustle_detected'
  | 'footprints';

/** Одно наблюдение фермера: «в 09:10 у забора появились 2 новые ямки». */
export interface FarmEvent {
  id: string;
  event: EventType;
  /** Где зафиксирован сигнал. События группируются по локациям. */
  location: string;
  /** Сколько единиц сигнала: морковок, ямок, срабатываний датчика. */
  count: number;
  /** Субъективная сила сигнала от 1 до 10. */
  intensity: number;
  /** Время наблюдения в формате "HH:MM" (все события — в пределах одного дня). */
  time: string;
  /** Выключенное событие полностью исключается из расчёта. */
  enabled: boolean;
}

/** Идентификатор line-глифа сигнала (SVG рисуется в UI, тип кодируется формой, не цветом). */
export type GlyphId = 'carrot' | 'hole' | 'wave' | 'rustle' | 'paw';

/** Свойства типа сигнала: насколько ему верить и во сколько кроликов конвертировать. */
export interface SignalProfile {
  label: string;
  icon: GlyphId;
  /** 0..1 — вероятность, что сигнал вызван именно кроликом, а не ветром/вороной. */
  reliability: number;
  /** Сколько кроликов в среднем стоит за одной единицей сигнала. */
  rabbitsPerUnit: number;
  /** Человеческое пояснение коэффициентов для панели «Как это посчитано». */
  rationale: string;
}

/** Пороги уровня угрозы, сравниваются с центром диапазона оценки. */
export interface ThreatThresholds {
  /** Ниже этого значения — «Спокойно». */
  calm: number;
  /** Выше этого значения — «Нашествие»; между порогами — «Повышенная активность». */
  invasion: number;
}

/** Параметры модели, которые пользователь крутит в секции «Штаб». */
export interface ModelParams {
  /** Период полураспада значимости сигнала, часы. Через halfLife часов вес сигнала падает вдвое. */
  halfLifeHours: number;
  /** Пороги трёхступенчатой шкалы угрозы. */
  thresholds: ThreatThresholds;
  /** Переопределяемая надёжность каждого типа сигнала (по умолчанию — из профилей). */
  reliability: Record<EventType, number>;
}

/** Три ступени угрозы: Спокойно / Повышенная активность / Нашествие. */
export type ThreatLevel = 'calm' | 'activity' | 'invasion';

/** Разложение вклада одного события — для баров «Вклад сигналов» и объяснений. */
export interface EventContribution {
  event: FarmEvent;
  /** Итоговый вклад в оценку: count × rabbitsPerUnit × reliability × intensityFactor × decay. */
  contribution: number;
  intensityFactor: number;
  decay: number;
  ageHours: number;
  reliability: number;
  rabbitsPerUnit: number;
}

/** Оценка по одной локации с поправкой √n на пересечение сигналов. */
export interface LocationEstimate {
  location: string;
  /** rawSum / √(число событий в локации). */
  estimate: number;
  /** Сумма вкладов до поправки. */
  rawSum: number;
  eventCount: number;
  contributions: EventContribution[];
}

/** Четыре фактора, из которых складывается уверенность (каждый 0..1). */
export interface ConfidenceFactors {
  /** Средняя надёжность сигналов, взвешенная по вкладу. */
  reliability: number;
  /** Разнообразие: уникальные типы сигналов / 5. */
  diversity: number;
  /** Свежесть: средний decay включённых событий. */
  freshness: number;
  /** Подтверждённость: доля локаций с ≥2 сигналами. */
  corroboration: number;
}

/** Полный результат расчёта модели. */
export interface Estimate {
  /** Сырая суммарная оценка (Σ по локациям), до округления. */
  total: number;
  /** Округлённое центральное значение для крупной цифры. */
  central: number;
  /** Нижняя граница диапазона: total × confidence. */
  low: number;
  /** Верхняя граница диапазона: total × (2 − confidence). */
  high: number;
  /** Уверенность системы, 0..1. */
  confidence: number;
  factors: ConfidenceFactors;
  /** Оценки по локациям, по убыванию. */
  locations: LocationEstimate[];
  /** Вклады всех включённых событий, по убыванию. */
  contributions: EventContribution[];
  /** Число включённых событий, участвовавших в расчёте. */
  enabledCount: number;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';

/** Идентификатор line-иконки рекомендации (SVG рисуется в UI). */
export type RecommendationIcon = 'eye' | 'sensor' | 'fence' | 'storage' | 'chart';

/** Рекомендация фермеру: что сделать и почему система так считает. */
export interface Recommendation {
  id: string;
  icon: RecommendationIcon;
  priority: RecommendationPriority;
  title: string;
  reason: string;
}
