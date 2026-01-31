# Shopper API Scopes Reference

Complete reference for OAuth scopes used with SLAS (Shopper Login and API Access Service).

## Scope Overview

Scopes define what APIs and operations a SLAS client can access. Configure scopes when creating SLAS clients:

```bash
# Create client with specific scopes
b2c slas client create \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --scopes "sfcc.shopper-products,sfcc.shopper-baskets-orders.rw" \
  --redirect-uri http://localhost:3000/callback

# Create client with default scopes (recommended for shopping apps)
b2c slas client create \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback
```

## Scope Categories

### Product APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-products` | Shopper Products | Read products, prices, images |
| `sfcc.shopper-categories` | Shopper Products | Read categories |

### Search APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-product-search` | Shopper Search | Product search and suggestions |
| `sfcc.shopper-discovery-search` | Shopper Discovery Search | AI-powered search (Einstein) |

### Checkout APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-baskets-orders` | Shopper Baskets, Orders | Read baskets and orders |
| `sfcc.shopper-baskets-orders.rw` | Shopper Baskets, Orders | Create/update/delete baskets, create orders |

### Customer APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-customers.login` | Shopper Customers | Log in shoppers |
| `sfcc.shopper-customers.register` | Shopper Customers | Register new shoppers |
| `sfcc.shopper-myaccount` | Shopper Customers | Read account info |
| `sfcc.shopper-myaccount.rw` | Shopper Customers | Update account info |
| `sfcc.shopper-myaccount.addresses` | Shopper Customers | Read addresses |
| `sfcc.shopper-myaccount.addresses.rw` | Shopper Customers | Manage addresses |
| `sfcc.shopper-myaccount.baskets` | Shopper Customers | Read saved baskets |
| `sfcc.shopper-myaccount.orders` | Shopper Customers | Read order history |
| `sfcc.shopper-myaccount.paymentinstruments` | Shopper Customers | Read payment methods |
| `sfcc.shopper-myaccount.paymentinstruments.rw` | Shopper Customers | Manage payment methods |
| `sfcc.shopper-myaccount.productlists` | Shopper Customers | Read wishlists |
| `sfcc.shopper-myaccount.productlists.rw` | Shopper Customers | Manage wishlists |

### Pricing APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-promotions` | Shopper Promotions | Read promotions |
| `sfcc.shopper-gift-certificates` | Shopper Gift Certificates | Read/redeem gift certificates |

### Store APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-stores` | Shopper Stores | Search and read stores |

### Context APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-context` | Shopper Context | Read shopper context |
| `sfcc.shopper-context.rw` | Shopper Context | Read/write shopper context |

### Configuration APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-configurations` | Shopper Configurations | Read site configurations |

### Product Lists APIs

| Scope | API | Access |
|-------|-----|--------|
| `sfcc.shopper-productlists` | Shopper Product Lists | Read product lists |

## Special Scopes

### Authentication Scopes

| Scope | Purpose |
|-------|---------|
| `sfcc.pwdless_login` | Enable passwordless email login (OTP) |
| `sfcc.session_bridge` | Enable session bridging between PWA and SFRA |

### Trusted Agent/System Scopes

| Scope | Purpose |
|-------|---------|
| `sfcc.ta_ext_on_behalf_of` | Trusted agent - act on behalf of shoppers |
| `sfcc.ts_ext_on_behalf_of` | Trusted system - backend service integration |

### AI Agent Scope

| Scope | Purpose |
|-------|---------|
| `sfcc.shopper-mcpagent` | MCP (Model Context Protocol) agent access |

### Custom Scopes

Custom APIs define their own scopes with `c_` prefix:

| Scope Pattern | Purpose |
|---------------|---------|
| `c_my_custom_scope` | Custom API endpoint access |

```bash
# Create client with custom scope for Custom API
b2c slas client create \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --default-scopes \
  --scopes "c_loyalty,c_rewards" \
  --redirect-uri http://localhost:3000/callback
```

## Default Scopes

When using `--default-scopes`, these scopes are automatically included:

