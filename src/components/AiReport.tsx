import { useState } from 'react';
import { buildFacts, buildTemplateReport } from '../model/report';
import type { Estimate, Recommendation, ThreatLevel } from '../model/types';

interface AiReportProps {
  result: Estimate;
  threat: ThreatLevel;
  recommendations: Recommendation[];
}

type ReportSource = 'ai' | 'template';

/** Сколько ждём serverless-функцию, прежде чем честно упасть в шаблон. */
const AI_TIMEOUT_MS = 9000;

/**
 * «Отчёт смены»: человеческий рапорт по текущим цифрам модели.
 * LLM вынесен на периферию: он получает УЖЕ посчитанные факты через
 * серверную функцию /api/summary (ключ живёт в env на сервере) и ничего
 * не считает сам. Если ИИ недоступен — отчёт собирает локальный шаблон,
 * кнопка работает всегда.
 */
export function AiReport({ result, threat, recommendations }: AiReportProps) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [source, setSource] = useState<ReportSource>('template');

  const generate = async () => {
    setLoading(true);
    const facts = buildFacts(result, threat, recommendations);
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const data = (await res.json()) as { text?: string };
      if (!data.text) throw new Error('empty response');
      setText(data.text);
      setSource('ai');
    } catch {
      setText(buildTemplateReport(facts));
      setSource('template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card card--ai" aria-labelledby="ai-report-title">
      <div className="card__head-row">
        <h2 className="card__title" id="ai-report-title">Отчёт смены</h2>
        {text && (
          <span className="pill">
            {source === 'ai' ? 'ИИ-агроном' : 'шаблон · ИИ офлайн'}
          </span>
        )}
        <button type="button" className="btn btn--pill" onClick={generate} disabled={loading}>
          {loading ? 'Агроном печатает…' : text ? 'Обновить отчёт' : 'Сформировать отчёт'}
        </button>
      </div>

      {text && (
        <p className="report__text" aria-live="polite">
          {text}
        </p>
      )}

      <p className="report__note">
        ИИ получает только готовые числа модели — расчёты остаются детерминированными
        и проверяемыми. Запрос идёт через серверную функцию, ключ хранится в переменных
        окружения и в браузер не попадает. Без ИИ отчёт собирается локальным шаблоном.
      </p>
    </section>
  );
}
