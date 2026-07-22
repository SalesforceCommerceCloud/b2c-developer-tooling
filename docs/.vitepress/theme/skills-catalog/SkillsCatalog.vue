<!--
  Copyright (c) 2025, Salesforce, Inc.
  SPDX-License-Identifier: Apache-2
  For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
-->
<script setup lang="ts">
import {computed, ref} from 'vue';
import {data} from '../../../skills.data';
import SkillCard from './SkillCard.vue';

// Build-time data, inlined (SSR-safe, no runtime fetch). See docs/skills.data.ts.
const {skills, personaTree} = data;

// Simple top-of-page controls: free-text search + a single persona filter.
// (Tag filtering is intentionally omitted for now to keep the UI uncluttered.)
const search = ref('');
const activePersona = ref<string | null>(null);

const personas = computed(() => personaTree.map((p) => ({id: p.id, label: p.label, count: p.count})));

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const persona = activePersona.value;
  return skills.filter((s) => {
    // A persona filter matches the skill's primary persona OR any alsoFor persona.
    if (persona && s.persona !== persona && !s.alsoFor.includes(persona)) return false;
    if (q) {
      const hay = `${s.name} ${s.description} ${s.tags.join(' ')} ${s.category ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

function setPersona(id: string | null) {
  activePersona.value = activePersona.value === id ? null : id;
}
</script>

<template>
  <div class="skills-catalog">
    <div class="sc-controls">
      <input
        v-model="search"
        type="search"
        class="sc-search"
        placeholder="Search by keyword…"
        aria-label="Search skills by keyword"
      />
      <div class="sc-personas">
        <button
          type="button"
          class="sc-chip"
          :class="{'sc-chip--active': activePersona === null}"
          @click="setPersona(null)"
        >
          All <span class="sc-chip-count">{{ skills.length }}</span>
        </button>
        <button
          v-for="p in personas"
          :key="p.id"
          type="button"
          class="sc-chip"
          :class="{'sc-chip--active': activePersona === p.id}"
          @click="setPersona(p.id)"
        >
          {{ p.label }} <span class="sc-chip-count">{{ p.count }}</span>
        </button>
      </div>
    </div>

    <div class="sc-meta">
      <span class="sc-count">{{ filtered.length }} {{ filtered.length === 1 ? 'skill' : 'skills' }}</span>
    </div>

    <div v-if="filtered.length" class="sc-grid">
      <SkillCard v-for="s in filtered" :key="`${s.plugin}/${s.name}`" :skill="s" />
    </div>
    <p v-else class="sc-empty">
      No skills match your search.
      <button type="button" class="sc-link" @click="search = ''">Clear</button>
    </p>
  </div>
</template>

<style scoped>
.skills-catalog {
  margin: 24px 0 8px;
}

.sc-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.sc-search {
  flex: 1 1 240px;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.sc-search:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.sc-personas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sc-chip {
  font-size: 13px;
  font-family: inherit;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.sc-chip:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sc-chip--active {
  color: var(--vp-c-bg);
  background: var(--vp-c-brand-1);
}

.sc-chip-count {
  opacity: 0.6;
}

.sc-meta {
  margin-bottom: 12px;
}

.sc-count {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.sc-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Two-up at most, so cards stay comfortably readable. */
@media (min-width: 720px) {
  .sc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.sc-empty {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.sc-link {
  font-size: 13px;
  font-family: inherit;
  color: var(--vp-c-brand-1);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.sc-link:hover {
  text-decoration: underline;
}
</style>
