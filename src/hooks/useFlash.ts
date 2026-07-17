import { useEffect, useRef, useState } from 'react';

/**
 * Возвращает true на 600 мс после каждого изменения value —
 * вспышка-подчёркивание, по которой глаз ловит цепочку «причина → эффект».
 * Первый рендер вспышку не вызывает.
 */
export function useFlash(value: unknown): boolean {
  const [flashing, setFlashing] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFlashing(true);
    const timer = setTimeout(() => setFlashing(false), 600);
    return () => clearTimeout(timer);
  }, [value]);

  return flashing;
}
