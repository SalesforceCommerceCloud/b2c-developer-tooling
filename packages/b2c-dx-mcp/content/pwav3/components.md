# Component Development

## Component Architecture

PWA Kit applications use functional React components exclusively, leveraging React Hooks for state management and side effects. All components should be simple, modular, reusable, and follow established patterns from the Retail React App template.

## PWA Kit Special Components

PWA Kit provides three special components that start with an underscore. These customize core application behavior:

### app/components/_app-config/index.jsx

The top-level component for app-wide configurations. Use this for:
- Theme providers (Chakra UI via shared/ui)
- Commerce API Provider configuration
- React Query (via withReactQuery HOC)
- State management setup (Context Providers, Redux store)
- AppConfig.restore, AppConfig.freeze, AppConfig.extraGetPropsArgs — for SSR: restore/freeze serialize state (e.g., Redux); extraGetPropsArgs injects buildUrl, site, locale into getProps

**Important:** AppConfig is wrapped with `withReactQuery` to enable SSR data fetching. Do not wrap individual route components with withReactQuery—it is applied at the AppConfig level.

**Reference:** See `app/components/_app-config/index.jsx` in the template for the full implementation.

### app/components/_app/index.jsx

The child of _app-config. Use this for layout and UI that persists throughout your app: header, footer, sidebar, layout containers, global modals (AuthModal, StoreLocatorModal).

**Reference:** See `app/components/_app/index.jsx` in the template.

### app/components/_error/index.jsx

Renders when: (1) page not routable, (2) getProps() throws, (3) render() throws. **Props:** `message`, `stack`, `status`. Keep it simple—it must not throw.

**Reference:** See `app/components/_error/index.jsx` in the template.

## Component Best Practices

### Functional Components with Hooks

Always use functional components with React Hooks. Avoid class components:

```jsx
import {useState, useEffect, useMemo, useCallback} from 'react';
import {Box, Button} from '@salesforce/retail-react-app/app/components/shared/ui';
import PropTypes from 'prop-types';

/**
 * A reusable product tile component.
 */
const ProductTile = ({product, onAddToCart}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Memoize expensive computations
    const discountPercent = useMemo(() => {
        if (!product.priceMax || !product.price) return 0;
        return Math.round(((product.priceMax - product.price) / product.priceMax) * 100);
    }, [product.price, product.priceMax]);

    // Memoize callbacks
    const handleAddToCart = useCallback(() => {
        onAddToCart(product);
    }, [product, onAddToCart]);

    return (
        <Box
            p={4}
            borderWidth="1px"
            borderRadius="md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Box>{product.name}</Box>
            {discountPercent > 0 && <Box>{discountPercent}% off</Box>}
            <Button onClick={handleAddToCart} isDisabled={!isHovered}>
                Add to Cart
            </Button>
        </Box>
    );
};

ProductTile.displayName = 'ProductTile';

ProductTile.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number,
        priceMax: PropTypes.number
    }).isRequired,
    onAddToCart: PropTypes.func.isRequired
};

export default ProductTile;
```

### Key React Hooks to Use

- **useState**: Local component state
- **useEffect**: Side effects, subscriptions, data fetching
- **useContext**: Access React Context values
- **useMemo**: Memoize expensive computations
- **useCallback**: Memoize callback functions
- **useRef**: Persist values across renders, access DOM
- **useReducer**: Complex state logic

## Chakra UI Integration

Use Chakra UI via the Retail React App shared/ui barrel for consistent, accessible, and themeable components:

```jsx
import {
    Box,
    Button,
    Heading,
    Text,
    Stack,
    Flex,
    Image,
    Badge
} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductCard = ({product}) => {
    return (
        <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Image src={product.imageUrl} alt={product.name} />

            <Box p="6">
                <Flex align="baseline" mb={2}>
                    {product.isNew && (
                        <Badge borderRadius="full" px="2" colorScheme="teal">
                            New
                        </Badge>
                    )}
                </Flex>

                <Heading size="md" mt={2} mb={2}>
                    {product.name}
                </Heading>

                <Text color="gray.600" fontSize="sm" mb={2}>
                    {product.shortDescription}
                </Text>

                <Stack direction="row" align="center" justify="space-between">
                    <Text fontSize="2xl" fontWeight="bold">
                        ${product.price}
                    </Text>
                    <Button colorScheme="blue" size="sm">
                        Add to Cart
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};
```

### Responsive Design with Chakra UI

