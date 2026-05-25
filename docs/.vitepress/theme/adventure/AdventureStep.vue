<script setup lang="ts">
import {computed} from 'vue';
import {withBase} from 'vitepress';
import type {AdventureState, Choice, Flags, Step} from '../../data/adventures/_types.js';
import ChoiceCard from './ChoiceCard.vue';

const props = defineProps<{
  index: number;
  step: Step;
  state: AdventureState;
  flags: Flags;
  selectedIds: string[];
  confirmed: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'confirm'): void;
  (e: 'edit'): void;
}>();

const choices = computed<Choice[]>(() =>
  props.step.choices(props.state, props.flags).filter((c) => !c.featureFlag || props.flags[c.featureFlag]),
);

const selectedSet = computed(() => new Set(props.selectedIds));

const selectedChoices = computed<Choice[]>(() =>
  choices.value.filter((c) => selectedSet.value.has(c.id)),
);

const isMulti = computed(() => !!props.step.multiSelect);
const minPicks = computed(() => props.step.minPicks ?? 1);
const canConfirm = computed(() => props.selectedIds.length >= minPicks.value);

const docHref = computed(() => {
  const a = props.step.docAnchor;
  if (/^https?:\/\//.test(a.path)) return a.path;
  return withBase(a.path) + (a.hash ? `#${a.hash}` : '');
});
</script>

<template>
  <section class="b2c-step" :class="{'b2c-step--locked': confirmed}">
    <header class="b2c-step__head">
      <span class="b2c-step__num">{{ index }}</span>
      <div class="b2c-step__titles">
        <h2 class="b2c-step__title">
          {{ step.title }}
          <span v-for="c in selectedChoices" :key="c.id" class="b2c-step__chip">{{ c.title }}</span>
        </h2>
        <p v-if="step.subtitle && !confirmed" class="b2c-step__sub">{{ step.subtitle }}</p>
        <p v-if="isMulti && !confirmed" class="b2c-step__hint">
          Pick {{ minPicks > 1 ? `${minPicks}+` : 'one or more' }}, then confirm.
        </p>
      </div>
      <div class="b2c-step__actions">
        <a class="b2c-step__doc" :href="docHref" target="_blank" rel="noopener">
          {{ step.docAnchor.label }} →
        </a>
        <button v-if="confirmed" type="button" class="b2c-step__edit" @click="$emit('edit')">Change</button>
      </div>
    </header>
    <div v-if="!confirmed">
      <div class="b2c-step__grid">
        <ChoiceCard
          v-for="c in choices"
          :key="c.id"
          :choice="c"
          :selected="selectedSet.has(c.id)"
          :multi="isMulti"
          @select="$emit('select', $event)"
        />
      </div>
      <div v-if="isMulti" class="b2c-step__confirm">
        <span class="b2c-step__count">{{ selectedIds.length }} selected</span>
        <button
          type="button"
          class="b2c-step__confirm-btn"
          :disabled="!canConfirm"
          @click="$emit('confirm')"
        >
          Confirm →
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.b2c-step {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 18px;
}

.b2c-step--locked {
  background: var(--vp-c-bg-soft);
}

.b2c-step__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.b2c-step__num {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 50%;
  font-weight: 600;
  font-size: 13px;
}

.b2c-step--locked .b2c-step__num {
  background: var(--vp-c-text-3);
}

.b2c-step__titles {
  flex: 1 1 auto;
}

.b2c-step__title {
  margin: 0;
  font-size: 17px;
  line-height: 1.3;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  border: none;
  padding: 0;
}

.b2c-step__chip {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.b2c-step__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.b2c-step__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.b2c-step__doc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  white-space: nowrap;
}

.b2c-step__doc:hover {
  color: var(--vp-c-brand-1);
}

.b2c-step__edit {
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-family: inherit;
}

.b2c-step__edit:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.b2c-step__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.b2c-step__hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.b2c-step__confirm {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.b2c-step__count {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.b2c-step__confirm-btn {
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  background: var(--vp-c-brand-1);
  color: #fff;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.b2c-step__confirm-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.b2c-step__confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
