# Unit and route tests

## Environment (`vitest.config.ts`, `vitest.setup.ts`)

- jsdom, `globals: true`, `@/` alias, `testTimeout` 15s, Testing Library `asyncUtilTimeout` 10s, `pool: 'forks'` on Windows.
- Setup already: jest-dom matchers, `window.__APP_CONFIG__ = mockConfig`, i18next initialized with all locales (language `en-GB`), `vitest-localstorage-mock`, and a global mock of `@/hooks/use-analytics`.
- The global analytics mock means a missing `track*` call will not fail an ordinary test. To assert on tracking, call `vi.unmock('@/hooks/use-analytics')` in a `beforeEach` and provide your own spy implementation.
- Static assets and `virtual:action-hooks` are aliased to mocks.

## Helper inventory

`@/test-utils/*` (src/test-utils):

| Import | Provides |
|--------|----------|
| `@/test-utils/config` | `mockConfig`, `mockBuildConfig`, `mockSiteObject`, `mockAltSiteObject`, `mockLocale`, `getSitePrefix`, `ConfigWrapper`, `createConfigWrapper(overrides)` |
| `@/test-utils/context-provider` | `ConfigWrapper`, `AllProvidersWrapper` (config + site + store locator + UI targets; props `config`, `currency`) |
| `@/test-utils/auth` | `buildMockAccessToken`, `buildMockTokenResponse` |
| `@/test-utils/request-helpers` | `createFormDataRequest(url, method, data)` |
| `@/test-utils/wishlist` | `resetWishlistStore`, `seedWishlistStore` |
| `@/test-utils/page-designer-host-provider` | `PageDesignerHostProvider` |

`@/lib/test-utils` (src/lib/test-utils):

| Export | Use |
|--------|-----|
| `createTestContext(opts)` | A `RouterContextProvider` with auth, app config, i18n, site (locale/currency), maintenance and performance-timer contexts. Options: `authSession` (`null` for no session), `rejectAuth`/`authError`, `appConfig`, `locale` (default `en-GB`), `currency` (default `GBP`), `skipI18next`. |
| `createLoaderArgs(request, context, { params, pattern })` | Full `LoaderFunctionArgs`; pass `<Route.LoaderArgs>` as type parameter for typed loaders. |
| `createActionArgs(...)` | Same for actions. |
| `ROUTE_PATTERN` | Safe placeholder for `pattern`. |
| `expectStatus(result, 400)` | Assert status of a `data()` response (missing status counts as 200). |

Fixtures: `@/components/__mocks__` (and `@/components/__mocks__/<file>`), for example `basketWithOneItem`, `emptyBasket`, `masterProduct`, `mockStandardProductOrderable`, `mockCategories`.

## Loader/action pattern

Model new tests on `src/routes/resource.basket-products.test.ts` and the `_app.p.$.loader.test.ts` / `_app.cart.test.tsx` route tests:

1. `vi.mock('@/lib/api-clients.server', () => ({ createApiClients: vi.fn() }))` and return fake SCAPI clients per test.
2. Mock `@/middlewares/basket.server` (`getBasket`) or auth helpers if the route reads them.
3. Build context with `createTestContext`, args with `createLoaderArgs`/`createActionArgs`, call the exported `loader`/`action`.
4. Assert the returned object, thrown `Response`, or `expectStatus`.
5. For routes exporting `shouldRevalidate`, call it directly (see `docs/README-REVALIDATION.md`).

Use `createFormDataRequest` for action input.

## MSW

`msw` is a dev dependency. For HTTP-level tests use `setupServer` from `msw/node` and `http`/`HttpResponse` from `msw` (example: `src/components/checkout/checkout-flow.test.tsx`). Start the server in `beforeAll`, `resetHandlers` in `afterEach`, `close` in `afterAll`.

## Hooks and components

- Hooks: `renderHook(() => useX(), { wrapper: ConfigWrapper })` with the wrapper from `@/test-utils/config`.
- Components needing site/config/UI targets: `render(ui, { wrapper: AllProvidersWrapper })`.
- Component tests that mock `react-router` must provide every export the component tree uses.
- Prefer `userEvent` from `@testing-library/user-event` over `fireEvent`, and role-based queries.

## i18n in tests

See `storefront-next:sfnext-i18n`: i18next is initialized globally; use `createTestContext({ locale })` for loaders.
