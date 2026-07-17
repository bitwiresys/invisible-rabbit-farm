import { SIGNAL_PROFILES, EVENT_TYPES } from './profiles';
import type { EventType, FarmEvent, ModelParams } from './types';

/** Параметры модели по умолчанию: halfLife 6 ч, пороги 2/6, надёжности — из профилей. */
export function defaultParams(): ModelParams {
  const reliability = {} as Record<EventType, number>;
  for (const type of EVENT_TYPES) {
    reliability[type] = SIGNAL_PROFILES[type].reliability;
  }
  return {
    halfLifeHours: 6,
    // Пороги по центру диапазона: < 2 — «Спокойно», 2–6 — «Активность», > 6 — «Нашествие».
    thresholds: { calm: 2, invasion: 6 },
    reliability,
  };
}

/** Стартовый набор наблюдений — обычное утро на ферме. */
export const START_EVENTS: FarmEvent[] = [
  { id: 'evt_001', event: 'missing_carrot', location: 'Огород', count: 5, intensity: 4, time: '08:30', enabled: true },
  { id: 'evt_002', event: 'new_hole', location: 'У забора', count: 2, intensity: 7, time: '09:10', enabled: true },
  { id: 'evt_003', event: 'motion_sensor', location: 'Сарай', count: 1, intensity: 8, time: '10:05', enabled: true },
  { id: 'evt_004', event: 'rustle_detected', location: 'Сарай', count: 3, intensity: 5, time: '10:20', enabled: true },
  { id: 'evt_005', event: 'footprints', location: 'Теплица', count: 6, intensity: 6, time: '11:45', enabled: true },
];

/** «Тихая ночь»: пара слабых сигналов — оценка низкая, уверенность тоже. */
export const QUIET_NIGHT_EVENTS: FarmEvent[] = [
  { id: 'qn_001', event: 'rustle_detected', location: 'Сарай', count: 1, intensity: 2, time: '02:15', enabled: true },
  { id: 'qn_002', event: 'missing_carrot', location: 'Огород', count: 1, intensity: 3, time: '04:40', enabled: true },
];

/** «Нашествие»: много сильных свежих сигналов по всей ферме. */
export const INVASION_EVENTS: FarmEvent[] = [
  { id: 'inv_001', event: 'motion_sensor', location: 'Сарай', count: 4, intensity: 9, time: '21:10', enabled: true },
  { id: 'inv_002', event: 'motion_sensor', location: 'Огород', count: 3, intensity: 8, time: '21:25', enabled: true },
  { id: 'inv_003', event: 'new_hole', location: 'У забора', count: 5, intensity: 9, time: '21:30', enabled: true },
  { id: 'inv_004', event: 'new_hole', location: 'Огород', count: 3, intensity: 7, time: '21:40', enabled: true },
  { id: 'inv_005', event: 'footprints', location: 'Теплица', count: 12, intensity: 8, time: '21:45', enabled: true },
  { id: 'inv_006', event: 'rustle_detected', location: 'Теплица', count: 6, intensity: 7, time: '21:50', enabled: true },
  { id: 'inv_007', event: 'missing_carrot', location: 'Огород', count: 14, intensity: 9, time: '21:55', enabled: true },
  { id: 'inv_008', event: 'footprints', location: 'У забора', count: 8, intensity: 6, time: '22:00', enabled: true },
];

export interface Preset {
  id: string;
  label: string;
  description: string;
  events: FarmEvent[];
}

export const PRESETS: Preset[] = [
  {
    id: 'start',
    label: 'Стартовая сводка',
    description: 'Обычное утро: пять сигналов разных типов',
    events: START_EVENTS,
  },
  {
    id: 'quiet-night',
    label: 'Тихая ночь',
    description: 'Пара слабых сигналов — почти тишина',
    events: QUIET_NIGHT_EVENTS,
  },
  {
    id: 'invasion',
    label: 'Нашествие 🥕',
    description: 'Много сильных сигналов по всей ферме',
    events: INVASION_EVENTS,
  },
];

/** Глубокая копия событий пресета, чтобы правки не портили исходник. */
export function clonePresetEvents(events: FarmEvent[]): FarmEvent[] {
  return events.map((e) => ({ ...e }));
}
