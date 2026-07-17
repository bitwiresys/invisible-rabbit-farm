import { useMemo, useState } from 'react';
import { estimate, opsSummary, recommend, threatLevel } from './model/engine';
import { START_EVENTS, clonePresetEvents, defaultParams } from './model/presets';
import type { FarmEvent, ModelParams } from './model/types';
import { Header } from './components/Header';
import { HeroPopulation } from './components/HeroPopulation';
import { ConfidenceCard } from './components/ConfidenceCard';
import { ThreatCard } from './components/ThreatCard';
import { HowCalculated } from './components/HowCalculated';
import { FarmMap } from './components/FarmMap';
import { SignalEditor } from './components/SignalEditor';
import { ContributionBars } from './components/ContributionBars';
import { Recommendations } from './components/Recommendations';
import { AiReport } from './components/AiReport';
import { Headquarters } from './components/Headquarters';
import { WorklogOverlay } from './components/WorklogOverlay';

/** Одновременно на экране не больше 4 рекомендаций. */
const MAX_RECOMMENDATIONS = 4;

export default function App() {
  const [events, setEvents] = useState<FarmEvent[]>(() => clonePresetEvents(START_EVENTS));
  const [params, setParams] = useState<ModelParams>(() => defaultParams());
  const [filter, setFilter] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const [worklogOpen, setWorklogOpen] = useState(false);
  const [spotted, setSpotted] = useState(false);

  // Вся математика — в чистых функциях model/; UI только вызывает их.
  const result = useMemo(() => estimate(events, params), [events, params]);
  const recommendations = useMemo(() => recommend(result), [result]);
  const threat = threatLevel(result.central, params.thresholds);
  const summary = opsSummary(result, Math.min(recommendations.length, MAX_RECOMMENDATIONS));

  // Фильтр по исчезнувшей локации гаснет сам — это производное значение, не эффект.
  const activeFilter = filter && events.some((e) => e.location === filter) ? filter : null;

  const updateEvent = (id: string, patch: Partial<FarmEvent>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const addEvent = (event: FarmEvent) => setEvents((prev) => [...prev, event]);

  const replaceAll = (next: FarmEvent[]) => {
    setEvents(next);
    setFilter(null);
  };

  const showSummary = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Пасхалка: клик по логотипу на полторы секунды «показывает» одного кролика.
  const spotRabbit = () => {
    if (spotted) return;
    setSpotted(true);
    window.setTimeout(() => setSpotted(false), 1600);
  };

  const showHow = () => {
    setHowOpen(true);
    // Скроллим после того, как панель раскроется.
    requestAnimationFrame(() => {
      document.getElementById('how-calculated')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="app">
      <Header
        onShowSummary={showSummary}
        onShowHow={showHow}
        onShowWorklog={() => setWorklogOpen(true)}
        onLogoClick={spotRabbit}
      />

      <main className="grid">
        <HeroPopulation result={result} spotted={spotted} />
        <ConfidenceCard result={result} onShowHow={showHow} />
        <ThreatCard level={threat} summary={summary} />
        <HowCalculated
          open={howOpen}
          onToggle={() => setHowOpen((o) => !o)}
          result={result}
          params={params}
        />
        <FarmMap result={result} events={events} filter={activeFilter} onFilter={setFilter} />
        <SignalEditor
          events={events}
          filter={activeFilter}
          onUpdate={updateEvent}
          onRemove={removeEvent}
          onAdd={addEvent}
          onReplaceAll={replaceAll}
        />
        <ContributionBars result={result} events={events} filter={activeFilter} />
        <Recommendations recommendations={recommendations} />
        <AiReport result={result} threat={threat} recommendations={recommendations} />
        <Headquarters params={params} onChange={setParams} />
      </main>

      <footer className="footer">
        ПУХ v0.9 · при расчётах ни один кролик не пострадал
      </footer>

      {worklogOpen && <WorklogOverlay onClose={() => setWorklogOpen(false)} />}
    </div>
  );
}
