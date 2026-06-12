<script setup lang="ts">
import {computed, ref} from 'vue';
import {withBase} from 'vitepress';
import type {Adventure, SynthesizedConfig} from '../../data/adventures/_types.js';
import {renderBlock} from './_markdown.js';
import {useCopyableCode} from './useCopyableCode.js';

const warningsRef = ref<HTMLElement | null>(null);
useCopyableCode(warningsRef);

const props = defineProps<{
  adventure: Adventure;
  result: SynthesizedConfig;
}>();

// Warnings are markdown-with-fenced-code. Inline links/bold/code AND fenced
// blocks are honoured. Internal absolute paths go through withBase.
function renderWarning(s: string): string {
  return renderBlock(s, (path) => withBase(path));
}

const tab = ref<'primary' | 'env'>('primary');
const copied = ref(false);

// For agent-mcp, the primary slot is install commands, not dw.json — adjust
// the tab label so it doesn't say "dw.json" for shell snippets.
const primaryLabel = computed(() => (props.adventure.id === 'agent-mcp' ? 'Install commands' : 'dw.json'));
const primaryLang = computed(() => (props.adventure.id === 'agent-mcp' ? 'bash' : 'json'));

// "Verify with CLI" only applies when the verify is an actual CLI command
// (starts with `b2c`, `npm`, `claude`, `copilot`, etc.); fall back to plain
// "Verify" for prose instructions like "In your IDE, ask the agent: ...".
const verifyHeading = computed(() => {
  const cmd = props.result.verifyCommand.trim();
  return /^(b2c|npx|npm|pnpm|claude|copilot|codex)\b/.test(cmd) ? 'Verify with CLI' : 'Verify';
});

async function copyPrimary() {
  try {
    const text = tab.value === 'env' && props.result.env ? props.result.env : props.result.dwJson;
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

function checklistHref(item: SynthesizedConfig['checklist'][number]): string {
  const a = item.href;
  if (/^https?:\/\//.test(a.path)) return a.path;
  return withBase(a.path) + (a.hash ? `#${a.hash}` : '');
}
</script>

<template>
  <section class="b2c-output">
    <header class="b2c-output__head">
      <h2 class="b2c-output__title">Your configuration</h2>
      <p class="b2c-output__sub">
        Replace the <code>&lt;PLACEHOLDER&gt;</code> values, then run the verify command at the bottom.
      </p>
    </header>

    <div class="b2c-output__tabs">
      <button
        type="button"
        :class="['b2c-output__tab', {'b2c-output__tab--active': tab === 'primary'}]"
        @click="tab = 'primary'"
      >
        {{ primaryLabel }}
      </button>
      <button
        v-if="result.env"
        type="button"
        :class="['b2c-output__tab', {'b2c-output__tab--active': tab === 'env'}]"
        @click="tab = 'env'"
      >
        .env
      </button>
      <button type="button" class="b2c-output__copy" @click="copyPrimary">
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <pre v-if="tab === 'primary'" class="b2c-output__code"><code :class="`language-${primaryLang}`">{{ result.dwJson }}</code></pre>
    <pre v-else-if="tab === 'env' && result.env" class="b2c-output__code"><code class="language-bash">{{ result.env }}</code></pre>

    <div v-if="result.warnings && result.warnings.length" ref="warningsRef" class="b2c-output__warnings">
      <div v-for="(w, i) in result.warnings" :key="i" class="b2c-output__warning" v-html="renderWarning(w)"></div>
    </div>

    <h3 class="b2c-output__h3">Checklist</h3>
    <ol class="b2c-output__list">
      <li v-for="(item, i) in result.checklist" :key="i">
        <a :href="checklistHref(item)" target="_blank" rel="noopener">{{ item.text }} →</a>
      </li>
    </ol>

    <h3 class="b2c-output__h3">{{ verifyHeading }}</h3>
    <pre class="b2c-output__code b2c-output__verify"><code class="language-bash">{{ result.verifyCommand }}</code></pre>
  </section>
</template>

<style scoped>
.b2c-output {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 12px;
  padding: 20px;
}

.b2c-output__head {
  margin-bottom: 14px;
}

.b2c-output__title {
  margin: 0;
  font-size: 18px;
  border: none;
  padding: 0;
}

.b2c-output__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.b2c-output__tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: -1px;
}

.b2c-output__tab {
  padding: 6px 12px;
  font-size: 13px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-family: inherit;
}

.b2c-output__tab:hover {
  color: var(--vp-c-brand-1);
}

.b2c-output__tab--active {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
  border-bottom-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.b2c-output__copy {
  margin-left: auto;
  font-size: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-family: inherit;
}

.b2c-output__copy:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.b2c-output__code {
  margin: 0 0 14px;
  padding: 14px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.5;
}

.b2c-output__verify {
  margin-bottom: 0;
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.b2c-output__warnings {
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.b2c-output__warning {
  padding: 12px 14px;
  background: var(--vp-c-bg-soft);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.b2c-output__warning :deep(pre.b2c-output__inline-code) {
  margin: 8px 0 0;
  padding: 10px 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: auto;
  font-size: 12px;
  color: var(--vp-c-text-1);
}

.b2c-output__h3 {
  margin: 18px 0 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  border: none;
  padding: 0;
}

.b2c-output__list {
  margin: 0 0 8px 20px;
  padding: 0;
  font-size: 14px;
  line-height: 1.7;
}

.b2c-output__list a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.b2c-output__list a:hover {
  text-decoration: underline;
}
</style>
