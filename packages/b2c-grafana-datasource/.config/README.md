# Webpack Build Configuration

This directory contains the webpack configuration for building the Grafana datasource frontend plugin.

## Files

- **webpack.config.ts** - Main webpack configuration that produces AMD module format for Grafana

## Build Output

The webpack build produces the following in `dist/`:
- `module.js` - AMD module loadable by Grafana's SystemJS runtime
- `module.js.map` - Source map for debugging
- `plugin.json` - Plugin metadata (copied from src/)
- `img/logo.svg` - Plugin logo (copied from src/img/)

## Key Configuration Details

### AMD Module Format
Grafana uses SystemJS to load plugins, which requires AMD module format:
```typescript
output: {
  libraryTarget: 'amd'
}
```

### Externals
These packages are provided by Grafana at runtime and must not be bundled:
- `@grafana/data`, `@grafana/ui`, `@grafana/runtime`
- `react`, `react-dom`
- `@emotion/*` (used internally by Grafana)
- `lodash`

### Build Tool: SWC
Uses `swc-loader` instead of `ts-loader` for faster TypeScript compilation.

## Commands

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev

# Type check only
npm run typecheck
```

## Docker Integration

The Docker build stage runs:
```dockerfile
RUN npm install --production=false && npm run build
```

This produces a complete plugin directory ready to mount into Grafana.
