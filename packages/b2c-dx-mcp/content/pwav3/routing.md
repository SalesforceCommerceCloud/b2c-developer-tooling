# Routing in PWA Kit

## Overview

PWA Kit uses Express.js (server-side) and React Router (client-side) for routing. Routes are defined in `app/routes.jsx` and support both SSR and client-side navigation. The template uses `loadable` for code-splitting and `configureRoutes` to add site/locale path segments.

## Route Definition

**Reference:** See `app/routes.jsx` in the template for the full setup (loadable, configureRoutes, dynamic routes, catch-all).

To add a route: add to the `routes` array and ensure the default export passes them through `configureRoutes` with `fuzzyPathMatching: true`, then appends the catch-all `{ path: '*', component: PageNotFound }`.

## Route Parameters

```jsx
import {useParams} from 'react-router-dom';

const ProductDetail = () => {
    const {productId} = useParams();

    const {data: product} = useProduct({
        parameters: {id: productId}
    });

    return <ProductView product={product} />;
};
```

## Data Loading with React Query

`withReactQuery` is applied at the **AppConfig** level (in `_app-config/index.jsx`), not per route. Route components use commerce-sdk-react hooks (e.g., `useProduct`) which integrate with React Query automatically. No need to wrap individual route components with `withReactQuery`.

## Legacy getProps Pattern

PWA Kit still supports `getProps` and `shouldGetProps` methods with long-term support. The template prefers commerce-sdk-react hooks for data fetching; use getProps when you need server-side prefetching.

```jsx
const ProductDetail = ({product}) => {
    return <ProductView product={product} />;
};

// getProps receives {req, res, params, location} plus extraGetPropsArgs (buildUrl, site, locale)
ProductDetail.getProps = async ({params}) => {
    const {productId} = params;
    // Use Commerce SDK client or fetch via proxy to prefetch product data
    const product = await fetchProduct(productId);
    return {product};
};

ProductDetail.shouldGetProps = ({previousParams, params}) => {
    return previousParams?.productId !== params?.productId;
};

export default ProductDetail;
```

## Navigation

### Programmatic Navigation

```jsx
import {useHistory} from 'react-router-dom';

const ProductTile = ({product}) => {
    const history = useHistory();

    const navigateToProduct = () => {
        history.push(`/product/${product.id}`);
    };

    return <Button onClick={navigateToProduct}>View Details</Button>;
};
```

### Link Component

```jsx
import {Link} from 'react-router-dom';
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductTile = ({product}) => {
    return (
        <Button as={Link} to={`/product/${product.id}`}>
            View Details
        </Button>
    );
};
```

## SSR vs CSR Navigation

### Server-Side Rendering (First Load)
- Initial page request goes to Express.js
- Server renders React components to HTML
- Data fetched on server
- HTML sent to browser
- Client-side JavaScript hydrates

### Client-Side Rendering (Subsequent)
- React Router handles routing
- No full page reload
- Data fetched via React Query
- Smooth transitions

## Lazy Loading Routes

Use `@loadable/component` with a Skeleton fallback. See `app/routes.jsx` for the pattern.
