import { useState } from 'react';
import { EVENT_TYPES, SIGNAL_PROFILES } from '../model/profiles';
import { PRESETS, clonePresetEvents } from '../model/presets';
import type { EventType, FarmEvent } from '../model/types';
import { Icon } from './Icon';

/** Ограничение count: достаточно для любых сценариев, ввод не ломает модель. */
const MAX_COUNT = 99;

function clampCount(raw: string): number {
  const value = Math.round(Number(raw));
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_COUNT, value));
}

interface DraftEvent {
  event: EventType;
  location: string;
  count: number;
  intensity: number;
  time: string;
}

/** Зоны фермы для случайного наблюдения — те же, что на карте. */
const RANDOM_LOCATIONS = ['Огород', 'У забора', 'Сарай', 'Теплица'];

/** Случайное наблюдение: быстрый способ увидеть, как система пересчитывает вывод. */
function randomEvent(): FarmEvent {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const hh = 6 + Math.floor(Math.random() * 17);
  const mm = Math.floor(Math.random() * 60);
  return {
    id: `evt_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    event: pick(EVENT_TYPES),
    location: pick(RANDOM_LOCATIONS),
    count: 1 + Math.floor(Math.random() * 8),
    intensity: 1 + Math.floor(Math.random() * 10),
    time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    enabled: true,
  };
}

interface SignalEditorProps {
  events: FarmEvent[];
  filter: string | null;
  onUpdate: (id: string, patch: Partial<FarmEvent>) => void;
  onRemove: (id: string) => void;
  onAdd: (event: FarmEvent) => void;
  onReplaceAll: (events: FarmEvent[]) => void;
}

/** Редактор сигналов: инлайн-правки, тумблеры, добавление, пресеты-пилюли. */
export function SignalEditor({
  events,
  filter,
  onUpdate,
  onRemove,
  onAdd,
  onReplaceAll,
}: SignalEditorProps) {
  const [draft, setDraft] = useState<DraftEvent | null>(null);
  // Аккордеон работает только на мобильной раскладке (кнопка скрыта на десктопе).
  const [collapsed, setCollapsed] = useState(false);

  const visible = filter ? events.filter((e) => e.location === filter) : events;
  const hiddenCount = events.length - visible.length;
  const enabledCount = events.filter((e) => e.enabled).length;

  const startDraft = () =>
    setDraft({
      event: 'footprints',
      location: filter ?? 'Огород',
      count: 1,
      intensity: 5,
      time: '12:00',
    });

  const submitDraft = () => {
    if (!draft) return;
    onAdd({
      id: `evt_${Date.now().toString(36)}`,
      ...draft,
      location: draft.location.trim() || 'Без локации',
      enabled: true,
    });
    setDraft(null);
  };

  return (
    <section className="card card--editor" aria-labelledby="editor-title">
      <div className="card__head-row">
        <h2 className="card__title" id="editor-title">Сигналы</h2>
        <span className="pill">{enabledCount} вкл · {events.length} всего</span>
        <button
          type="button"
          className="btn btn--ghost editor__collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <Icon id="chevron" size={14} className={collapsed ? 'chevron' : 'chevron chevron--open'} />
        </button>
      </div>

      <div className={collapsed ? 'editor__body editor__body--collapsed' : 'editor__body'}>
        <div className="editor__presets" role="group" aria-label="Пресеты сценариев">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn btn--pill"
              title={preset.description}
              onClick={() => onReplaceAll(clonePresetEvents(preset.events))}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn--pill"
            title="Подбросить случайное наблюдение и посмотреть, как система пересчитает вывод"
            onClick={() => onAdd(randomEvent())}
          >
            🎲 Случайный сигнал
          </button>
        </div>

        {filter && (
          <p className="muted editor__filter-note">
            Фильтр: {filter} · скрыто {hiddenCount}
          </p>
        )}

        {visible.length === 0 && !draft && (
          <div className="empty-state">
            <p className="empty-state__title">Сигналов нет.</p>
            <p className="empty-state__hint">Тишина — тоже данные. Добавьте наблюдение.</p>
          </div>
        )}

        <ul className="editor__list">
          {visible.map((event) => {
            const profile = SIGNAL_PROFILES[event.event];
            return (
              <li key={event.id} className={event.enabled ? 'sig-row' : 'sig-row sig-row--off'}>
                <div className="sig-row__top">
                  <span className="sig-row__glyph" title={profile.label}>
                    <Icon id={profile.icon} size={16} />
                  </span>
                  <select
                    className="select sig-row__type"
                    value={event.event}
                    aria-label="Тип сигнала"
                    onChange={(e) => onUpdate(event.id, { event: e.target.value as EventType })}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SIGNAL_PROFILES[type].label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input sig-row__location"
                    value={event.location}
                    aria-label="Локация"
                    onChange={(e) => onUpdate(event.id, { location: e.target.value })}
                  />
                  <label className="toggle" title={event.enabled ? 'Выключить сигнал' : 'Включить сигнал'}>
                    <input
                      type="checkbox"
                      checked={event.enabled}
                      onChange={(e) => onUpdate(event.id, { enabled: e.target.checked })}
                      aria-label={`Сигнал ${profile.label}, ${event.location}`}
                    />
                    <span className="toggle__track" />
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    aria-label="Удалить сигнал"
                    onClick={() => onRemove(event.id)}
                  >
                    <Icon id="close" size={14} />
                  </button>
                </div>
                <div className="sig-row__bottom">
                  <label className="mini-field">
                    <span className="mini-field__label">шт</span>
                    <input
                      className="input input--num"
                      type="number"
                      min={0}
                      max={MAX_COUNT}
                      value={event.count}
                      onChange={(e) => onUpdate(event.id, { count: clampCount(e.target.value) })}
                      aria-label="Количество единиц сигнала"
                    />
                  </label>
                  <label className="mini-field mini-field--grow">
                    <span className="mini-field__label">интенсивность</span>
                    <span className="mini-field__slider">
                      <input
                        className="slider"
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={event.intensity}
                        onChange={(e) => onUpdate(event.id, { intensity: Number(e.target.value) })}
                        aria-label="Интенсивность от 1 до 10"
                      />
                      <span className="mono mini-field__value">{event.intensity}</span>
                    </span>
                  </label>
                  <label className="mini-field">
                    <span className="mini-field__label">время</span>
                    <input
                      className="input input--time"
                      type="time"
                      value={event.time}
                      onChange={(e) => onUpdate(event.id, { time: e.target.value })}
                      aria-label="Время наблюдения"
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>

        {draft ? (
          <div className="sig-row sig-row--draft">
            <div className="sig-row__top">
              <span className="sig-row__glyph">
                <Icon id={SIGNAL_PROFILES[draft.event].icon} size={16} />
              </span>
              <select
                className="select sig-row__type"
                value={draft.event}
                aria-label="Тип сигнала"
                onChange={(e) => setDraft({ ...draft, event: e.target.value as EventType })}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SIGNAL_PROFILES[type].label}
                  </option>
                ))}
              </select>
              <input
                className="input sig-row__location"
                value={draft.location}
                aria-label="Локация"
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
            <div className="sig-row__bottom">
              <label className="mini-field">
                <span className="mini-field__label">шт</span>
                <input
                  className="input input--num"
                  type="number"
                  min={0}
                  max={MAX_COUNT}
                  value={draft.count}
                  onChange={(e) => setDraft({ ...draft, count: clampCount(e.target.value) })}
                  aria-label="Количество единиц сигнала"
                />
              </label>
              <label className="mini-field mini-field--grow">
                <span className="mini-field__label">интенсивность</span>
                <span className="mini-field__slider">
                  <input
                    className="slider"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={draft.intensity}
                    onChange={(e) => setDraft({ ...draft, intensity: Number(e.target.value) })}
                    aria-label="Интенсивность от 1 до 10"
                  />
                  <span className="mono mini-field__value">{draft.intensity}</span>
                </span>
              </label>
              <label className="mini-field">
                <span className="mini-field__label">время</span>
                <input
                  className="input input--time"
                  type="time"
                  value={draft.time}
                  onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  aria-label="Время наблюдения"
                />
              </label>
            </div>
            <div className="sig-row__actions">
              <button type="button" className="btn" onClick={submitDraft}>
                Добавить
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn editor__add" onClick={startDraft}>
            <Icon id="plus" size={14} />
            Добавить сигнал
          </button>
        )}
      </div>
    </section>
  );
}
