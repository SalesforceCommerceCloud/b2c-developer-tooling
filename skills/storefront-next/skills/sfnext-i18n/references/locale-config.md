# Locale and currency configuration

Locale support is declared in several places that must agree. All keys below live in `config.server.ts`; see `storefront-next:sfnext-configuration` and `docs/README-CONFIG-OPTIONS.md` for the full option reference.

## Must stay in sync

| Place | What |
|-------|------|
| `i18n.supportedLngs` / `i18n.fallbackLng` | Languages the app serves; `src/middlewares/i18next.server.ts` reads them |
| `commerce.sites[].supportedLocales` | `{ id, preferredCurrency }` per locale, per site |
| `commerce.sites[].supportedCurrencies` | Currencies a shopper may pick; each `preferredCurrency` must be listed |
| `src/locales/<id>/` + `src/locales/index.ts` | Translation files and barrel registration |

Rules of thumb:

- Every id in `supportedLngs` needs a directory in `src/locales/` and an entry in the barrel.
- Every id in `supportedLngs` should appear in at least one site's `supportedLocales`; the locale switcher only lists languages that are in both `supportedLngs` and the current site's `supportedLocales`.
- Different sites can expose different subsets of locales.
- Env overrides use the `PUBLIC__` double-underscore convention described in `docs/README-CONFIG.md`.

## Currency

Locale and currency switch independently. Priority: shopper's manual choice (cookie) over the locale's `preferredCurrency` over the site default currency. The UI is `src/components/currency-switcher`.

## Typing

`src/middlewares/i18next.server.ts` augments i18next `CustomTypeOptions` with the `en-GB` resources so `t('ns:key')` is type-checked. `src/locales/types.ts` exports `DeepPartial`; non-English locales use `satisfies ResourceLanguage satisfies DeepPartial<typeof enUS>`. Run `pnpm typecheck` after adding keys: a key present in a translated locale but missing in English, or with a different nested shape, fails the type check.

## Client loading

`src/i18n-client-init.ts` calls `initI18next` from `@salesforce/storefront-next-runtime/i18n/client` with a `loadLocale` that dynamically imports `@/locales/<language>/index.ts`, so each language becomes its own chunk. `whenI18nReady()` delays hydration until the active language chunk is loaded (with a timeout safety net). Keep the `import()` template there so Vite can split the chunks.

## Using a different i18n library

i18next is only the translation layer; locale resolution is independent (site context). `docs/README-I18N.md` ("Using a Different i18n Library") describes what to replace.
