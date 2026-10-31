# Storefront Next Extension Templates

Complete templates for the extension system. All files must use TypeScript (.ts/.tsx).

**⚠️ IMPORTANT:** Extensions inherit TypeScript configuration from the parent Storefront Next application. **Do NOT create tsconfig.json at the extension level** - it's unnecessary and can cause configuration conflicts.

## Target Configuration

**File:** `storefront-next/src/extensions/{{appName}}/target-config.json`

```json
{
    "components": [
        {
            "targetId": "sfcc.header.before.cart",
            "path": "extensions/{{appName}}/components/{{ComponentName}}.tsx",
            "order": 0
        }
    ],
    "contextProviders": [
        {
            "path": "extensions/{{appName}}/providers/{{AppName}}Provider.tsx",
            "order": 0
        }
    ],
    "actionHooks": [
        {
            "hookId": "sfcc.checkout.fraud.afterSubmitContactInfo",
            "handler": "extensions/{{appName}}/hooks/{{hookName}}.server.ts",
            "order": 0
        }
    ]
}
```

**Key fields:**
- `targetId`: UI target slot where component should be inserted — must include the `sfcc.` prefix (see "Complete Target ID Reference" below)
- `path`: Relative path from `src/` to the component file
- `order`: Insertion order when multiple components target the same slot (lower = earlier)
- `contextProviders`: Application-root level providers (injected after ComposeProviders)
- `actionHooks`: Server-side handlers that run during storefront actions (see "Action Hook Handler" below)
- `devOnly`: (optional) Set to `true` to exclude extension from production builds

**⚠️ IMPORTANT:** Use `target-config.json` (not `plugin-config.json`) and `targetId` (not `pluginId`)

## Finding Valid Target IDs

All target IDs use the `sfcc.` prefix. To find valid target slots in the codebase:

```bash
# Search for UITarget component usage
grep -r "UITarget" src/ --include="*.tsx" --include="*.ts"

# Look for existing target-config.json files
find . -name "target-config.json" -exec cat {} \;
```

See the "Complete Target ID Reference" section below for the full list. **Always verify target IDs exist** before using them. Non-existent targets will cause components to never render.

## Index Barrel File

**File:** `storefront-next/src/extensions/{{appName}}/index.ts`

```typescript
// Export all public components
export { default as {{ComponentName}} } from './components/{{ComponentName}}';

// Export hooks
export { use{{FeatureName}} } from './hooks/use{{FeatureName}}';

// Export types
export type { {{ComponentName}}Props } from './components/{{ComponentName}}';

// Export providers
export { {{AppName}}Provider, use{{AppName}}Context } from './providers/{{AppName}}Provider';
```

**Why:** Provides clean import paths and explicit public API for the extension.

**Import pattern from other files:**
```typescript
// Importing from the extension
import { ComponentName } from '@/extensions/appName';              // Component (runtime)
import type { ComponentNameProps } from '@/extensions/appName';    // Type (compile-time)
import { useFeatureName } from '@/extensions/appName';             // Hook (runtime)
import { AppNameProvider, useAppNameContext } from '@/extensions/appName';  // Provider (runtime)
```

**Rule:** Always use `import type` for types/interfaces. Use regular `import` for runtime values (functions, components).

## TypeScript Component with i18n

**File:** `storefront-next/src/extensions/{{appName}}/components/{{ComponentName}}.tsx`

```typescript
import React, { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export interface {{ComponentName}}Props {
    /**
     * Optional className for styling
     */
    className?: string;
    /**
     * Additional data prop (adjust based on component needs)
     */
    data?: unknown;
}

/**
 * {{ComponentName}} component for {{displayName}}
 * 
 * @param props - Component props
 * @returns React element
 */
export default function {{ComponentName}}({ className, data }: {{ComponentName}}Props): ReactElement {
    const { t } = useTranslation('ext{{AppName}}');

    return (
        <div className={className} data-testid="{{app-name}}-{{component-name}}">
            <h3>{t('{{appName}}.title')}</h3>
            <p>{t('{{appName}}.description')}</p>
            {/* TODO: Implement component logic */}
        </div>
    );
}
```

**⚠️ IMPORTANT:** Always use `useTranslation()` - never hardcode strings. The namespace should be `'ext{{AppName}}'` (ext + PascalCase) and the JSON root key should be `{{appName}}` (camelCase).

**Important:**
- Always export a `Props` interface
- Include JSDoc comments for props
- Add `data-testid` for testing
- Use PascalCase for component names
- Export component as default (required for extension system dynamic imports)
- **Use `import type` for all TypeScript types** (ReactElement, ReactNode, custom interfaces) - only runtime values (functions, components) use regular import
- Ensure `useTranslation('ext{{AppName}}')` namespace uses ext + PascalCase, while JSON root key uses camelCase
- Follow ESLint recommended rules for code quality and consistency

## Context Provider

**File:** `storefront-next/src/extensions/{{appName}}/providers/{{AppName}}Provider.tsx`

