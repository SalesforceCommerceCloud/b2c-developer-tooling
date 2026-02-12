---
name: testing
description: Writing tests for the B2C CLI project using Mocha, Chai, and MSW
metadata:
  internal: true
---

# Testing

This skill covers project-specific testing patterns for the B2C CLI project.

## Test Framework Stack

- **Test Runner**: Mocha
- **Assertions**: Chai (property-based)
- **HTTP Mocking**: MSW (Mock Service Worker)
- **Stubbing/Mocking**: Sinon
- **Code Coverage**: c8
- **TypeScript**: tsx (native execution without compilation)

## Running Tests

For coding agents (minimal output - only failures shown):

```bash
# Run tests - only failures + summary
pnpm run test:agent

# Run tests for specific package
pnpm --filter @salesforce/b2c-tooling-sdk run test:agent
pnpm --filter @salesforce/b2c-cli run test:agent
```

For debugging (full output with coverage):

```bash
# Run all tests with coverage
pnpm run test

# Run tests for specific package
pnpm --filter @salesforce/b2c-tooling-sdk run test
pnpm --filter @salesforce/b2c-cli run test

# Run single test file (no coverage, faster)
cd packages/b2c-tooling-sdk
pnpm mocha "test/clients/webdav.test.ts"

# Run tests matching pattern
pnpm mocha --grep "mkcol" "test/**/*.test.ts"

# Watch mode for TDD
pnpm --filter @salesforce/b2c-tooling-sdk run test:watch
```

## Test Organization

Tests mirror the source directory structure with `.test.ts` suffix:

```
packages/b2c-tooling-sdk/
├── src/
│   └── clients/
│       └── webdav.ts
└── test/
    └── clients/
        └── webdav.test.ts
```

## Import Patterns

Always use package exports, not relative paths:

```typescript
// Good - uses package exports
import { WebDavClient } from '@salesforce/b2c-tooling-sdk/clients';
import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';

// Avoid - relative paths
import { WebDavClient } from '../../src/clients/webdav.js';
```

This ensures tests use the same export paths as consumers.

## Config Isolation

Tests that check for "missing credentials" or "no config" scenarios need isolation from the developer's real configuration files (`~/.mobify`, `dw.json`) and environment variables.

### Using Config Isolation Helpers

```typescript
import { isolateConfig, restoreConfig } from '../helpers/config-isolation.js';

describe('config-dependent tests', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    restoreConfig();
  });

  it('handles missing credentials', async () => {
    // Test now runs without reading real ~/.mobify or SFCC_* env vars
  });
});
```

The helpers:
- Clear all `SFCC_*` and `MRT_*` environment variables
- Clear other config-affecting vars (`LANGUAGE`, `NO_COLOR`)
- Must call `restoreConfig()` in afterEach to restore original state

### For SDK Unit Tests (bypass config sources)

When testing `resolveConfig` directly without file system:

```typescript
import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';

const config = resolveConfig({}, {
  replaceDefaultSources: true,
  sources: []  // No file-based sources
});
```

### For MRT Credential Isolation

Use the `credentialsFile` option to override the default `~/.mobify` path:

```typescript
import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';

// Point to non-existent file for isolation
const config = resolveConfig({}, {
  credentialsFile: '/dev/null'
});
```

In CLI command tests, use the `stubParse` helper with the `credentials-file` flag:

```typescript
import { stubParse } from '../helpers/stub-parse.js';

stubParse(command, {'credentials-file': '/dev/null'});  // Isolates from real ~/.mobify
```

## Polling Tests (Avoid Fake Timers)

**Do not use fake timers with MSW.** MSW v2 uses microtasks internally, and fake timers prevent MSW's promises from resolving.

Instead, use the `pollInterval` option for fast tests:

```typescript
// Good - use short poll interval
const result = await siteArchiveImport(mockInstance, siteDir, {
  archiveName: 'test-import',
  waitOptions: { pollInterval: 10 }  // 10ms instead of default 3000ms
});

// Bad - fake timers break MSW
import FakeTimers from '@sinonjs/fake-timers';
const clock = FakeTimers.install();  // DON'T DO THIS with MSW
```

## HTTP Mocking with MSW

### Basic Setup

```typescript
import { expect } from 'chai';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { WebDavClient } from '@salesforce/b2c-tooling-sdk/clients';
import { MockAuthStrategy } from '../helpers/mock-auth.js';

const TEST_HOST = 'test.salesforce.com';
const BASE_URL = `https://${TEST_HOST}`;

const server = setupServer();

