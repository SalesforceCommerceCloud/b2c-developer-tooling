# CLI Command Testing Patterns

## Testing CLI Commands with oclif

### Integration Tests with runCommand

Use `@oclif/test`'s `runCommand()` for integration-style tests:

```typescript
import { runCommand } from '@oclif/test';
import { expect } from 'chai';

describe('ods list', () => {
  it('runs without errors', async () => {
    const { error } = await runCommand('ods list --help');
    expect(error).to.be.undefined;
  });
});
```

### SDK Base Command Integration Tests

The SDK includes a test fixture at `test/fixtures/test-cli/` for integration testing base command behavior. See `test/cli/base-command.integration.test.ts` for examples.

### When to Use Each Approach

| Approach | Use For |
|----------|---------|
| Unit tests with `stubParse` | Testing protected method logic in isolation |
| Integration tests with fixture | Testing full command lifecycle, flag parsing |
| `runCommand()` in b2c-cli | Testing actual CLI commands |

## E2E Tests

E2E tests run against real infrastructure and are skipped without credentials:

```typescript
describe('ODS Lifecycle E2E', function () {
  this.timeout(360_000); // 6 minutes

  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');

  before(function () {
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      this.skip();
    }
  });

  async function runCLI(args: string[]) {
    return execa('node', [CLI_BIN, ...args], {
      env: { ...process.env, SFCC_LOG_LEVEL: 'silent' },
      reject: false,
    });
  }

  it('creates a sandbox', async function () {
    this.timeout(300_000);

    const result = await runCLI([
      'ods', 'create',
      '--realm', process.env.TEST_REALM!,
      '--ttl', '24',
      '--json',
    ]);

    expect(result.exitCode).to.equal(0);
  });
});
```
