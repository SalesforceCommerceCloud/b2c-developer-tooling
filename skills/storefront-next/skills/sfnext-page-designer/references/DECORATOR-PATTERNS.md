# Decorator Patterns Reference

## @Component Decorator

Marks a class as a Page Designer component:

```typescript
@Component('typeId', {
    name: 'Display Name',
    description: 'Component description for merchants'
})
class MyComponentMeta {
    // attribute definitions...
}
```

- `typeId` — Unique identifier (lowercase, hyphens); used in registry and Business Manager
- `name` — Display name in Page Designer sidebar
- `description` — Merchant-facing description

## @AttributeDefinition Decorator

Defines a merchant-editable attribute:

```typescript
@AttributeDefinition()              // Default: string type
headline: string;

@AttributeDefinition({ type: 'image' })
heroImage: string;

@AttributeDefinition({ type: 'url' })
ctaLink: string;

@AttributeDefinition({ type: 'boolean' })
showBadge: boolean;

@AttributeDefinition({ type: 'enum', values: ['left', 'center', 'right'] })
alignment: string;

@AttributeDefinition({ type: 'product' })
featuredProduct: string;

@AttributeDefinition({ type: 'category' })
category: string;

@AttributeDefinition({ type: 'markup' })
richText: string;

@AttributeDefinition({ type: 'integer' })
maxItems: number;
```

### Attribute Types

| Type | Input in Business Manager | Returns |
|------|--------------------------|---------|
| `string` | Text input | String |
| `text` | Multi-line text | String |
| `markup` | Rich text editor | Markup string |
| `boolean` | Checkbox | Boolean |
| `integer` | Number input | Integer |
| `enum` | Dropdown select | String |
| `image` | Image picker | Image URL |
| `file` | File picker | File URL |
| `url` | URL input | URL string |
| `category` | Category selector | Category ID |
| `product` | Product selector | Product ID |

### Type Inference by MCP Tool

The `storefront_next_page_designer_decorator` MCP tool infers types from prop names:

| Prop Name Pattern | Inferred Type |
|------------------|---------------|
| `*Url`, `*Link`, `*Href` | `url` |
| `*Image`, `*Img`, `*Src` | `image` |
| `is*`, `show*`, `has*`, `enable*` | `boolean` |
| `*Count`, `*Num`, `max*`, `min*` | `integer` |
| Other | `string` |

## @RegionDefinition Decorator

Defines nested regions within a component (e.g., a grid with slots):

```typescript
@Component('content-grid', { name: 'Content Grid', description: '2-column grid' })
@RegionDefinition([
    {
        id: 'left',
        name: 'Left Column',
        description: 'Left content area',
        maxComponents: 3,
    },
    {
        id: 'right',
        name: 'Right Column',
        description: 'Right content area',
        maxComponents: 3,
    },
])
class ContentGridMeta {
    @AttributeDefinition({ type: 'boolean' })
    equalWidth: boolean;
}
```

## @PageType Decorator

Used on route modules to define page types in Business Manager:

```typescript
@PageType({
    name: 'Home Page',
    description: 'Main landing page',
    supportedAspectTypes: ['default']
})
@RegionDefinition([
    { id: 'hero', name: 'Hero Section', maxComponents: 1 },
    { id: 'content', name: 'Main Content' },
])
```

## Complete Component Example

```typescript
import { Component, AttributeDefinition, RegionDefinition } from '@salesforce/storefront-next-runtime/design';

@Component('promo-banner', {
    name: 'Promotional Banner',
    description: 'Banner with background image, text overlay, and CTA'
})
class PromoBannerMeta {
    @AttributeDefinition({ type: 'image' })
    backgroundImage: string;

    @AttributeDefinition()
    headline: string;

    @AttributeDefinition({ type: 'text' })
    subheadline: string;

    @AttributeDefinition({ type: 'url' })
    ctaUrl: string;

    @AttributeDefinition()
    ctaLabel: string;

    @AttributeDefinition({ type: 'enum', values: ['light', 'dark'] })
    theme: string;

    @AttributeDefinition({ type: 'boolean' })
    fullWidth: boolean;
}

export default function PromoBanner({
    backgroundImage,
    headline,
    subheadline,
    ctaUrl,
    ctaLabel,
    theme = 'light',
    fullWidth,
}: PromoBannerProps) {
    return (
        <div className={cn(
            'relative overflow-hidden',
            fullWidth ? 'w-full' : 'max-w-7xl mx-auto',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
            <DynamicImage src={backgroundImage} alt="" className="absolute inset-0" />
            <div className="relative z-10 p-8">
                <h2 className="text-3xl font-bold">{headline}</h2>
                {subheadline && <p className="mt-2">{subheadline}</p>}
                {ctaUrl && <a href={ctaUrl} className="mt-4 inline-block">{ctaLabel}</a>}
            </div>
        </div>
    );
}
```
