<script setup lang="ts">
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {onBeforeUnmount, onMounted, ref, useId} from 'vue';
import {withBase} from 'vitepress';
import PluginInstall from '../../_partials/mcp-plugin-install.md';

const props = defineProps<{host?: boolean}>();
const dialog = ref<HTMLDialogElement>();
const titleId = useId();
let previousOverflow = '';
let opener: HTMLElement | null = null;

function open() {
  if (!props.host) {
    window.dispatchEvent(new Event('b2c-install-tools'));
    return;
  }
  if (dialog.value?.open) return;
  opener = document.activeElement as HTMLElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.value?.showModal();
}

function closed() {
  document.body.style.overflow = previousOverflow;
  opener?.focus();
}

function close() {
  dialog.value?.close();
}

function followSetupLink(event: MouseEvent) {
  const link = (event.target as Element).closest('a');
  if (link && new URL(link.href).origin === window.location.origin) close();
}

onMounted(() => {
  if (props.host) window.addEventListener('b2c-install-tools', open);
});

onBeforeUnmount(() => {
  if (props.host) window.removeEventListener('b2c-install-tools', open);
  if (dialog.value?.open) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <button v-if="!props.host" class="install-tools-trigger" type="button" @click="open">Install AI Tools</button>
  <Teleport v-else to="body">
    <dialog
      ref="dialog"
      class="install-tools-dialog"
      :aria-labelledby="titleId"
      @close="closed"
      @click="(event) => event.target === dialog && close()"
    >
      <div class="install-tools-body vp-doc">
        <header>
          <h2 :id="titleId">Install AI Tools</h2>
          <button class="install-close" type="button" aria-label="Close installation" autofocus @click="close">
            &#215;
          </button>
        </header>
        <p>B2C Commerce tools, documentation, and skills for your assistant.</p>
        <div @click="followSetupLink"><PluginInstall /></div>
        <p>No separate skills plugins needed.</p>
        <a :href="withBase('/mcp/#other-mcp-clients')" @click="close">Other clients and manual setup &rarr;</a>
        <footer>
          <a :href="withBase('/guide/installation')" @click="close">Install CLI</a>
          <a :href="withBase('/vscode-extension/installation')" @click="close">Install IDE extension</a>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.install-tools-trigger {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  white-space: nowrap;
  transition:
    background-color 0.15s linear,
    border-color 0.15s linear;
}
.install-tools-trigger:hover,
.install-tools-trigger:focus-visible {
  color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-soft);
}
.install-tools-dialog {
  width: min(840px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 16px 64px #0003;
}
.install-tools-dialog::backdrop {
  background: #172d4655;
}
.install-tools-body {
  padding: 24px;
  min-width: 0;
}
.install-tools-body :deep(.vp-code-group .tabs),
.install-tools-body :deep(div[class*='language-']) {
  margin-left: 0;
  margin-right: 0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.install-tools-body h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 22px;
}
.install-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  font-size: 26px;
  border-radius: 4px;
}
.install-close:hover {
  background: var(--vp-c-bg-soft);
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 14px;
}
@media (max-width: 600px) {
  .install-tools-body {
    padding: 20px;
  }
}
</style>
