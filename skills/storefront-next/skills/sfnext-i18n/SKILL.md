---
name: sfnext-i18n
description: Implement internationalization in Storefront Next using i18next with useTranslation for components and getTranslation for server-side code. Use when adding translations, configuring locales, handling pluralization, using the Zod schema factory pattern, or managing extension translations. Covers namespaces, interpolation, and language switching.
---

# Internationalization (i18n) Skill

This skill covers internationalization in Storefront Next using i18next with a dual-instance architecture (server + client).

## Overview

- **Server instance** — Has access to all translations for all languages
- **Client instance** — Dynamically imports translations as JavaScript chunks
- **Dual API** — `useTranslation()` for components, `getTranslation()` for non-component code

## Translation File Structure

Translations are organized as namespace files per locale, compiled into a TypeScript index:

```
src/locales/en-US/
├── index.ts              # Merges all namespace files + extensions
├── translations.json     # Default namespace (top-level keys become namespaces)
└── product.json          # "product" namespace (separate file)

src/locales/en-GB/
├── index.ts
├── translations.json
└── product.json
```

The `index.ts` imports all namespace files and extension translations:

```typescript
import translations from '@/locales/en-US/translations.json';
import product from '@/locales/en-US/product.json';
import extensionTranslations from '@/extensions/locales/en-US/';

const allTranslations = { ...translations, product, ...extensionTranslations };
export default allTranslations satisfies ResourceLanguage;
```

### Namespace structure in `translations.json`

Each top-level key is a namespace:

```json
{
    "header": {
        "search": "Search",
        "account": "Account"
    },
    "footer": {
        "copyright": "© {{year}} Company"
    }
}
```

### Separate namespace file (`product.json`)

```json
{
    "title": "Product Details",
    "addToCart": "Add to Cart",
    "greeting": "Hello, {{name}}!",
    "itemCount_one": "{{count}} item",
    "itemCount_other": "{{count}} items"
}
```

## Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

export function ProductCard() {
    const { t } = useTranslation('product');

    return (
        <div>
            <h1>{t('title')}</h1>
            <button>{t('addToCart')}</button>
            <p>{t('greeting', { name: 'John' })}</p>
            <p>{t('itemCount', { count: 5 })}</p>
        </div>
    );
}
```

**Critical:** Always pass a namespace to `useTranslation()`:

```typescript
// WRONG — missing namespace
const { t } = useTranslation();
t('title');  // Will not find the key

// CORRECT — with namespace
const { t } = useTranslation('product');
t('title');  // Works
```

## Usage in Server Code

```typescript
import { getTranslation } from '@/lib/i18next';

// In loaders/actions (pass context)
export function loader(args: LoaderFunctionArgs) {
    const { t } = getTranslation(args.context);
    return { title: t('product:title') };
}

// Client-side utilities (no context)
const { t } = getTranslation();
const message = t('product:addToCart');
```

## Validation Schemas — Factory Pattern

**Critical:** Use a factory function for Zod schemas with translated messages to avoid race conditions:

```typescript
// WRONG — Module-level schema (race condition: t() may not be initialized)
export const schema = z.object({
    email: z.string().email(t('validation:emailInvalid'))
});

// CORRECT — Factory function
import type { TFunction } from 'i18next';

export const createSchema = (t: TFunction) => {
    return z.object({
        email: z.string().email(t('validation:emailInvalid'))
    });
};

// Usage in component
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function MyForm() {
    const { t } = useTranslation();
    const schema = useMemo(() => createSchema(t), [t]);

    const form = useForm({ resolver: zodResolver(schema) });
}
```

## Language Switching

```typescript
import LocaleSwitcher from '@/components/locale-switcher';

export function Footer() {
    return <footer><LocaleSwitcher /></footer>;
}
```

## Extension Translations

Extensions use `extPascalCase` namespace auto-derived from the extension directory name:

```
src/extensions/my-extension/locales/
├── en-US/translations.json
└── it-IT/translations.json
```

```typescript
const { t } = useTranslation('extMyExtension');
t('welcome');
```

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Missing namespace | Keys not found | Always pass namespace: `useTranslation('product')` |
| Module-level `t()` in schemas | Race condition on initialization | Use factory pattern: `createSchema(t)` |
| Forgetting context on server | Translations not found | Use `getTranslation(args.context)` in loaders |
| Duplicate keys across namespaces | Wrong translation shown | Prefix with namespace: `t('product:title')` |

## Related Skills

- `storefront-next:sfnext-components` - Using translations in UI components
- `storefront-next:sfnext-extensions` - Extension translation namespacing
- `storefront-next:sfnext-configuration` - Locale and site configuration
