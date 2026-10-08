# Decorator Patterns

All four decorators are imported from your project, not from the runtime package:

```typescript
import { AttributeDefinition, Component, PageType, RegionDefinition } from '@/lib/decorators';
```

Deep imports (`@/lib/decorators/component`, `.../attribute-definition`, `.../page-type`, `.../region-definition`) also work and are used by some shipped files.

Decorators only attach metadata. They are stripped of behavior at runtime and read at build time by `pnpm cartridge:generate` (and by the registry plugin for `@Component`). Mistakes therefore show up as a missing or broken editor in Business Manager, not as a runtime error.

## `@Component(typeId, options)`

```typescript
@Component('productCarousel', {
    name: 'Product Carousel',
    description: 'Scrollable row of product cards. Pick a category or add product tiles.',
    group: 'Layout',
})
```

| Option | Meaning |
|--------|---------|
| `typeId` (first arg) | String literal, camelCase by convention (`hero`, `heroCarousel`, `megaMenu`). The registry plugin rejects non-literals. |
| `name`, `description` | Shown to merchants in the palette. Be specific about which attributes drive which behavior. |
| `group` | Palette folder. Default `storefrontnext_base`. Shipped components use `Content` and `Layout`. |
| `embedded`, `component_id` | Marks a singleton content block that is referenced rather than dropped into regions. The component preview route and `fetchComponentWithComponentData` use this path. |

The stored, fully-qualified id is `<group>.<typeId>` (`Layout.productCarousel`). That is the id that appears in SCAPI responses, in the registry, and in region include/exclude lists.

## `@AttributeDefinition(config)`

Put it on a field of the exported metadata class. The field name is the prop name your component receives.

```typescript
@AttributeDefinition({
    id: 'limit',
    name: 'Product Limit',
    description: 'Maximum number of products to show.',
    type: 'integer',
    required: false,
    defaultValue: 12,
})
limit?: number;
```

| Option | Notes |
|--------|-------|
| `id` | Attribute id written to metadata. Keep it identical to the field name; a mismatch means merchant values never reach the prop. |
| `name`, `description` | Merchant-facing label and help text. Without them Business Manager shows the raw id. |
| `type` | One of the types below. Default is a string attribute. An unknown string (such as `'number'`) is not type-checked and produces a broken editor. |
| `required` | Match the component: `required: true` only if it cannot render without a value. |
| `defaultValue` | Prefilled in the editor. Keep it equal to the component's destructuring default so editor and runtime agree. For `enum` it must be one of `values`. |
| `values` | Required for `enum`: the option list. |
| `editorDefinition` | For `type: 'custom'`: `{ type, configuration? }` selecting a custom editor. |
| `searching` | `{ searchable, refinable, boostFactor?, sortable? }`. Makes the attribute searchable in Business Manager. Both booleans are required. |
| `dynamicLookup` | `{ aspectAttributeAlias }`. Sources the value from an aspect attribute at render time instead of a stored value. Allowed on all types. |

### Attribute types

`string`, `text`, `markup`, `integer`, `boolean`, `product`, `category`, `file`, `page`, `image`, `url`, `enum`, `custom`, `cms_record`.

| Type | Value your component receives |
|------|-------------------------------|
| `string`, `text` | string (`text` is multi-line) |
| `markup` | raw HTML string; render with `dangerouslySetInnerHTML` only after deciding it is trusted content |
| `integer`, `boolean` | number, boolean |
| `enum` | one of `values` |
| `image` | object `{ url, focalPoint?, metaData? }` (`Image` from `@/types`) |
| `url` | string |
| `product`, `category` | the id (string); fetch details in a `loader` |
| `file`, `page`, `custom`, `cms_record` | reference values; check the generated JSON and a live SCAPI payload before relying on the shape |

### `searching` combinations

Generation fails (and `cartridge:validate` reports it) when the combination is invalid:

- `string`, `text`, `product`, `category`: all fields allowed.
- `markup`: `sortable` must be omitted or `false`.
- `custom`, `cms_record`: `refinable` must be `false`; `boostFactor` and `sortable` are not allowed.
- `integer`, `boolean`, `file`, `page`, `image`, `url`, `enum`: searching is not allowed.

## `@RegionDefinition(regions)`

Declares the slots a component (or a page route) exposes to merchants.

```typescript
@RegionDefinition([
    {
        id: 'products',
        name: 'Products',
        description: 'Add Product Tile components to populate this carousel.',
        maxComponents: 12,
        componentTypeInclusions: ['Content.productTile'],
    },
])
```

| Field | Notes |
|-------|-------|
| `id`, `name` | Required. The `id` must match the `regionId` passed to `<Region>`. |
| `description` | Shown to merchants. |
| `maxComponents` | Set only when the layout structurally limits children. |
| `componentTypeInclusions`, `componentTypeExclusions` | Allow-list / deny-list of component types. Unqualified ids are prefixed with the host component's group; refer to another group with the full id (`'Content.productTile'` from a `Layout.*` host). |
| `defaultComponentConstructors` | `[{ id, typeId, data }]` components created when a merchant adds the region to a new page. `typeId` follows the same qualification rule. |

Leaf components may use `@RegionDefinition([])` or omit the decorator. A declared region that the implementation never renders is invisible to shoppers even when merchants fill it.

## `@PageType(config)`

```typescript
@PageType({
    name: 'Product Detail Page',
    description: 'Product detail page with promotional and engagement regions',
    supportedAspectTypes: ['pdp'],
})
@RegionDefinition([{ id: 'pdpPromo', name: 'Promo Content Region', maxComponents: 1 }])
export class ProductPageMetadata {}
```

| Field | Notes |
|-------|-------|
| `name`, `description` | Human-readable. `name` is the template label merchants pick. |
| `supportedAspectTypes` | `['pdp']`, `['plp']`, or `[]` for routes not bound to an aspect (home, about-us, component preview). Must agree with the `aspectType` the route loader fetches. |
| `preview` | Only `'default'` is valid. Used by the component preview route. |

The class must be exported and empty. Never put `@AttributeDefinition` on a page type.

`sfnext generate-cartridge` parses decorators statically, so decorator arguments must be literals, not imported constants.

## Nested regions in a container

```tsx
import { Region } from '@/components/region';

@Component('twoColumn', { name: 'Two Column', description: 'Two side-by-side regions.', group: 'Layout' })
@RegionDefinition([
    { id: 'left', name: 'Left' },
    { id: 'right', name: 'Right' },
])
export class TwoColumnMetadata {}

export default function TwoColumn({ component }: { component: ComponentType }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Region component={component} regionId="left" />
            <Region component={component} regionId="right" />
        </div>
    );
}
```

`ComponentType` is exported from `@/components/region`. Use `className` on `<Region>` for layout; the design-mode wrapper uses `display: contents`, so children stay direct grid/flex items. `src/components/grid/index.tsx` is the reference implementation.

## Images

```tsx
import { DynamicImage } from '@/components/dynamic-image';

<DynamicImage src={image.url} alt="" />
```

Always provide `alt` (empty for decorative images). Set `priority="high"` only on the LCP image, never on every image.

## Text that is not merchant content

Button labels and fallback messages that developers (not merchants) own should use `useTranslation()`. Text in attributes is edited and localized by merchants in Business Manager, so leave it raw.