```typescript
import React, { createContext, useContext, type ReactNode, type ReactElement } from 'react';

interface {{AppName}}ContextType {
    // Define context state and methods
    isEnabled: boolean;
    toggle: () => void;
}

const {{AppName}}Context = createContext<{{AppName}}ContextType | undefined>(undefined);

export interface {{AppName}}ProviderProps {
    children: ReactNode;
}

/**
 * {{AppName}} context provider
 * Register in target-config.json contextProviders, not inline wrapping
 * MUST be default export for extension system dynamic imports
 */
export default function {{AppName}}Provider({ children }: {{AppName}}ProviderProps): ReactElement {
    const [isEnabled, setIsEnabled] = React.useState(false);

    const value = {
        isEnabled,
        toggle: () => setIsEnabled(prev => !prev),
    };

    return (
        <{{AppName}}Context.Provider value={value}>
            {children}
        </{{AppName}}Context.Provider>
    );
}

/**
 * Hook to use {{AppName}} context
 * @throws Error if used outside {{AppName}}Provider
 */
export function use{{AppName}}Context(): {{AppName}}ContextType {
    const context = useContext({{AppName}}Context);
    if (context === undefined) {
        throw new Error('use{{AppName}}Context must be used within {{AppName}}Provider');
    }
    return context;
}
```

**Provider with configuration:**

If your provider needs access to configuration (API keys, settings, etc.), use this pattern:

```typescript
import React, { createContext, useContext, useState, useEffect, type ReactNode, type ReactElement } from 'react';
import { useConfig } from '@salesforce/storefront-next-runtime/config';

interface AppConfig {
    extension?: {
        {{appName}}?: {
            apiKey: string;
            enabled: boolean;
        };
    };
}

interface {{AppName}}Config {
    apiKey: string;
    enabled: boolean;
}

interface {{AppName}}ContextType {
    config: {{AppName}}Config;
    isReady: boolean;
}

const {{AppName}}Context = createContext<{{AppName}}ContextType | undefined>(undefined);

export interface {{AppName}}ProviderProps {
    children: ReactNode;
}

export default function {{AppName}}Provider({ children }: {{AppName}}ProviderProps): ReactElement {
    const appConfig = useConfig<AppConfig>();
    const [config] = useState<{{AppName}}Config>({
        apiKey: appConfig.extension?.{{appName}}?.apiKey || '',
        enabled: appConfig.extension?.{{appName}}?.enabled !== false,
    });
    
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Initialize provider with configuration
        setIsReady(true);
    }, []);

    const value = {
        config,
        isReady,
    };

    return (
        <{{AppName}}Context.Provider value={value}>
            {children}
        </{{AppName}}Context.Provider>
    );
}

export function use{{AppName}}Context(): {{AppName}}ContextType {
    const context = useContext({{AppName}}Context);
    if (context === undefined) {
        throw new Error('use{{AppName}}Context must be used within {{AppName}}Provider');
    }
    return context;
}
```

**Key points:**
- **Provider MUST be default export** for extension system dynamic imports
- Register providers in `target-config.json` under `contextProviders`
- Do NOT wrap components inline
- Hook is named export, provider is default export
- Include type safety with undefined check
- Use `import type` for TypeScript types to avoid Vite ESM/CJS interop issues
- Use `useConfig<AppConfig>()` with TypeScript type for type-safe configuration access
- Access config with direct property access: `appConfig.extension?.{{appName}}?.key || defaultValue`

## Injecting External SDK Scripts

Context providers can render `<script src="...">` tags to load external vendor SDKs (fraud beacons, analytics, payment libraries). React 19 automatically hoists these to `<head>` and deduplicates by `src`.

**File:** `storefront-next/src/extensions/{{appName}}/providers/{{AppName}}Provider.tsx`

```typescript
'use client';
import { useEffect, type ReactNode, type ReactElement } from 'react';
import { useLocation } from 'react-router';
import { useConfig } from '@salesforce/storefront-next-runtime/config';

interface AppConfig {
    extension?: {
        {{appName}}?: {
            siteId: string;
            enabled: boolean;
        };
    };
}

export default function {{AppName}}Provider({ children }: { children: ReactNode }): ReactElement {
    const appConfig = useConfig<AppConfig>();
    const siteId = appConfig.extension?.{{appName}}?.siteId ?? '';
    const enabled = appConfig.extension?.{{appName}}?.enabled !== false;
    const location = useLocation();

    useEffect(() => {
        if (!enabled || !siteId) return;
        // Re-notify vendor SDK on SPA navigation.
        // Replace with your vendor's page-notify API.
        const win = window as Window & { vendorSdk?: { notifyPageView?: () => void } };
        win.vendorSdk?.notifyPageView?.();
    }, [enabled, siteId, location.pathname]);

    return (
        <>
            {enabled && siteId && (
                <script src={`https://cdn.example.com/sdk.js?id=${siteId}`} async />
            )}
            {children}
        </>
    );
}
```

**Key points:**
- Use `async` for non-blocking SDKs (analytics, widgets). Omit `async` for SDKs that must load synchronously (fraud beacons).
- Use `useLocation()` from `react-router` to detect SPA navigation and re-trigger vendor SDK logic.
- For checkout-scoped SDKs (payment processors), use a `component` at `sfcc.checkout.page.before` instead of a global `contextProvider`.
- Inline `<script>` blocks (code, not `src`) are NOT hoisted by React 19 — use `useEffect` for `window` object initialization.

## Action Hook Handler

**File:** `storefront-next/src/extensions/{{appName}}/hooks/{{hookName}}.server.ts`

Action hooks run server-side logic at specific points in the storefront flow. They are declared in `target-config.json` under `actionHooks` and execute in waterfall order with a 5-second timeout per handler.

**Available hook IDs:**

| Hook ID | Blocking | Purpose |
| :------ | :------- | :------ |
| `sfcc.checkout.fraud.afterSubmitContactInfo` | No | Fraud/identity checks after contact info submission |
| `sfcc.checkout.addressVerification.afterSubmitShippingAddress` | No | Address validation and standardization |
| `sfcc.checkout.shipping.afterMethodsFetch` | No | Enrich or filter shipping methods |
| `sfcc.checkout.shipping.afterMethodSelect` | No | Post-processing after shipping method selection |
| `sfcc.checkout.payments.afterSubmitPayment` | No | Post-payment processing (tokenization) |
| `sfcc.checkout.fraud.beforePlace` | **Yes** | Final fraud gate — can block order creation |
| `sfcc.checkout.payments.beforePlaceOrder` | **Yes** | Payment authorization gate — can block order creation |
| `sfcc.checkout.payments.afterPlaceOrder` | No | Post-order processing (payment capture) |

**Blocking** hooks abort the action on any failure. **Non-blocking** hooks log errors and continue. Throwing `ActionHookError` always aborts with a user-facing error.

```typescript
import type { ActionHookContext } from '@/targets/action-hook.server';
import { ActionHookError } from '@/targets/action-hook.server';

