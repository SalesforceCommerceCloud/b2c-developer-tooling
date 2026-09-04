<script setup lang="ts">
import {computed, ref} from 'vue';
import {withBase} from 'vitepress';
import {adventures, quickStarts} from '../../data/adventures/index.js';
import type {Adventure, AdventurePriority} from '../../data/adventures/_types.js';

const PRIORITY_SECTIONS: {key: AdventurePriority; title: string; tagline: string}[] = [
  {key: 'core', title: 'Core onboarding', tagline: 'Start here.'},
  {key: 'common', title: 'Common workflows', tagline: 'Day-to-day tasks.'},
  {key: 'specialized', title: 'Specialized', tagline: 'Targeted features.'},
  {key: 'niche', title: 'Niche', tagline: 'Less common, but here when you need them.'},
];

const search = ref('');
const activeTag = ref<string | null>(null);
const tagsOpen = ref(false);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return adventures.filter((a) => {
    if (activeTag.value && !(a.tags ?? []).includes(activeTag.value)) return false;
    if (!q) return true;
    if (a.title.toLowerCase().includes(q)) return true;
    if (a.tagline.toLowerCase().includes(q)) return true;
    if ((a.tags ?? []).some((t) => t.includes(q))) return true;
    return false;
  });
});

const grouped = computed(() => {
  const out = new Map<AdventurePriority, Adventure[]>();
  for (const section of PRIORITY_SECTIONS) out.set(section.key, []);
  // Adventures with no priority get bucketed into 'specialized' so they don't disappear.
  for (const a of filtered.value) {
    const p: AdventurePriority = a.priority ?? 'specialized';
    out.get(p)!.push(a);
  }
  return out;
});

