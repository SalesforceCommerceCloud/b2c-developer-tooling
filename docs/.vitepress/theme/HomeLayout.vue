<script setup lang="ts">
import VPHomeHero from 'vitepress/dist/client/theme-default/components/VPHomeHero.vue';
import VPHomeFeatures from 'vitepress/dist/client/theme-default/components/VPHomeFeatures.vue';
import VPHomeContent from 'vitepress/dist/client/theme-default/components/VPHomeContent.vue';
import {useData} from 'vitepress';
import HomePackages from './HomePackages.vue';

const {frontmatter, theme} = useData();
</script>

<template>
  <div
    class="VPHome"
    :class="{'external-link-icon-enabled': theme.externalLinkIcon}"
  >
    <VPHomeHero />

    <VPHomeContent v-if="frontmatter.markdownStyles !== false" class="home-install-section">
      <Content />
    </VPHomeContent>
    <Content v-else />

    <VPHomeFeatures />

    <HomePackages />

    <div v-if="frontmatter.renameNotice" class="home-rename-notice">
      <VPHomeContent>
        <div class="custom-block info">
          <p class="custom-block-title">{{ frontmatter.renameNotice.title }}</p>
          <p>{{ frontmatter.renameNotice.text }}</p>
        </div>
      </VPHomeContent>
    </div>
  </div>
</template>

<style scoped>
.VPHome {
  margin-bottom: 96px;
}

@media (min-width: 768px) {
  .VPHome {
    margin-bottom: 128px;
  }
}

.home-install-section {
  margin-top: 24px;
  margin-bottom: 48px;
}

@media (min-width: 768px) {
  .home-install-section {
    margin-top: 32px;
    margin-bottom: 64px;
  }
}

.home-install-section :deep(h2) {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

</style>
