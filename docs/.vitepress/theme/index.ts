import {h} from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import HomeQuickInstall from './HomeQuickInstall.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-features-before': () => h(HomeQuickInstall),
    });
  },
};