describe('WebDavClient', () => {
  let client: WebDavClient;
  let mockAuth: MockAuthStrategy;

  before(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  after(() => {
    server.close();
  });

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = new WebDavClient(TEST_HOST, mockAuth);
  });

  it('creates a directory successfully', async () => {
    server.use(
      http.all(`${BASE_URL}/*`, ({ request }) => {
        if (request.method === 'MKCOL') {
          return new HttpResponse(null, { status: 201 });
        }
        return new HttpResponse(null, { status: 405 });
      }),
    );

    await client.mkcol('Cartridges/v1');
  });
});
```

### Request Capture Pattern

To verify request details, capture requests in an array:

```typescript
interface CapturedRequest {
  method: string;
  url: string;
  headers: Headers;
  body?: unknown;
}

const requests: CapturedRequest[] = [];

beforeEach(() => {
  requests.length = 0;
});

it('sends correct headers', async () => {
  server.use(
    http.put(`${BASE_URL}/*`, async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: await request.text(),
      });
      return new HttpResponse(null, { status: 201 });
    }),
  );

  await client.put('path/to/file', Buffer.from('content'));

  expect(requests).to.have.length(1);
  expect(requests[0].method).to.equal('PUT');
  expect(requests[0].headers.get('Authorization')).to.equal('Bearer test-token');
});
```

### Error Responses

```typescript
it('handles 404 errors', async () => {
  server.use(
    http.get(`${BASE_URL}/api/items/:id`, () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }),
  );

  try {
    await client.getItem('nonexistent');
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error.message).to.include('404');
  }
});

it('handles network errors', async () => {
  server.use(
    http.get(`${BASE_URL}/api/items`, () => {
      return HttpResponse.error();
    }),
  );

  try {
    await client.listItems();
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error.message).to.include('network');
  }
});
```

## MockAuthStrategy

Use the test helper for authentication:

```typescript
// test/helpers/mock-auth.ts
import type { AuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';

export class MockAuthStrategy implements AuthStrategy {
  constructor(private token: string = 'test-token') {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.token}`);
    return fetch(url, { ...init, headers });
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Bearer ${this.token}`;
  }
}
```

Usage:

```typescript
import { MockAuthStrategy } from '../helpers/mock-auth.js';

const mockAuth = new MockAuthStrategy();
const client = new WebDavClient(TEST_HOST, mockAuth);

// Custom token for specific tests
const customAuth = new MockAuthStrategy('custom-token');
```

## Silencing Test Output

Commands may produce console output (tables, formatted displays) even in tests. Use these helpers to keep test output clean.

### Using runSilent for Output Capture

The `runSilent` helper uses oclif's `captureOutput` to suppress stdout/stderr:

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

Use `runSilent` when:
- Testing non-JSON output modes (tables, formatted displays)
- The test doesn't need to verify console output content
- You want clean test output with only pass/fail summary

### When Output Verification is Needed

If you need to verify console output, stub `ux.stdout` directly:

```typescript
import { ux } from '@oclif/core';

it('prints table in non-JSON mode', async () => {
  const stdoutStub = sinon.stub(ux, 'stdout');

  await command.run();

  expect(stdoutStub.called).to.be.true;
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

## Coverage

Coverage is configured in `.c8rc.json`. View the HTML report after running tests:

```bash
pnpm run test
open coverage/index.html
```

## Test Helpers Reference

### CLI Package (`packages/b2c-cli/test/helpers/`)

| Helper | Purpose |
|--------|---------|
| `runSilent(fn)` | Capture and suppress stdout/stderr from command execution |
| `stubParse(command, flags, args)` | Stub oclif's parse method with flags (includes silent log level) |
| `createTestCommand(CommandClass, config, flags, args)` | Create command instance with stubbed parse |
| `createIsolatedConfigHooks()` | Mocha hooks for config isolation |
| `createIsolatedEnvHooks()` | Mocha hooks for env var isolation |

### SDK Package (`packages/b2c-tooling-sdk/test/helpers/`)

| Helper | Purpose |
|--------|---------|
| `MockAuthStrategy` | Mock authentication for API clients |
| `stubParse(command, flags, args)` | Stub oclif's parse method (includes silent log level) |
| `createNullStream()` | Create a writable stream that discards output |
| `CapturingStream` | Writable stream that captures output for assertions |

### SDK Test Utils (exported from package)

```typescript
import { isolateConfig, restoreConfig } from '@salesforce/b2c-tooling-sdk/test-utils';
```

## Writing Tests Checklist

1. Create test file in `test/` mirroring source structure
2. Use `.test.ts` suffix
3. Import from package names, not relative paths
4. Set up MSW server for HTTP tests (avoid fake timers)
5. Use `isolateConfig()`/`restoreConfig()` for config-dependent tests
6. Use `runSilent()` for commands that produce console output
7. Use `pollInterval` option for polling operations
8. Use MockAuthStrategy for authenticated clients
9. Test both success and error paths
10. Focus on command-specific logic, not trivial delegation
11. Run tests: `pnpm --filter <package> run test`
