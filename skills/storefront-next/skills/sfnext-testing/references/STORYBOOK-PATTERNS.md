# Storybook patterns

Source of truth in your project: `docs/README-STORYBOOK.md`, `.storybook/`, and the existing `stories/` folders. Copy a neighbor story before inventing structure.

## Principles

1. Props first. Reach for the global provider/router stack only when the component reads global context (auth, basket, site, locale).
2. Mock at the boundary. Prefer `parameters.routeLoaderData`, `parameters.scapiMock`, `parameters.mockRoutes` over `vi.mock` of hooks.
3. Args are JSON-serializable. Promises, class instances and functions returning promises break the Controls panel and snapshot serialization; put them in `parameters`.
4. One reason to update a mock. If an internal refactor forces story edits, the mock is too deep.

## Decorator stack

`.storybook/preview.tsx` applies `decorators: [withRouter(StoryShell)]` to every story:

```
withRouter(StoryShell)        in-memory React Router with default mock routes
  StoryShell
    StorybookWrapper          config + site + i18n + auth + basket + storeLocator + checkoutOneClick
      UITargetProviders
        <Story />
```

Files: `.storybook/decorators/{with-router,with-providers,with-ui-targets,mock-routes}.tsx|ts`. Because of this, a story usually needs no per-story `ConfigProvider` or `SiteProvider`. If you do need to override config for one story, wrap with `ConfigProvider` from `@salesforce/storefront-next-runtime/config` and `SiteProvider` from `@salesforce/storefront-next-runtime/site-context`, using `mockConfig`, `mockLocale`, `mockSiteObject` from `@/test-utils/config` (see `src/components/footer/stories/index.stories.tsx`).

## Story parameters

| Parameter | Use |
|-----------|-----|
| `routeLoaderData: Record<string, unknown>` | Wrap the story in ancestor routes so `useRouteLoaderData(routeId)` resolves. Required for components that read a parent route's loader data. |
| `scapiMock: { data?: unknown }` | Override the default `/resource/api/client/:resource` response, for stories whose `play()` asserts specific product data. |
| `miniCartData: { basket, productsById }` | Override what `/resource/basket-products` returns (for example an empty cart). |
| `mockRoutes: RouteObject[]` | Add story-specific `/resource/*` or `/action/*` routes. Must not shadow `/`, `*` or a default mock path; `withRouter` throws on conflicts. |

`buildDefaultMockRoutes` (in `.storybook/decorators/mock-routes.ts`) lists the default routes: basket enrichment, cart mutations, wishlist, OTP, product/bundle/set adds, site-context updates, tracking consent, place-order.

## Titles and sidebar

`meta.title` is `Domain/Component` or `Domain/Subgroup/Component`, Title Case With Spaces. Top-level groups: Account, Authentication, Cart, Category, Checkout, Content, Core, Design System, Extensions, Home, Layout, Products, Search. Pick the closest existing group by purpose, not by folder. This is a convention, not lint-enforced, and you may restructure it for your brand.

## Naming and layout

| Thing | Convention |
|-------|-----------|
| Story file | `*.stories.tsx` in `stories/` next to the component (required) |
| Story export | PascalCase state name: `Default`, `Loading`, `InvalidEmailError` |
| Snapshot fixture | `<name>-snapshot.tsx` next to the story, with `__snapshots__/` beside it |
| shadcn primitives in `src/components/ui/` | No stories or coverage requirement |

Default to one component per folder. Snapshot fixtures use `StoryTestWrapper` from `@storybook/test-utils`; copy an existing `*-snapshot.tsx` pair (for example under `src/components/footer/stories/`).

## argTypes

Expose only what visibly drives the canvas:

```tsx
argTypes: {
    label: { control: 'text', description: 'Label in the summary row' },
    className: { control: false, table: { disable: true } },
    onCancel: { action: 'cancel' },
}
```

## play() functions

```tsx
import { expect, userEvent, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';

play: async ({ canvasElement }) => {
    await waitForStorybookReady(canvasElement);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /add to cart/i }));
    await expect(canvas.getByRole('status')).toHaveTextContent(/added/i);
},
```

- Tag the story `interaction` so it runs in `--type=interaction`.
- Dialogs, popovers and toasts render into `document.body`; use `within(canvasElement.ownerDocument.body)`.
- Assert outcomes (role, accessible name, focus, text), not CSS classes.
- To re-render a story when an arg changes (keyed state), key the component on that prop.

## Accessibility in stories

The a11y addon mode is `todo` (reports, does not fail) by default. `pnpm storybook:test --type=a11y` runs with `STORYBOOK_A11Y_TEST_MODE=error`. `STORYBOOK_DISABLE_A11Y=true` turns it off. Tag `skip-a11y` excludes a story from a11y runs. To make one file strict regardless, spread `{ a11y: { test: 'error' } }` into its `parameters` (see `src/components/checkout/storybook/checkout-strict-a11y-parameters.ts`). See `storefront-next:sfnext-accessibility`.

## Story coverage

Stories count toward component coverage when they match the component path (`cart/cart-content.tsx` maps to `cart/stories/cart-content.stories.tsx`; `index.tsx` maps to `stories/index.stories.tsx`). `pnpm storybook:test --type=snapshot --coverage` generates story tests and reports; details in `docs/README-STORY-COVERAGE.md`.

## Anti-patterns

- Recreating the component's data shape as a giant literal instead of passing a fixture.
- Promises in `args`.
- `vi.mock` of hooks inside a story.
- Separate Mobile/Tablet/Desktop stories (use the viewport toolbar).
- Novel top-level title groups.
