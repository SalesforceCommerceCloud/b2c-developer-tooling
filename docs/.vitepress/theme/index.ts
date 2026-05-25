import {h} from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import 'virtual:group-icons.css';
import HomeLayout from './HomeLayout.vue';
import MarkdownActions from './MarkdownActions.vue';
import QuickstartAdventure from './adventure/QuickstartAdventure.vue';
import QuickstartIndex from './adventure/QuickstartIndex.vue';
import Wizard from './adventure/declarative/Wizard.vue';
import QStep from './adventure/declarative/QStep.vue';
import QChoice from './adventure/declarative/QChoice.vue';

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
    app.component('QuickstartAdventure', QuickstartAdventure);
    app.component('QuickstartIndex', QuickstartIndex);
    app.component('Wizard', Wizard);
    app.component('QStep', QStep);
    app.component('QChoice', QChoice);
  },
};
