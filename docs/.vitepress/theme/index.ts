import {h} from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import 'virtual:group-icons.css';
import HomeLayout from './HomeLayout.vue';
import MarkdownActions from './MarkdownActions.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'aside-top': () => h(MarkdownActions, {variant: 'aside'}),
      'doc-before': () => h(MarkdownActions, {variant: 'inline'}),
    });
  },
  enhanceApp({app}) {
    app.component('b2c-home', HomeLayout);
  },
};
