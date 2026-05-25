import {h} from 'vue';
import type {Theme} from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import 'virtual:group-icons.css';
import HomeLayout from './HomeLayout.vue';
import MarkdownActions from './MarkdownActions.vue';
import QuickstartGuide from './adventure/QuickstartGuide.vue';
import QuickstartIndex from './adventure/QuickstartIndex.vue';

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'aside-top': () => h(MarkdownActions, {variant: 'aside'}),
      'doc-before': () => h(MarkdownActions, {variant: 'inline'}),
    });
  },
  enhanceApp({app}) {
    app.component('b2c-home', HomeLayout);
    app.component('QuickstartGuide', QuickstartGuide);
    app.component('QuickstartIndex', QuickstartIndex);
  },
};

export default theme;
