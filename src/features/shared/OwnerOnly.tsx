/**
 * Role-aware presentation (domain/roles). `useCan` follows the signed-in role live (the prototype tools can switch it);
 * `OwnerOnly` shows an owner-only action to a team member where they would look for it: disabled, with the reason.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { Role } from '../../domain/types';
import { can, type Permission } from '../../domain/roles';
import { useCopy } from '../../ui/copy';
import { useServices } from '../../app/data';

export function useRole(): Role {
  const services = useServices();
  const [role, setRole] = useState(() => services.session.currentUser().role);
  useEffect(() => services.onChange(() => setRole(services.session.currentUser().role)), [services]);
  return role;
}

export const useCan = (action: Permission): boolean => can(useRole(), action);

/** wraps a disabled action; the note sits right under it so sighted and screen-reader users get the same reason */
export function OwnerOnly({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useCopy();
  return <span className={`owner-only${className ? ` ${className}` : ''}`}>{children}<small className="owner-only-note">{t('ownerOnlyNote')}</small></span>;
}
