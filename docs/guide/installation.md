---
description: Install the B2C CLI using your preferred JavaScript package manager.
---

# Installation

## Prerequisites

- macOS, Linux, or Windows
- Node.js 22.16.0 or higher

## Install via npm (Recommended)

Install the CLI globally using your preferred package manager:

::: code-group

```bash [npm]
npm install -g @salesforce/b2c-cli
```

```bash [pnpm]
pnpm add -g @salesforce/b2c-cli
```

```bash [yarn]
yarn global add @salesforce/b2c-cli
```

:::

## Verify Installation

After installation, verify the CLI is available:

```bash
b2c --version
```

## Next Steps

- [Connect to your instance](./#connect-to-your-instance) - Deploy code and read logs with just your hostname
- [Configuration](./configuration) - Set up authentication and instance configuration
