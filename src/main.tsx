import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

// Пасхалка для тех, кто откроет консоль: кроликов и здесь не видно.
console.log(
  '%c(\\_/)\n( •_•)   ПУХ v0.9 — Пассивный Учёт Хвостатых\n/ >🥕   Кроликов в консоли не обнаружено. Но это ничего не значит.',
  'color:#b7ff3c;font-family:monospace;font-size:12px;line-height:1.5',
);

// Стоит отвернуться — и на ферме сразу движение.
const baseTitle = document.title;
document.addEventListener('visibilitychange', () => {
  document.title = document.visibilityState === 'hidden' ? '🐇 Движение на ферме!' : baseTitle;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
