<script setup lang="ts">
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
const props = defineProps<{client: 'vscode' | 'cursor'}>();
const config = {command: 'npx', args: ['-y', '@salesforce/b2c-dx-mcp@latest']};
const vscodeUrl = `https://vscode.dev/redirect/mcp/install?name=b2c-dx-mcp&config=${encodeURIComponent(JSON.stringify({type: 'stdio', ...config}))}`;
const cursorUrl = `cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=${encodeURIComponent(btoa(JSON.stringify(config)))}`;
</script>

<template>
  <div class="mcp-install-buttons">
    <a
      class="mcp-install-button"
      :href="props.client === 'vscode' ? vscodeUrl : cursorUrl"
      :target="props.client === 'vscode' ? '_blank' : undefined"
      rel="noopener"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Install in {{ props.client === 'vscode' ? 'VS Code' : 'Cursor' }}
    </a>
  </div>
</template>

<style scoped>
.mcp-install-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}
.vp-doc a.mcp-install-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 0;
  border-radius: 4px;
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;
}
.vp-doc a.mcp-install-button:hover,
.vp-doc a.mcp-install-button:focus-visible {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
