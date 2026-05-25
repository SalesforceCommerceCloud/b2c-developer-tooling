<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {flags, getAdventure, quickStarts} from '../../data/adventures/index.js';
import type {AdventureState, Step} from '../../data/adventures/_types.js';
import AdventureOutput from './AdventureOutput.vue';
import AdventureStep from './AdventureStep.vue';

const props = defineProps<{adventureId: string}>();

const adventure = computed(() => {
  const a = getAdventure(props.adventureId);
  if (!a) throw new Error(`No adventure registered with id "${props.adventureId}"`);
  return a;
});

// Per-step list of picked choice ids. Single-select steps store [id]; multi-
// select steps store the full set. A step is "confirmed" only when present in
// `confirmed` (multi-select needs an explicit Confirm; single-select is
// auto-confirmed on first pick).
const selections = ref<Record<string, string[]>>({});
const confirmed = ref<Record<string, boolean>>({});

// Merge a Choice's `contributes` map into `accum`. For array-valued keys,
// concatenate-and-dedupe so multi-select steps accumulate across picks.
function mergeContrib(accum: AdventureState, contrib: AdventureState | undefined) {
  if (!contrib) return;
  for (const [k, v] of Object.entries(contrib)) {
    if (Array.isArray(v)) {
      const prev = accum[k];
      const merged = Array.isArray(prev) ? [...prev, ...v] : [...v];
      accum[k] = Array.from(new Set(merged));
    } else {
      accum[k] = v;
    }
  }
}

// State accumulator from all confirmed selections, in step order.
const state = computed<AdventureState>(() => {
  const out: AdventureState = {};
  for (const stepId of adventure.value.stepOrder) {
    if (!confirmed.value[stepId]) continue;
    const ids = selections.value[stepId];
    if (!ids?.length) continue;
    const step = adventure.value.steps[stepId];
    const choices = step.choices(out, flags);
    for (const id of ids) {
      const c = choices.find((x) => x.id === id);
      mergeContrib(out, c?.contributes);
    }
  }
  return out;
});

// Visible steps in order, gated by `showIf`.
const visibleSteps = computed<Step[]>(() => {
  const out: Step[] = [];
  for (const id of adventure.value.stepOrder) {
    const step = adventure.value.steps[id];
    if (step.showIf && !step.showIf(state.value, flags)) continue;
    out.push(step);
  }
  return out;
});

// First step that hasn't been confirmed yet. Anything after it is hidden.
const activeIndex = computed(() => {
  const steps = visibleSteps.value;
  for (let i = 0; i < steps.length; i++) {
    if (!confirmed.value[steps[i].id]) return i;
  }
  return steps.length;
});

const isComplete = computed(() => activeIndex.value >= visibleSteps.value.length);

const result = computed(() => (isComplete.value ? adventure.value.synthesize(state.value, flags) : null));

function selectChoice(stepId: string, choiceId: string) {
  const step = adventure.value.steps[stepId];
  const current = selections.value[stepId] ?? [];
  if (step.multiSelect) {
    // Toggle membership; do not auto-confirm.
    const next = current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId];
    const max = step.maxPicks;
    if (max && next.length > max) return; // ignore over-cap toggles
    selections.value = {...selections.value, [stepId]: next};
  } else {
    selections.value = {...selections.value, [stepId]: [choiceId]};
    confirmed.value = {...confirmed.value, [stepId]: true};
  }
}

function confirmStep(stepId: string) {
  const step = adventure.value.steps[stepId];
  const picks = selections.value[stepId] ?? [];
  const min = step.minPicks ?? 1;
  if (picks.length < min) return;
  confirmed.value = {...confirmed.value, [stepId]: true};
}

function editStep(stepId: string) {
  const nextSel = {...selections.value};
  const nextConf = {...confirmed.value};
  // Clear this step and everything after it so prior picks can no longer
  // contribute to state (which would freeze downstream `showIf` decisions).
  let cleared = false;
  for (const id of adventure.value.stepOrder) {
    if (id === stepId) cleared = true;
    if (cleared) {
      delete nextSel[id];
      delete nextConf[id];
    }
  }
  selections.value = nextSel;
  confirmed.value = nextConf;
}

function startOver() {
  selections.value = {};
  confirmed.value = {};
}

