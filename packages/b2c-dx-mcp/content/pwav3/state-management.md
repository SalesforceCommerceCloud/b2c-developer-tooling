# State Management

## Overview

PWA Kit applications support various state management approaches, from prop passing to global state using React Context API or Redux. The _app-config special component initializes state management systems.

## React Context API (Recommended)

The React Context API combined with useReducer provides simple, effective state management:

```jsx
import {createContext, useContext, useReducer} from 'react';

// Create context
const CartContext = createContext();

// Define reducer
const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ITEM':
            return {...state, items: [...state.items, action.payload]};
        case 'REMOVE_ITEM':
            return {...state, items: state.items.filter(item => item.id !== action.payload)};
        case 'CLEAR_CART':
            return {...state, items: []};
        default:
            return state;
    }
};

// Provider component
export const CartProvider = ({children}) => {
    const [state, dispatch] = useReducer(cartReducer, {
        items: [],
        total: 0
    });

    return (
        <CartContext.Provider value={{state, dispatch}}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
```

### Using Context in Components

```jsx
import {useCart} from '../contexts/cart-context';

const ProductDetail = ({product}) => {
    const {state, dispatch} = useCart();

    const addToCart = () => {
        dispatch({type: 'ADD_ITEM', payload: product});
    };

    return (
        <Button onClick={addToCart}>
            Add to Cart ({state.items.length} items)
        </Button>
    );
};
```

### Integrating Context in _app-config

```jsx
// app/components/_app-config/index.jsx
import {CartProvider} from '../../contexts/cart-context';
import {MultiSiteProvider} from '../../contexts/multi-site-context';

const AppConfig = ({children}) => {
    return (
        <CommerceApiProvider>
            <ChakraProvider>
                <MultiSiteProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </MultiSiteProvider>
            </ChakraProvider>
        </CommerceApiProvider>
    );
};

export default AppConfig;
```

## Redux Integration

PWA Kit supports Redux through AppConfig special methods:

```jsx
// app/components/_app-config/index.jsx
import {Provider} from 'react-redux';
import {createStore} from '../../store';

const AppConfig = ({children, locals = {}}) => {
    const store = createStore(locals.initialState);

    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
};

// Restore state from server
AppConfig.restore = (locals = {}) => {
    const store = createStore(locals.initialState);
    return {initialState: store.getState()};
};

// Serialize state for SSR
AppConfig.freeze = () => {
    const store = window.__STORE__;
    return {initialState: store.getState()};
};

// Provide extra arguments to getProps
AppConfig.extraGetPropsArgs = () => {
    return {store: window.__STORE__};
};

export default AppConfig;
```

## Local Component State

For simple, component-specific state:

```jsx
import {useState} from 'react';

const ProductImages = ({images}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    return (
        <Box>
            <Image src={images[selectedIndex]} />
            <Thumbnails
                images={images}
                onSelect={setSelectedIndex}
            />
        </Box>
    );
};
```

## Derived State with useMemo

```jsx
import {useMemo} from 'react';

const Cart = ({items}) => {
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [items]);

    const tax = useMemo(() => subtotal * 0.08, [subtotal]);
    const total = useMemo(() => subtotal + tax, [subtotal, tax]);

    return (
        <Box>
            <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
            <Text>Tax: ${tax.toFixed(2)}</Text>
            <Text>Total: ${total.toFixed(2)}</Text>
        </Box>
    );
};
```

## Best Practices

1. Keep state as local as possible
2. Use Context for global UI state
3. Use React Query for server state
4. Avoid prop drilling
5. Memoize expensive computations
6. Keep reducer logic pure
7. Type your state
8. Normalize complex state
9. Test reducers independently
