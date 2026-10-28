/**
 * Public prototype honesty: organizer screens say once, quietly, that this is a demo whose data lives on this device.
 * Dismissible (remembered on this device). Guest pages never show it — they have their own demo notice on the reply.
 */
import { useState } from 'react';
import { useLocation } from '../../app/router';
import { Icon } from '../../ui';

const KEY = 'doyofy:demo-bar-dismissed';
const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export function DemoBar() {
  const loc = useLocation();
  const [hidden, setHidden] = useState(seen);
  // home and the event workspace only: focused tasks (editor, create, import, gate) keep their full screen
  if (hidden || !/^\/app\/events(\/[^/]+\/(overview|invitation|guests|rsvp|seating|check-in|settings|summary|more))?$/.test(loc.pathname)) return null;
  const dismiss = () => { try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked: it simply shows again */ } setHidden(true); };
  return (
    <div className="demo-bar" role="note">
      <span><strong>نسخة تجريبية</strong> — مناسباتك وضيوفك محفوظة على هذا الجهاز فقط، ولا تُرسل رسائل حقيقية.</span>
      <button type="button" className="demo-bar-close" aria-label="إخفاء التنبيه" onClick={dismiss}><Icon name="close" size="sm" /></button>
    </div>
  );
}
