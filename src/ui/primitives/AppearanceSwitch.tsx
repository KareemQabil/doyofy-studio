/** Platform appearance: light · dark · follow the device. Saved with the organizer's settings; never touches the invitation. */
import { usePrototype } from '../../app/data';
import { APPEARANCE_LABEL, useAppearance, type Appearance } from '../../app/review';
import { Segmented } from './Segmented';

const ICON = { light: 'sun', dark: 'moon', system: 'device' } as const;

export function AppearanceSwitch({ className = '' }: { className?: string }) {
  const proto = usePrototype();
  const { appearance } = useAppearance();
  return (
    <div className={`appearance-switch ${className}`}>
      <p className="appearance-label" id="appearance-label">مظهر المنصة</p>
      <Segmented size="sm" label="مظهر المنصة" value={appearance} onChange={(v: Appearance) => proto.update({ appearance: v })}
        options={(Object.keys(APPEARANCE_LABEL) as Appearance[]).map((v) => ({ value: v, label: APPEARANCE_LABEL[v], icon: ICON[v] }))} />
    </div>
  );
}
