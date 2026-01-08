<script setup>
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <div class="preview-banner">
        <strong>Developer Preview</strong> — This project is in active development. APIs may change.
        <a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues" target="_blank">Provide feedback</a>
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.preview-banner {
  background: linear-gradient(90deg, #0070d2 0%, #00a1e0 100%);
  color: white;
  text-align: center;
  padding: 8px 16px;
  font-size: 14px;
  position: relative;
  z-index: 100;
}

.preview-banner a {
  color: white;
  text-decoration: underline;
  margin-left: 8px;
}

.preview-banner a:hover {
  opacity: 0.9;
}
</style>

<style>
:root {
  --vp-banner-height: 38px;
}

.VPNav {
  top: var(--vp-banner-height) !important;
}

.VPSidebar {
  top: calc(var(--vp-nav-height) + var(--vp-banner-height)) !important;
  height: calc(100vh - var(--vp-nav-height) - var(--vp-banner-height)) !important;
}

.VPContent {
  padding-top: var(--vp-banner-height) !important;
}

.VPLocalNav {
  top: calc(var(--vp-nav-height) + var(--vp-banner-height)) !important;
}
</style>
