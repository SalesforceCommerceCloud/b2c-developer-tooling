// Shared types + injection keys for the slot-based wizard. Step and Choice
// components register themselves with the parent <Wizard> through this
// context; the wizard's UI is then driven by the collected registrations.

import type {InjectionKey, Ref, Slot} from 'vue';
import type {AdventureState, ChecklistItem, DocAnchor, Flags, SynthesizedConfig} from '../../../data/adventures/_types.js';

export interface ChoiceRegistration {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badges?: {text: string; tone?: string}[];
  contributes?: AdventureState;
  featureFlag?: string;
  // Slot function rendering the choice's description. Optional — a choice
  // can have just a title.
  description?: Slot;
}

export interface StepRegistration {
  id: string;
  title: string;
  subtitle?: string;
  multiSelect?: boolean;
  minPicks?: number;
  maxPicks?: number;
  showIf?: (state: AdventureState, flags: Flags) => boolean;
  docAnchor: DocAnchor;
  choices: ChoiceRegistration[];
}

export interface WizardContext {
  registerStep: (step: StepRegistration) => void;
  // Used by the Step component to discover its parent wizard; otherwise
  // unused.
  flags: Flags;
}

export interface StepContext {
  registerChoice: (choice: ChoiceRegistration) => void;
}

export const wizardKey: InjectionKey<WizardContext> = Symbol('quickstart.wizard');
export const stepKey: InjectionKey<StepContext> = Symbol('quickstart.step');

// A page-level synthesizer. Same shape as Adventure.synthesize, exported so
// authors can import the type from a single place.
export type Synthesizer = (state: AdventureState, flags: Flags) => SynthesizedConfig;

export type {AdventureState, ChecklistItem, DocAnchor, Flags, SynthesizedConfig};
