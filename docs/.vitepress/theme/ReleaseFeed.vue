<script setup lang="ts">
import {onMounted, ref} from 'vue';

const feed = ref<HTMLElement>();
const selected = ref('all');
const ready = ref(false);
const hasUpdates = ref(true);
const filters = [
  ['all', 'All updates'],
  ['cli', 'CLI'],
  ['ide', 'IDE Extension'],
  ['mcp', 'MCP'],
  ['skills', 'Agent Skills'],
  ['mrt', 'MRT Utilities'],
  ['sdk', 'TypeScript SDK'],
];

function filter(product: string) {
  selected.value = product;
  for (const element of feed.value!.querySelectorAll<HTMLElement>('[data-products]')) {
    element.hidden = product !== 'all' && !element.dataset.products!.split(' ').includes(product);
  }
  for (const day of feed.value!.querySelectorAll<HTMLElement>('.release-day')) {
    const heading = day.querySelector('h2')!;
    // Keep both desktop and mobile date outlines aligned with the product filter.
    for (const link of document.querySelectorAll(`a[href="#${heading.id}"]`)) {
      const item = link.closest('li');
      if (item) item.hidden = day.hidden;
    }
  }
  hasUpdates.value = feed.value!.querySelector('.release-entry:not([hidden])') !== null;
}

onMounted(() => {
  ready.value = true;
  filter('all');
});
</script>

<template>
  <div ref="feed" class="release-feed">
    <div v-if="ready" class="release-filters" role="group" aria-label="Filter release notes by product">
      <button
        v-for="[id, label] in filters"
        :key="id"
        type="button"
        :aria-pressed="selected === id"
        @click="filter(id)"
      >
        {{ label }}
      </button>
    </div>
    <slot />
    <p v-if="ready && !hasUpdates" role="status">No updates for this product in this release history.</p>
  </div>
</template>

<style scoped>
.release-feed {
  margin-top: 28px;
}
.release-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.release-filters button {
  padding: 5px 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.15s;
}
.release-filters button:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}
.release-filters button[aria-pressed='true'] {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.release-filters button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
:deep([hidden]) {
  display: none !important;
}
:deep(.release-day) {
  margin: 24px 0 40px;
  padding: 28px 0 0;
  border-top: 1px solid var(--vp-c-divider);
}
:deep(.release-entry + .release-entry) {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--vp-c-divider);
}
:deep(.release-day h2) {
  margin: 8px 0 16px;
  padding: 0;
  border: 0;
}
:deep(.release-badges) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 28px;
}
:deep(.release-badge) {
  padding: 3px 9px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
:deep(.release-badge strong) {
  color: var(--vp-c-text-1);
  margin-left: 4px;
}
:deep(.release-change-group) {
  margin: 24px 0;
}
:deep(.release-change-group .release-products) {
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}
:deep(.release-change p) {
  margin: 4px 0 12px;
}
:deep(.release-changes) {
  padding-left: 20px;
  margin-top: 8px;
}
:deep(.release-change::marker) {
  color: var(--vp-c-text-3);
}
:deep(.release-dependencies) {
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
}
:deep(.release-dependencies summary) {
  cursor: pointer;
  font-weight: 600;
}
:deep(.release-sources) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