export default async function {{hookName}}(
    context: ActionHookContext,
): Promise<ActionHookContext | void> {
    const { data, actionContext } = context;

    const response = await fetch('https://api.example.com/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: data.shippingAddress }),
    });
    const result = await response.json();

    if (!result.valid) {
        throw new ActionHookError(
            'Please check your information and try again.',
            'sfcc.checkout.addressVerification.afterSubmitShippingAddress',
            'shippingAddress',
        );
    }

    // Return modified context for downstream handlers, or void to pass through unchanged.
    return { ...context, data: { ...data, shippingAddress: result.standardizedAddress } };
}
```

**Key points:**
- Handler MUST be default export
- `ActionHookContext` contains `data` (step-specific) and `actionContext` (React Router action context)
- `ActionHookError(message, hookId, step)` returns a 400 response; `step` controls where the error displays
- Return modified context to pass data downstream, or `void` to pass through unchanged
- 5-second timeout per handler — keep external calls fast

## Custom Hook

**File:** `storefront-next/src/extensions/{{appName}}/hooks/use{{FeatureName}}.ts`

```typescript
import { useState, useEffect } from 'react';

export interface Use{{FeatureName}}Options {
    enabled?: boolean;
}

export interface Use{{FeatureName}}Result {
    data: unknown | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook for {{featureName}} functionality
 * @param options - Hook configuration options
 * @returns Hook result with data, loading, and error states
 */
export function use{{FeatureName}}(options: Use{{FeatureName}}Options = {}): Use{{FeatureName}}Result {
    const { enabled = true } = options;
    const [data, setData] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled) return;

        setIsLoading(true);
        // TODO: Implement hook logic
        setIsLoading(false);
    }, [enabled]);

    return { data, isLoading, error };
}
```

## Localization

**Supported locales:** `en-US` (English - US), `en-GB` (English - UK), `it-IT` (Italian)

All three locales must be created for each extension to support internationalization.

**Structure:** `locales/{locale}/translations.json` (NOT flat `locales/{locale}.json`)

### English (US)
**File:** `storefront-next/src/extensions/{{appName}}/locales/en-US/translations.json`

```json
{
    "{{appName}}": {
        "title": "{{displayName}}",
        "description": "{{description}}",
        "button": {
            "submit": "Submit",
            "cancel": "Cancel"
        },
        "message": {
            "success": "Operation completed successfully",
            "error": "An error occurred"
        }
    }
}
```

### English (UK)
**File:** `storefront-next/src/extensions/{{appName}}/locales/en-GB/translations.json`

```json
{
    "{{appName}}": {
        "title": "{{displayName}}",
        "description": "{{description}}",
        "button": {
            "submit": "Submit",
            "cancel": "Cancel"
        },
        "message": {
            "success": "Operation completed successfully",
            "error": "An error occurred"
        }
    }
}
```

**Note:** UK English typically uses the same content as US English for most UI text. Adjust spelling where needed (e.g., "colour" vs "color", "favourites" vs "favorites").

### Italian
**File:** `storefront-next/src/extensions/{{appName}}/locales/it-IT/translations.json`

```json
{
    "{{appName}}": {
        "title": "{{displayName}}",
        "description": "{{description}}",
        "button": {
            "submit": "Invia",
            "cancel": "Annulla"
        },
        "message": {
            "success": "Operazione completata con successo",
            "error": "Si è verificato un errore"
        }
    }
}
```

**Translation guidance:** Italian translations should be provided by native speakers or professional translation services. The examples above are basic defaults - adjust based on your app's context.

**Namespace pattern:**
- `useTranslation()` namespace: `'ext' + PascalCaseAppName` (e.g., `'extProductReviews'`)
- JSON root key: camelCaseAppName (e.g., `"productReviews": { ... }`)
- Usage: `t('productReviews.title')` - references JSON keys directly without namespace prefix
- All three locale files must have identical key structures

## Component Test

**File:** `storefront-next/src/extensions/{{appName}}/tests/{{ComponentName}}.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {{ComponentName}} from '../components/{{ComponentName}}';

// Mock i18n - MUST be outside describe block
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { changeLanguage: () => Promise.resolve() }
    })
}));

