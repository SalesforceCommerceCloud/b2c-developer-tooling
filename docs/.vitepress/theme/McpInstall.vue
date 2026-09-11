<script setup lang="ts">
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {onMounted} from 'vue';

const clients = [
  {id: 'codex', label: 'Codex'},
  {id: 'claude', label: 'Claude Code'},
  {id: 'claude-desktop', label: 'Claude Desktop'},
  {id: 'copilot', label: 'GitHub Copilot in VS Code'},
  {id: 'copilot-cli', label: 'GitHub Copilot CLI'},
  {id: 'cursor', label: 'Cursor'},
  {id: 'windsurf', label: 'Windsurf'},
  {id: 'gemini', label: 'Gemini CLI'},
  {id: 'opencode', label: 'OpenCode'},
  {id: 'cline', label: 'Cline'},
  {id: 'amp', label: 'Amp'},
  {id: 'warp', label: 'Warp'},
  {id: 'zed', label: 'Zed'},
  {id: 'jetbrains', label: 'JetBrains AI Assistant'},
  {id: 'fx', label: 'fx'},
  {id: 'other', label: 'Other MCP clients'},
];
const selected = defineModel<string>({default: 'codex'});

onMounted(() => {
  const client = new URL(window.location.href).searchParams.get('client');
  if (clients.some(({id}) => id === client)) selected.value = client!;
});

function selectClient() {
  const url = new URL(window.location.href);
  url.searchParams.set('client', selected.value);
  window.history.replaceState(window.history.state, '', url);
}
</script>

<template>
  <div class="mcp-install">
    <div class="client-picker">
      <label for="mcp-client">Choose your assistant</label>
      <select id="mcp-client" v-model="selected" aria-controls="mcp-client-instructions" @change="selectClient">
        <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.label }}</option>
      </select>
    </div>
    <section id="mcp-client-instructions" :aria-label="`${clients.find((c) => c.id === selected)?.label} installation`">
      <slot :name="selected" />
    </section>
  </div>
</template>

<style scoped>
.client-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin: 24px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

label {
  font-weight: 600;
}

select {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  appearance: auto;
}

select:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

@media (max-width: 480px) {
  select {
    flex-basis: 100%;
  }
}
</style>
