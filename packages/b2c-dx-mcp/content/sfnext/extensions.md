# Extension Development

## Structure

```
src/extensions/my-extension/
├── plugin-config.json    # Plugin configuration
├── components/           # Extension components
├── routes/              # Extension routes
├── locales/             # Extension translations
└── providers/           # Extension providers
```

## Plugin Configuration

**Insert component into plugin point**:

```json
{
  "components": [
    {
      "pluginId": "header.before.cart",
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

## Extension Routes

Files in `routes/` auto-register:

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

Auto-namespaced as `extPascalCase`:

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

```typescript
// Single line
/** @sfdc-extension-line SFDC_EXT_MY_FEATURE */
import myFeature from '@extensions/my-feature';

// Block
{/* @sfdc-extension-block-start SFDC_EXT_MY_FEATURE */}
<Link to="/my-feature">My Feature</Link>
{/* @sfdc-extension-block-end SFDC_EXT_MY_FEATURE */}
```

For full documentation, read: src/extensions/README.md
