<!--
  Copyright (c) 2025, Salesforce, Inc.
  SPDX-License-Identifier: Apache-2
  For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
-->
<script setup lang="ts">
import {computed, ref} from 'vue';
import {data} from '../../../skills.data';
import CopyButton from './CopyButton.vue';
import SkillCard from './SkillCard.vue';

// Build-time data, inlined (SSR-safe, no runtime fetch). See docs/skills.data.ts.
const {skills, personaTree, tagCounts, fidelityNote} = data;

// Filter state: one persona (+ optional category) single-select, many tags
// AND-combined, plus a free-text search. All filtering is in-memory.
const activePersona = ref<string | null>(null);
const activeCategory = ref<string | null>(null);
const activeTags = ref<string[]>([]);
const search = ref('');

function selectPersona(id: string | null) {
  if (activePersona.value === id) {
    activePersona.value = null;
    activeCategory.value = null;
  } else {
    activePersona.value = id;
    activeCategory.value = null;
  }
}

function selectCategory(persona: string, category: string) {
  activePersona.value = persona;
  activeCategory.value = activeCategory.value === category ? null : category;
}

function toggleTag(tag: string) {
  const i = activeTags.value.indexOf(tag);
  if (i === -1) activeTags.value = [...activeTags.value, tag];
  else activeTags.value = activeTags.value.filter((t) => t !== tag);
}

function clearAll() {
  activePersona.value = null;
  activeCategory.value = null;
  activeTags.value = [];
  search.value = '';
}

const hasFilters = computed(
  () => !!activePersona.value || !!activeCategory.value || activeTags.value.length > 0 || search.value.trim() !== '',
);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return skills.filter((s) => {
    if (activePersona.value && s.persona !== activePersona.value) return false;
    if (activeCategory.value && s.category !== activeCategory.value) return false;
    if (activeTags.value.length && !activeTags.value.every((t) => s.tags.includes(t))) return false;
    if (q) {
      const hay = `${s.name} ${s.description} ${s.tags.join(' ')} ${s.category ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

// Batch "copy all curls" — lazy so the string is built only on click.
const allCurls = () => filtered.value.map((s) => `curl -sL ${s.skillUrl}`).join('\n');
</script>

<template>
  <div class="skills-catalog">
    <div class="sc-toolbar">
      <input v-model="search" type="search" class="sc-search" placeholder="Search skills…" aria-label="Search skills" />
      <div class="sc-toolbar-right">
        <span class="sc-count">{{ filtered.length }} / {{ skills.length }} skills</span>
        <CopyButton
          v-if="filtered.length"
          :text="allCurls"
          :label="`Copy ${filtered.length} curls`"
          copied-label="Copied!"
          title="Copy curl commands for all matching skills"
        />
        <button v-if="hasFilters" type="button" class="sc-clear" @click="clearAll">Clear filters</button>
      </div>
    </div>

    <div class="sc-body">
      <aside class="sc-rail">
        <div class="sc-rail-section">
          <div class="sc-rail-title">Personas</div>
          <ul class="sc-persona-list">
            <li v-for="p in personaTree" :key="p.id">
              <button
                type="button"
                class="sc-persona"
                :class="{'sc-persona--active': activePersona === p.id && !activeCategory}"
                @click="selectPersona(p.id)"
              >
                <span>{{ p.label }}</span>
                <span class="sc-badge">{{ p.count }}</span>
              </button>
              <ul v-if="activePersona === p.id" class="sc-cat-list">
                <li v-for="c in p.categories" :key="c.name">
                  <button
                    type="button"
                    class="sc-cat"
                    :class="{'sc-cat--active': activeCategory === c.name}"
                    @click="selectCategory(p.id, c.name)"
                  >
                    <span>{{ c.name }}</span>
                    <span class="sc-badge">{{ c.count }}</span>
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div class="sc-rail-section">
          <div class="sc-rail-title">Tags</div>
          <div class="sc-tag-cloud">
            <button
              v-for="t in tagCounts"
              :key="t.tag"
              type="button"
              class="sc-tag"
              :class="{'sc-tag--active': activeTags.includes(t.tag)}"
              @click="toggleTag(t.tag)"
            >
              {{ t.tag }} <span class="sc-tag-count">{{ t.count }}</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="sc-results">
        <p class="sc-fidelity">{{ fidelityNote }}</p>
        <div v-if="filtered.length" class="sc-grid">
          <SkillCard
            v-for="s in filtered"
            :key="`${s.plugin}/${s.name}`"
            :skill="s"
            :active-tags="activeTags"
            @toggle-tag="toggleTag"
          />
        </div>
        <p v-else class="sc-empty">
          No skills match these filters. <button type="button" class="sc-clear" @click="clearAll">Clear filters</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills-catalog {
  margin: 24px 0 8px;
}

.sc-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sc-search {
  flex: 1;
  min-width: 220px;
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

.sc-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sc-count {
  font-size: 13px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.sc-clear {
  font-size: 12px;
  font-family: inherit;
  color: var(--vp-c-brand-1);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.sc-clear:hover {
  text-decoration: underline;
}

.sc-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 880px) {
  .sc-body {
    grid-template-columns: 240px 1fr;
  }
}

.sc-rail-section {
  margin-bottom: 24px;
}

.sc-rail-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
}

.sc-persona-list,
.sc-cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sc-cat-list {
  margin: 2px 0 6px 10px;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 8px;
}

.sc-persona,
.sc-cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  text-align: left;
  font-family: inherit;
  color: var(--vp-c-text-1);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 5px 8px;
}

.sc-persona {
  font-size: 14px;
  font-weight: 600;
}

.sc-cat {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.sc-persona:hover,
.sc-cat:hover {
  background: var(--vp-c-default-soft);
}

.sc-persona--active,
.sc-cat--active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}

.sc-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.sc-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sc-tag {
  font-size: 12px;
  font-family: inherit;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 2px 10px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.sc-tag:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.sc-tag--active {
  color: var(--vp-c-bg);
  background: var(--vp-c-brand-1);
}

.sc-tag-count {
  opacity: 0.6;
}

.sc-fidelity {
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
  margin: 0 0 16px;
  padding: 8px 12px;
  background: var(--vp-c-default-soft);
  border-radius: 8px;
}

.sc-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .sc-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1240px) {
  .sc-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.sc-empty {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>
