<template>
  <div class="doc-cards"><slot /></div>
</template>

<style scoped>
.doc-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0 36px;
}
.doc-cards :deep(p) {
  margin: 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.doc-cards :deep(a) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
}
.doc-cards :deep(a img) {
  margin: 0;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.doc-cards :deep(p:hover) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
@media (min-width: 1280px) {
  .doc-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .doc-cards {
    grid-template-columns: 1fr;
  }
}
</style>