```jsx
import {Box, SimpleGrid} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductGrid = ({products}) => {
    return (
        <SimpleGrid
            columns={{base: 1, sm: 2, md: 3, lg: 4}}
            spacing={6}
            p={4}
        >
            {products.map((product) => (
                <ProductTile key={product.id} product={product} />
            ))}
        </SimpleGrid>
    );
};
```

## File Naming Conventions

### Component Files
- Use kebab-case for all file names
- Use `.jsx` extension for components
- Use `index.jsx` for main component export in a directory

```
app/components/
├── product-tile/
│   ├── index.jsx         # Main component export
│   ├── product-tile.test.jsx  # Co-located test
│   └── README.md         # Component documentation
├── header/
│   └── index.jsx
└── footer/
    └── index.jsx
```

### Special Component Exception
Only use underscore prefix for PWA Kit special components:
- `_app.jsx`
- `_app-config.jsx`
- `_error.jsx`

## Component Composition

Build complex UIs by composing simple components:

```jsx
// Small, focused components
const ProductImage = ({src, alt}) => (
    <Image src={src} alt={alt} borderRadius="md" />
);

const ProductPrice = ({price, compareAtPrice}) => (
    <Stack direction="row" align="center">
        <Text fontSize="2xl" fontWeight="bold">${price}</Text>
        {compareAtPrice && (
            <Text fontSize="md" textDecoration="line-through" color="gray.500">
                ${compareAtPrice}
            </Text>
        )}
    </Stack>
);

const ProductTitle = ({title}) => (
    <Heading size="lg" mb={2}>{title}</Heading>
);

// Composed product detail component
const ProductDetail = ({product}) => {
    return (
        <Box>
            <ProductImage src={product.image} alt={product.name} />
            <ProductTitle title={product.name} />
            <ProductPrice
                price={product.price}
                compareAtPrice={product.priceMax}
            />
        </Box>
    );
};
```

## Reusing Shared Components

The Retail React App template provides shared UI components in:
```
app/components/shared/ui/
```

Import and use these components for consistency:

```jsx
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductSkeleton = () => (
    <Skeleton height="300px" />
);
```

## Loading States and Skeletons

Always provide loading states for async operations:

```jsx
import {Box, Skeleton, SkeletonText} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductDetail = ({productId}) => {
    const {data: product, isLoading} = useProduct({
        parameters: {id: productId}
    });

    if (isLoading) {
        return (
            <Box p={4}>
                <Skeleton height="300px" mb={4} />
                <SkeletonText mt="4" noOfLines={4} spacing="4" />
            </Box>
        );
    }

    return <ProductView product={product} />;
};
```

## Error Handling in Components

Implement graceful error handling:

```jsx
import {Box, Alert, AlertIcon, Button} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductDetail = ({productId}) => {
    const {data: product, isLoading, error, refetch} = useProduct({
        parameters: {id: productId}
    });

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                Failed to load product.
                <Button ml={4} size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </Alert>
        );
    }

    if (isLoading) return <ProductSkeleton />;
    return <ProductView product={product} />;
};
```

## Component Documentation

Add JSDoc comments for components:

```jsx
/**
 * Displays a product tile with image, name, price, and add to cart button.
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data object
 * @param {string} props.product.id - Product ID
 * @param {string} props.product.name - Product name
 * @param {number} props.product.price - Product price
 * @param {Function} props.onAddToCart - Callback when add to cart is clicked
 * @returns {JSX.Element}
 */
const ProductTile = ({product, onAddToCart}) => {
    // Component implementation
};
```

## PropTypes Validation

Always define PropTypes for all component props:

```jsx
import PropTypes from 'prop-types';

ProductTile.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        imageUrl: PropTypes.string
    }).isRequired,
    onAddToCart: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool
};

ProductTile.defaultProps = {
    isDisabled: false
};
```

## Display Names for Debugging

Set displayName for better debugging:

```jsx
const ProductTile = ({product}) => {
    // Component implementation
};

ProductTile.displayName = 'ProductTile';
```

## HTML Head Tag Management

Use React Helmet to modify document head tags:

```jsx
import {Helmet} from 'react-helmet';

const ProductDetail = ({product}) => {
    return (
        <>
            <Helmet>
                <title>{product.name} | My Store</title>
                <meta name="description" content={product.description} />
                <meta property="og:title" content={product.name} />
                <meta property="og:image" content={product.imageUrl} />
            </Helmet>
            <ProductView product={product} />
        </>
    );
};
```

## Component Testing

Co-locate test files with components using the `.test.jsx` suffix. See the Testing section for comprehensive testing patterns.

```
app/components/product-tile/
├── index.jsx
└── product-tile.test.jsx
```
