<script setup lang="ts">
import {ref} from 'vue';

const tabs = [
  {label: 'npm', code: 'npm install -g @salesforce/b2c-cli'},
  {label: 'npx', code: 'npx @salesforce/b2c-cli --help'},
  {label: 'Homebrew', code: 'brew install SalesforceCommerceCloud/tools/b2c-cli'},
];

const active = ref(0);
</script>

<template>
  <section class="quick-install">
    <div class="container">
      <h2>Quick Install</h2>
      <p>Get started with the CLI in seconds:</p>
      <div class="tabs">
        <div class="tab-bar">
          <button
            v-for="(tab, i) in tabs"
            :key="tab.label"
            :class="['tab-btn', {active: active === i}]"
            @click="active = i"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="tab-panel">
          <code>{{ tabs[active].code }}</code>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.quick-install {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px 24px;
  text-align: center;
}

.quick-install h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.quick-install p {
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
}

.tabs {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
}

.tab-bar {
  display: flex;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: transparent;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}

.tab-panel {
  padding: 16px 20px;
  background: var(--vp-code-block-bg);
}

.tab-panel code {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--vp-c-text-1);
}
</style>
