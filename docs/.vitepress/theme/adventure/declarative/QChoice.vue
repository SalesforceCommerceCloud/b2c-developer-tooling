<script setup lang="ts">
import {inject, useSlots} from 'vue';
import type {AdventureState} from '../../../data/adventures/_types.js';
import {stepKey} from './wizard-context.js';

const props = defineProps<{
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badges?: {text: string; tone?: string}[];
  contributes?: AdventureState;
  featureFlag?: string;
}>();

const step = inject(stepKey);
if (!step) throw new Error('<QChoice> must be used inside a <QStep>');

const slots = useSlots();
step.registerChoice({
  id: props.id,
  title: props.title,
  subtitle: props.subtitle,
  icon: props.icon,
  badges: props.badges,
  contributes: props.contributes,
  featureFlag: props.featureFlag,
  description: slots.default,
});
</script>

<template>
  <!-- Renders nothing; the wizard UI handles display from the registration. -->
</template>
