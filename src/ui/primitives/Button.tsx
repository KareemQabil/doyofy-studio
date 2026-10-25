import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from '../../app/router';
import { Icon, type IconName } from '../icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
}

const cls = ({ variant = 'secondary', size = 'md', block, loading }: Common, extra = '') =>
  `btn btn-${variant} btn-${size}${block ? ' btn-block' : ''}${loading ? ' is-loading' : ''} ${extra}`.trim();

const Inner = ({ icon, iconEnd, loading, children }: Common) => (
  <>
    {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size="sm" /> : null}
    {children != null && <span className="btn-label">{children}</span>}
    {iconEnd && !loading ? <Icon name={iconEnd} size="sm" /> : null}
  </>
);

type ButtonProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, size, icon, iconEnd, loading, block, children, className, disabled, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={cls({ variant, size, block, loading }, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      <Inner icon={icon} iconEnd={iconEnd} loading={loading}>{children}</Inner>
    </button>
  );
});

/** a link that looks like a button (navigation, not an action) */
export function LinkButton({ to, variant, size, icon, iconEnd, block, children, className, target, ...rest }: Common & { to: string; className?: string; target?: string; 'aria-label'?: string; onClick?: () => void }) {
  return (
    <Link to={to} className={cls({ variant, size, block }, className)} target={target} {...rest}>
      <Inner icon={icon} iconEnd={iconEnd}>{children}</Inner>
    </Link>
  );
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }: { icon: IconName; label: string; variant?: ButtonVariant; size?: ButtonSize } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} btn-icon ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'lg' ? 'md' : 'sm'} />
    </button>
  );
}
