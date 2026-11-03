/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Mock OpenID Connect identity provider for trying SLAS external IDP login end to end.
 *
 *   pnpm slas:mock-idp [serve] [options]      Start the IDP (optionally behind a public tunnel)
 *   pnpm slas:mock-idp login [options]        Drive a full SLAS IDP login against a running mock
 *
 * SLAS calls the IDP token and user info endpoints from Salesforce servers, so the IDP needs a
 * public HTTPS URL. `--tunnel` starts a Cloudflare quick tunnel (requires `cloudflared` on PATH;
 * no account needed); `--public-url` uses a URL you already expose (ngrok, a dev host, ...).
 *
 * `--register` creates or updates the SLAS identity provider through the CLI in this checkout,
 * pointing it at the mock. Then sign in through the IDP either way:
 *
 *   - interactively: open the printed SLAS authorize URL in a browser and pick a shopper on the
 *     mock's sign-in page (or use your storefront's IDP login with hint=<idp name>);
 *   - programmatically: `pnpm slas:mock-idp login`, which follows the redirects, signs in as the
 *     given shopper without a browser, and exchanges the code for SLAS shopper tokens.
 *
 * Use a shopper email outside the reserved test domains (example.com, *.test, ...): SLAS rejects
 * those at the IDP callback with "The shopper is invalid". No mail is sent to the address. Each
 * new email creates a registered customer on the instance.
 *
 * Everything lives in memory; restart the mock to reset it. Each request SLAS makes is logged
 * (Basic or body client credentials, redirect URI, scopes) so you can see what SLAS sent.
 * State for `login` (the public URL and IDP name) is written to a state file next to your
 * B2C CLI config so the commands can run in separate terminals.
 */

import {spawn, spawnSync, type ChildProcess} from 'node:child_process';
import {createHash, generateKeyPairSync, randomBytes, randomUUID, sign, type KeyObject} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {parseArgs} from 'node:util';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
/** SLAS key → mock token/user info claim, as documented for the `default` IDP. */
const CLAIM_MAPPER = [
  'accessToken=access_token',
  'refreshToken=refresh_token',
  'accessTokenTTL=expires_in',
  'idToken=id_token',
  'subject=sub',
  'userId=sub',
  'email=email',
  'familyName=family_name',
  'givenName=given_name',
  'name=name',
];
const STATE_FILE = path.join(os.homedir(), '.config', 'b2c', 'slas-mock-idp.json');

const HELP = `Mock OIDC identity provider for SLAS IDP login testing.

Usage:
  pnpm slas:mock-idp [serve] [options]
  pnpm slas:mock-idp login [options]

serve options:
  --port <n>              Local port (default 8787)
  --tunnel                Expose the mock through a Cloudflare quick tunnel (needs cloudflared)
  --public-url <url>      Public base URL when you expose the mock yourself
  --idp <name>            SLAS IDP name to register (default default-mock, the generic OIDC provider)
  --register              Create or update the SLAS IDP with the CLI in this checkout
  --tenant-id <id>        SLAS tenant (otherwise from your B2C configuration)
  --client-id <id>        Client ID SLAS uses at the mock (default b2c-mock-client)
  --client-secret <s>     Client secret SLAS uses at the mock (default: random per run)
  --user <email>          Shopper to sign in as when no one is chosen (default shopper@sink.salesforce.com)
  --auto-approve          Skip the sign-in page and sign in as --user immediately
  --cli-arg <arg>         Extra argument for CLI calls, repeatable (e.g. --cli-arg=-i --cli-arg=my-sandbox)

login options:
  --slas-client-id <id>   Public SLAS client allowed on the site (otherwise from configuration)
  --site-id <id>          Site/channel ID (otherwise from configuration)
  --redirect-uri <uri>    Redirect URI registered on the SLAS client (default http://localhost:3000/callback)
  --user <email>          Shopper to sign in as (default shopper@sink.salesforce.com)
  --short-code, --tenant-id, --idp, --cli-arg   As above
  --json                  Print the SLAS token response as JSON
`;

