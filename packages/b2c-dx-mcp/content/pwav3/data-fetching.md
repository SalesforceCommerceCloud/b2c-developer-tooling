# Data Fetching and Commerce API Integration

## Overview

PWA Kit applications fetch data from Salesforce Commerce Cloud APIs using the `@salesforce/commerce-sdk-react` library. This library provides React hooks built on top of React Query for data fetching, caching, and state management.

## Commerce SDK React Hooks

### Standard Commerce API Hooks

The commerce-sdk-react library provides hooks for all standard Commerce APIs:

```jsx
import {
    useProduct,
    useProducts,
    useCategory,
    useCustomer,
    useBasket,
    useCustomerBaskets,
    useProductSearch,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react';
```

### Basic Usage Pattern

**Reference:** See `app/pages/product-detail/index.jsx` for useProduct with useParams, loading/error states. Pattern: `const {data, isLoading, error, refetch} = useProduct({parameters: {id, allImages, perPricebook}})`.

## Custom API Implementation

For custom Commerce Cloud APIs (OCAPI Data API or SCAPI custom endpoints), use `useCustomQuery` and `useCustomMutation`.

### useCustomQuery for GET Requests

```jsx
import {useCustomQuery} from '@salesforce/commerce-sdk-react';

const MyComponent = () => {
    const {data, isLoading, error} = useCustomQuery({
        options: {
            method: 'GET',
            customApiPathParameters: {
                apiName: 'store-locations',
                apiVersion: 'v1',
                endpointPath: 'locations'
            },
            parameters: {
                c_latitude: 37.7749,
                c_longitude: -122.4194,
                c_radius: 50
            }
        }
    });

    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;

    return <StoreList stores={data?.stores} />;
};
```

### Critical Rules for customApiPathParameters

**DO NOT include extra '/' before or after path parameters:**

```javascript
// ✅ CORRECT
customApiPathParameters: {
    apiName: 'store-locations',
    apiVersion: 'v1',
    endpointPath: 'locations'
}

// ❌ WRONG - Extra slashes
customApiPathParameters: {
    apiName: '/store-locations/',
    apiVersion: '/v1/',
    endpointPath: '/locations'
}
```

### useCustomMutation for POST/PUT/PATCH/DELETE

```jsx
import {useCustomMutation} from '@salesforce/commerce-sdk-react';

const StoreLocator = () => {
    const mutation = useCustomMutation({
        options: {
            method: 'POST',
            customApiPathParameters: {
                apiName: 'store-locator',
                apiVersion: 'v1',
                endpointPath: 'find-nearest'
            }
        }
    });

    const findNearestStore = () => {
        mutation.mutate({
            body: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            parameters: {
                c_maxResults: 5
            },
            headers: {
                'X-Custom-Header': 'value'
            }
        });
    };

    return (
        <div>
            <Button onClick={findNearestStore} isLoading={mutation.isLoading}>
                Find Nearest Store
            </Button>
            {mutation.isSuccess && <StoreList stores={mutation.data.stores} />}
            {mutation.isError && <ErrorMessage error={mutation.error} />}
        </div>
    );
};
```

### mutation.mutate() Arguments

The `mutation.mutate(args)` function accepts:
- **body** (Object): Request payload for POST/PUT/PATCH methods
- **parameters** (Object): Optional query parameters
- **headers** (Object): Optional custom headers

## Custom Hooks Pattern

Create custom hooks to encapsulate data fetching logic. **Reference:** See `app/hooks/use-current-customer.js` in the template.

## React Query Integration

PWA Kit uses React Query under the hood. Access the query client for advanced operations:

```jsx
import {useQueryClient} from '@tanstack/react-query';
import {useParams} from 'react-router-dom';

const ProductDetail = () => {
    const {productId} = useParams();
    const queryClient = useQueryClient();

    const handleUpdate = async () => {
        // Invalidate and refetch
        await queryClient.invalidateQueries(['product', productId]);

        // Or manually update cache
        queryClient.setQueryData(['product', productId], (old) => ({
            ...old,
            viewed: true
        }));
    };

    return <div>...</div>;
};
```

## Caching Strategies

### Default Cache Behavior (Template Override)

The Retail React App _app-config overrides React Query defaults:
- **staleTime**: 10 seconds
- **retry**: false
- **refetchOnWindowFocus**: false

### Custom Cache Configuration

```jsx
const {data} = useProduct({
    parameters: {id: productId},
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes (React Query v4; gcTime in v5)
    refetchOnWindowFocus: false
});
```

## Error Handling

```jsx
import {useProduct} from '@salesforce/commerce-sdk-react';
import {useParams} from 'react-router-dom';
import {Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductDetail = () => {
    const {productId} = useParams();
    const {data, error, isError, refetch} = useProduct({
        parameters: {id: productId}
    });

    if (isError) {
        return (
            <Alert status="error">
                <AlertIcon />
                <Box flex="1">
                    <AlertTitle>Failed to load product</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Box>
                <Button size="sm" onClick={() => refetch()}>Retry</Button>
            </Alert>
        );
    }

    return <ProductView product={data} />;
};
```
