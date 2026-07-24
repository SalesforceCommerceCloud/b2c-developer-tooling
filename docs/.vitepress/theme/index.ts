import {h} from 'vue';
import type {Theme} from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import type {Router} from 'vitepress';
import './custom.css';
import 'virtual:group-icons.css';
import HomeLayout from './HomeLayout.vue';
import MarkdownActions from './MarkdownActions.vue';
import QuickstartGuide from './adventure/QuickstartGuide.vue';
import QuickstartIndex from './adventure/QuickstartIndex.vue';
import {lookupRedirect} from './redirects';

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'aside-top': () => h(MarkdownActions, {variant: 'aside'}),
      'doc-before': () => h(MarkdownActions, {variant: 'inline'}),
    });
  },
  enhanceApp({app, router, siteData}) {
    app.component('b2c-home', HomeLayout);
    app.component('QuickstartGuide', QuickstartGuide);
    app.component('QuickstartIndex', QuickstartIndex);

    // Client-side redirects for moved/merged pages (SSR-safe: browser only).
    if (typeof window !== 'undefined') {
      const base = siteData.value.base;
      const applyRedirect = (r: Router, to: string) => {
        const target = lookupRedirect(to, base);
        if (target) {
          const dest = base.replace(/\/$/, '') + target;
          r.go(dest);
          return true;
        }
        return false;
      };
      // Handle the initial load and every in-app navigation.
      applyRedirect(router, window.location.pathname);
      const onBeforeRouteChange = router.onBeforeRouteChange;
      router.onBeforeRouteChange = (to: string) => {
        if (applyRedirect(router, to)) return false;
        return onBeforeRouteChange ? onBeforeRouteChange(to) : undefined;
      };
    }
  },
};

export default theme;
