// Walks a container for <pre><code> elements and injects a Copy button into
// each one. Idempotent — re-running on the same container won't double-add.
//
// Used by AdventureOutput (warnings + verify) and QChoice (rich descriptions
// that may include fenced code blocks via the slot).

import {nextTick, onMounted, onUpdated, type Ref} from 'vue';

const MARKER_ATTR = 'data-b2c-copy-attached';

function attachCopyButton(pre: HTMLPreElement) {
  if (pre.hasAttribute(MARKER_ATTR)) return;
  pre.setAttribute(MARKER_ATTR, 'true');

  // Some VitePress themes wrap <pre> in <div class="language-..."> with
  // existing copy buttons — skip those so we don't double-decorate.
  const parent = pre.parentElement;
  if (parent?.querySelector('.copy')) return;

  // Position the wrapper as relative for absolute button placement.
  pre.style.position = pre.style.position || 'relative';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'b2c-copy-btn';
  btn.textContent = 'Copy';
  btn.setAttribute('aria-label', 'Copy code');

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const code = pre.querySelector('code');
    const text = code?.textContent ?? pre.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      btn.classList.add('b2c-copy-btn--copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('b2c-copy-btn--copied');
      }, 1600);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });

  pre.appendChild(btn);
}

export function useCopyableCode(containerRef: Ref<HTMLElement | null>) {
  function refresh() {
    const root = containerRef.value;
    if (!root) return;
    const pres = root.querySelectorAll<HTMLPreElement>('pre');
    pres.forEach(attachCopyButton);
  }

  onMounted(() => {
    nextTick(() => refresh());
  });
  onUpdated(() => {
    nextTick(() => refresh());
  });

  return {refresh};
}
