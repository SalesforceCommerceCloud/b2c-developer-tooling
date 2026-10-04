# Stories and Storybook Checks

Project reference: `docs/README-STORYBOOK.md` (taxonomy, decorators, mock routes, play functions) and `docs/README-STORY-COVERAGE.md`.

## Layout

- Stories go in a `stories/` subfolder beside the component: `cart/cart-content.tsx` is matched by `cart/stories/cart-content.stories.tsx`; `cart/index.tsx` by `cart/stories/index.stories.tsx`. Coverage tooling only recognizes stories there.
- `src/components/ui/` (shadcn forks) is excluded from story coverage and generated story tests.
- Snapshot baselines use a fixture file `<name>-snapshot.tsx` next to the story and write to `stories/__snapshots__/`. Copy the small wrapper from `src/components/collapsible-section/stories/collapsible-section-snapshot.tsx`; `product-tile/stories/` shows a richer one.

## Minimal story

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromoBadge } from '../index';

const meta: Meta<typeof PromoBadge> = {
    title: 'Products/Promo Badge',
    component: PromoBadge,
    tags: ['autodocs'],
    args: { label: '20% off' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

Import types from `@storybook/react-vite` (not `@storybook/react`). Include the Apache header.

## Titles

`meta.title` is `Domain/Component` or `Domain/Subgroup/Component`, Title Case With Spaces. Use an existing top-level group: Account, Authentication, Cart, Category, Checkout, Content, Core, Design System, Extensions, Home, Layout, Products, Search. Pick by purpose, not folder. Titles are convention, not lint-enforced; you may restructure the sidebar for your brand.

## Writing good stories

- Props first; mock at the route boundary via story parameters (`routeLoaderData`, `scapiMock`, `mockRoutes`), not `vi.mock` of hooks.
- Reuse fixtures from `@/components/__mocks__` and config from `@/test-utils/config` instead of inventing data shapes.
- No promises or other non-serializable values in `args`.
- Hide `className` and ReactNode props from Controls (`control: false, table: { disable: true }`).
- Interactive components: add a `play` function and the `'interaction'` tag.

## Commands

```bash
pnpm storybook                               # dev server on :6006
pnpm storybook:test --type=snapshot          # jsdom snapshot gate
pnpm storybook:test --type=snapshot --update # refresh baselines after an intended DOM change
pnpm storybook:test --type=interaction       # real Chromium, runs play()
pnpm storybook:test --type=a11y              # axe-core
```

Only run `--update` for changes you meant to make, and check the diff is additive before committing. After a theme change (colors, shape), snapshots of DOM markup normally do not change, but visual review in the `Design System/Theme/*` stories is worthwhile.
