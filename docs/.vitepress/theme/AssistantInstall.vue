<script setup lang="ts">
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots} from 'vue';

const props = defineProps<{syncUrl?: boolean}>();
const slots = useSlots();
const groupId = useId();
const root = ref<HTMLElement>();
const enhanced = ref(false);
const clients = [
  {id: 'claude', label: 'Claude'},
  {id: 'codex', label: 'Codex'},
  {id: 'copilot', label: 'VS Code'},
  {id: 'cursor', label: 'Cursor'},
  {id: 'opencode', label: 'OpenCode'},
  {id: 'gemini', label: 'Gemini'},
].filter(({id}) => slots[id]);
const selected = defineModel<string>({default: 'claude'});

function panel(client: string) {
  return root.value?.querySelector<HTMLElement>(`[data-client="${client}"]`);
}

function updateUrl(client: string) {
  if (!props.syncUrl) return;
  const url = new URL(window.location.href);
  url.searchParams.set('client', client);
  url.hash = '';
  window.history.replaceState(window.history.state, '', url);
}

function selectClient(client: string) {
  selected.value = client;
  updateUrl(client);
}

async function moveTab(event: KeyboardEvent, index: number) {
  const offsets: Record<string, number> = {ArrowLeft: -1, ArrowRight: 1};
  let next: number;
  if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = clients.length - 1;
  else if (event.key in offsets) next = (index + offsets[event.key] + clients.length) % clients.length;
  else return;
  event.preventDefault();
  selectClient(clients[next].id);
  await nextTick();
  root.value?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${groupId}-tab-${clients[next].id}`)}`)?.focus();
}

// All panels are rendered at build time. Links reveal the panel before scrolling.
async function restoreClient() {
  if (!props.syncUrl) return;
  const url = new URL(window.location.href);
  let anchor = url.hash.slice(1);
  try {
    anchor = decodeURIComponent(anchor);
  } catch {
    return;
  }
  const target =
    root.value?.querySelector<HTMLElement>(`[data-setup-anchor="${CSS.escape(anchor)}"]`) ||
    document.getElementById(anchor);
  const owner = target?.closest<HTMLElement>('[data-client]');
  const aliases: Record<string, string> = {
    'claude-code': 'claude',
    'github-copilot-in-vs-code': 'copilot',
    'copilot-vs-code': 'copilot',
    'gemini-cli': 'gemini',
  };
  const client =
    (owner && root.value?.contains(owner) ? owner.dataset.client : undefined) ||
    aliases[anchor] ||
    (clients.some(({id}) => id === anchor) ? anchor : url.searchParams.get('client'));
  if (!clients.some(({id}) => id === client)) return;
  selected.value = client!;
  await nextTick();
  const activePanel = panel(client!);
  if (!anchor || !activePanel) return;
  if (target && activePanel.contains(target)) {
    let details = target.closest('details');
    while (details && activePanel.contains(details)) {
      details.open = true;
      details = details.parentElement?.closest('details') ?? null;
    }
    target.scrollIntoView({block: 'start'});
  } else if (aliases[anchor] || clients.some(({id}) => id === anchor)) {
    activePanel.scrollIntoView({block: 'start'});
  }
}

onMounted(() => {
  enhanced.value = true;
  restoreClient();
  window.addEventListener('hashchange', restoreClient);
});
onBeforeUnmount(() => window.removeEventListener('hashchange', restoreClient));
</script>

<template>
  <div ref="root" class="assistant-install">
    <div v-show="enhanced" class="assistant-tabs" role="tablist" aria-label="Choose your assistant">
      <button
        v-for="(client, index) in clients"
        :id="`${groupId}-tab-${client.id}`"
        :key="client.id"
        type="button"
        role="tab"
        :aria-selected="selected === client.id"
        :aria-controls="`${groupId}-panel-${client.id}`"
        :tabindex="selected === client.id ? 0 : -1"
        @click="selectClient(client.id)"
        @keydown="moveTab($event, index)"
      >
        <span v-if="client.id === 'claude'" class="assistant-icon" data-title="Claude Code" aria-hidden="true" />
        <span v-else-if="client.id === 'codex'" class="assistant-icon" data-title="Codex" aria-hidden="true" />
        <span
          v-else-if="client.id === 'copilot'"
          class="assistant-icon"
          data-title="Copilot (VS Code)"
          aria-hidden="true"
        />
        <span v-else-if="client.id === 'cursor'" class="assistant-icon" data-title="Cursor" aria-hidden="true" />
        <span v-else-if="client.id === 'opencode'" class="assistant-icon" data-title="OpenCode" aria-hidden="true" />
        <span v-else-if="client.id === 'gemini'" class="assistant-icon" data-title="Gemini" aria-hidden="true" />
        {{ client.label }}
      </button>
    </div>
    <section
      v-for="client in clients"
      :id="`${groupId}-panel-${client.id}`"
      :key="client.id"
      :data-client="client.id"
      :hidden="enhanced && selected !== client.id"
      :role="enhanced ? 'tabpanel' : undefined"
      :aria-labelledby="enhanced ? `${groupId}-tab-${client.id}` : undefined"
      :tabindex="enhanced ? 0 : undefined"
      class="assistant-panel"
    >
      <slot :name="`${client.id}-title`"
        ><h3 v-show="!enhanced">{{ client.label }}</h3></slot
      >
      <slot :name="client.id" />
    </section>
  </div>
</template>

<style scoped>
.assistant-install {
  min-width: 0;
  margin: 24px 0;
}
.assistant-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid var(--vp-c-divider);
  scrollbar-width: thin;
}
.assistant-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 12px 14px;
  border-bottom: 2px solid transparent;
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.assistant-icon,
.assistant-icon::before {
  display: inline-block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.assistant-icon::before {
  background: var(--icon) no-repeat center / contain;
}
.assistant-tabs button:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}
.assistant-tabs button[aria-selected='true'] {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}
.assistant-tabs button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -4px;
  border-radius: 4px;
}
.assistant-panel {
  min-width: 0;
  padding-top: 8px;
  scroll-margin-top: calc(var(--vp-nav-height) + 48px);
}
.assistant-panel[hidden] {
  display: none;
}
.assistant-panel:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}
.assistant-panel :deep(h2:first-child),
.assistant-panel :deep(h3:first-child) {
  margin-top: 16px;
  padding-top: 0;
  border-top: 0;
}
</style>
