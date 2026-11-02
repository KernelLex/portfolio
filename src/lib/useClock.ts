import { useEffect, useState } from 'react';

/** The time now, refreshed often enough for a clock that shows minutes. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
