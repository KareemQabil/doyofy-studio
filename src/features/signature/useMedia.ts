import { useEffect, useState } from 'react';
/** live media query, for the few layout decisions CSS can't make (a rendered card's pixel width) */
export function useMedia(q: string): boolean {
  const get = () => typeof matchMedia === 'function' && matchMedia(q).matches;
  const [m, setM] = useState(get);
  useEffect(() => { if (typeof matchMedia !== 'function') return; const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); on(); return () => mq.removeEventListener('change', on); }, [q]);
  return m;
}
