# PWA Kit Extensibility

## Overview

PWA Kit v3 provides an extensibility system to extend a base template (like @salesforce/retail-react-app) and override specific files while inheriting the rest.

## Configuration

Configure extensibility in `package.json`:

```json
{
  "ccExtensibility": {
    "extends": "@salesforce/retail-react-app",
    "overridesDir": "overrides"
  },
  "dependencies": {
    "@salesforce/retail-react-app": "^3.0.0"
  }
}
```

### Configuration Properties

- **extends**: The npm package name of the base template
- **overridesDir**: Directory containing override files (default: "overrides")

## Overriding Files

To override a file, recreate its exact path in your overrides directory:

```
Base template:
@salesforce/retail-react-app/app/components/header/index.jsx

Your override:
overrides/app/components/header/index.jsx
```

### Example Override Structure

```
my-custom-storefront/
├── overrides/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   └── index.jsx   # Overrides base header
│   │   │   └── footer/
│   │   │       └── index.jsx   # Overrides base footer
│   │   └── theme/
│   │       └── index.js        # Overrides base theme
│   └── config/
│       └── default.js          # Overrides base config
├── package.json
└── README.md
```

## Overriding Components

### Simple Component Override

```jsx
// overrides/app/components/header/index.jsx
import {Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui';

const Header = () => {
    return (
        <Box bg="brand.500" p={4}>
            <Heading color="white">My Custom Store</Heading>
        </Box>
    );
};

export default Header;
```

### Importing from Base Template

```jsx
// overrides/app/components/header/index.jsx
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui';
import Navigation from '@salesforce/retail-react-app/app/components/list-menu';
import SearchBar from '@salesforce/retail-react-app/app/components/search';

const Header = () => {
    return (
        <Box>
            <SearchBar />
            <Navigation />
        </Box>
    );
};

export default Header;
```

### Extending Base Component

```jsx
// overrides/app/components/product-tile/index.jsx
import BaseProductTile from '@salesforce/retail-react-app/app/components/product-tile';
import {Badge, Box} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductTile = (props) => {
    return (
        <Box position="relative">
            {props.product.isNew && (
                <Badge position="absolute" top={2} right={2} colorScheme="green">
                    New
                </Badge>
            )}
            <BaseProductTile {...props} />
        </Box>
    );
};

export default ProductTile;
```

## Overriding Configuration

### Custom Theme

```javascript
// overrides/app/theme/index.js
import baseTheme from '@salesforce/retail-react-app/app/theme';
import {extendTheme} from '@salesforce/retail-react-app/app/components/shared/ui';

const customTheme = extendTheme(baseTheme, {
    colors: {
        brand: {
            50: '#e6f2ff',
            500: '#0066cc',
            900: '#003366'
        }
    }
});

export default customTheme;
```

### Custom Configuration

```javascript
// overrides/config/default.js
const baseConfig = require('@salesforce/retail-react-app/config/default');

module.exports = {
    ...baseConfig,
    app: {
        ...baseConfig.app,
        defaultSite: 'MyCustomSite',
        storeLocatorEnabled: true,
        customFeatureEnabled: true
    }
};
```

## Best Practices

1. **Minimize Overrides** - Only override what you need
2. **Import from Base** - Reuse components from base template
3. **Extend, Don't Replace** - Wrap or extend base components
4. **Document Overrides** - Keep clear records of changes
5. **Test Thoroughly** - Ensure overrides work correctly
6. **Keep Up to Date** - Review base template updates
