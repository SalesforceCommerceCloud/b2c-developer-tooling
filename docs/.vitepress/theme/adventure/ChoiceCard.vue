<script setup lang="ts">
import type {Badge, Choice} from '../../data/adventures/_types.js';

defineProps<{
  choice: Choice;
  selected?: boolean;
  multi?: boolean;
  size?: 'compact' | 'normal';
}>();

defineEmits<{
  (e: 'select', id: string): void;
}>();

function badgeClass(b: Badge): string {
  return `b2c-badge b2c-badge--${b.tone ?? 'info'}`;
}
</script>

<template>
  <button
    type="button"
    class="b2c-choice"
    :class="{
      'b2c-choice--selected': selected,
      'b2c-choice--multi': multi,
      'b2c-choice--compact': size === 'compact',
    }"
    @click="$emit('select', choice.id)"
  >
    <div class="b2c-choice__icon" aria-hidden="true">
      <svg v-if="multi && selected" class="b2c-choice__check" viewBox="0 0 24 24" width="14" height="14">
        <path fill="#fff" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      <span v-else class="b2c-choice__dot"></span>
    </div>
    <div class="b2c-choice__body">
      <div class="b2c-choice__head">
        <h3 class="b2c-choice__title">{{ choice.title }}</h3>
        <span v-for="b in choice.badges" :key="b.text" :class="badgeClass(b)">{{ b.text }}</span>
      </div>
      <div v-if="choice.subtitle" class="b2c-choice__sub">{{ choice.subtitle }}</div>
      <!-- Slot-rendered description (from <QChoice> body) takes precedence
           over the plain-string description used by TS-driven adventures. -->
      <div v-if="(choice as any).descriptionVNodes" class="b2c-choice__desc">
        <component :is="(choice as any).descriptionVNodes" />
      </div>
      <p v-else-if="choice.description" class="b2c-choice__desc">{{ choice.description }}</p>
    </div>
  </button>
</template>

<style scoped>
.b2c-choice {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 14px 12px;
  text-align: left;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  color: var(--vp-c-text-1);
  transition: border-color 0.15s, background 0.15s, transform 0.15s, box-shadow 0.15s;
  width: 100%;
  height: 100%;
}

.b2c-choice:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  transform: translateY(-1px);
}

.b2c-choice--selected {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.b2c-choice__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.b2c-choice--selected .b2c-choice__icon {
  background: var(--vp-c-brand-1);
}

.b2c-choice__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.b2c-choice--selected .b2c-choice__dot {
  background: #fff;
}

/* Multi-select unselected state shows an empty square instead of a dot, so
   users immediately understand they can pick more than one. */
.b2c-choice--multi .b2c-choice__icon {
  border-radius: 4px;
}

.b2c-choice--multi:not(.b2c-choice--selected) .b2c-choice__dot {
  width: 0;
  height: 0;
  background: transparent;
}

.b2c-choice__check {
  display: block;
}

.b2c-choice__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.b2c-choice__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.b2c-choice__sub {
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.b2c-choice__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--vp-c-text-2);
}

.b2c-choice--compact {
  padding: 10px 12px;
}

.b2c-choice--compact .b2c-choice__desc {
  display: none;
}
</style>
