// Types for the existing JS customer wizard (see Wizard.js), including the platform mode.
export interface WizardPlatformForm {
  aAr: string; aEn: string; bAr: string; bEn: string;
  msgAr: string; msgEn: string;
  program: Array<{ time: string; ar: string; en: string }>;
}
export interface WizardPlatformState {
  experience: { dimension: '3d' | '2d'; motion: 'animated' | 'static' };
  card: string;
  scene: string;
  form: WizardPlatformForm;
}
export interface WizardPlatform {
  initial: WizardPlatformState;
  /** event-owned data shown read-only in the Details step */
  eventSummary: { names: string; namesEn: string; when: string; where: string; editLabel: string };
  /** builds the Studio content from the current state (event data merged in by the platform) */
  toInvitation(state: WizardPlatformState): unknown;
  onChange(state: WizardPlatformState): void;
  onAction(action: 'publish' | 'preview-guest' | 'edit-event' | 'done'): void;
  /** publish step status (re-read when the step renders or `refresh()` is called) */
  status(): { state: 'none' | 'draft' | 'published' | 'changed'; link: string; publishedAt?: string; busy?: boolean; error?: string };
}
export declare class Wizard {
  constructor(root: HTMLElement, opts?: { assetBase?: string; platform?: WizardPlatform; startStep?: number });
  refresh(): void;
  destroy(): void;
  step: number;
}
