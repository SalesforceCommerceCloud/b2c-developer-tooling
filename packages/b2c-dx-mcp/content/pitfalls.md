# Common Pitfalls

## 1. Using Client Loaders/Actions

```typescript
// ❌ NEVER USE - Client loaders are not permitted
export function clientLoader() { ... }

// ❌ NEVER USE - Client actions are not permitted  
export function clientAction() { ... }

// ✅ REQUIRED - Server-only data loading
export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return { product: clients.shopperProducts.getProduct({...}) };
}

// ✅ REQUIRED - Server-only actions
export async function action({ request, context }: ActionFunctionArgs) {
    const clients = createApiClients(context);
    // Handle mutation on server
}
```

**Decision tree:**

```text
Need data for page render?
└─ Use server `loader`

Need to handle mutations (form submissions, cart updates)?
└─ Use server `action`

Need on-demand fetching after page load?
└─ Use `useScapiFetcher` (search, modals, infinite scroll)
```

**Key Point:** ALL SCAPI requests happen on the server:
- `loader`: Runs on server, SCAPI direct (prod) or proxied (dev)
- `action`: Runs on server, handles mutations securely
- `useScapiFetcher`: Triggers server route that calls SCAPI

## 2. Module-Level i18n in Schemas

```typescript
// ❌ RACE CONDITION
const schema = z.object({
  email: z.string().email(t('error')),
});

// ✅ FACTORY PATTERN
export const createSchema = (t: TFunction) => {
  return z.object({
    email: z.string().email(t('error')),
  });
};
```

## 3. Using Async Loaders (Blocks Page Transitions)

```typescript
// ❌ BLOCKS PAGE TRANSITIONS - Async loader with await
export async function loader({ context }: LoaderFunctionArgs) {
    const product = await fetchProduct();    // Blocks!
    const reviews = await fetchReviews();    // Blocks!
    return { product, reviews };
}

// ✅ NON-BLOCKING - Synchronous loader returning promises
export function loader({ context }: LoaderFunctionArgs): PageData {
    return {
        product: fetchProduct(),    // Streams progressively
        reviews: fetchReviews(),    // Streams progressively
    };
}
```

**Key insight:** Defining loaders as `async` and using `await` causes the entire page transition to block until all data resolves. Use synchronous loaders returning promises for streaming.

**Reference:** See `data-fetching` section for comprehensive loader patterns including mixed strategies (awaited + streamed).

## 4. Modifying shadcn/ui

```typescript
// ❌ NEVER modify src/components/ui/

// ✅ Create wrapper
import { Button } from '@/components/ui/button';
export function MyButton(props) {
    return <Button {...props} className="custom" />;
}
```

## 5. Missing Namespace in i18n

```typescript
// ❌ MISSING NAMESPACE
const {t} = useTranslation();
t('title'); // Won't work

// ✅ USE NAMESPACE
const {t} = useTranslation('product');
t('title'); // Works
```

## 6. Not Using Context in Server Loaders

```typescript
// ❌ MISSING CONTEXT
export function loader() {
    const config = getConfig(); // Wrong!
}

// ✅ PASS CONTEXT
export function loader({ context }: LoaderFunctionArgs) {
    const config = getConfig(context); // Correct
}
```

## 7. Forgetting to Namespace i18n Keys

```typescript
// ❌ MISSING NAMESPACE
const { t } = useTranslation();
t('title'); // Won't work without namespace

// ✅ USE NAMESPACE
const { t } = useTranslation('product');
t('title'); // Works

// OR
const { t } = getTranslation();
t('product:title'); // Works
```

## 8. Using JavaScript Files

```text
❌ .js, .jsx, .mjs, .cjs files are BLOCKED
✅ Use .ts, .tsx files only
```
