import {h} from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import HomeQuickInstall from './HomeQuickInstall.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () =>
        h('div', {class: 'preview-banner'}, [
          h('strong', 'Developer Preview'),
          ' — This project is in active development. APIs may change. ',
          h(
            'a',
            {href: 'https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues', target: '_blank'},
            'Provide feedback',
          ),
        ]),
      'home-features-before': () => h(HomeQuickInstall),
    });
  },
};
