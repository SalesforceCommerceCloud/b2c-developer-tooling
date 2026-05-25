<script setup lang="ts">
import {computed, onMounted, provide, ref, useSlots, watch, h, defineComponent} from 'vue';
import {flags as registryFlags} from '../../../data/adventures/index.js';
import type {Adventure, AdventureState} from '../../../data/adventures/_types.js';
import AdventureOutput from '../AdventureOutput.vue';
import AdventureStep from '../AdventureStep.vue';
import {wizardKey, type StepRegistration, type Synthesizer} from './wizard-context.js';

const props = defineProps<{
  id: string;
  title: string;
  tagline: string;
  intro?: string;
  icon?: string;
  synth: Synthesizer;
}>();

// Steps register themselves during the hidden slot's render. The array
// must be reactive so the wizard's computeds re-evaluate after the slot
// pass populates them — Vue tracks the .value access and recomputes when
// new step registrations arrive.
const stepsRef = ref<StepRegistration[]>([]);

provide(wizardKey, {
  registerStep(step) {
    // Only register once per id; HMR can re-run setups, so dedupe by id.
    const existing = stepsRef.value.find((s) => s.id === step.id);
    if (existing) Object.assign(existing, step);
    else stepsRef.value = [...stepsRef.value, step];
  },
  flags: registryFlags,
});

const steps = computed(() => stepsRef.value);

// Headless component that renders the slot once, hidden, so Step/Choice
// setup runs and self-registers. After the first render the `steps` array
// is populated and the visible wizard UI below kicks in.
const slots = useSlots();
const HiddenSlotProbe = defineComponent({
  setup() {
    return () => h('div', {style: 'display: none'}, slots.default ? slots.default() : []);
  },
});

const flags = registryFlags;

// Selection model — same shape as the existing TS-driven QuickstartAdventure.
const selections = ref<Record<string, string[]>>({});
const confirmed = ref<Record<string, boolean>>({});

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

const state = computed<AdventureState>(() => {
  const out: AdventureState = {};
  for (const step of steps.value) {
    if (!confirmed.value[step.id]) continue;
    const ids = selections.value[step.id];
    if (!ids?.length) continue;
    for (const id of ids) {
      const c = step.choices.find((x) => x.id === id);
      mergeContrib(out, c?.contributes);
    }
  }
  return out;
});

const visibleSteps = computed(() =>
  steps.value.filter((s) => !s.showIf || s.showIf(state.value, flags)),
);

const activeIndex = computed(() => {
  const v = visibleSteps.value;
  for (let i = 0; i < v.length; i++) if (!confirmed.value[v[i].id]) return i;
  return v.length;
});

const isComplete = computed(() => activeIndex.value >= visibleSteps.value.length);
const result = computed(() => (isComplete.value ? props.synth(state.value, flags) : null));

// Adapter: AdventureStep currently expects an Adventure-shaped Step (object
// with a `choices(state, flags) => Choice[]` function). Synthesise that
// shape from the registration.
function asLegacyStep(step: StepRegistration) {
  return {
    id: step.id,
    title: step.title,
    subtitle: step.subtitle,
    multiSelect: step.multiSelect,
    minPicks: step.minPicks,
    maxPicks: step.maxPicks,
    docAnchor: step.docAnchor,
    showIf: step.showIf,
    choices: () =>
      step.choices
        .filter((c) => !c.featureFlag || flags[c.featureFlag])
        .map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          icon: c.icon,
          badges: c.badges as Choice['badges'],
          contributes: c.contributes,
          featureFlag: c.featureFlag,
          // Slot-rendered description: pass through as a function the
          // ChoiceCard can render. We use a `descriptionVNodes` field that
          // ChoiceCard checks for first; falls back to `description` string
          // if not present.
          descriptionVNodes: c.description,
        })),
  };
}

// Adapter for the synthetic Adventure passed to AdventureOutput.
const adventure = computed<Adventure>(() => ({
  id: props.id,
  title: props.title,
  tagline: props.tagline,
  icon: props.icon,
  intro: props.intro,
  stepOrder: steps.value.map((s) => s.id),
  steps: Object.fromEntries(steps.value.map((s) => [s.id, asLegacyStep(s)])) as Adventure['steps'],
  synthesize: props.synth,
}));

function selectChoice(stepId: string, choiceId: string) {
  const step = steps.value.find((s) => s.id === stepId)!;
  const current = selections.value[stepId] ?? [];
  if (step.multiSelect) {
    const next = current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId];
    if (step.maxPicks && next.length > step.maxPicks) return;
    selections.value = {...selections.value, [stepId]: next};
  } else {
    selections.value = {...selections.value, [stepId]: [choiceId]};
    confirmed.value = {...confirmed.value, [stepId]: true};
  }
}

function confirmStep(stepId: string) {
  const step = steps.value.find((s) => s.id === stepId)!;
  const picks = selections.value[stepId] ?? [];
  const min = step.minPicks ?? 1;
  if (picks.length < min) return;
  confirmed.value = {...confirmed.value, [stepId]: true};
}

function editStep(stepId: string) {
  const nextSel = {...selections.value};
  const nextConf = {...confirmed.value};
  let cleared = false;
  for (const s of steps.value) {
    if (s.id === stepId) cleared = true;
    if (cleared) {
      delete nextSel[s.id];
      delete nextConf[s.id];
    }
  }
  selections.value = nextSel;
  confirmed.value = nextConf;
}

function startOver() {
  selections.value = {};
  confirmed.value = {};
}

onMounted(() => {
  selections.value = {};
  confirmed.value = {};
});

watch(visibleSteps, (current) => {
  const visibleIds = new Set(current.map((s) => s.id));
  let dirty = false;
  const nextSel = {...selections.value};
  const nextConf = {...confirmed.value};
  for (const id of Object.keys(nextSel)) if (!visibleIds.has(id)) {
    delete nextSel[id];
    dirty = true;
  }
  for (const id of Object.keys(nextConf)) if (!visibleIds.has(id)) {
    delete nextConf[id];
    dirty = true;
  }
  if (dirty) {
    selections.value = nextSel;
    confirmed.value = nextConf;
  }
});
</script>

<script lang="ts">
// Type-only import for Choice so the asLegacyStep cast above compiles.
import type {Choice} from '../../../data/adventures/_types.js';
export type {Choice};
</script>

<template>
  <div class="b2c-adv">
    <!-- Render once to collect registrations from <QStep> + <QChoice>. -->
    <HiddenSlotProbe />

    <header class="b2c-adv__head">
      <h1 class="b2c-adv__title">{{ title }}</h1>
      <p class="b2c-adv__tag">{{ tagline }}</p>
      <p v-if="intro" class="b2c-adv__intro">{{ intro }}</p>
    </header>

    <div class="b2c-adv__steps">
      <template v-for="(step, i) in visibleSteps" :key="step.id">
        <AdventureStep
          v-if="i <= activeIndex"
          :index="i + 1"
          :step="asLegacyStep(step)"
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
