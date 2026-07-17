import type { Recommendation } from '../model/types';
import { Icon } from './Icon';

/** Одновременно показывается не больше 4 приказов. */
const MAX_VISIBLE = 4;

interface RecommendationsProps {
  recommendations: Recommendation[];
}

/** Рекомендации-«приказы»: действие в повелительном наклонении + причина. */
export function Recommendations({ recommendations }: RecommendationsProps) {
  const visible = recommendations.slice(0, MAX_VISIBLE);

  return (
    <section className="card card--recs" aria-labelledby="recs-title">
      <h2 className="card__title" id="recs-title">Рекомендации</h2>

      {visible.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">Действий не требуется.</p>
          <p className="empty-state__hint">Наблюдайте.</p>
        </div>
      ) : (
        <ul className="recs">
          {visible.map((rec) => (
            <li key={rec.id} className="rec">
              <span className="rec__icon">
                <Icon id={rec.icon} size={18} />
              </span>
              <div className="rec__body">
                <div className="rec__head">
                  <h3 className="rec__title">{rec.title}</h3>
                  <span className={rec.priority === 'high' ? 'pill rec__chip--high' : 'pill'}>
                    {rec.priority === 'high' ? 'высокий' : 'обычный'}
                  </span>
                </div>
                <p className="rec__reason">{rec.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