```
sfcc.shopper-myaccount
sfcc.shopper-myaccount.rw
sfcc.shopper-myaccount.baskets
sfcc.shopper-myaccount.addresses
sfcc.shopper-myaccount.addresses.rw
sfcc.shopper-myaccount.paymentinstruments
sfcc.shopper-myaccount.paymentinstruments.rw
sfcc.shopper-myaccount.orders
sfcc.shopper-myaccount.productlists
sfcc.shopper-myaccount.productlists.rw
sfcc.shopper-products
sfcc.shopper-productlists
sfcc.shopper-promotions
sfcc.shopper-customers.login
sfcc.shopper-customers.register
sfcc.shopper-stores
sfcc.shopper-baskets-orders
sfcc.shopper-baskets-orders.rw
sfcc.shopper-gift-certificates
sfcc.shopper-product-search
sfcc.shopper-discovery-search
sfcc.shopper-categories
sfcc.shopper-configurations
```

## Recommended Scope Sets

### Basic Shopping App (PWA Kit)

Minimum scopes for a typical shopping experience:

```
sfcc.shopper-baskets-orders.rw
sfcc.shopper-categories
sfcc.shopper-customers.login
sfcc.shopper-customers.register
sfcc.shopper-gift-certificates
sfcc.shopper-myaccount.rw
sfcc.shopper-product-search
sfcc.shopper-productlists
sfcc.shopper-products
sfcc.shopper-promotions
sfcc.shopper-stores
```

### Read-Only Catalog Browser

For content/catalog browsing without checkout:

```
sfcc.shopper-products
sfcc.shopper-categories
sfcc.shopper-product-search
sfcc.shopper-promotions
sfcc.shopper-stores
```

### Guest Checkout Only

For sites without customer registration:

```
sfcc.shopper-products
sfcc.shopper-categories
sfcc.shopper-product-search
sfcc.shopper-baskets-orders.rw
sfcc.shopper-promotions
sfcc.shopper-gift-certificates
```

### Full Customer Experience

Complete scope set for registered customer features:

```
sfcc.shopper-products
sfcc.shopper-categories
sfcc.shopper-product-search
sfcc.shopper-baskets-orders.rw
sfcc.shopper-customers.login
sfcc.shopper-customers.register
sfcc.shopper-myaccount.rw
sfcc.shopper-myaccount.addresses.rw
sfcc.shopper-myaccount.paymentinstruments.rw
sfcc.shopper-myaccount.productlists.rw
sfcc.shopper-promotions
sfcc.shopper-gift-certificates
sfcc.shopper-stores
```

## Best Practices

### Minimize Scope Set

Only include scopes your application actually needs:
- Smaller scope set = smaller token = faster cookie/header transmission
- Reduces attack surface if token is compromised
- Easier to audit API access

### Avoid Redundant Scopes

Don't include both read and read/write scopes:

```bash
# Bad - redundant
--scopes "sfcc.shopper-myaccount,sfcc.shopper-myaccount.rw"

# Good - just use the .rw scope
--scopes "sfcc.shopper-myaccount.rw"
```

### Separate Clients for Different Purposes

Create dedicated clients for different use cases:

```bash
# Client for storefront (shopper-facing)
b2c slas client create storefront-client \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --scopes "sfcc.shopper-products,sfcc.shopper-baskets-orders.rw" \
  --redirect-uri https://store.example.com/callback

# Client for mobile app (may need different scopes)
b2c slas client create mobile-client \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --scopes "sfcc.shopper-products,sfcc.shopper-baskets-orders.rw,sfcc.shopper-stores" \
  --redirect-uri myapp://callback
```

### Don't Mix Admin and Shopper Scopes

Shopper scopes (SLAS) and Admin scopes (Account Manager) cannot be combined in the same client or token. Use separate authentication for admin operations.

## Verifying Token Scopes

Check what scopes are in your access token:

```javascript
// Decode JWT payload (base64)
const tokenParts = accessToken.split('.');
const payload = JSON.parse(atob(tokenParts[1]));

console.log('Token scopes:', payload.scope);
// Output: "sfcc.shopper-products sfcc.shopper-baskets-orders.rw ..."
```
