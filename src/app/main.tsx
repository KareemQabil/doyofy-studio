/**
 * Entry. Legacy Invitation Studio routes keep working unchanged:
 *   ?view=invite[&i=…] / ?i=…   the standalone invitation (self-contained guest links, QA)
 * Everything else is the Doyofy app.
 */
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { RouterMode } from './router';

const params = new URLSearchParams(location.search);
const legacy = params.get('view') === 'invite' || params.has('i');

if (legacy) {
  void import('../main.js');
} else {
  const mode: RouterMode = (window as unknown as { __DOYOFY_ROUTER__?: RouterMode }).__DOYOFY_ROUTER__ === 'history' ? 'history' : 'hash';
  if (mode === 'history' && location.pathname === '/' && !location.hash) history.replaceState(null, '', '/app/events');
  if (mode === 'hash' && !location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/app/events`);
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.body.classList.add('dy');
  const root = document.getElementById('app')!;
  root.className = 'dy-root';
  createRoot(root).render(<App mode={mode} />);
}
