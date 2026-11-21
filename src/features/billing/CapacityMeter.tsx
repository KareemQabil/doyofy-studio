import { useEffect, useState } from 'react';
import { allocatedGuests, guestLimit } from '../../domain/billing';
import type { InvitationParty } from '../../domain/types';
export function CapacityMeter({ eventId, parties }: { eventId: string; parties: readonly InvitationParty[] }) {
  const [, render] = useState(0);
  useEffect(() => { const update = () => render(n => n + 1); window.addEventListener('doyofy:capacity', update); window.addEventListener('storage', update); return () => { window.removeEventListener('doyofy:capacity', update); window.removeEventListener('storage', update); }; }, []);
  return <p className="field-hint" role="status" data-capacity-meter>سعة الضيوف: <span className="num">{allocatedGuests(parties)} / {guestLimit(eventId)}</span> · تشمل المرافقين. يمكنك زيادة السعة عند الحاجة.</p>;
}
