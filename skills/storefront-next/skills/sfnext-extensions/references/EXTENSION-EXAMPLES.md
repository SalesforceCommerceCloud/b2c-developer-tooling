# Extension Examples Reference

## Store Locator Extension

A complete extension adding store locator functionality:

```
src/extensions/store-locator/
├── target-config.json
├── components/
│   ├── store-locator-badge.tsx    # Badge in header
│   └── store-locator-map.tsx      # Map component
├── routes/
│   └── store-locator.tsx          # /store-locator page
├── locales/
│   ├── en-US/translations.json
│   └── de-DE/translations.json
└── providers/
    └── store-provider.tsx         # Store data context
```

### target-config.json

```json
{
  "components": [
    {
      "targetId": "header.after.logo",
      "path": "extensions/store-locator/components/store-locator-badge.tsx",
      "order": 0
    }
  ],
  "contextProviders": [
    {
      "path": "extensions/store-locator/providers/store-provider.tsx",
      "order": 0
    }
  ]
}
```

### Route

```typescript
// src/extensions/store-locator/routes/store-locator.tsx
import { createApiClients } from '@/lib/api-clients';
import { useTranslation } from 'react-i18next';

export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        stores: clients.shopperStores.getStores({...}).then(({ data }) => data),
    };
}

export default function StoreLocatorPage({ loaderData }) {
    const { t } = useTranslation('extStoreLocator');

    return (
        <div>
            <h1>{t('title')}</h1>
            {/* Render store map and list */}
        </div>
    );
}
```

### Translations

```json
// src/extensions/store-locator/locales/en-US/translations.json
{
  "title": "Find a Store",
  "searchPlaceholder": "Enter city or zip code",
  "noResults": "No stores found nearby"
}
```

## Integration Marker Patterns

### Single-Line Import

```typescript
/** @sfdc-extension-line SFDC_EXT_STORE_LOCATOR */
import StoreLocatorBadge from '@extensions/store-locator/components/store-locator-badge';
```

### Block Integration

```typescript
/* @sfdc-extension-block-start SFDC_EXT_STORE_LOCATOR */
<Link to="/store-locator" className="flex items-center gap-2">
    <MapPinIcon className="h-4 w-4" />
    <span>{t('storeLocator')}</span>
</Link>
/* @sfdc-extension-block-end SFDC_EXT_STORE_LOCATOR */
```

## BOPIS Extension (Buy Online, Pick Up In Store)

```json
{
  "components": [
    {
      "targetId": "product.detail.fulfillment",
      "path": "extensions/bopis/components/pickup-selector.tsx",
      "order": 0
    },
    {
      "targetId": "cart.item.fulfillment",
      "path": "extensions/bopis/components/pickup-info.tsx",
      "order": 0
    }
  ]
}
```
