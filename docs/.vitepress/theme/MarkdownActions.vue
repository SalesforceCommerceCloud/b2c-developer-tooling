<script setup lang="ts">
import {computed, ref} from 'vue';
import {useData, withBase} from 'vitepress';

const props = defineProps<{variant?: 'aside' | 'inline'}>();

const {page} = useData();

const mdUrl = computed(() => {
  const rel = page.value.relativePath;
  if (!rel) return '';
  return withBase('/' + rel);
});

const copied = ref(false);
const failed = ref(false);

async function copyMarkdown() {
  copied.value = false;
  failed.value = false;
  try {
    const response = await fetch(mdUrl.value);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch (err) {
    failed.value = true;
    setTimeout(() => (failed.value = false), 2400);
    console.error('Copy markdown failed:', err);
  }
}
</script>

<template>
  <div v-if="mdUrl" class="md-actions" :class="`md-actions--${props.variant ?? 'aside'}`">
    <a :href="mdUrl" target="_blank" rel="noopener" class="md-action">
      <svg class="md-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
        <line x1="8" y1="9" x2="10" y2="9"/>
      </svg>
      <span>View as Markdown</span>
    </a>
    <button type="button" class="md-action" @click="copyMarkdown">
      <svg v-if="copied" class="md-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <svg v-else class="md-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span v-if="copied">Copied!</span>
      <span v-else-if="failed">Copy failed</span>
      <span v-else>Copy for LLM</span>
    </button>
  </div>
</template>

<style scoped>
.md-actions {
  display: flex;
  gap: 8px;
}

/* Aside variant: vertical stack, right column, desktop only */
.md-actions--aside {
  display: none;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

@media (min-width: 960px) {
  .md-actions--aside {
    display: flex;
  }
}

/* Inline variant: horizontal above content, mobile only (aside hidden) */
.md-actions--inline {
  flex-wrap: wrap;
  margin-bottom: 20px;
}

@media (min-width: 960px) {
  .md-actions--inline {
    display: none;
  }
}

.md-action {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
  text-align: left;
}

.md-actions--aside .md-action {
  width: 100%;
}

.md-action:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.md-icon {
  flex-shrink: 0;
}
</style>