function applyQuickStart(qsId: string) {
  const qs = quickStarts.find((q) => q.id === qsId && q.adventureId === adventure.value.id);
  if (!qs) return;
  const nextSel: Record<string, string[]> = {};
  const nextConf: Record<string, boolean> = {};
  const accum: AdventureState = {};
  for (const stepId of adventure.value.stepOrder) {
    const step = adventure.value.steps[stepId];
    if (step.showIf && !step.showIf({...accum, ...qs.preselect}, flags)) continue;
    const choices = step.choices(accum, flags);
    // For multi-select steps the preset can list `<key>: ['a','b','c']`; we
    // pick every choice whose contribution is a subset of the preselect.
    const matching = choices.filter((c) => {
      if (!c.contributes) return false;
      return Object.entries(c.contributes).every(([k, v]) => {
        const pv = qs.preselect[k];
        if (Array.isArray(v) && Array.isArray(pv)) return v.every((x) => pv.includes(x));
        if (Array.isArray(v)) return false;
        if (Array.isArray(pv)) return pv.includes(v as string);
        return pv === v;
      });
    });
    if (!matching.length) break;
    const ids = step.multiSelect ? matching.map((c) => c.id) : [matching[0].id];
    nextSel[stepId] = ids;
    nextConf[stepId] = true;
    for (const c of matching) mergeContrib(accum, c.contributes);
  }
  selections.value = nextSel;
  confirmed.value = nextConf;
}

const eligibleQuickStarts = computed(() => quickStarts.filter((q) => q.adventureId === adventure.value.id));

watch(
  () => props.adventureId,
  () => {
    selections.value = {};
    confirmed.value = {};
  },
);

onMounted(() => {
  selections.value = {};
  confirmed.value = {};
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const qsId = url.searchParams.get('qs');
  if (qsId) applyQuickStart(qsId);
});

// Drop selections for steps that became invisible due to a prior pick changing.
watch(visibleSteps, (steps) => {
  const visibleIds = new Set(steps.map((s) => s.id));
  const dropSel: string[] = [];
  for (const id of Object.keys(selections.value)) if (!visibleIds.has(id)) dropSel.push(id);
  const dropConf: string[] = [];
  for (const id of Object.keys(confirmed.value)) if (!visibleIds.has(id)) dropConf.push(id);
  if (dropSel.length) {
    const next = {...selections.value};
    for (const id of dropSel) delete next[id];
    selections.value = next;
  }
  if (dropConf.length) {
    const next = {...confirmed.value};
    for (const id of dropConf) delete next[id];
    confirmed.value = next;
  }
});
</script>

<template>
  <div class="b2c-adv">
    <header class="b2c-adv__head">
      <h1 class="b2c-adv__title">{{ adventure.title }}</h1>
      <p class="b2c-adv__tag">{{ adventure.tagline }}</p>
      <p v-if="adventure.intro" class="b2c-adv__intro">{{ adventure.intro }}</p>
    </header>

    <div v-if="eligibleQuickStarts.length && !Object.keys(confirmed).length" class="b2c-adv__qs">
      <span class="b2c-adv__qs-label">Preset:</span>
      <button
        v-for="qs in eligibleQuickStarts"
        :key="qs.id"
        type="button"
        class="b2c-adv__qs-btn"
        @click="applyQuickStart(qs.id)"
      >
        {{ qs.label }}
      </button>
    </div>

    <div class="b2c-adv__steps">
      <template v-for="(step, i) in visibleSteps" :key="step.id">
        <AdventureStep
          v-if="i <= activeIndex"
          :index="i + 1"
          :step="step"
          :state="state"
          :flags="flags"
          :selected-ids="selections[step.id] ?? []"
          :confirmed="!!confirmed[step.id]"
          @select="selectChoice(step.id, $event)"
          @confirm="confirmStep(step.id)"
          @edit="editStep(step.id)"
        />
      </template>
    </div>

    <AdventureOutput v-if="result" :adventure="adventure" :result="result" />

    <div v-if="Object.keys(selections).length" class="b2c-adv__foot">
      <button type="button" class="b2c-adv__reset" @click="startOver">↺ Start over</button>
    </div>
  </div>
</template>

<style scoped>
.b2c-adv {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.b2c-adv__head {
  margin-bottom: 4px;
}

.b2c-adv__title {
  margin: 0;
  font-size: 28px;
  border: none;
  padding: 0;
}

.b2c-adv__tag {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.b2c-adv__intro {
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

.b2c-adv__qs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--vp-c-brand-soft);
  border: 1px dashed var(--vp-c-brand-1);
  border-radius: 10px;
}

.b2c-adv__qs-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.b2c-adv__qs-btn {
  font-size: 13px;
  padding: 4px 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-family: inherit;
}

.b2c-adv__qs-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.b2c-adv__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.b2c-adv__foot {
  display: flex;
  justify-content: flex-end;
}

.b2c-adv__reset {
  font-size: 13px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-family: inherit;
}

.b2c-adv__reset:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>
