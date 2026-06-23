<!--
  Copyright (c) 2025, Salesforce, Inc.
  SPDX-License-Identifier: Apache-2
  For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
-->
<script setup lang="ts">
import {ref} from 'vue';

// Reusable copy-to-clipboard button. Mirrors the copied/failed + timeout-reset
// pattern from MarkdownActions.vue, but copies a literal string (the `text`
// prop, or its return value when a function) rather than fetching a URL — so a
// per-card "Copy curl" can never 404 at copy time. Each instance owns its own
// state, so many buttons on one page don't share a "Copied!" flash.
const props = defineProps<{
  text: string | (() => string);
  label?: string;
  copiedLabel?: string;
  title?: string;
}>();

const copied = ref(false);
const failed = ref(false);

async function copy() {
  copied.value = false;
  failed.value = false;
  try {
    const value = typeof props.text === 'function' ? props.text() : props.text;
    await navigator.clipboard.writeText(value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch (err) {
    failed.value = true;
    setTimeout(() => (failed.value = false), 2400);
    console.error('Copy failed:', err);
  }
}
</script>

<template>
  <button type="button" class="copy-btn" :title="title" @click="copy">
    <svg v-if="copied" class="copy-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
    <svg v-else class="copy-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
    <span>{{ copied ? (copiedLabel ?? 'Copied!') : failed ? 'Copy failed' : (label ?? 'Copy') }}</span>
  </button>
</template>

<style scoped>
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s;
}

.copy-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.copy-icon {
  flex-shrink: 0;
}
</style>
