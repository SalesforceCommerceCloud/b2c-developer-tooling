---
name: sfnext-i18n
description: >-
  Translate and localize a Storefront Next storefront with i18next: useTranslation in components, getTranslation in loaders/actions/utilities, translations.json namespaces, pluralization and interpolation, Zod validation-message factories, adding a new language or locale, extension translations, and locale/currency switching. Use when adding or editing strings, "add a Brazilian Portuguese locale", supportedLngs / fallbackLng / supportedLocales, src/locales, locales:aggregate-extensions, LocaleSwitcher, mockI18nContext, hydration mismatch on translated text, or missing-key problems. Do not use for site/locale URL prefix routing (use `storefront-next:sfnext-routing`), site and currency configuration keys (use `storefront-next:sfnext-configuration`), or extension scaffolding (use `storefront-next:sfnext-extensions`).
---

# Storefront Next Internationalization

Storefront Next uses `i18next` with a server instance (all languages loaded) and a browser instance (loads the active language as a static JS chunk). The infrastructure comes from `@salesforce/storefront-next-runtime/i18n`; your project owns the translations in `src/locales/`. The full guide ships in your project as `docs/README-I18N.md`. Caution: its locale-detection and `set-locale` passages are outdated; trust the code and this skill.

## Which API to use

| Where | API |
|-------|-----|
| React components | `useTranslation` from `react-i18next` |
| Loaders, actions, middleware, utilities, tests | `getTranslation` from `@salesforce/storefront-next-runtime/i18n` |

```tsx
import { useTranslation } from 'react-i18next';

export function AddToCart({ count }: { count: number }) {
    const { t } = useTranslation('product'); // namespace = top-level key in translations.json
    return <button>{t('addToCart', { count })}</button>;
}
```

```ts
import type { LoaderFunctionArgs } from 'react-router';
import { getTranslation } from '@salesforce/storefront-next-runtime/i18n';

export function loader({ context }: LoaderFunctionArgs) {
    const { t } = getTranslation(context); // server: pass the router context
    return { title: t('product:title') };
}
```

- Without a namespace argument, prefix keys: `useTranslation()` then `t('product:title')` works. You lose key autocomplete, not correctness.
- Client-only non-component code may call `getTranslation()` with no argument.
- Other exports from the same module: `getLocale`, `mockI18nContext` (tests), `createI18nMiddleware`.

## File layout

```
src/locales/
├── index.ts               # barrel: explicit import of every locale
├── types.ts               # DeepPartial<T>
└── en-US/
    ├── index.ts           # merges translations.json + aggregated extension strings
    └── translations.json  # ONE file; each top-level key is a namespace
```

The project ships 17 locale directories (`ls src/locales`). Each `translations.json` is a single file whose top-level keys (`product`, `cart`, `checkout`, `routeError`, ...) are namespaces. There is no separate per-namespace file.

```json
{
    "product": {
        "addToCart": "Add to cart",
        "greeting": "Hello, {{name}}!",
        "itemCount_one": "{{count}} item",
        "itemCount_other": "{{count}} items"
    }
}
```

- Interpolation uses `{{var}}`.
- Plurals use i18next suffix keys (`_one`, `_other`, plus `_zero`, `_few`, ... where a language needs them), as in the shipped files. Call `t('itemCount', { count })` with the base key. Do not use nested `{ one, other }` objects.
- `t()` key types come from the `en-GB` resources (`src/middlewares/i18next.server.ts`). Non-English locales are typed `satisfies DeepPartial<typeof enUS>`, so they may omit keys (i18next falls back to `fallbackLng`) but keys they include must match the English shape.

To customize copy, edit `translations.json` directly.

## Add a new locale (checklist)

Keep these in sync or the locale silently never appears:

1. Create `src/locales/pt-BR/index.ts` and `translations.json`. Copy an existing locale (for example `de-DE`, which carries the `DeepPartial` typing) and translate.
2. Import and register it in the barrel `src/locales/index.ts` (both the import and the exported object).
3. Add the id to `i18n.supportedLngs` in `config.server.ts` (and check `fallbackLng`).
4. Add `{ id: 'pt-BR', preferredCurrency: 'BRL' }` to the site's `supportedLocales`, and make sure that currency is in the site's `supportedCurrencies`. The shape is `commerce.sites[]`; see `storefront-next:sfnext-configuration`.
5. Add extension translations for the new locale (`src/extensions/<ext>/locales/pt-BR/translations.json`) if the extensions you use ship translations.
6. Run `pnpm locales:aggregate-extensions` (also run automatically by `pnpm dev` and `pnpm build`).
7. Verify: `pnpm dev`, then open the site under the new locale prefix and switch via the locale switcher.