describe('{{ComponentName}}', () => {
    it('renders without crashing', () => {
        render(<{{ComponentName}} />);
        expect(screen.getByTestId('{{app-name}}-{{component-name}}')).toBeInTheDocument();
    });

    it('displays translated content', () => {
        render(<{{ComponentName}} />);
        // Verify translation keys are used (mock returns the key itself)
        expect(screen.getByText('{{appName}}.title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-class';
        render(<{{ComponentName}} className={customClass} />);
        const element = screen.getByTestId('{{app-name}}-{{component-name}}');
        expect(element).toHaveClass(customClass);
    });
});
```

**⚠️ CRITICAL:** `vi.mock()` MUST be outside `describe()` or `it()` blocks. Vitest hoists mocks, so calling inside a test won't work.

**Required:** Extensions must include unit tests for coverage enforcement.

## Configuration Pattern

**CRITICAL: Use the standard 3-step configuration pattern for all extensions.**

### Step 1: Add Type to AppConfig

Define your extension's config type in `src/types/config.ts`:

```typescript
export type AppConfig = {
    // ...existing fields...
    extension?: {
        {{appName}}?: {
            apiKey: string;
            enabled: boolean;
        };
    };
};
```

### Step 2: Add Defaults in config.server.ts

Provide default values in `config.server.ts`:

```typescript
app: {
    // ...existing config...
    extension: {
        {{appName}}: {
            apiKey: '',
            enabled: false,
        },
    },
}
```

### Step 3: Override via PUBLIC__ Environment Variables

Set values in `.env` using the PUBLIC__ prefix with double underscores:

```bash
PUBLIC__app__extension__{{appName}}__apiKey=your-key-here
PUBLIC__app__extension__{{appName}}__enabled=true
```

The double underscore (`__`) navigates nested config paths:
- `PUBLIC__app__extension__{{appName}}__apiKey` → `config.app.extension.{{appName}}.apiKey`

### Step 4: Access Configuration with Direct Property Access

**In components (client-side):**

```typescript
import React, { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@salesforce/storefront-next-runtime/config';

interface AppConfig {
    extension?: {
        {{appName}}?: {
            apiKey: string;
            enabled: boolean;
        };
    };
}

export interface {{ComponentName}}Props {
    className?: string;
}

export default function {{ComponentName}}({ className }: {{ComponentName}}Props): ReactElement {
    const { t } = useTranslation('ext{{AppName}}');
    const appConfig = useConfig<AppConfig>();
    
    // ✅ Correct - direct property access with optional chaining
    const apiKey = appConfig.extension?.{{appName}}?.apiKey || '';
    const enabled = appConfig.extension?.{{appName}}?.enabled !== false;
    
    return (
        <div className={className} data-testid="{{app-name}}-{{component-name}}">
            <h3>{t('{{appName}}.title')}</h3>
            {enabled && <p>{t('{{appName}}.status.enabled')}</p>}
            {/* Use apiKey for API calls */}
        </div>
    );
}
```

**In loaders/actions (server-side):**

```typescript
import { getConfig } from '@salesforce/storefront-next-runtime/config';

export async function loader({ context }) {
    const config = getConfig<AppConfig>(context);
    
    // ✅ Correct - direct property access
    const apiKey = config.extension?.{{appName}}?.apiKey || '';
    const enabled = config.extension?.{{appName}}?.enabled !== false;
    
    // Use config values...
}
```

**Critical rules:**
- ❌ **NEVER use `.get()` method** - this is incorrect and will not work
- ✅ **ALWAYS use direct property access** with optional chaining (`?.`)
- ✅ **ALWAYS provide fallback values** with `|| ''` or `!== false`
- ✅ **ALWAYS use TypeScript generic** `useConfig<AppConfig>()` for type safety

**Why this pattern:**
- Type-safe configuration with full IDE autocomplete
- Consistent with entire Storefront Next application
- PUBLIC__ prefixed variables automatically merge into config.server.ts
- Double underscore (`__`) maps to nested paths
- Unified configuration system for all app settings

## ESLint Rules and Code Quality

Extensions must follow the Storefront Next ESLint configuration for consistency and quality.

### Import Rules

**No duplicate imports (eslint: no-duplicate-imports):**
```typescript
// ✅ Correct - single import combining runtime and types (inline type syntax)
import React, { useState, useEffect, type ReactElement, type ReactNode } from 'react';

// ❌ Wrong - multiple import statements from same source
import React from 'react';
import { useState } from 'react';
import type { ReactElement } from 'react';
```

**Consistent type imports (REQUIRED):**
```typescript
// ✅ Correct - use inline type modifier for types
import { type ReactElement, type ReactNode } from 'react';
import { type MyCustomType } from './types';

// ✅ Also correct - separate import type statement (when no runtime imports)
import type { MyCustomType } from './types';

// ❌ Wrong - don't import types as regular imports
import { ReactElement } from 'react';
```

**Multi-site navigation imports:**
```typescript
// ✅ Correct - use multi-site-aware wrappers
import { Link } from '@/components/link';
import { useNavigate } from '@/hooks/use-navigate';

// ❌ Wrong - direct react-router imports don't handle site prefixing
import { Link } from 'react-router';
```

### TypeScript Rules

- **No non-null assertions:** Avoid using `!` operator (e.g., `value!.prop`)
- **No unused variables:** Remove unused imports and variables (underscore prefix allowed: `_unused`)
- **Consistent type exports:** Export types with `export type`
- **No explicit any:** Avoid `any` type - use `unknown` or proper types

### React Rules

**No array index as key (react/no-array-index-key):**
```typescript
// ✅ Correct - use stable unique IDs
items.map((item) => <Item key={item.id} {...item} />)
items.map((item) => <Item key={item.sku} {...item} />)

// ❌ Wrong - array index causes re-render issues
items.map((item, index) => <Item key={index} {...item} />)
```
Why: Using indices as keys causes incorrect component state and poor performance when items reorder/add/remove.

**Other React rules:**
- **No dangerous HTML:** Avoid dangerouslySetInnerHTML for XSS security
- **Self-closing components:** Use `<Component />` not `<Component></Component>` for empty components
- **React Hooks rules:** Follow hooks rules (only at top level, only in function components)

### Code Quality Rules

**String quotes:**
```typescript
// ✅ Single quotes (allow template literals)
const message = 'Hello world';
const dynamic = `Hello ${name}`;

// ❌ Double quotes (unless avoiding escape)
const wrong = "Hello world";
```

**Max line length:** 120 characters (warnings for longer lines, ignores URLs and long strings)

**Prefer const:** Use `const` over `let` when value doesn't change

**No console:** Remove `console.log`, `console.error` etc. from production code (use logger utility)

**Object shorthand:**
```typescript
// ✅ Correct
const obj = { name, age };

// ❌ Verbose
const obj = { name: name, age: age };
```

**Prefer template literals:**
```typescript
// ✅ Correct
const message = `Hello ${name}`;

// ❌ String concatenation
const message = 'Hello ' + name;
```

### Prettier Formatting Rules

**Configuration:** Storefront Next uses the following Prettier settings (`.prettierrc.js`):
- `printWidth: 120` - Max line length
- `tabWidth: 4` - 4 spaces per indentation level
- `useTabs: false` - Use spaces, not tabs
- `semi: true` - Semicolons required
- `singleQuote: true` - Use single quotes
- `trailingComma: 'es5'` - ES5-compatible trailing commas
- `arrowParens: 'always'` - Parentheses around arrow params
- `bracketSpacing: true` - Spaces inside object brackets
- `bracketSameLine: true` - JSX closing bracket on same line as last prop

**Semicolons:** Always use semicolons
```typescript
// ✅ Correct
const message = 'Hello';
const sum = (a, b) => a + b;

// ❌ Wrong
const message = 'Hello'
const sum = (a, b) => a + b
```

**Trailing commas (ES5-compatible):** Add trailing commas in multi-line objects, arrays, function params
```typescript
// ✅ Correct - trailing commas
const config = {
    apiKey: 'key',
    enabled: true,
    timeout: 5000,
};

const items = ['first', 'second', 'third'];
```

**Parentheses around arrow params (arrowParens: 'always'):**
```typescript
// ✅ Correct - always use parentheses
items.map((item) => item.id);
items.filter((x) => x.active);

// ❌ Wrong - no parentheses
items.map(item => item.id);
```

**Bracket spacing:** Spaces inside object brackets
```typescript
// ✅ Correct - spaces inside brackets
const config = { apiKey: 'key', enabled: true };

// ❌ Wrong - no spaces
const config = {apiKey: 'key', enabled: true};
```

**JSX bracket same line (bracketSameLine: true):**
```typescript
// ✅ Correct - closing > on same line as last prop
<Component
    prop1="value"
    prop2="value">
    Content
</Component>

// ❌ Wrong - closing > on separate line
<Component
    prop1="value"
    prop2="value"
>
    Content
</Component>
```

**useCallback formatting:** Indent async arrow function body one additional level (8 spaces total)
```typescript
// ✅ Correct - 8-space indentation for body (2 levels)
const handleSubmit = useCallback(
    async (data) => {
        try {
            const result = await submitData(data);
            return result;
        } catch (error) {
            logger.error('Submit failed', error);
        }
    },
    [submitData],
);
```

### Custom Rules

**No hardcoded Tailwind colors:**
```typescript
// ✅ Correct - use theme colors
<div className="bg-primary text-foreground" />
<div className="border-border" />

// ❌ Wrong - hardcoded color utilities
<div className="bg-blue-500 text-gray-900" />
<div className="border-red-600" />
```

Use Shadcn theme utilities: `primary`, `secondary`, `accent`, `muted`, `destructive`, `border`, `input`, `ring`, `background`, `foreground`, `card`, etc.

### Accessibility Rules

- **Alt text required:** All images must have alt text
- **No redundant alt:** Don't use "image" or "picture" in alt text

### File-Specific Rules

**Route files** (inside `routes/` directory):
- No `clientAction` exports (use server actions for security)
- No `clientLoader` exports (use server loaders for performance)

**Test files** (`.test.ts`, `.test.tsx`):
- Console statements allowed
- Relaxed type checking
- No import restrictions

## Extension Routes

**File:** `storefront-next/src/extensions/{{appName}}/routes/{{route-name}}.ts`

```typescript

import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const {{ComponentName}}Page = lazy(() => import('../components/{{ComponentName}}Page'));

export default {
    path: '/{{route-path}}',
    element: <{{ComponentName}}Page />,
} as RouteObject;
```

**Usage:** File-based routes under `extensions/{{appName}}/routes/` are automatically registered. Extension routes take precedence over core template routes (can override).

## Complete Target ID Reference

All target IDs use the `sfcc.` prefix. Target slots where components can be inserted. **Always verify these exist in your version** using grep. Targets without children are INSERTION points (self-closing `<UITarget />`); targets with children are WRAPPER points that wrap default content.

### Header & Navigation
- `sfcc.header.before.cart` - Insert content before the cart icon in the header toolbar
- `sfcc.header.bnpl.banner` - Insert BNPL banner below header
- `sfcc.header.search.input` - (WRAPPER) Replace the search input component

### Footer
- `sfcc.footer.customersupport.start` - Insert links at the top of the Customer Support column
- `sfcc.footer.customersupport.end` - Insert links at the bottom of the Customer Support column
- `sfcc.footer.account.start` - Insert links at the top of the Account column
- `sfcc.footer.account.end` - Insert links at the bottom of the Account column
- `sfcc.footer.ourcompany.start` - Insert links at the top of the Our Company column
- `sfcc.footer.ourcompany.end` - Insert links at the bottom of the Our Company column

### PDP (Product Detail Page)
- `sfcc.pdp.products.gallery` - (WRAPPER) Replace the product image gallery
- `sfcc.pdp.products.visualization` - Insert product visualization (e.g., 3D viewer)
- `sfcc.pdp.reviews.rating` - (WRAPPER) Replace the product rating display
- `sfcc.pdp.reviews.summary` - (WRAPPER) Replace the reviews summary section
- `sfcc.pdp.reviews.list` - (WRAPPER) Replace the review cards list
- `sfcc.pdp.reviews.form` - (WRAPPER) Replace the write-a-review form
- `sfcc.pdp.reviews.qna` - Insert Q&A section
- `sfcc.pdp.after.addToCart` - (WRAPPER) Content below the Add to Cart button
- `sfcc.pdp.bnpl.message` - Insert BNPL messaging
- `sfcc.pdp.tax.productMessage` - Insert tax messaging on product page
- `sfcc.pdp.loyalty.points` - Insert loyalty points display
- `sfcc.pdp.shipping.deliveryEstimate` - (WRAPPER) Replace delivery estimate display
- `sfcc.pdp.payments.expressCheckout` - (WRAPPER) Replace express checkout on PDP
- `sfcc.pdp.agent.productHelper` - Insert AI product helper

### PLP (Product List Page)
- `sfcc.plp.search.results` - (WRAPPER) Replace the search results grid
- `sfcc.plp.search.summary` - Insert search summary content
- `sfcc.plp.search.filters` - (WRAPPER) Replace the search filters/refinements
- `sfcc.plp.agent.categoryHelper` - Insert AI category helper
- `sfcc.plp.shipping.deliveryEstimate` - Insert delivery estimate on product tiles

### Product Card
- `sfcc.productCard.reviews.rating` - Insert star rating on product cards
- `sfcc.productCard.loyalty.points` - Insert loyalty points on product cards
- `sfcc.productCard.bnpl.message` - Insert BNPL message on product cards

### Cart
- `sfcc.cart.loyalty.pointsEarned` - Insert loyalty points earned display
- `sfcc.cart.giftCards.apply` - Insert gift card apply form
- `sfcc.cart.tax.lineItemMessage` - Insert tax message per line item
- `sfcc.cart.identity.verification` - Insert identity verification
- `sfcc.cart.payments.expressCheckout` - Insert express checkout buttons
- `sfcc.cart.shipping.deliveryEstimate` - Insert shipping delivery estimate
- `sfcc.cart.bnpl.message` - Insert BNPL messaging in cart

### Mini Cart
- `sfcc.miniCart.payments.expressCheckout` - Insert express checkout in mini cart
- `sfcc.miniCart.bnpl.message` - Insert BNPL message in mini cart
- `sfcc.miniCart.shipping.deliveryEstimate` - Insert delivery estimate in mini cart
- `sfcc.miniCart.tax.lineItemMessage` - Insert tax message in mini cart

### Quick Add
- `sfcc.quickAdd.payments.expressCheckout` - (WRAPPER) Replace express checkout in quick add

### Checkout — Page Layout
- `sfcc.checkout.page.before` - Content before the entire checkout page
- `sfcc.checkout.page.after` - Content after the entire checkout page
- `sfcc.checkout.mainContent.before` - Content before the main checkout column
- `sfcc.checkout.mainContent.after` - Content after the main checkout column

### Checkout — Express Payments
- `sfcc.checkout.expressPayments.header.before` - Content before the express payments section header
- `sfcc.checkout.expressPayments.before` - Content before express payments (inside Suspense)
- `sfcc.checkout.expressPayments` - (WRAPPER) Replace the express payments component
- `sfcc.checkout.expressPayments.after` - Content after express payments

### Checkout — Contact Info
- `sfcc.checkout.contactInfo.header.before` - Content before the contact info section header
- `sfcc.checkout.contactInfo.before` - Content before contact info (inside Suspense)
- `sfcc.checkout.contactInfo` - (WRAPPER) Replace the contact info component
- `sfcc.checkout.contactInfo.after` - Content after contact info

### Checkout — Shipping Address
- `sfcc.checkout.shippingAddress.header.before` - Content before the shipping address section header
- `sfcc.checkout.shippingAddress.before` - Content before the shipping address form
- `sfcc.checkout.shippingAddress` - (WRAPPER) Replace the shipping address component
- `sfcc.checkout.shippingAddress.after` - Content after the shipping address form
- `sfcc.checkout.shippingAddress.autocomplete` - (WRAPPER) Replace the address autocomplete dropdown

### Checkout — Shipping Options
- `sfcc.checkout.shippingOptions.header.before` - Content before the shipping options section header
- `sfcc.checkout.shippingOptions.before` - Content before shipping options
- `sfcc.checkout.shippingOptions` - (WRAPPER) Replace the shipping options component
- `sfcc.checkout.shippingOptions.after` - Content after shipping options

### Checkout — Payment
- `sfcc.checkout.payment.header.before` - Content before the payment section header
- `sfcc.checkout.payment.before` - Content before the payment component
- `sfcc.checkout.payment` - (WRAPPER) Replace the entire payment component
- `sfcc.checkout.payment.after` - Content after the payment component
- `sfcc.checkout.payment.paymentMethods.before` - Content before payment method options
- `sfcc.checkout.payment.paymentMethods` - (WRAPPER) Replace payment method selection (saved cards + CC form)
- `sfcc.checkout.payment.paymentMethods.after` - Content after payment method options
- `sfcc.checkout.payment.billingAddress.before` - Content before the billing address form
- `sfcc.checkout.payment.billingAddress` - (WRAPPER) Replace the billing address form
- `sfcc.checkout.payment.billingAddress.after` - Content after the billing address form
- `sfcc.checkout.payment.billingAddress.autocomplete` - (WRAPPER) Replace the billing address autocomplete dropdown

### Checkout — Account Creation & Place Order
- `sfcc.checkout.createAccount.before` - Content before guest account creation
- `sfcc.checkout.createAccount` - (WRAPPER) Replace the guest account creation component
- `sfcc.checkout.createAccount.after` - Content after guest account creation
- `sfcc.checkout.placeOrder.before` - Content before the place order button
- `sfcc.checkout.placeOrder` - (WRAPPER) Replace the place order form/button
- `sfcc.checkout.placeOrder.after` - Content after the place order button

### Checkout — Sidebar
- `sfcc.checkout.sidebar.before` - Content before the sidebar column
- `sfcc.checkout.sidebar.after` - Content after the sidebar column
- `sfcc.checkout.orderSummary.before` - Content before the order summary card
- `sfcc.checkout.orderSummary` - (WRAPPER) Replace the order summary component
- `sfcc.checkout.orderSummary.after` - Content after the order summary card
- `sfcc.checkout.myCart.before` - Content before the cart items accordion
- `sfcc.checkout.myCart` - (WRAPPER) Replace the cart items component
- `sfcc.checkout.myCart.after` - Content after the cart items accordion
- `sfcc.checkout.myCart.header.before` - Content before the "My Cart" accordion header

### Order Summary (line items)
- `sfcc.orderSummary.subtotal.before` - Content before the subtotal row
- `sfcc.orderSummary.subtotal` - (WRAPPER) Replace the subtotal row
- `sfcc.orderSummary.subtotal.after` - Content after the subtotal row
- `sfcc.orderSummary.giftCards.applied` - Insert applied gift cards display
- `sfcc.orderSummary.adjustments.before` - Content before price adjustment rows
- `sfcc.orderSummary.adjustments` - (WRAPPER) Replace price adjustment rows
- `sfcc.orderSummary.adjustments.after` - Content after price adjustment rows
- `sfcc.orderSummary.shipping.before` - Content before the shipping cost row
- `sfcc.orderSummary.shipping` - (WRAPPER) Replace the shipping cost row
- `sfcc.orderSummary.shipping.after` - Content after the shipping cost row
- `sfcc.orderSummary.tax.before` - Content before the tax row
- `sfcc.orderSummary.tax` - (WRAPPER) Replace the tax row
- `sfcc.orderSummary.tax.line` - (WRAPPER) Replace individual tax line items
- `sfcc.orderSummary.tax.after` - Content after the tax row
- `sfcc.orderSummary.promoCode.before` - Content before the promo code form
- `sfcc.orderSummary.promoCode` - (WRAPPER) Replace the promo code form
- `sfcc.orderSummary.promoCode.after` - Content after the promo code form
- `sfcc.orderSummary.total.before` - Content before the order total row
- `sfcc.orderSummary.total` - (WRAPPER) Replace the order total row
- `sfcc.orderSummary.total.after` - Content after the order total row

### My Cart
- `sfcc.myCart.header.before` - Content before the My Cart accordion header

### My Account
- `sfcc.myAccount.address.autocomplete` - (WRAPPER) Replace address autocomplete in account
- `sfcc.myAccount.address.validation` - Insert address validation in account
- `sfcc.myAccount.identity.verification` - Insert identity verification
- `sfcc.myAccount.orders.tracking` - Insert order tracking
- `sfcc.myAccount.payments.addMethod` - (WRAPPER) Replace add payment method form
- `sfcc.myAccount.gdpr.dataRequest` - Insert GDPR data request
- `sfcc.myAccount.gdpr.deleteAccount` - Insert GDPR account deletion
- `sfcc.myAccount.loyalty.summary` - Insert loyalty summary on account overview
- `sfcc.myAccount.reviews.pending` - Insert pending reviews on account overview
- `sfcc.myAccount.orderDetails.review` - Insert review link on order details
- `sfcc.myAccount.orderDetails.tracking` - Insert tracking on order details
- `sfcc.myAccount.orderDetails.tax` - (WRAPPER) Replace tax display on order details
- `sfcc.myAccount.orderDetails.returns` - Insert returns on order details
- `sfcc.myAccount.orderDetails.cancel` - Insert cancel order on order details
- `sfcc.myAccount.orderDetails.support` - Insert support on order details
- `sfcc.myAccountPaymentMethods.giftCards.manage` - Insert gift card management
- `sfcc.accountPaymentOptions.payments.savedPaymentMethods` - (WRAPPER) Replace saved payment methods

### User Registration
- `sfcc.userRegistration.consent.marketing` - Insert marketing consent checkbox
- `sfcc.userRegistration.consent.tos` - Insert terms of service checkbox
- `sfcc.userRegistration.identity.verification` - Insert identity verification
- `sfcc.userRegistration.loyalty.enrollment` - Insert loyalty enrollment option
- `sfcc.userRegistration.address.autocomplete` - Insert address autocomplete
- `sfcc.userRegistration.address.validation` - Insert address validation

### Email Signup
- `sfcc.emailSignUp.consent.marketing` - (WRAPPER) Replace marketing consent in email signup
- `sfcc.emailSignUp.consent.tos` - Insert terms of service in email signup

### Order Confirmation
- `sfcc.orderConfirmation.tax.summary` - (WRAPPER) Replace tax summary on order confirmation
- `sfcc.orderConfirmation.shipping.tracking` - Insert shipping tracking on order confirmation

### Global
- `sfcc.global.cookies.banner` - (WRAPPER) Replace the cookie consent banner

## Example: Complete Extension

For a product review widget:

```
storefront-next/src/extensions/product-reviews/
├── index.ts                                    # Barrel exports
├── target-config.json                          # Extension registration
├── components/
│   ├── ProductReviews.tsx                     # Main component (TypeScript)
│   ├── ReviewItem.tsx
│   └── ReviewForm.tsx
├── hooks/
│   └── useReviews.ts                          # Custom hook
├── providers/
│   └── ReviewsProvider.tsx                    # Context provider (registered in target-config)
├── locales/
│   ├── en-US/
│   │   └── translations.json                   # English (US) translations
│   ├── en-GB/
│   │   └── translations.json                   # English (UK) translations
│   └── it-IT/
│       └── translations.json                   # Italian translations
└── tests/
        ├── ProductReviews.test.tsx
        ├── ReviewItem.test.tsx
        └── ReviewForm.test.tsx
```

**target-config.json:**
```json
{
    "components": [
        {
            "targetId": "sfcc.pdp.reviews.summary",
            "path": "extensions/product-reviews/components/ProductReviews.tsx",
            "order": 0
        }
    ],
    "contextProviders": [
        {
            "path": "extensions/product-reviews/providers/ReviewsProvider.tsx",
            "order": 0
        }
    ]
}
```

## Key Requirements Checklist

### TypeScript & Structure
- [ ] All files use TypeScript (.ts/.tsx), not JavaScript
- [ ] **No tsconfig.json at extension level** - extensions inherit from parent Storefront Next
- [ ] **No Tailwind config files** - use `@theme inline` with CSS 4
- [ ] target-config.json uses correct format (components array with targetId/path/order)
- [ ] index.ts barrel file exports public API
- [ ] Component props have TypeScript interfaces

### Exports & Imports
- [ ] **Components and providers use default export** (required for extension system)
- [ ] **Use `import type` for ALL types/interfaces** (React types, custom types from .ts files)
- [ ] **Regular `import` only for runtime values** (functions, components, hooks)
- [ ] No direct react-router imports (use @/components/link and @/hooks/use-navigate)

### Internationalization
- [ ] **All three locales created:** en-US, en-GB, it-IT
- [ ] Locales use nested structure: locales/{locale}/translations.json
- [ ] **useTranslation namespace uses ext + PascalCase** (e.g., 'extProductReviews'), JSON root key uses camelCase (e.g., "productReviews")
- [ ] All locale files have identical key structures
- [ ] No hardcoded English strings in components

### Configuration
- [ ] Configuration uses `useConfig()` from `@salesforce/storefront-next-runtime/config`
- [ ] Environment variables use PUBLIC__ prefix with double underscores (e.g., PUBLIC__app__extension__{{appName}}__key)

### Action Hooks
- [ ] Action hook handlers are default exports in `.server.ts` files
- [ ] Handlers registered in target-config.json under `actionHooks` with `hookId`, `handler`, `order`
- [ ] Handlers use `ActionHookError` for user-facing errors (not raw `throw`)
- [ ] External service calls complete within 5-second timeout

### Testing & Documentation
- [ ] Tests included for all components (.test.tsx)
- [ ] Components have data-testid attributes for testing
- [ ] JSDoc comments on exported functions and components
- [ ] Context providers registered in target-config.json (not inline wrapping)

### ESLint & Code Quality
- [ ] **Consistent type imports** (import type for all types)
- [ ] No console statements (except in logger utility)
- [ ] Single quotes for strings
- [ ] 4 spaces indentation
- [ ] Max 120 characters per line
- [ ] No hardcoded Tailwind color utilities (use theme colors)
- [ ] No array indices as React keys
- [ ] No dangerouslySetInnerHTML
- [ ] Self-closing components where appropriate
- [ ] Object shorthand notation
- [ ] Template literals over string concatenation
- [ ] Accessibility: alt text on all images
