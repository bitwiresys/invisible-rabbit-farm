interface HeaderProps {
  onShowSummary: () => void;
  onShowHow: () => void;
  onShowWorklog: () => void;
  /** Пасхалка: клик по логотипу на секунду «показывает» одного кролика. */
  onLogoClick: () => void;
}

/** Шапка: ПУХ · расшифровка · v0.9 | меню: Сводка · Как посчитано · AI Worklog. */
export function Header({ onShowSummary, onShowHow, onShowWorklog, onLogoClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" onClick={onLogoClick}>ПУХ</span>
        <span className="header__expansion">
          Пассивный
          <br />
          Учёт Хвостатых
        </span>
        <span className="pill">v0.9 · полевая версия</span>
      </div>
      <nav className="header__nav" aria-label="Разделы">
        <button type="button" className="header__link" onClick={onShowSummary}>
          Сводка
        </button>
        <button type="button" className="header__link" onClick={onShowHow}>
          Как посчитано
        </button>
        <button type="button" className="header__link" onClick={onShowWorklog}>
          AI Worklog
        </button>
      </nav>
    </header>
  );
}
