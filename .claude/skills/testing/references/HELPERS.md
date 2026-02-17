# Test Helpers Reference

## CLI Package (`packages/b2c-cli/test/helpers/`)

| Helper | Purpose |
|--------|---------|
| `runSilent(fn)` | Capture and suppress stdout/stderr from command execution |
| `stubParse(command, flags, args)` | Stub oclif's parse method with flags (includes silent log level) |
| `createTestCommand(CommandClass, config, flags, args)` | Create command instance with stubbed parse |
| `createIsolatedConfigHooks()` | Mocha hooks for config isolation |
| `createIsolatedEnvHooks()` | Mocha hooks for env var isolation |

## SDK Package (`packages/b2c-tooling-sdk/test/helpers/`)

| Helper | Purpose |
|--------|---------|
| `MockAuthStrategy` | Mock authentication for API clients |
| `stubParse(command, flags, args)` | Stub oclif's parse method (includes silent log level) |
| `createNullStream()` | Create a writable stream that discards output |
| `CapturingStream` | Writable stream that captures output for assertions |

## SDK Test Utils (exported from package)

```typescript
import { isolateConfig, restoreConfig } from '@salesforce/b2c-tooling-sdk/test-utils';
```
