/** Form primitives: every control has a real <label>, hint and error wired with aria-describedby. */
import { cloneElement, forwardRef, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons';

export function Field({ label, hint, error, required, optional, children, className = '' }: {
  label: ReactNode; hint?: ReactNode; error?: string | null; required?: boolean; optional?: boolean; children: ReactElement<Record<string, unknown>>; className?: string;
}) {
  const id = useId();
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string | undefined) ?? id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined,
        'aria-required': required || undefined,
      })
    : children;
  const controlId = (isValidElement(children) && (children.props.id as string | undefined)) || id;
  return (
    <div className={`field${error ? ' has-error' : ''} ${className}`}>
      <label className="field-label" htmlFor={controlId}>
        {label}
        {required && <span className="field-req" aria-hidden="true"> *</span>}
        {optional && <span className="field-opt"> (اختياري)</span>}
      </label>
      {control}
      {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errId} className="field-error" role="alert"><Icon name="alert" size="sm" />{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; ltr?: boolean }>(function Input({ icon, ltr, className = '', ...rest }, ref) {
  const input = <input ref={ref} className={`input${icon ? ' has-icon' : ''} ${className}`} dir={ltr ? 'ltr' : rest.dir} {...rest} />;
  if (!icon) return input;
  return <span className="input-wrap"><Icon name={icon} size="sm" className="input-icon" />{input}</span>;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = '', rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={`input textarea ${className}`} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className = '', children, ...rest }, ref) {
  return (
    <span className="select-wrap">
      <select ref={ref} className={`input select ${className}`} {...rest}>{children}</select>
      <Icon name="chevron-down" size="sm" className="select-caret" />
    </span>
  );
});

export function Checkbox({ label, hint, checked, onChange, disabled, id }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; id?: string }) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className="check">
      <input id={cid} type="checkbox" className="check-input" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-describedby={hint ? `${cid}-h` : undefined} />
      <label htmlFor={cid} className="check-label">{label}{hint && <span id={`${cid}-h`} className="check-hint">{hint}</span>}</label>
    </div>
  );
}

export function Switch({ label, hint, checked, onChange, disabled }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="switch-row">
      <label htmlFor={id} className="switch-text"><span id={`${id}-l`} className="switch-label">{label}</span>{hint && <span id={`${id}-h`} className="switch-hint">{hint}</span>}</label>
      <button id={id} type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-l`} aria-describedby={hint ? `${id}-h` : undefined} className="switch" disabled={disabled} onClick={() => onChange(!checked)}><span className="switch-thumb" /></button>
    </div>
  );
}

/** big tappable choices (event type, attendance…) */
export function ChoiceGroup<T extends string>({ label, value, options, onChange, columns = 2, error }: {
  label: string; value: T | null; options: Array<{ value: T; label: ReactNode; hint?: ReactNode; icon?: IconName }>; onChange: (v: T) => void; columns?: number; error?: string | null;
}) {
  const name = useId();
  return (
    <fieldset className={`choices${error ? ' has-error' : ''}`} style={{ ['--cols' as string]: columns }}>
      <legend className="field-label">{label}</legend>
      <div className="choices-grid">
        {options.map((o) => (
          <label key={o.value} className={`choice${value === o.value ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.icon && <Icon name={o.icon} />}
            <span className="choice-text"><span className="choice-label">{o.label}</span>{o.hint && <span className="choice-hint">{o.hint}</span>}</span>
            <span className="choice-mark" aria-hidden="true"><Icon name="check" size="sm" /></span>
          </label>
        ))}
      </div>
      {error && <p className="field-error" role="alert"><Icon name="alert" size="sm" />{error}</p>}
    </fieldset>
  );
}

/** − 3 + counter with real buttons (no tiny number spinners on phones) */
export function Stepper({ label, value, min = 0, max = 99, onChange, suffix }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void; suffix?: (n: number) => ReactNode }) {
  const id = useId();
  return (
    <div className="stepper" role="group" aria-labelledby={id}>
      <span id={id} className="field-label">{label}</span>
      <div className="stepper-row">
        <button type="button" className="btn btn-secondary btn-lg btn-icon" aria-label={`زيادة ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" /></button>
        <output className="stepper-value num" aria-live="polite">{value}{suffix && <span className="stepper-suffix">{suffix(value)}</span>}</output>
        <button type="button" className="btn btn-secondary btn-lg btn-icon" aria-label={`إنقاص ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" /></button>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'ابحث بالاسم أو الجوال', label = 'بحث', autoFocus, inputMode, size }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; autoFocus?: boolean; inputMode?: 'search' | 'text'; size?: 'lg' }) {
  return (
    <div className={`search${size === 'lg' ? ' search-lg' : ''}`} role="search">
      <Icon name="search" size="sm" className="search-icon" />
      <input type="search" className="input search-input" value={value} placeholder={placeholder} aria-label={label} autoFocus={autoFocus} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      {value && <button type="button" className="search-clear" aria-label="مسح البحث" onClick={() => onChange('')}><Icon name="close" size="sm" /></button>}
    </div>
  );
}