const allTags = computed(() => {
  const counts = new Map<string, number>();
  for (const a of adventures) {
    for (const t of a.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({tag, count}));
});

const totalMatches = computed(() => filtered.value.length);

function adventureHref(id: string): string {
  return withBase(`/quickstart/${id}`);
}

function quickStartHref(qsAdventureId: string, qsId: string): string {
  return withBase(`/quickstart/${qsAdventureId}?qs=${qsId}`);
}

function toggleTag(tag: string) {
  activeTag.value = activeTag.value === tag ? null : tag;
}

function clearFilters() {
  search.value = '';
  activeTag.value = null;
}
</script>

<template>
  <div class="b2c-advi">
    <header class="b2c-advi__head">
      <h1 class="b2c-advi__title">Quickstart</h1>
      <p class="b2c-advi__tag">
        Pick what you want to do, and we'll synthesize the minimum config — dw.json, doc links, and a verify command.
      </p>
    </header>

    <div class="b2c-advi__controls">
      <div class="b2c-advi__search">
        <input
          v-model="search"
          type="search"
          placeholder="Search guides…"
          aria-label="Search guides"
          class="b2c-advi__search-input"
        />
        <span class="b2c-advi__search-count">{{ totalMatches }} of {{ adventures.length }}</span>
      </div>
      <!-- Active filter chip + disclosure toggle. Tags drive search whether
           or not the picker is visible; this row stays compact unless the
           user opts in. -->
      <div class="b2c-advi__filterbar">
        <button
          type="button"
          class="b2c-advi__disclose"
          :aria-expanded="tagsOpen"
          @click="tagsOpen = !tagsOpen"
        >
          {{ tagsOpen ? 'Hide tags' : 'Filter by tag' }}
        </button>
        <span v-if="activeTag" class="b2c-advi__active-tag">
          tag: <strong>{{ activeTag }}</strong>
          <button type="button" class="b2c-advi__active-tag-clear" aria-label="Clear tag filter" @click="activeTag = null">×</button>
        </span>
        <button
          v-if="search || activeTag"
          type="button"
          class="b2c-advi__clear"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
      <div v-if="tagsOpen" class="b2c-advi__tags">
        <button
          v-for="{tag, count} in allTags"
          :key="tag"
          type="button"
          :class="['b2c-advi__tag', {'b2c-advi__tag--active': activeTag === tag}]"
          @click="toggleTag(tag)"
        >
          {{ tag }}
          <span class="b2c-advi__tag-count">{{ count }}</span>
        </button>
      </div>
    </div>

    <section v-if="quickStarts.length && !search && !activeTag" class="b2c-advi__qs">
      <h2 class="b2c-advi__h2">Presets</h2>
      <div class="b2c-advi__qs-grid">
        <a
          v-for="qs in quickStarts"
          :key="qs.id"
          :href="quickStartHref(qs.adventureId, qs.id)"
          class="b2c-advi__qs-card"
        >
          <div class="b2c-advi__qs-title">{{ qs.label }}</div>
          <p v-if="qs.description" class="b2c-advi__qs-desc">{{ qs.description }}</p>
        </a>
      </div>
    </section>

    <template v-for="section in PRIORITY_SECTIONS" :key="section.key">
      <section v-if="(grouped.get(section.key) ?? []).length">
        <header class="b2c-advi__section-head">
          <h2 class="b2c-advi__h2">{{ section.title }}</h2>
          <span class="b2c-advi__section-tag">{{ section.tagline }}</span>
        </header>
        <div class="b2c-advi__grid">
          <a
            v-for="a in grouped.get(section.key) ?? []"
            :key="a.id"
            :href="adventureHref(a.id)"
            class="b2c-advi__card"
          >
            <h3 class="b2c-advi__card-title">{{ a.title }}</h3>
            <p class="b2c-advi__card-desc">{{ a.tagline }}</p>
            <div v-if="a.tags?.length" class="b2c-advi__card-tags">
              <span
                v-for="t in a.tags"
                :key="t"
                class="b2c-advi__card-tag"
                :class="{'b2c-advi__card-tag--active': activeTag === t}"
                @click.prevent.stop="toggleTag(t)"
              >
                {{ t }}
              </span>
            </div>
          </a>
        </div>
      </section>
    </template>

    <p v-if="totalMatches === 0" class="b2c-advi__empty">
      No guides match. <button type="button" class="b2c-advi__clear-inline" @click="clearFilters">Clear filters</button>
    </p>
  </div>
</template>

<style scoped>
.b2c-advi {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.b2c-advi__head {
  text-align: center;
}

.b2c-advi__title {
  margin: 0;
  font-size: 32px;
  border: none;
  padding: 0;
}

.b2c-advi__tag {
  margin: 8px auto 0;
  max-width: 640px;
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.b2c-advi__controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.b2c-advi__search {
  display: flex;
  align-items: center;
  gap: 12px;
}

.b2c-advi__search-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.b2c-advi__search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.b2c-advi__search-count {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.b2c-advi__filterbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.b2c-advi__disclose {
  font-size: 12px;
  padding: 3px 9px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-family: inherit;
}

.b2c-advi__disclose:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.b2c-advi__active-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 3px 4px 3px 9px;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  color: var(--vp-c-brand-1);
}

.b2c-advi__active-tag-clear {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 4px;
  font-family: inherit;
}

.b2c-advi__active-tag-clear:hover {
  color: var(--vp-c-brand-2);
}

.b2c-advi__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-top: 4px;
}

.b2c-advi__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  font-size: 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-family: inherit;
}

.b2c-advi__tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.b2c-advi__tag--active {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}

.b2c-advi__tag-count {
  font-size: 10px;
  opacity: 0.7;
}

.b2c-advi__clear {
  font-size: 12px;
  margin-left: 4px;
  padding: 3px 9px;
  background: transparent;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-family: inherit;
}

.b2c-advi__clear:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.b2c-advi__h2 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin: 0;
  border: none;
  padding: 0;
}

.b2c-advi__section-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.b2c-advi__section-tag {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.b2c-advi__qs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.b2c-advi__qs-card {
  display: block;
  padding: 14px 16px;
  background: var(--vp-c-brand-soft);
  border: 1px dashed var(--vp-c-brand-1);
  border-radius: 10px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background 0.15s, transform 0.15s;
}

.b2c-advi__qs-card:hover {
  background: var(--vp-c-bg);
  transform: translateY(-1px);
}

.b2c-advi__qs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.b2c-advi__qs-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.b2c-advi__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.b2c-advi__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
}

.b2c-advi__card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  transform: translateY(-1px);
}

.b2c-advi__card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  border: none;
  padding: 0;
}

.b2c-advi__card-desc {
  margin: 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.b2c-advi__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.b2c-advi__card-tag {
  display: inline-block;
  padding: 1px 7px;
  font-size: 11px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-3);
  cursor: pointer;
}

.b2c-advi__card-tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.b2c-advi__card-tag--active {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}

.b2c-advi__empty {
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 14px;
  padding: 24px 0;
}

.b2c-advi__clear-inline {
  background: none;
  border: none;
  padding: 0;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
}
</style>
