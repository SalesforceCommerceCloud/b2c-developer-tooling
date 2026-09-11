<template>
  <figure class="example-prompt">
    <figcaption>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" />
        <path d="M8 8h8M8 12h5" />
      </svg>
      Example prompt
    </figcaption>
    <slot />
  </figure>
</template>

<style scoped>
.example-prompt {
  margin: 20px 0;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
}
.example-prompt figcaption {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}
.example-prompt svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.example-prompt :deep(blockquote) {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--vp-c-text-1);
}
.example-prompt :deep(blockquote p) {
  margin: 0;
  color: inherit;
  font-size: 15px;
  font-style: italic;
  line-height: 1.65;
}
</style>
