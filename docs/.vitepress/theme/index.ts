/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {h} from 'vue';
import DefaultTheme from 'vitepress/theme';
import type {Router} from 'vitepress';
import './custom.css';
import 'virtual:group-icons.css';
import InstallTools from './InstallTools.vue';
import DocCards from './DocCards.vue';
import MarkdownActions from './MarkdownActions.vue';
import AssistantInstall from './AssistantInstall.vue';
import McpInstallButtons from './McpInstallButtons.vue';
import {lookupRedirect} from './redirects';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'aside-top': () => h(MarkdownActions, {variant: 'aside'}),
      'doc-before': () => h(MarkdownActions, {variant: 'inline'}),
      'nav-bar-content-after': () => h(InstallTools),
      'layout-bottom': () => h(InstallTools, {host: true}),
    });
  },
  enhanceApp({app, router, siteData}) {
    app.component('InstallTools', InstallTools);
    app.component('DocCards', DocCards);
    app.component('AssistantInstall', AssistantInstall);
    app.component('McpInstallButtons', McpInstallButtons);

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
      applyRedirect(router, window.location.pathname + window.location.search + window.location.hash);
      const onBeforeRouteChange = router.onBeforeRouteChange;
      router.onBeforeRouteChange = (to: string) => {
        if (applyRedirect(router, to)) return false;
        return onBeforeRouteChange ? onBeforeRouteChange(to) : undefined;
      };
    }
  },
};