// ---------------------------------------------------------------------------------------------
// Shared helpers

type Options = Record<string, boolean | string | string[] | undefined>;

function parse(argv: string[]): {command: string; values: Options} {
  const {values, positionals} = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'auto-approve': {type: 'boolean'},
      'cli-arg': {type: 'string', multiple: true},
      'client-id': {type: 'string'},
      'client-secret': {type: 'string'},
      help: {type: 'boolean', short: 'h'},
      idp: {type: 'string'},
      json: {type: 'boolean'},
      port: {type: 'string'},
      'public-url': {type: 'string'},
      'redirect-uri': {type: 'string'},
      register: {type: 'boolean'},
      'short-code': {type: 'string'},
      'site-id': {type: 'string'},
      'slas-client-id': {type: 'string'},
      'tenant-id': {type: 'string'},
      tunnel: {type: 'boolean'},
      user: {type: 'string'},
    },
  });
  return {command: positionals[0] ?? 'serve', values};
}

function str(values: Options, key: string): string | undefined {
  const value = values[key];
  return typeof value === 'string' ? value : undefined;
}

function cliArgs(values: Options): string[] {
  const extra = values['cli-arg'];
  return Array.isArray(extra) ? extra : [];
}

/** Run the CLI from this checkout and return parsed JSON output. */
function runCli(args: string[], values: Options): unknown {
  const result = spawnSync(path.join(REPO_ROOT, 'cli'), [...args, ...cliArgs(values), '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const detail = result.stdout.trim() || result.stderr.trim();
    throw new Error(`b2c ${args.slice(0, 3).join(' ')} failed: ${detail.split('\n').slice(0, 5).join('\n')}`);
  }
  return JSON.parse(result.stdout);
}

/** Resolved B2C configuration values (tenant, short code, site, SLAS client) for defaults. */
function resolvedConfig(values: Options): Record<string, unknown> {
  try {
    const out = runCli(['setup', 'inspect'], values) as {config?: Record<string, unknown>};
    return (out.config ?? out) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function log(message: string): void {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[${time}] ${message}`);
}

// ---------------------------------------------------------------------------------------------
// Mock IDP server

interface MockUser {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  name: string;
  preferred_username: string;
  sub: string;
}

interface Grant {
  clientId: string;
  codeChallenge?: string;
  nonce?: string;
  redirectUri: string;
  scope: string;
  user: MockUser;
}

/** Deterministic UUID-shaped subject for an email. */
function uuidFrom(value: string): string {
  const h = createHash('sha256').update(value).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** SLAS rejects shoppers on reserved test domains (RFC 2606) with "The shopper is invalid". */
function isReservedEmail(email: string): boolean {
  const domain = (email.split('@').pop() ?? '').toLowerCase();
  return /(?:^|\.)example\.(?:com|net|org)$/.test(domain) || /\.(?:example|invalid|localhost|test)$/.test(domain);
}

const RESERVED_WARNING =
  'SLAS rejects reserved test domains such as example.com ("The shopper is invalid"); use another domain.';

function userFor(email: string): MockUser {
  const local = email.split('@')[0] ?? 'shopper';
  const [given = 'Mock', family = 'Shopper'] = local.split(/[._-]/);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    email,
    email_verified: true,
    family_name: cap(family),
    given_name: cap(given),
    name: `${cap(given)} ${cap(family)}`,
    preferred_username: email,
    // Stable per email so repeated logins map to the same SLAS shopper.
    sub: uuidFrom(email.toLowerCase()),
  };
}

class MockIdp {
  readonly clientId: string;
  readonly clientSecret: string;
  publicUrl = '';
  private readonly accessTokens = new Map<string, {expires: number; scope: string; user: MockUser}>();
  private readonly codes = new Map<string, Grant>();
  private readonly kid = randomUUID();
  private readonly privateKey: KeyObject;
  private readonly publicJwk: Record<string, unknown>;

  constructor(
    private readonly options: {autoApprove: boolean; clientId: string; clientSecret: string; defaultUser: string},
  ) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
    this.privateKey = privateKey;
    this.publicJwk = {...publicKey.export({format: 'jwk'}), alg: 'RS256', kid: this.kid, use: 'sig'};
  }

  get endpoints() {
    const base = this.publicUrl;
    return {
      authUrl: `${base}/authorize`,
      tokenInfoUrl: `${base}/tokeninfo`,
      tokenUrl: `${base}/token`,
      userInfoUrl: `${base}/userinfo`,
      wellKnownUrl: `${base}/.well-known/openid-configuration`,
    };
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const body = req.method === 'POST' ? await readBody(req) : new URLSearchParams();
    log(`${req.method} ${url.pathname}${describeRequest(req, url, body)}`);
    try {
      switch (url.pathname) {
        case '/.well-known/openid-configuration':
          return json(res, 200, this.discovery());
        case '/authorize':
          return this.authorize(req, res, url, body);
        case '/token':
          return this.token(req, res, body);
        case '/userinfo':
          return this.userinfo(req, res);
        case '/tokeninfo':
        case '/introspect':
          return this.tokeninfo(req, res, url, body);
        case '/jwks':
          return json(res, 200, {keys: [this.publicJwk]});
        case '/':
          return html(res, 200, page('Mock IDP', `<p>Discovery: <code>${this.endpoints.wellKnownUrl}</code></p>`));
        default:
          return json(res, 404, {error: 'not_found'});
      }
    } catch (error) {
      log(`  ! ${(error as Error).message}`);
      return json(res, 500, {error: 'server_error', error_description: (error as Error).message});
    }
  }

  private authorize(req: IncomingMessage, res: ServerResponse, url: URL, body: URLSearchParams): void {
    const params = req.method === 'POST' ? body : url.searchParams;
    const clientId = params.get('client_id') ?? '';
    const redirectUri = params.get('redirect_uri') ?? '';
    if (clientId !== this.clientId) {
      return html(
        res,
        400,
        page('Unknown client', `<p>client_id <code>${escape(clientId)}</code> is not registered.</p>`),
      );
    }
    if (!redirectUri) return html(res, 400, page('Missing redirect_uri', ''));

    // login_hint or a posted email signs in directly; otherwise show the sign-in page.
    const email =
      params.get('email') || params.get('login_hint') || (this.options.autoApprove ? this.options.defaultUser : '');
    if (!email) return html(res, 200, this.signInPage(url.searchParams));

    const code = base64url(randomBytes(24));
    this.codes.set(code, {
      clientId,
      codeChallenge: params.get('code_challenge') ?? undefined,
      nonce: params.get('nonce') ?? undefined,
      redirectUri,
      scope: params.get('scope') ?? 'openid',
      user: userFor(email),
    });
    const target = new URL(redirectUri);
    target.searchParams.set('code', code);
    const state = params.get('state');
    if (state) target.searchParams.set('state', state);
    if (isReservedEmail(email)) log(`  ! ${email}: ${RESERVED_WARNING}`);
    log(`  → signed in ${email}; redirecting to ${target.origin}${target.pathname}`);
    res.writeHead(302, {Location: target.toString()}).end();
  }

  private discovery() {
    const e = this.endpoints;
    return {
      authorization_endpoint: e.authUrl,
      claims_supported: ['sub', 'email', 'email_verified', 'name', 'given_name', 'family_name'],
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      id_token_signing_alg_values_supported: ['RS256'],
      introspection_endpoint: `${this.publicUrl}/introspect`,
      issuer: this.publicUrl,
      jwks_uri: `${this.publicUrl}/jwks`,
      response_types_supported: ['code'],
      scopes_supported: ['openid', 'email', 'profile', 'offline_access'],
      subject_types_supported: ['public'],
      token_endpoint: e.tokenUrl,
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      userinfo_endpoint: e.userInfoUrl,
    };
  }

  private jwt(user: MockUser, extra: Record<string, unknown>): string {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({alg: 'RS256', kid: this.kid, typ: 'JWT'}));
    const claims = base64url(
      JSON.stringify({
        ...user,
        aud: this.clientId,
        exp: now + 3600,
        iat: now,
        iss: this.publicUrl,
        jti: randomUUID(),
        ...extra,
      }),
    );
    const signature = sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), this.privateKey);
    return `${header}.${claims}.${base64url(signature)}`;
  }

  private issueTokens(user: MockUser, scope: string, nonce?: string) {
    // Signed JWT access tokens, like most hosted IDPs; SLAS may read claims from them.
    const accessToken = this.jwt(user, {scope, token_use: 'access'});
    const refreshToken = base64url(randomBytes(32));
    this.accessTokens.set(accessToken, {expires: Date.now() + 3_600_000, scope, user});
    this.accessTokens.set(`refresh:${refreshToken}`, {expires: Date.now() + 86_400_000, scope, user});
    return {
      access_token: accessToken,
      expires_in: 3600,
      id_token: this.jwt(user, nonce ? {nonce} : {}),
      refresh_token: refreshToken,
      scope,
      token_type: 'Bearer',
    };
  }

  private lookup(token: string | undefined) {
    const entry = token ? this.accessTokens.get(token) : undefined;
    return entry && entry.expires > Date.now() ? entry : undefined;
  }

  private signInPage(query: URLSearchParams): string {
    const hidden = [...query.entries()]
      .map(([k, v]) => `<input type="hidden" name="${escape(k)}" value="${escape(v)}">`)
      .join('');
    return page(
      'Sign in to Mock IDP',
      `<p>Any email signs in. The same email always maps to the same shopper.</p>
       <form method="post" action="/authorize">${hidden}
         <label>Email <input name="email" type="email" value="${escape(this.options.defaultUser)}" required autofocus></label>
         <button type="submit">Sign in</button>
       </form>`,
    );
  }

  private token(req: IncomingMessage, res: ServerResponse, body: URLSearchParams): void {
    const creds = clientCredentials(req, body);
    log(`  client auth: ${creds.method}`);
    if (creds.clientId !== this.clientId || creds.clientSecret !== this.clientSecret) {
      return json(res, 401, {error: 'invalid_client', error_description: 'Unknown client or wrong secret'});
    }

    const grantType = body.get('grant_type');
    if (grantType === 'refresh_token') {
      const entry = this.lookup(`refresh:${body.get('refresh_token') ?? ''}`);
      if (!entry) return json(res, 400, {error: 'invalid_grant'});
      return json(res, 200, this.issueTokens(entry.user, entry.scope));
    }
    if (grantType !== 'authorization_code') return json(res, 400, {error: 'unsupported_grant_type'});

    const code = body.get('code') ?? '';
    const grant = this.codes.get(code);
    this.codes.delete(code);
    if (!grant) return json(res, 400, {error: 'invalid_grant', error_description: 'Unknown or used code'});
    const redirectUri = body.get('redirect_uri');
    if (redirectUri && redirectUri !== grant.redirectUri) {
      return json(res, 400, {error: 'invalid_grant', error_description: 'redirect_uri mismatch'});
    }
    if (grant.codeChallenge) {
      const verifier = body.get('code_verifier') ?? '';
      if (base64url(createHash('sha256').update(verifier).digest()) !== grant.codeChallenge) {
        return json(res, 400, {error: 'invalid_grant', error_description: 'PKCE verification failed'});
      }
    }
    return json(res, 200, this.issueTokens(grant.user, grant.scope, grant.nonce));
  }

  private tokeninfo(req: IncomingMessage, res: ServerResponse, url: URL, body: URLSearchParams): void {
    const token =
      bearer(req) ?? body.get('token') ?? body.get('access_token') ?? url.searchParams.get('access_token') ?? undefined;
    const entry = this.lookup(token);
    if (!entry) return json(res, 200, {active: false});
    return json(res, 200, {
      ...entry.user,
      active: true,
      client_id: this.clientId,
      exp: Math.floor(entry.expires / 1000),
      scope: entry.scope,
      token_type: 'Bearer',
    });
  }

  private userinfo(req: IncomingMessage, res: ServerResponse): void {
    const token = bearer(req);
    if (!token) log(`  no bearer token (authorization header: ${req.headers.authorization ? 'present' : 'absent'})`);
    const entry = this.lookup(token);
    if (!entry) return json(res, 401, {error: 'invalid_token'});
    return json(res, 200, {...entry.user, email_verified: true});
  }
}

function bearer(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization ?? '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : undefined;
}

function clientCredentials(req: IncomingMessage, body: URLSearchParams) {
  const header = req.headers.authorization ?? '';
  if (header.toLowerCase().startsWith('basic ')) {
    const [id, secret] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':');
    return {
      clientId: decodeURIComponent(id ?? ''),
      clientSecret: decodeURIComponent(secret ?? ''),
      method: 'Basic header',
    };
  }
  return {
    clientId: body.get('client_id') ?? '',
    clientSecret: body.get('client_secret') ?? '',
    method: body.has('client_secret') ? 'credentials in body' : 'none',
  };
}

function describeRequest(req: IncomingMessage, url: URL, body: URLSearchParams): string {
  const params = new URLSearchParams([...url.searchParams, ...body]);
  for (const secret of [
    'client_secret',
    'code',
    'code_verifier',
    'refresh_token',
    'token',
    'access_token',
    'password',
  ]) {
    if (params.has(secret)) params.set(secret, '…');
  }
  const shown = params.toString();
  return shown ? ` ${decodeURIComponent(shown)}` : '';
}

async function readBody(req: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  if ((req.headers['content-type'] ?? '').includes('application/json')) {
    return new URLSearchParams(Object.entries(JSON.parse(text || '{}') as Record<string, string>));
  }
  return new URLSearchParams(text);
}

function json(res: ServerResponse, status: number, data: unknown): void {
  if (status >= 400) log(`  ← ${status} ${JSON.stringify(data)}`);
  res.writeHead(status, {'Cache-Control': 'no-store', 'Content-Type': 'application/json'}).end(JSON.stringify(data));
}

function html(res: ServerResponse, status: number, content: string): void {
  res.writeHead(status, {'Content-Type': 'text/html; charset=utf-8'}).end(content);
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function page(title: string, content: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:28rem;margin:4rem auto;padding:0 1rem}
label{display:block;margin:1rem 0}input{display:block;width:100%;padding:.5rem;font-size:1rem}
button{padding:.5rem 1rem;font-size:1rem}code{word-break:break-all}</style></head>
<body><h1>${title}</h1>${content}</body></html>`;
}

// ---------------------------------------------------------------------------------------------
// Tunnel

function startTunnel(port: number): Promise<{process: ChildProcess; url: string}> {
  return new Promise((resolve, reject) => {
    const child = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => reject(new Error('Timed out waiting for the Cloudflare tunnel URL')), 30_000);
    const onData = (chunk: Buffer) => {
      const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString());
      if (match) {
        clearTimeout(timer);
        resolve({process: child, url: match[0]});
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Could not start cloudflared (${error.message}). Install it or use --public-url.`));
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`cloudflared exited with code ${code}`));
    });
  });
}

/**
 * Quick tunnels can take up to a minute to route. Wait until discovery answers through the tunnel;
 * local DNS may cache the early miss, so give up quietly and let SLAS (which resolves separately) try.
 */
async function waitForTunnel(url: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 3000));
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${url}/.well-known/openid-configuration`);
      if (response.ok) return true;
    } catch {
      // not routed yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Commands

async function serve(values: Options): Promise<void> {
  const port = Number(str(values, 'port') ?? 8787);
  const idpName = str(values, 'idp') ?? 'default-mock';
  const defaultUser = str(values, 'user') ?? 'shopper@sink.salesforce.com';
  const idp = new MockIdp({
    autoApprove: Boolean(values['auto-approve']),
    clientId: str(values, 'client-id') ?? 'b2c-mock-client',
    clientSecret: str(values, 'client-secret') ?? base64url(randomBytes(18)),
    defaultUser,
  });

  const server = createServer((req, res) => void idp.handle(req, res));
  await new Promise<void>((resolve) => server.listen(port, resolve));
  idp.publicUrl = `http://localhost:${port}`;

  let tunnel: ChildProcess | undefined;
  const publicUrl = str(values, 'public-url');
  if (publicUrl) {
    idp.publicUrl = publicUrl.replace(/\/$/, '');
  } else if (values.tunnel) {
    log('Starting Cloudflare quick tunnel...');
    const started = await startTunnel(port);
    tunnel = started.process;
    idp.publicUrl = started.url;
    process.on('exit', () => tunnel?.kill());
    if (!(await waitForTunnel(started.url))) {
      log('Tunnel is not reachable from this machine yet; continuing (it usually starts routing shortly).');
    }
  }

  const shutdown = () => {
    tunnel?.kill();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const e = idp.endpoints;
  console.log(`
Mock IDP listening on http://localhost:${port}
Public URL:      ${idp.publicUrl}
Client ID:       ${idp.clientId}${values.register ? '' : `\nClient secret:   ${idp.clientSecret}`}
Discovery:       ${e.wellKnownUrl}
`);

  const setArgs = [
    'slas',
    'idp',
    'set',
    idpName,
    '--idp-client-id',
    idp.clientId,
    '--idp-client-secret',
    idp.clientSecret,
    '--well-known-url',
    e.wellKnownUrl,
    '--auth-url',
    e.authUrl,
    '--token-url',
    e.tokenUrl,
    '--token-info-url',
    e.tokenInfoUrl,
    '--user-info-url',
    e.userInfoUrl,
    '--scopes',
    'openid,email,profile',
    '--login-merge-claims',
    'email',
    // The generic `default` provider reads shopper details through this mapping.
    '--claim-mapper',
    CLAIM_MAPPER.join(','),
  ];
  const tenantId = str(values, 'tenant-id');
  if (tenantId) setArgs.push('--tenant-id', tenantId);

  if (!idp.publicUrl.startsWith('https://')) {
    console.log(
      'SLAS can only reach the mock over public HTTPS. Restart with --tunnel or --public-url to register it.\n',
    );
  } else if (values.register) {
    log(`Registering SLAS identity provider ${idpName}...`);
    try {
      runCli(setArgs, values);
      log(`Registered ${idpName}. Delete it when you are done: b2c slas idp delete ${idpName} --force`);
    } catch (error) {
      log(`Registration failed: ${(error as Error).message}`);
    }
  } else {
    console.log(`Register it with SLAS:\n\n  b2c ${setArgs.map((a) => (/[\s,]/.test(a) ? `'${a}'` : a)).join(' ')}\n`);
  }

  mkdirSync(path.dirname(STATE_FILE), {recursive: true});
  writeFileSync(STATE_FILE, JSON.stringify({idp: idpName, publicUrl: idp.publicUrl, tenantId}, null, 2), {mode: 0o600});
  console.log(`Sign in programmatically:  pnpm slas:mock-idp login --user ${defaultUser}`);
  console.log('Stop with Ctrl+C.\n');
}

/** Drive SLAS IDP login: authorize with hint=<idp>, sign in at the mock, exchange the code. */
async function login(values: Options): Promise<void> {
  let state: {idp?: string; tenantId?: string} = {};
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // no running mock recorded
  }
  const config = resolvedConfig(values);
  const pick = (flag: string, key: string, fallback?: string) =>
    str(values, flag) ?? (typeof config[key] === 'string' ? (config[key] as string) : undefined) ?? fallback;

  const shortCode = pick('short-code', 'shortCode');
  const tenantId = str(values, 'tenant-id') ?? state.tenantId ?? pick('tenant-id', 'tenantId');
  const siteId = pick('site-id', 'siteId');
  const clientId = pick('slas-client-id', 'slasClientId');
  const idpName = str(values, 'idp') ?? state.idp ?? 'default-mock';
  const redirectUri = str(values, 'redirect-uri') ?? 'http://localhost:3000/callback';
  const user = str(values, 'user') ?? 'shopper@sink.salesforce.com';
  const missing = Object.entries({clientId, shortCode, siteId, tenantId})
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new Error(`Missing ${missing.join(', ')}; pass flags or configure them.`);
  if (isReservedEmail(user)) throw new Error(`${user}: ${RESERVED_WARNING}`);

  const organizationId = tenantId!.startsWith('f_ecom_') ? tenantId! : `f_ecom_${tenantId}`;
  const slasBase = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${organizationId}`;
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash('sha256').update(verifier).digest());

  const authorize = new URL(`${slasBase}/oauth2/authorize`);
  authorize.search = new URLSearchParams({
    channel_id: siteId!,
    client_id: clientId!,
    code_challenge: challenge,
    hint: idpName,
    redirect_uri: redirectUri,
    response_type: 'code',
  }).toString();
  console.log(`Interactive alternative: open this URL in a browser\n  ${authorize}\n`);

  // Follow redirects by hand: SLAS → mock /authorize → SLAS callback → client redirect_uri.
  let next = authorize.toString();
  let finalUrl: URL | undefined;
  for (let hop = 0; hop < 10 && !finalUrl; hop++) {
    const target = new URL(next);
    if (target.origin === new URL(redirectUri).origin && target.pathname === new URL(redirectUri).pathname) {
      finalUrl = target;
      break;
    }
    // Sign in at the mock without the page by passing login_hint.
    if (target.pathname.endsWith('/authorize') && !target.host.endsWith('commercecloud.salesforce.com')) {
      target.searchParams.set('login_hint', user);
    }
    const response = await fetch(target, {redirect: 'manual'});
    const location = response.headers.get('location');
    log(`${response.status} ${target.host}${target.pathname}`);
    if (!location) {
      const text = await response.text();
      throw new Error(
        `Expected a redirect from ${target.host}${target.pathname}, got ${response.status}: ${text.slice(0, 300)}`,
      );
    }
    next = new URL(location, target).toString();
  }
  if (!finalUrl) throw new Error('Too many redirects before reaching the redirect URI');
  const code = finalUrl.searchParams.get('code');
  const usid = finalUrl.searchParams.get('usid');
  if (!code) throw new Error(`Redirect URI reached without a code: ${finalUrl.search}`);

  const tokenResponse = await fetch(`${slasBase}/oauth2/token`, {
    body: new URLSearchParams({
      channel_id: siteId!,
      client_id: clientId!,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code_pkce',
      redirect_uri: redirectUri,
      ...(usid ? {usid} : {}),
    }),
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    method: 'POST',
  });
  const tokens = (await tokenResponse.json()) as Record<string, unknown>;
  if (!tokenResponse.ok)
    throw new Error(`SLAS token exchange failed (${tokenResponse.status}): ${JSON.stringify(tokens)}`);

  if (values.json) {
    console.log(JSON.stringify(tokens, null, 2));
    return;
  }
  console.log(`
Signed in ${user} through ${idpName}.
  customer_id: ${tokens.customer_id}
  usid:        ${tokens.usid}
  idp_access_token returned: ${tokens.idp_access_token ? 'yes' : 'no'}

Access token (Bearer) for Shopper APIs:
${tokens.access_token}

Clean up the SLAS records for this shopper: b2c slas shopper delete ${tokens.customer_id} --email ${user} --force`);
}

async function main(): Promise<void> {
  const {command, values} = parse(process.argv.slice(2));
  if (values.help) {
    console.log(HELP);
    return;
  }
  if (command === 'serve') return serve(values);
  if (command === 'login') return login(values);
  console.error(`Unknown command "${command}".\n\n${HELP}`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
