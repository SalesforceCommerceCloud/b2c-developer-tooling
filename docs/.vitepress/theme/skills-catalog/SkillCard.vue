<!--
  Copyright (c) 2025, Salesforce, Inc.
  SPDX-License-Identifier: Apache-2
  For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
-->
<script setup lang="ts">
import {computed} from 'vue';
import CopyButton from './CopyButton.vue';
import type {SkillRecord} from './types';

const props = defineProps<{
  skill: SkillRecord;
  activeTags: string[];
}>();

const emit = defineEmits<{(e: 'toggle-tag', tag: string): void}>();

const curl = computed(() => `curl -sL ${props.skill.skillUrl}`);
</script>

<template>
  <div class="skill-card">
    <div class="skill-card-head">
      <a :href="skill.skillUrl" target="_blank" rel="noopener" class="skill-name">{{ skill.name }}</a>
      <span class="skill-plugin">{{ skill.plugin }}</span>
    </div>

    <div v-if="skill.personaLabel || skill.category" class="skill-crumb">
      <span v-if="skill.personaLabel">{{ skill.personaLabel }}</span>
      <span v-if="skill.personaLabel && skill.category" class="skill-crumb-sep">›</span>
      <span v-if="skill.category">{{ skill.category }}</span>
    </div>

    <p class="skill-desc">{{ skill.description }}</p>

    <div v-if="skill.tags.length" class="skill-tags">
      <button
        v-for="tag in skill.tags"
        :key="tag"
        type="button"
        class="skill-tag"
        :class="{'skill-tag--active': activeTags.includes(tag)}"
        @click="emit('toggle-tag', tag)"
      >
        {{ tag }}
      </button>
    </div>

    <div class="skill-card-foot">
      <code class="skill-curl" :title="curl">{{ curl }}</code>
      <CopyButton :text="curl" label="Copy curl" copied-label="Copied!" :title="`Copy ${curl}`" />
    </div>
  </div>
</template>

<style scoped>
.skill-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.skill-card:hover {
  border-color: var(--vp-c-brand-1);
}

.skill-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.skill-name {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.skill-name:hover {
  text-decoration: underline;
}

.skill-plugin {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  padding: 2px 8px;
  border-radius: 999px;
}

.skill-crumb {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.skill-crumb-sep {
  margin: 0 4px;
  color: var(--vp-c-text-3);
}

.skill-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-tag {
  font-size: 11px;
  font-family: inherit;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 1px 8px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.skill-tag:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.skill-tag--active {
  color: var(--vp-c-bg);
  background: var(--vp-c-brand-1);
}

.skill-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
}

.skill-curl {
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
</style>
