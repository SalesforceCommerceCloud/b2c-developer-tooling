
# Installation

## Prerequisites

- macOS, Linux, or Windows
- Node.js 22.16.0 or higher (for npm installation or SDK usage)

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

## Install the SDK (Optional)

If you want to use the SDK library in your own projects:

::: code-group

```bash [npm]
npm install @salesforce/b2c-tooling-sdk
```

```bash [pnpm]
pnpm add @salesforce/b2c-tooling-sdk
```

```bash [yarn]
yarn add @salesforce/b2c-tooling-sdk
```

:::

## Next Steps

- [Configuration](./configuration) - Set up authentication and instance configuration
