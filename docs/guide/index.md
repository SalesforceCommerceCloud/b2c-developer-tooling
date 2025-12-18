# Introduction

The B2C CLI is a command-line interface for Salesforce Commerce Cloud B2C. It provides tools for:

- **Code Deployment**: Upload cartridges and activate code versions
- **Site Management**: List and manage sites in your organization
- **Sandbox Management**: Create and manage sandbox environments
- **Managed Runtime (MRT)**: Configure MRT environments and environment variables

## Packages

This project consists of two packages:

### @salesforce/b2c-cli

The command-line interface that you interact with directly. It provides a set of commands for common B2C Commerce operations.

```bash
# Example: Deploy code to an instance
b2c code deploy --server your-instance.demandware.net
```

### @salesforce/b2c-tooling-sdk

The underlying SDK library that powers the CLI. You can use this package directly in your own Node.js applications to automate B2C Commerce operations.

```typescript
import { uploadCartridges, B2CInstance } from '@salesforce/b2c-tooling-sdk';

const instance = new B2CInstance({
  server: 'your-instance.demandware.net',
  // ... authentication config
});

await uploadCartridges(instance, './cartridges');
```

## Next Steps

- [Installation](./installation) - Install the CLI
- [Configuration](./configuration) - Configure authentication and instances
- [CLI Reference](/cli/) - Browse available commands
- [API Reference](/api/) - Explore the SDK API
