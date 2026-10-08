# State patterns and anti-patterns

## Render scope should not exceed data-change scope

If a value changes often but only event handlers read it, do not store it in state or Context. Keep it in a `useRef` or read it at call time (for example `window.matchMedia(...).matches` inside the handler). Every state change re-renders the component and all consumers of a Context value.

Hidden subscribers: a component that subscribes to a store but renders nothing visible (an invisible drawer) still re-renders. Return `null` early or move the subscription to the component that renders the content.

## Provider value stability

```tsx
const value = useMemo(() => ({ items, isOpen }), [items, isOpen]);
const actions = useMemo(() => ({ open, close }), [open, close]); // useCallback inside
return (
    <StateContext.Provider value={value}>
        <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
);
```

Check each field read during render: if a consumer uses only `isOpen`, it still re-renders when `items` changes with one combined context. Split or use a selector.

## Manager components

A component that only subscribes to data to perform a side effect (for example syncing the basket cookie, like `BasketCookieReconciler`) should render `null` and live as a leaf so the parent is not re-rendered.

## Server versus client snapshots

For `useSyncExternalStore`, `getServerSnapshot` must equal what the first client render will read, or React warns and re-renders. Read browser-only data (storage, matchMedia) after mount in an effect and then write it into the store.

## URL state

Prefer URL state for anything a shopper might share or reload. Changing search params triggers navigation and loader re-run; see `storefront-next:sfnext-revalidation` to skip re-runs for client-only params. Use `setSearchParams(next, { replace: true, preventScrollReset: true })` for high-frequency updates such as typing.

## Cookies

Cookies written by the server are set from `action` or middleware responses. Use the helpers in `src/lib/cookie-utils.server.ts` (site-scoped names, domain resolution, `createCookie`). Do not store personal data or tokens in cookies readable by scripts. Consent state is covered by `storefront-next:sfnext-analytics-consent`.

## Derived state

Compute derived values during render. `useMemo` is for expensive pure computations of UI-derived values; it does not fix transforming loader data in render (do that in the loader) and must not wrap promises.

## Testing state

Render with the real provider in tests, or mock the hook module (`vi.mock('@/providers/basket')`). For stores, call the exported setters inside `act` and reset module state between tests. See `storefront-next:sfnext-testing`.
