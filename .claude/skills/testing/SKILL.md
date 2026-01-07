---
name: testing
description: Writing tests for the B2C CLI project using Mocha, Chai, and MSW
---

# Testing

This skill covers writing tests for the B2C CLI project using Mocha, Chai, and MSW.

## Test Framework Stack

- **Test Runner**: Mocha
- **Assertions**: Chai (property-based)
- **HTTP Mocking**: MSW (Mock Service Worker)
- **Code Coverage**: c8
- **TypeScript**: tsx (native execution without compilation)

## Running Tests

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

Tests mirror the source directory structure:

```
packages/b2c-tooling-sdk/
├── src/
│   └── clients/
│       └── webdav.ts
└── test/
    └── clients/
        └── webdav.test.ts
```

Use `.test.ts` suffix for test files.

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
    // If no error thrown, test passes
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
  expect(requests[0].body).to.equal('content');
});
```

### Mocking Different HTTP Methods

```typescript
// GET request
http.get(`${BASE_URL}/api/items`, () => {
  return HttpResponse.json({ items: [{ id: '1' }] });
});

// POST request with body inspection
http.post(`${BASE_URL}/api/items`, async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ id: '123', ...body }, { status: 201 });
});

// PUT request
http.put(`${BASE_URL}/api/items/:id`, ({ params }) => {
  return HttpResponse.json({ id: params.id, updated: true });
});

// DELETE request
http.delete(`${BASE_URL}/api/items/:id`, () => {
  return new HttpResponse(null, { status: 204 });
});

// Match any method
http.all(`${BASE_URL}/*`, ({ request }) => {
  // Handle based on request.method
});
```

### Error Responses

```typescript
it('handles 404 errors', async () => {
  server.use(
    http.get(`${BASE_URL}/api/items/:id`, () => {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
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

## Testing Operations

Operations tests verify higher-level business logic:

```typescript
import { expect } from 'chai';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { uploadBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
import { createMrtClient } from '@salesforce/b2c-tooling-sdk/clients';
import { MockAuthStrategy } from '../helpers/mock-auth.js';

const server = setupServer();

describe('uploadBundle', () => {
  const testBundle = {
    message: 'Test bundle',
    encoding: 'base64',
    data: 'dGVzdC1kYXRh',
  };

  before(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('uploads bundle and returns result', async () => {
    let receivedBody: unknown;

    server.use(
      http.post('https://cloud.commercecloud.com/api/projects/:slug/builds/', async ({ request, params }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          bundle_id: 123,
          message: 'Bundle created',
        });
      }),
    );

    const auth = new MockAuthStrategy();
    const client = createMrtClient({}, auth);

    const result = await uploadBundle(client, 'my-project', testBundle);

    expect(result.bundleId).to.equal(123);
    expect(receivedBody).to.deep.include({ message: 'Test bundle' });
  });
});
```

## Testing Pure Logic

For functions without HTTP calls:

```typescript
import { expect } from 'chai';
import { checkAvailableAuthMethods } from '@salesforce/b2c-tooling-sdk/auth';

describe('checkAvailableAuthMethods', () => {
  it('returns client-credentials when credentials provided', () => {
    const result = checkAvailableAuthMethods({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    expect(result.available).to.include('client-credentials');
  });

  it('returns unavailable with reason when secret missing', () => {
    const result = checkAvailableAuthMethods(
      { clientId: 'test-client' },
      ['client-credentials']
    );

    expect(result.available).to.have.length(0);
    expect(result.unavailable[0]).to.deep.equal({
      method: 'client-credentials',
      reason: 'clientSecret is required',
    });
  });
});
```

## Testing CLI Commands

Use `@oclif/test` for CLI command tests:

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

## End-to-End Tests

E2E tests run against real infrastructure:

```typescript
import { expect } from 'chai';
import { execa } from 'execa';
import path from 'node:path';

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
    const response = JSON.parse(result.stdout);
    expect(response.id).to.be.a('string');
  });
});
```

## Test Structure Patterns

### Describe/It Nesting

```typescript
describe('WebDavClient', () => {
  describe('mkcol', () => {
    it('creates directory on success', async () => { });
    it('throws on 403 forbidden', async () => { });
    it('handles nested paths', async () => { });
  });

  describe('put', () => {
    it('uploads file content', async () => { });
    it('sets correct content-type', async () => { });
  });
});
```

### Setup/Teardown

```typescript
describe('Feature', () => {
  let sharedResource: Resource;

  before(() => {
    // Once before all tests in this describe
  });

  after(() => {
    // Once after all tests in this describe
  });

  beforeEach(() => {
    // Before each test
    sharedResource = new Resource();
  });

  afterEach(() => {
    // After each test
    sharedResource.cleanup();
  });
});
```

## Chai Assertions

Common assertion patterns:

```typescript
// Equality
expect(value).to.equal('expected');
expect(obj).to.deep.equal({ key: 'value' });

// Truthiness
expect(value).to.be.true;
expect(value).to.be.false;
expect(value).to.be.undefined;
expect(value).to.be.null;

// Arrays
expect(arr).to.have.length(3);
expect(arr).to.include('item');
expect(arr).to.deep.include({ id: '1' });

// Objects
expect(obj).to.have.property('key');
expect(obj).to.have.property('key', 'value');
expect(obj).to.deep.include({ subset: 'props' });

// Strings
expect(str).to.include('substring');
expect(str).to.match(/pattern/);

// Errors
expect(() => fn()).to.throw();
expect(() => fn()).to.throw('message');
expect(() => fn()).to.throw(ErrorType);

// Async errors
try {
  await asyncFn();
  expect.fail('Should have thrown');
} catch (error) {
  expect(error.message).to.include('expected');
}
```

## Coverage

Coverage is configured in `.c8rc.json`:

```json
{
  "all": true,
  "src": ["src"],
  "exclude": ["src/clients/*.generated.ts", "test/**"],
  "reporter": ["text", "text-summary", "html", "lcov"],
  "check-coverage": true,
  "lines": 5,
  "functions": 5,
  "branches": 5,
  "statements": 5
}
```

View coverage report:

```bash
pnpm run test
# Then open coverage/index.html
```

## Writing Tests Checklist

1. Create test file in `test/` mirroring source structure
2. Use `.test.ts` suffix
3. Import from package names, not relative paths
4. Set up MSW server for HTTP tests
5. Use MockAuthStrategy for authenticated clients
6. Test both success and error paths
7. Use request capture to verify HTTP call details
8. Clean up handlers with `afterEach(() => server.resetHandlers())`
9. Run tests: `pnpm --filter <package> run test`