Details and currency rules: [references/locale-config.md](references/locale-config.md).

## How the active locale is chosen

The locale is resolved from the site context, driven by the URL prefix (default `/:siteId/:localeId`, from `config.url.prefix`). `siteContextMiddleware` runs before `i18nextMiddleware` (see the middleware array in `src/root.tsx`). It is not read from a `lng` cookie or `Accept-Language`.

`src/components/locale-switcher` changes locale by navigating to the same page under the rebuilt prefix (`buildUrl`, `resolvePrefix`, `stripPathPrefix` from `@salesforce/storefront-next-runtime/site-context`) and posting the choice to persist it. There is no `action.set-locale` route. Render it with `import LocaleSwitcher from '@/components/locale-switcher'`. Currency is switched independently with `src/components/currency-switcher`.

## Extension translations

Each extension keeps its strings in `src/extensions/<name>/locales/<locale>/translations.json`. Its namespace is `ext` + PascalCase directory name:

```tsx
const { t } = useTranslation('extStoreLocator'); // src/extensions/store-locator
```

`src/extensions/locales/<locale>/index.ts` is generated by `pnpm locales:aggregate-extensions`. Never edit it, and leave its `// @sfdc-extension-line` marker comments alone.

## Validation messages: Zod schema factories

Module-level `t()` runs before i18next is initialized. Build the schema from a function:

```tsx
import { useMemo } from 'react';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export const createSchema = (t: TFunction) =>
    z.object({ email: z.string().email(t('validation:emailInvalid')) });

function MyForm() {
    const { t } = useTranslation();
    const schema = useMemo(() => createSchema(t as unknown as TFunction), [t]);
    // useForm({ resolver: zodResolver(schema) })
}
```

`createCustomerProfileFormSchema` in `src/components/customer-profile-form/index.tsx` is a working example.

## Testing translations

`vitest.setup.ts` initializes i18next with all locales (language `en-GB`), so components using `useTranslation` render real English text. For loaders/actions, `createTestContext({ locale })` from `@/lib/test-utils` wires `mockI18nContext` for you; call it directly when building a context by hand. Assert on text with `getTranslation()` or literal English. Locale completeness tests (for example `src/locales/*.locale-completeness.test.ts`) are a good pattern for feature-specific keys. See `storefront-next:sfnext-testing`.

## Pitfalls

| Pitfall | Fix |
|---------|-----|
| Importing `getTranslation` from `@/lib/i18next` | It lives in `@salesforce/storefront-next-runtime/i18n`. |
| Importing `@salesforce/storefront-next-runtime/i18n/client` from a `*.server.ts` file | Browser-only; it fails to bundle and lint blocks it. |
| Statically importing `@/locales` in `root.tsx` or the error boundary | Pulls every language into the client bundle; `src/locales/locale-imports.test.ts` guards this. The root loader passes `errorTranslations` (the `routeError` bundle) instead. |
| New locale not showing up | Check all of: `src/locales/index.ts`, `supportedLngs`, site `supportedLocales`. |
| `t()` at module scope | Use a factory or call inside the component/function. |
| Hydration mismatch on translated text | `src/i18n-client-init.ts` gates hydration with `whenI18nReady()`; do not bypass it. |
| Same key name in two namespaces | Use `t('ns:key')` to disambiguate. |
| "Click here" style link text | `jsx-a11y/anchor-ambiguous-text` cannot see translated strings; review link copy in JSON (see `storefront-next:sfnext-accessibility`). |

## Finding more

- `docs/README-I18N.md` (architecture, currency flow, using a different i18n library) and the doc index in `AGENTS.md`.
- `b2c docs search "i18n"` (or the MCP `docs_search` tool) for the Storefront Next docs corpus.

## Related Skills

- `storefront-next:sfnext-configuration` - `i18n`, `supportedLocales`, `supportedCurrencies` config
- `storefront-next:sfnext-routing` - site/locale URL prefix and site-aware links
- `storefront-next:sfnext-extensions` - extension structure and `ext*` namespaces
- `storefront-next:sfnext-components` - using translations in UI components
- `storefront-next:sfnext-testing` - unit and story tests
- `storefront-next:sfnext-accessibility` - translated link and label text
