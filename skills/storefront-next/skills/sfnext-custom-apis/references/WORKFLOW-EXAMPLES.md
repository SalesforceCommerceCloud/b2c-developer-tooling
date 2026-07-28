# Workflow Examples

Complete end-to-end examples showing the full lifecycle from custom API creation through calling from a Storefront Next storefront.

## Example 1: Shopper Custom API — Loyalty Points

A customer-facing API that retrieves and redeems loyalty points.

### Cartridge Structure

```
loyalty-cartridge/cartridge/rest-apis/loyalty-points/
├── schema.yaml
├── api.json
└── script.js
```

### schema.yaml

```yaml
openapi: "3.0.0"
info:
  title: Loyalty Points API
  version: "v1"
paths:
  /points/{customerId}:
    get:
      operationId: getPoints
      parameters:
        - name: customerId
          in: path
          required: true
          schema:
            type: string
        - name: siteId
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Customer loyalty points
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LoyaltyBalance"
  /points/{customerId}/redeem:
    post:
      operationId: redeemPoints
      parameters:
        - name: customerId
          in: path
          required: true
          schema:
            type: string
        - name: siteId
          in: query
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RedeemRequest"
      responses:
        "200":
          description: Redemption result
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RedeemResult"
components:
  schemas:
    LoyaltyBalance:
      type: object
      properties:
        customerId:
          type: string
        points:
          type: integer
        tier:
          type: string
          enum: [bronze, silver, gold, platinum]
        lastUpdated:
          type: string
          format: date-time
    RedeemRequest:
      type: object
      required: [points]
      properties:
        points:
          type: integer
          minimum: 1
    RedeemResult:
      type: object
      properties:
        success:
          type: boolean
        remainingPoints:
          type: integer
        transactionId:
          type: string
```

### api.json

```json
{
  "type": "shopper",
  "version": "v1"
}
```

### Deploy and Register

```bash
# deploy the cartridge
b2c code deploy ./loyalty-cartridge --activate

# verify registration
b2c scapi custom status --api-name loyalty-points
```

### Add to Storefront Next Project

```bash
b2c sfnext scapi add custom loyalty-points v1
```

### Discover and Use

```bash
# check endpoints
b2c scapi schemas get custom loyalty-points v1 --list-paths

# inspect response shape
b2c scapi schemas get custom loyalty-points v1 \
  --expand-paths /points/{customerId} \
  --expand-schemas LoyaltyBalance
```

### Storefront Code

```typescript
// src/routes/_app.account.loyalty.tsx
import { createApiClients } from '@/lib/api-clients';
import { createPage } from '@/lib/create-page';

interface LoyaltyPageData {
    balance: Promise<LoyaltyBalance>;
}

export function loader({ context }: LoaderFunctionArgs): LoyaltyPageData {
    const clients = createApiClients(context);
    const customerId = context.session.customerId;

    return {
        balance: clients.loyaltyPoints.getPoints({
            params: {
                path: { customerId },
                query: { siteId: context.siteId }
            }
        }).then(({ data }) => data),
    };
}

export default createPage<LoyaltyPageData>(({ data }) => (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold">Loyalty Points</h1>
        <Suspense fallback={<Skeleton className="h-24" />}>
            <Await resolve={data.balance}>
                {(balance) => (
                    <div className="rounded-lg border p-6">
                        <p className="text-4xl font-bold">{balance.points}</p>
                        <p className="text-muted-foreground">
                            {balance.tier} tier
                        </p>
                    </div>
                )}
            </Await>
        </Suspense>
    </div>
));
```

---

## Example 2: Admin Custom API — Inventory Check

An admin API for back-office inventory operations. Admin APIs use BearerToken auth and do not require `siteId`.

### Key Differences from Shopper APIs

| Aspect | This Example | Example 1 (Shopper) |
|--------|-------------|---------------------|
| api.json `type` | `"admin"` | `"shopper"` |
| Auth | BearerToken (Account Manager) | ShopperToken (SLAS) |
| `siteId` param | Not required | Required |
| Typical caller | Admin tools, cron jobs | Storefront loaders |

### api.json

```json
{
  "type": "admin",
  "version": "v1"
}
```

### Usage in Storefront Context

Admin APIs are typically NOT called from storefront loaders (since storefronts use shopper auth). If you need admin-level data in a storefront, consider:

1. Using a shopper API that exposes the same data with appropriate access controls
2. Pre-computing results and storing them in a custom object accessible via shopper APIs

---

## Example 3: useScapiFetcher with Custom API

Interactive pattern for fetching custom API data after page load (e.g., showing loyalty points in a modal that opens on click).

```typescript
// src/hooks/use-loyalty-points.ts
import { useScapiFetcher } from '@/hooks/use-scapi-fetcher';
import { useMemo, useCallback } from 'react';

export function useLoyaltyPoints(customerId: string | undefined) {
    const parameters = useMemo(
        () => customerId ? {
            params: {
                path: { customerId },
                query: { siteId: getSiteId() }
            }
        } : null,
        [customerId]
    );

    const fetcher = useScapiFetcher(
        'loyaltyPoints',
        'getPoints',
        parameters
    );

    const refresh = useCallback(async () => {
        if (parameters) {
            await fetcher.load();
        }
    }, [fetcher, parameters]);

    return {
        points: fetcher.data?.points ?? 0,
        tier: fetcher.data?.tier ?? 'bronze',
        isLoading: fetcher.state === 'loading',
        refresh,
    };
}
```

```typescript
// src/components/loyalty-badge.tsx
import { useLoyaltyPoints } from '@/hooks/use-loyalty-points';

export function LoyaltyBadge({ customerId }: { customerId: string }) {
    const { points, tier, isLoading, refresh } = useLoyaltyPoints(customerId);

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (isLoading) return <Skeleton className="h-6 w-16" />;

    return (
        <Badge variant={tier === 'platinum' ? 'default' : 'secondary'}>
            {points} pts
        </Badge>
    );
}
```

### How It Works

```
LoyaltyBadge renders
  → useLoyaltyPoints calls useScapiFetcher('loyaltyPoints', 'getPoints', params)
  → fetcher.load() sends GET to /resource/api/client/{encoded-params}
  → Resource route runs ON SERVER
  → createApiClients(context).loyaltyPoints.getPoints({...}) calls SCAPI
  → JSON response returned to component
```

The custom API call happens server-side even though it's triggered from a client component.
