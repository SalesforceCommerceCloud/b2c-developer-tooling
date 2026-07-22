---
name: sfnext-extensions
description: Build extensions for Storefront Next using target-config.json, target points, extension routes, and translation namespaces. Use when creating modular features, inserting components into UI targets, adding extension routes, adding a section to an existing page, or using SFDC_EXT_ integration markers. Covers the base-audit decision gate (deciding whether to extend at all vs token/variant override), extension structure, targetId configuration, and extension registration in src/extensions/config.json.
persona: developer
category: Headless Storefront (Storefront Next)
tags: [headless, storefront-next, storefront, routing, i18n, integrations]
---

# Extensions Skill

This skill covers the Storefront Next extension system — modular features that plug into the storefront via target points.

## Overview

Extensions are self-contained feature modules that add components, routes, translations, and providers to a Storefront Next storefront without modifying core code.

## Before You Build — Audit the Base First (Decision Gate)

An extension is the right tool for adding something the storefront does **not already render**. Before scaffolding one, confirm you actually need it — a duplicated section costs you on every page load, every test, and every design sync.

Run this gate **before writing any extension code**:

1. **Find the base.** Open the relevant route in `src/routes/` and trace every component it renders.
2. **Check each section you intend to add.** Does the base already render equivalent content at that location (a description, accordion, badge, banner, title…)?
   - **YES** → do not create a parallel component. Restyle it through the token/brand layer (a CVA variant or `brand.css` value), or inject into a UITarget slot on the existing content. Adding a duplicate section is a bug, not a feature.
   - **NO** → an extension is justified. Continue to the structure below and register it at the correct `targetId`.
3. **Decide the layer for what's missing:**

   ```
   Is the change purely visual (color, font, spacing)?
     └─ YES → Token / CVA change (brand.css or a component variant). No extension needed.
     └─ NO  → Is the new structure needed by only one storefront/vertical?
                 └─ YES → Extension at a UITarget slot (this skill). Never edit core.
                 └─ NO  → It's a shared pattern — add a slot/render-prop to the BASE
                          component instead, and let each consumer fill it.
   ```

**Rule of thumb:** extensions *add what is missing*; they never recreate what already exists. When in doubt, prefer a UITarget slot or a token override over a new component.

See [Base Audit Reference](references/BASE-AUDIT.md) for worked examples of the gate.

## Extension Structure

```
src/extensions/my-extension/
├── target-config.json    # Target configuration (components/providers)
├── components/           # Extension components
├── routes/              # Extension routes (auto-registered)
├── locales/             # Extension translations (auto-namespaced)
└── providers/           # Extension context providers
```

## Target Configuration

The `target-config.json` file declares how the extension integrates:

```json
{
  "components": [
    {
      "targetId": "header.before.cart",
      "path": "extensions/my-extension/components/badge.tsx",
      "order": 0
    }
  ],
  "contextProviders": [
    {
      "path": "extensions/my-extension/providers/my-provider.tsx",
      "order": 0
    }
  ]
}
```

### Target Points

Target points are named insertion slots in the storefront layout (for example, `header.before.cart`). Extensions insert components at these points via `targetId`.

Extension availability is managed in `src/extensions/config.json`, where each extension is keyed by an `SFDC_EXT_*` marker.

## Extension Routes

Files in the `routes/` directory auto-register as routes:

```typescript
// src/extensions/my-extension/routes/my-route.tsx
export function loader() {
    return { message: 'Hello' };
}

export default function MyRoute() {
    const { message } = useLoaderData();
    return <div>{message}</div>;
}
```

## Extension Translations

Translations are auto-namespaced as `extPascalCase` based on the directory name:

```
src/extensions/my-extension/locales/
├── en-US/translations.json
└── it-IT/translations.json
```

```typescript
const {t} = useTranslation('extMyExtension');
t('welcome');
```

## Integration Markers

Mark extension integration points in core code:

```typescript
// Single line marker
/** @sfdc-extension-line SFDC_EXT_MY_FEATURE */
import myFeature from '@extensions/my-feature';

// Block marker
{/* @sfdc-extension-block-start SFDC_EXT_MY_FEATURE */}
<Link to="/my-feature">My Feature</Link>
{/* @sfdc-extension-block-end SFDC_EXT_MY_FEATURE */}
```

See [Extension Examples Reference](references/EXTENSION-EXAMPLES.md) for complete examples.

## Best Practices

1. **Self-contained** — Each extension should be independent
2. **Use target points** — Insert UI via `target-config.json` rather than editing core files
3. **Namespace translations** — Auto-namespacing prevents collisions
4. **Order matters** — Use `order` in `target-config.json` to control rendering order

## Related Skills

- `storefront-next:sfnext-i18n` - Translation patterns and namespace usage
- `storefront-next:sfnext-routing` - How extension routes integrate with the router
- `storefront-next:sfnext-components` - Component patterns used in extensions

## Reference Documentation

- [Base Audit Reference](references/BASE-AUDIT.md) - Worked examples of the decision gate (extend vs token/variant vs base slot)
- [Extension Examples Reference](references/EXTENSION-EXAMPLES.md) - Complete extension examples
