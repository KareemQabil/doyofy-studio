/**
 * One feature's strings in the three voices. The modern Arabic object is the source of truth (and the type of the
 * keys); Egyptian and Saudi supply their own wording. `voiced` groups (high-visibility screens and guest messages)
 * must spell every key in every voice — a missing variant is a type error, not a silent fallback. `partly` groups
 * fall back to modern Arabic for the low-frequency explanatory lines they leave out.
 */
export type Strings = Record<string, string>;
export type Variants<M extends Strings> = { readonly [K in keyof M]?: string };
export type FullVariants<M extends Strings> = { readonly [K in keyof M]: string };
export interface CopyGroup<M extends Strings> { readonly modern: M; readonly 'ar-EG': Variants<M>; readonly 'ar-SA': Variants<M>; readonly full: boolean }

export const voiced = <M extends Strings>(modern: M, eg: NoInfer<FullVariants<M>>, sa: NoInfer<FullVariants<M>>): CopyGroup<M> => ({ modern, 'ar-EG': eg, 'ar-SA': sa, full: true });
export const partly = <M extends Strings>(modern: M, eg: NoInfer<Variants<M>>, sa: NoInfer<Variants<M>>): CopyGroup<M> => ({ modern, 'ar-EG': eg, 'ar-SA': sa, full: false });
