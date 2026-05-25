<script setup lang="ts">
import {inject, provide} from 'vue';
import type {AdventureState, DocAnchor, Flags} from '../../../data/adventures/_types.js';
import {stepKey, wizardKey, type ChoiceRegistration} from './wizard-context.js';

const props = defineProps<{
  id: string;
  title: string;
  subtitle?: string;
  doc: DocAnchor;
  multiSelect?: boolean;
  minPicks?: number;
  maxPicks?: number;
  showIf?: (state: AdventureState, flags: Flags) => boolean;
}>();

const wizard = inject(wizardKey);
if (!wizard) throw new Error('<QStep> must be used inside a <Wizard>');

// Collected choices in source order. The Choice components push into this
// array during their own setup, which runs after this Step's setup but
// before the parent Wizard reads the final registrations.
const choices: ChoiceRegistration[] = [];

provide(stepKey, {
  registerChoice(c) {
    choices.push(c);
  },
});

wizard.registerStep({
  id: props.id,
  title: props.title,
  subtitle: props.subtitle,
  multiSelect: props.multiSelect,
  minPicks: props.minPicks,
  maxPicks: props.maxPicks,
  showIf: props.showIf,
  docAnchor: props.doc,
  // Reference the array so children pushed during their own setup are seen
  // when the Wizard reads `choices` afterward.
  choices,
});
</script>

<template>
  <!-- Render the slot so QChoice setup runs and self-registers — but hide
       it; the Wizard renders the visible UI from the registrations. -->
  <div style="display: none">
    <slot />
  </div>
</template>
