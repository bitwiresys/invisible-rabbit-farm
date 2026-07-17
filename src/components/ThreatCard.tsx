import type { ThreatLevel } from '../model/types';
import { useFlash } from '../hooks/useFlash';
import { Icon, type IconId } from './Icon';

const STEPS: { level: ThreatLevel; label: string; icon: IconId }[] = [
  { level: 'calm', label: 'Спокойно', icon: 'calm' },
  { level: 'activity', label: 'Повышенная активность', icon: 'activity' },
  { level: 'invasion', label: 'Нашествие', icon: 'alert' },
];

interface ThreatCardProps {
  level: ThreatLevel;
  summary: string;
}

/**
 * Уровень угрозы: степпер из 3 сегментов (иконка + слово + цвет — статус
 * никогда не кодируется одним цветом) и генерируемая оперативная сводка.
 */
export function ThreatCard({ level, summary }: ThreatCardProps) {
  const flashing = useFlash(level);
  const summaryFlashing = useFlash(summary);

  return (
    <section className="card card--threat" aria-labelledby="threat-title">
      <h2 className="card__title" id="threat-title">Уровень угрозы</h2>

      <div className="threat__steps" role="status">
        {STEPS.map((step) => {
          const active = step.level === level;
          const classes = [
            'threat__step',
            `threat__step--${step.level}`,
            active ? 'threat__step--active' : '',
            active && flashing ? 'flash' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={step.level} className={classes}>
              <Icon id={step.icon} size={18} />
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      <p className={summaryFlashing ? 'threat__summary flash' : 'threat__summary'} aria-live="polite">
        {summary}
      </p>
    </section>
  );
}
