# Command Testing Patterns

## Silencing Test Output

Commands produce console output (tables, formatted displays) during tests. **All test helpers are designed to keep test output clean by default** — no extra work needed in most cases.

### stubCommandConfigAndLogger Silences Output Automatically

The `stubCommandConfigAndLogger` helper (used by AM and sandbox command tests) automatically stubs `command.log`, `command.logToStderr`, and `ux.stdout` so no output leaks to the console:

```typescript
import { stubCommandConfigAndLogger } from '../../../helpers/test-setup.js';

it('displays client details in non-JSON mode', async () => {
  const command = new ClientGet([], {} as any);
  stubCommandConfigAndLogger(command); // stdout is silenced automatically
  stubJsonEnabled(command, false);
  // ... setup ...

  const result = await command.run(); // No console noise
  expect(result.id).to.equal('client-123');
});
```

### Using runSilent for Other Cases

For commands that don't use `stubCommandConfigAndLogger`, use `runSilent` to capture stdout/stderr:

```typescript
import { runSilent } from '../../helpers/test-setup.js';

it('returns data in non-JSON mode', async () => {
  const command = new MyCommand([], {} as any);
  // ... setup ...

  // Silences any console output from the command
  const result = await runSilent(() => command.run());

  expect(result.data).to.exist;
});
```

### When Output Verification is Needed

If you need to verify console output content, stub `ux.stdout` directly **before** calling `stubCommandConfigAndLogger` (which checks if the stub already exists):

```typescript
import { ux } from '@oclif/core';

it('prints table in non-JSON mode', async () => {
  const stdoutStub = sinon.stub(ux, 'stdout');
  stubCommandConfigAndLogger(command); // won't double-stub ux.stdout

  await command.run();

  expect(stdoutStub.called).to.be.true;
  const text = stdoutStub.firstCall.args[0];
  expect(text).to.include('expected content');
});
```

### stubParse Sets Silent Logging

The `stubParse` helper automatically sets `'log-level': 'silent'` to reduce pino logger output:

```typescript
// stubParse includes silent log level by default
stubParse(command, {server: 'test.demandware.net'});
// Equivalent to: {server: 'test.demandware.net', 'log-level': 'silent'}
```

## Command Test Guidelines

Command tests should focus on **command-specific logic**, not trivial flag verification.

### Using the stubParse Helper

Use the `stubParse` helper from `test/helpers/stub-parse.js` to stub oclif's parse method. This handles the type casting needed for oclif's protected `parse` method:

```typescript
import sinon from 'sinon';
import { stubParse } from '../helpers/stub-parse.js';
import { isolateConfig, restoreConfig } from '../helpers/config-isolation.js';

describe('cli/mrt-command', () => {
  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('throws error when no credentials', async () => {
    stubParse(command, {'credentials-file': '/dev/null'});
    await command.init();

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      command.testRequireMrtCredentials();
    } catch {
      // Expected
    }

    expect(errorStub.called).to.be.true;
  });
});
```

### Low-Value Tests to Avoid

Do not write tests that just verify flag values equal mocked values:

```typescript
// BAD - tests nothing (just verifies JavaScript assignment works)
it('handles server flag', async () => {
  stubParse(command, {server: 'test.demandware.net'});

  await command.init();
  expect(command.flags.server).to.equal('test.demandware.net');  // Trivial!
});
```

### What to Test in Commands

| Test | Keep |
|------|------|
| `requireX` error handling | Yes - verifies error messages |
| `parseAuthMethods` logic | Yes - transforms/filters input |
| Lazy client initialization | Yes - verifies caching behavior |
| Context creation | Yes - assembles operation metadata |
| Flag value equals mocked value | No - tests nothing |
| Delegation to resolvedConfig | No - tested in SDK unit tests |
