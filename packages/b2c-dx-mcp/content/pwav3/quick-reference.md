# PWA Kit Development Quick Reference

## Overview

PWA Kit (Progressive Web App Kit) is Salesforce's solution for building high-performance, React-based e-commerce storefronts for Commerce Cloud. It provides server-side rendering (SSR), React Router integration, and seamless Commerce API integration through the commerce-sdk-react library.

The Retail React App template serves as the foundation, demonstrating best practices for component architecture, data fetching, and state management using modern React patterns.

## Core Architecture

### Hybrid Rendering Model
- **Server-Side Rendering (SSR)**: Initial page loads render on the server for fast First Contentful Paint and SEO
- **Client-Side Rendering (CSR)**: After hydration, navigation happens client-side for fluid user interactions
- **Isomorphic Code**: All application code must work in both Node.js (server) and browser (client) environments
- **CDN Caching**: Server-rendered pages are cached at the edge for optimal performance

### Express.js + React Stack
- **Express.js**: Handles server-side routing and rendering
- **React Router**: Manages client-side navigation and route definitions
- **React 18**: UI library with Hooks, Suspense, and Concurrent Features
- **Managed Runtime**: Salesforce's hosting platform for PWA Kit applications

## Core Principles

### Project Understanding
- Thoroughly analyze requests and the existing project before implementation
- Examine the current codebase to identify similar solutions and reusable components
- Promptly clarify ambiguous requirements

### Development Workflow
Follow this workflow for all development tasks:

1. **Analyze Requirements** - Clearly define objectives and functionalities
2. **Review Existing Code** - Identify patterns and reusable components
3. **Understand Available Tools** - Familiarize with hooks and utilities from commerce-sdk-react and template-retail-react-app
4. **Plan Implementation** - Design component structure before coding
5. **Implement Incrementally** - Develop and test in small, manageable steps
6. **Test Thoroughly** - Ensure comprehensive testing with Jest and React Testing Library

## Technical Stack

### Core Technologies
- **React** - UI components and single-page application architecture
- **Express** - Server-side rendering and backend routing
- **@salesforce/commerce-sdk-react** - Commerce Cloud API integration with React hooks
- **PWA Kit** - SSR framework, routing, configuration, and Salesforce integration
- **Chakra UI V2** - UI component library and theming system
- **Emotion** - CSS-in-JS styling solution
- **React Router** - Client-side routing
- **React Intl** - Internationalization and localization
- **React Query** - Data fetching, caching, and state synchronization
- **Webpack** - Module bundling and code splitting
- **React Testing Library & Jest** - Testing frameworks
- **react-helmet** - HTML head tag management
- **framer-motion** - Animation library
- **ESLint & Prettier** - Code formatting and linting

## Critical Non-Negotiable Rules

### 1. Isomorphic Code Requirements
```javascript
import {useState, useEffect} from 'react';

// ✅ CORRECT: Isomorphic code that works in both environments
export const MyComponent = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Client-only logic safely in useEffect
        setMounted(true);
        if (window.analytics) {
            window.analytics.track('page_view');
        }
    }, []);

    return <div>Component</div>;
};

// ❌ WRONG: Direct window access at module level
const userAgent = window.navigator.userAgent; // Crashes on server!
```

### 2. No Secrets in Configuration
```javascript
// ❌ WRONG: Secrets in config files (serialized to client!)
export default {
    apiKey: 'sk_live_abc123', // EXPOSED TO BROWSER!
    secretToken: process.env.SECRET // Still serialized!
};

// ✅ CORRECT: Use proxy requests for sensitive operations
// Keep secrets in environment variables on the server only
```

### 3. Proxy Pattern for API Requests
Always use the proxy pattern for external APIs to avoid CORS and improve performance:

```javascript
// Proxy configuration in config/default.js (merge into module.exports)
module.exports = {
    // ...other config
    proxy: {
        'external-api': {
            host: 'https://api.example.com',
            path: '/api'
        }
    }
};

// Request through proxy
fetch('/mobify/proxy/external-api/endpoint')
```

### 4. Component File Naming
- Use kebab-case for all file names: `product-tile.jsx`, `use-basket.js`
- Only prefix with underscore for special components: `_app.jsx`, `_app-config.jsx`, `_error.jsx`

## Quick Code Patterns

**Reference the template for these patterns:**
- **Fetch Commerce Data:** `app/pages/product-detail/index.jsx` (useProduct, useParams)
- **Custom Hook:** `app/hooks/use-current-customer.js` (useCustomer, useCustomerId, useCustomerType)
- **Routes:** `app/routes.jsx` (loadable, configureRoutes)
- **Chakra UI:** `app/components/product-tile`, `app/components/shared/ui`

## Quality Standards

- **Code Formatting**: Maintain consistent formatting using Prettier and ESLint
- **Test Coverage**: Write comprehensive tests for all business logic
- **Accessibility**: Ensure components are keyboard navigable and screen reader friendly
- **Mobile-First**: Design responsive layouts that work on all device sizes
- **Security**: Follow OWASP best practices, never expose secrets
- **Performance**: Monitor bundle sizes, use code splitting, optimize images

## Common Commands

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Extract and compile translations
npm run build-translations
# Or individually: extract-default-translations, compile-translations, compile-translations:pseudo

# Run Lighthouse CI performance tests
npm run test:lighthouse
```

## Documentation References

For detailed information on specific topics, refer to the dedicated sections:
- **Components**: Component patterns, Chakra UI, special components, React Hooks
- **Data Fetching**: commerce-sdk-react hooks, custom APIs, React Query patterns
- **Routing**: Express.js integration, React Router, SSR/CSR navigation
- **Configuration**: Config files, environment variables, proxy setup, multi-site
- **State Management**: Context API, useReducer, Redux integration patterns
- **Extensibility**: Template extension, overrides directory, ccExtensibility configuration
- **Testing**: Jest, React Testing Library, MSW, test organization
- **Internationalization**: React Intl, translation workflows, multi-locale support
- **Styling**: Chakra UI theming, Emotion CSS-in-JS, responsive design
