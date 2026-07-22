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
}>();

// Discovery-first card. The fetch instruction is a secondary action — the card
// is mainly for learning what skills exist. The copyable text is an instruction
// to the agent (Sentry-style framing), not a bare shell command.
const instruction = computed(() => `Use curl to download, read, and follow: ${props.skill.skillUrl}`);
const MAX_TAGS = 6;
const shownTags = computed(() => props.skill.tags.slice(0, MAX_TAGS));
const extraTags = computed(() => Math.max(0, props.skill.tags.length - MAX_TAGS));
</script>

<template>
  <a :href="skill.skillUrl" target="_blank" rel="noopener" class="skill-card">
    <div class="skill-name">{{ skill.name }}</div>

    <div class="skill-crumb">
      <span v-if="skill.personaLabel" class="skill-persona">{{ skill.personaLabel }}</span>
      <span v-if="skill.category" class="skill-category">{{ skill.category }}</span>
    </div>

    <p class="skill-desc">{{ skill.description }}</p>

    <div v-if="shownTags.length" class="skill-tags">
      <span v-for="tag in shownTags" :key="tag" class="skill-tag">{{ tag }}</span>
      <span v-if="extraTags" class="skill-tag skill-tag--more">+{{ extraTags }}</span>
    </div>

    <div class="skill-card-foot">
      <span class="skill-view">Read skill →</span>
      <CopyButton
        :text="instruction"
        label="Copy for agent"
        copied-label="Copied!"
        title="Copy an instruction you can paste to your AI assistant to fetch this skill"
        @click.stop.prevent
      />
    </div>
  </a>
</template>

<style scoped>
.skill-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
  min-width: 0;
  text-decoration: none;
  color: inherit;
}

.skill-card:hover {
  border-color: var(--vp-c-brand-1);
}

.skill-name {
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  line-height: 1.3;
  /* No truncation — names like b2c-business-manager-extensions wrap fully. */
  word-break: break-word;
}

.skill-crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.skill-persona {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.skill-category {
  color: var(--vp-c-text-3);
}

.skill-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.skill-tag {
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  border-radius: 999px;
  padding: 2px 9px;
}

.skill-tag--more {
  color: var(--vp-c-text-2);
}

.skill-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
}

.skill-view {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}
</style>
