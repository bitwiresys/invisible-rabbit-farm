import { useEffect } from 'react';
import { WORKLOG } from '../worklog/worklog';
import { Icon } from './Icon';

interface WorklogOverlayProps {
  onClose: () => void;
}

/** Оверлей «AI Worklog»: вертикальный таймлайн чекпоинтов из worklog/worklog.ts. */
export function WorklogOverlay({ onClose }: WorklogOverlayProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="worklog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overlay__head">
          <div>
            <h2 className="overlay__title" id="worklog-title">AI Worklog</h2>
            <p className="muted overlay__disclaimer">
              Журнал совместной работы с AI-инструментами. Секретов, ключей и приватных данных в
              логе нет.
            </p>
          </div>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Закрыть">
            <Icon id="close" size={16} />
          </button>
        </div>

        <ol className="wl">
          {WORKLOG.map((item, i) => (
            <li key={i} className="wl-item">
              <span className="wl-item__num mono" aria-hidden="true">{i + 1}</span>
              <div className="wl-item__body">
                <span className="pill">{item.stage}</span>
                <h3 className="wl-item__title">{item.title}</h3>
                <dl className="wl-item__rows">
                  <div>
                    <dt>Задача</dt>
                    <dd>{item.task}</dd>
                  </div>
                  <div>
                    <dt>Решение</dt>
                    <dd>{item.decision}</dd>
                  </div>
                  <div>
                    <dt>Результат</dt>
                    <dd>{item.outcome}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
