# Performance self-review checklist

Run this on your own diff before you call a change done, especially when it adds a loader, fetcher, Suspense boundary, modal, context or action. For each section, find the relevant lines in the diff, answer the questions, and fix what fails. Related docs in your project: `docs/README-DATA.md`, `docs/README-SUSPENSE.md`, `docs/README-REVALIDATION.md`, `docs/README-PERFORMANCE.md`.

Impact of a problem is roughly: traffic of the page x instances of the component on it x cost of one occurrence. A fetch in a product tile on a listing page multiplies by every tile; a layout loader re-run multiplies by every action on every page.

## 1. Fetch efficiency

Map the fetch topology for each user gesture (load, navigation, add to cart, open modal): which loaders, fetchers and SCAPI calls run, and in what order.

- [ ] Overlapping loaders: do two active loaders read the same resource? Move it to the lowest common layout and share via `useRouteLoaderData`.
- [ ] Dependent data chained across round trips (fetch A, then B using A, then enrichment) belongs in one loader, with independent calls started in parallel first.
- [ ] Write-in-read: does a GET path create or mutate server state (for example "get or create basket")? Reads called from many places then race or duplicate writes. Separate creation from reads.
- [ ] Prefetch and consume: if one component prefetches and another consumes the same data, they must share one fetcher key, or the data is fetched twice.
- [ ] Unstable references in effect dependencies (object or array literals, fresh callbacks) re-fire fetches on every render. Depend on primitives or stable refs.
- [ ] Fetcher hooks inside list items: N items means N registered fetchers and, when they load on mount, N requests. A `useFetcher` used only on interaction is not amplification; one that loads on mount is. Lift the data into the parent loader or a single batched call (`fetchProductsByIds`).
- [ ] Payload: only the `expand`/`select` values the UI renders.

## 2. Fetcher misuse

Is this a fetcher that should be a loader?

- [ ] A fetch on mount or render whose inputs are known at request time (route params, search params, cookies, context) belongs in the loader. This includes indirect forms: `useEffect` calls an async function that calls `fetch` or `fetcher.load()`, and fetches inside error fallbacks.
- [ ] Does the component ignore `loaderData` and re-fetch the same data? Use the loader data.
- [ ] Legitimate uses: gesture-gated loads (click, hover, open), client-only inputs (geolocation, local selection), re-fetching after a mutation, intent-based prefetch.

## 3. Suspense placement

- [ ] Every `use(promise)` and `<Await>` has a `<Suspense>` ancestor.
- [ ] The boundary is as low as possible: it wraps only the subtree that reads the promise, not the page or layout.
- [ ] The fallback reserves the final size (no layout shift) and is not `null` above the fold without reserved space.

## 4. Suspense granularity

- [ ] Independent consumers have sibling boundaries, so a slow promise does not hold back a fast one.
- [ ] One logical unit that must appear together shares one boundary and one promise composed in the loader.
- [ ] No boundary wrapped around content that is already resolved.

## 5. Promise stability

A new promise object on each render restarts suspension and flashes the fallback.

- [ ] Stable sources only: `loaderData`, `useRouteLoaderData`, `useOutletContext`, props derived from them, `useRef`, `useState` lazy-pinned, module constants.
- [ ] No `Promise.all/race/allSettled`, `.then/.catch/.finally`, `new Promise`, or async IIFE in render. No `useMemo` around a promise.
- [ ] Fixes: compose and transform in the loader (`.then` there); split into separate boundaries; pin with `useState(() => ...)` or re-pin with `useRef` keyed on inputs.

## 6. Hydration and render stability

Render scope should not exceed data-change scope.

- [ ] Values read only inside event handlers or callbacks live in `useRef`, or are read at call time (for example `matchMedia` inside the handler), not in state or Context.
- [ ] Hidden subscribers: components that subscribe to a store but render nothing visible still re-render; return `null` early or move the subscription to the component that renders.
- [ ] Context values are memoized (`useMemo`/`useCallback`); check every field each consumer reads during render, and split state from updaters.
- [ ] Subscriptions sit at the consumer, or in a render-nothing manager that writes to a ref/store.
- [ ] `useSyncExternalStore`: `getServerSnapshot` matches the first client render; `getSnapshot` returns a stable reference when nothing changed.

## 7. Revalidation scope

After an action, every active loader re-runs by default.

- [ ] For each new or changed action and each active loader (matched chain, mounted resource fetchers, open modals and drawers): is there overlap (does the result change what the loader reads) and is the value otherwise unavailable (provider not already updated)? If either is false, gate the loader with `shouldRevalidate`.
- [ ] Confirm the trigger is a real submission (`Form`, `useSubmit`, `fetcher.submit`). Raw `fetch` or SCAPI client calls trigger nothing.
- [ ] Modals and drawers count twice: as targets (fetchers they load when open) and as triggers (actions they submit). Unmount them when closed (`useDeferredUnmount`).
- [ ] A gate must inspect the action path or `actionResult`; checking only that `formAction` is set still re-runs on everything.
- [ ] Do not gate off a re-run that is the sync mechanism for a provider.

See `storefront-next:sfnext-revalidation`.

## 8. Client-side transforms

- [ ] Shape data in the loader, not during render: lookup maps, chained filter/map passes, deep spreads, slug or URL normalization.
- [ ] `useMemo` does not fix transforming loader data on every mount; move it to the loader.
- [ ] Exceptions: values derived from UI state (selected variant, local filter), and work inside event handlers.

## 9. Also check

- [ ] Images: LCP image has `priority="high"` and is not lazy; `widths` match the layout.
- [ ] New dependency: check bundle impact with `pnpm bundlesize`; lazy-load heavy, hidden UI.
- [ ] Third-party scripts: `async` or `defer`, loaded after consent where required.
- [ ] New preconnect only for origins used on every page.
- [ ] Added routes export the right `shouldRevalidate`.

## Reporting

For each finding note where it is (file and line), the rule it breaks, who pays (every shopper, every tile, every action), and the smallest fix. Prefer fixing the highest-multiplier problems first.
