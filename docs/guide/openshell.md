---
description: Run the B2C CLI and MCP server inside an NVIDIA OpenShell sandbox so AI agents never see your API client secret and can only reach the B2C Commerce hosts and operations you allow.
---

# Sandboxing with OpenShell

[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runs AI agents and
their tools inside an isolated container. It checks every outbound request
against a policy you write and supplies credentials without placing the real
values in the sandbox. Running the B2C CLI or MCP server inside an OpenShell
sandbox gives you:

- **Credential isolation.** The sandbox sees placeholders such as
  `openshell:resolve:env:v1_SFCC_CLIENT_SECRET` instead of your API client
  secret or WebDAV access key. The OpenShell proxy inserts the real value only
  when the request goes to the host you bound it to.
- **Enforced network rules.** Only the hosts in your policy can be reached,
  and you can limit each host by HTTP method and path. For example, you can
  allow reads on an instance but deny `PATCH` and `DELETE`.
- **An audit log of agent activity.** OpenShell records every connection and
  HTTP request from the sandbox, whether it was allowed or denied, and which
  process made it. You can see exactly which B2C Commerce operations an agent
  performed, or tried to perform. See [Audit log](#audit-log).

## OpenShell and Safety Mode

[Safety Mode](./safety) runs inside the CLI and MCP server. It is quick to set
up and understands B2C operations, but anything else in the same environment
can bypass it. For example, an agent with a terminal can call `curl` directly.
OpenShell enforces its rules outside the process, so the agent cannot switch
them off. Use both together: Safety Mode for detailed B2C rules and approval
prompts, and OpenShell to limit where credentials can be sent and which
requests are allowed at all.

## Requirements

- OpenShell 0.1.2 or later with a running gateway. See the
  [OpenShell quickstart](https://github.com/NVIDIA/OpenShell#quickstart). The
  examples in this guide were tested with 0.1.2. OpenShell is alpha software,
  so pin the version you validate.
- An API client that uses client credentials (`SFCC_CLIENT_ID` and
  `SFCC_CLIENT_SECRET`). A B2C CLI and MCP server release that includes
  sandbox placeholder support. Earlier releases send the placeholder in a
  form the proxy cannot resolve, and Account Manager rejects the login with
  `invalid_client`.
- A Linux container image with Node.js 22 or later. The sandbox always runs
  Linux, including on macOS.

::: tip Docker Desktop on macOS
Sandbox containers must be able to reach the gateway. Either enable host
networking in Docker Desktop, or point sandboxes at the gateway through
`host.docker.internal` in the gateway configuration (with Homebrew:
`$(brew --prefix)/var/openshell/gateway.toml`), then run
`brew services restart openshell`:

```toml
[openshell.drivers.docker]
grpc_endpoint = "https://host.docker.internal:17670"
```

Without one of these, sandbox creation fails with
`failed to connect to OpenShell server`.
:::

## 1. Build a sandbox image

OpenShell starts its own supervisor as the container's entrypoint. The image
needs a non-root user, a writable `/sandbox` directory, and `iproute2`:

```dockerfile
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates iproute2 \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @salesforce/b2c-cli && npm cache clean --force
RUN useradd --create-home --shell /bin/bash sandbox \
 && install -d -o sandbox -g sandbox /sandbox
USER sandbox
WORKDIR /sandbox
```

```bash
docker build -t b2c-sandbox .
```

To give an agent access to the MCP server, also install
`@salesforce/b2c-dx-mcp` and your coding agent in the image. The agent's model
provider also needs a network policy. See the OpenShell documentation for
agent-specific setup.

## 2. Define provider profiles

A provider profile tells OpenShell which environment variables hold secrets
and where those secrets may be sent. Create one profile for the Account
Manager client secret and one for the WebDAV access key.

`b2c-account-manager.yaml`:

```yaml
id: b2c-account-manager
display_name: B2C Commerce Account Manager
description: API client secret for B2C Commerce OAuth (client credentials)
category: other
credentials:
  - name: client_secret
    description: Account Manager API client secret
    env_vars: [SFCC_CLIENT_SECRET]
    required: true
discovery:
  credentials: [client_secret]
endpoints:
  - host: account.demandware.com
    port: 443
    path: /dwsso/oauth2/access_token
    protocol: rest
    enforcement: enforce
    # Resolve the placeholder in the form-encoded token request body.
    request_body_credential_rewrite: true
    rules:
      - allow: {method: POST, path: /dwsso/oauth2/access_token}
binaries: [/usr/local/bin/node]
```

`b2c-webdav.yaml`. This profile lists no endpoints, so each instance host is
bound in the sandbox policy (step 4):

```yaml
id: b2c-webdav
display_name: B2C Commerce WebDAV
description: WebDAV access key for a B2C Commerce instance
category: other
credentials:
  - name: access_key
    description: WebDAV access key (Business Manager user access key)
    env_vars: [SFCC_PASSWORD]
    required: true
    auth_style: basic
discovery:
  credentials: [access_key]
```

Validate and register both profiles:

```bash
openshell profile lint --file b2c-account-manager.yaml
openshell profile lint --file b2c-webdav.yaml
openshell profile import --file b2c-account-manager.yaml
openshell profile import --file b2c-webdav.yaml
```

If your Account Manager host is not `account.demandware.com`, change `host` to
match.

## 3. Store the credentials

Create providers from your local environment. Each `--credential` value is an
environment variable name, so secrets stay out of your shell history:

```bash
export SFCC_CLIENT_SECRET=...   # or load from your secret manager
export SFCC_PASSWORD=...

openshell provider create --name my-sandbox-am --type b2c-account-manager \
  --credential SFCC_CLIENT_SECRET
openshell provider create --name my-sandbox-webdav --type b2c-webdav \
  --credential SFCC_PASSWORD
```

The gateway stores the secrets. Sandboxes only receive placeholders.

## 4. Write a sandbox policy

This policy allows reads on one instance and its SCAPI short code host. Every
other host is blocked. Replace the hostnames with your own:

```yaml
version: 1

filesystem_policy:
  include_workdir: true
  read_only: [/bin, /usr, /opt, /lib, /proc, /dev/urandom, /etc]
  read_write: [/sandbox, /tmp, /dev/null, /home/sandbox]
landlock:
  compatibility: best_effort

network_policies:
  # OCAPI Data API and WebDAV on the instance host: reads only.
  b2c_instance:
    name: b2c-instance-read-only
    endpoints:
      - host: abcd-001.dx.commercecloud.salesforce.com
        port: 443
        protocol: rest
        enforcement: enforce
        # Release the WebDAV access key only to this host.
        credential_binding:
          provider: my-sandbox-webdav
        rules:
          - allow: {method: GET, path: '/**'}
          - allow: {method: HEAD, path: '/**'}
          - allow: {method: OPTIONS, path: '/**'}
          - allow: {method: PROPFIND, path: '/on/demandware.servlet/webdav/**'}
    binaries:
      - {path: /usr/local/bin/node}

  # SCAPI Admin APIs on the organization short code host: reads only.
  b2c_scapi:
    name: b2c-scapi-read-only
    endpoints:
      - host: kv7kzm78.api.commercecloud.salesforce.com
        port: 443
        protocol: rest
        enforcement: enforce
        access: read-only
    binaries:
      - {path: /usr/local/bin/node}
```

You don't need to list the Account Manager host. OpenShell adds the endpoint
from the provider profile when you attach the provider. OpenShell reports a
validation warning for `PROPFIND` because it is not a standard HTTP method; the
rule still applies.

Use exact hostnames rather than wildcards, so a credential can only be sent to
the instance you intend.

## 5. Run the CLI in the sandbox

Pass the non-secret settings with `--env` and attach both providers:

```bash
openshell sandbox create --name b2c --from b2c-sandbox \
  --policy policy.yaml \
  --provider my-sandbox-am --provider my-sandbox-webdav --no-auto-providers \
  --env SFCC_SERVER=abcd-001.dx.commercecloud.salesforce.com \
  --env SFCC_CLIENT_ID=<client-id> \
  --env SFCC_USERNAME=<bm-username> \
  --env SFCC_SHORTCODE=kv7kzm78 \
  --env SFCC_TENANT_ID=abcd_001 \
  --env SFCC_DISABLE_TELEMETRY=1 \
  -- b2c code list
```

With this policy:

| Command                           | Result                                             |
| --------------------------------- | -------------------------------------------------- |
| `b2c code list`                   | Works (OAuth through the proxy, then an OCAPI GET) |
| `b2c webdav ls --root cartridges` | Works (WebDAV `PROPFIND`)                          |
| `b2c scapi custom status`         | Works (SCAPI GET)                                  |
| `b2c code activate <version>`     | Denied: `PATCH ... not permitted by policy`        |
| `b2c webdav rm ... --force`       | Denied: `403 Forbidden`                            |
| `curl https://example.com`        | Connection refused                                 |

To keep a sandbox running for an interactive session or an agent, use
`--keep -- sleep infinity` and then `openshell sandbox connect b2c` or
`openshell sandbox exec -n b2c -- <command>`.

## Allow specific writes

Add a rule for each write you want to permit. You can update a running sandbox
with `openshell policy set b2c --policy policy.yaml`.

Many B2C searches are `POST` requests, so the read-only rules above deny them.
Allow the searches you need:

```yaml
rules:
  # OCAPI job execution search on the instance host
  - allow: {method: POST, path: '/s/-/dw/data/*/job_execution_search'}
```

`b2c code deploy` uploads a zip over WebDAV (`PUT`), extracts it (`POST`), and
then deletes the zip (`DELETE`). Allow those methods under `Cartridges` only.
Add the `PATCH` rule if you also use `--activate`:

```yaml
rules:
  - allow: {method: PUT, path: '/on/demandware.servlet/webdav/Sites/Cartridges/**'}
  - allow: {method: POST, path: '/on/demandware.servlet/webdav/Sites/Cartridges/**'}
  - allow: {method: DELETE, path: '/on/demandware.servlet/webdav/Sites/Cartridges/**'}
  - allow: {method: PATCH, path: '/s/-/dw/data/*/code_versions/*'}
```

Denied requests are recorded in the audit log, so use a denial in the log to
find the path to allow.

## Audit log {#audit-log}

OpenShell's sandbox supervisor records every connection and HTTP request that
leaves the sandbox. The supervisor runs outside the agent's process and
streams entries to the gateway; processes in the sandbox run as an
unprivileged user and cannot modify the log. This gives you a record of what an
agent did against B2C Commerce, including the attempts your policy blocked.
The B2C CLI and MCP server do not write this log; OpenShell does.

View recent entries:

```bash
openshell logs b2c --since 10m --source sandbox
```

Each entry shows the process, host, HTTP method and path, the result, and the
policy that allowed or denied it:

```text
HTTP:POST [INFO] ALLOWED POST .../dwsso/oauth2/access_token [policy:_provider_my_sandbox_am engine:l7]
HTTP:DELETE [MED] DENIED DELETE .../webdav/Sites/Temp/old.zip [policy:b2c_instance engine:l7]
NET:OPEN [MED] DENIED /usr/bin/curl(0) -> account.demandware.com:443
```

The log records requests, not request or response bodies. It shows that an
agent sent a `PATCH` to a code version, for example, but not the payload.

::: warning Keep the log if you need it later
By default, the gateway keeps only a limited in-memory buffer of recent
entries per sandbox, and loses it on restart. The files inside the sandbox
keep three days and are deleted along with the sandbox. For compliance or
long-term review, enable OpenShell's
[OCSF JSON export](https://github.com/NVIDIA/OpenShell/blob/main/docs/observability/ocsf-json-export.mdx)
and send the records to your log platform or SIEM:

```bash
openshell settings set b2c --key ocsf_json_enabled --value true
```

See the OpenShell
[logging documentation](https://github.com/NVIDIA/OpenShell/blob/main/docs/observability/logging.mdx)
for the event format and filtering.
:::

## How credentials are handled

- When the client secret is an OpenShell placeholder, the CLI and MCP server
  send the client credentials in the token request body instead of an HTTP
  Basic `Authorization` header. The proxy swaps in the real secret there.
  Real secrets always use the Basic header.

  The body is needed because the proxy replaces a placeholder in a Basic
  header with the raw secret, and Account Manager form-decodes that header.
  A secret containing `+` or `%` would therefore reach Account Manager
  altered, and the login would fail. In the body, the proxy decodes and
  re-encodes the value, so every secret arrives intact.

- WebDAV requests keep using Basic authentication. The proxy resolves the
  placeholder only on the host named in `credential_binding`.
- The access token that Account Manager returns is a real, short-lived token
  that processes in the sandbox can read. The network policy limits where it
  can be used.

## Limitations

- **Client credentials only.** Browser-based user login (`b2c auth login`),
  JWT/certificate authentication, and mTLS client certificates do not work
  with placeholders.
- **SLAS private clients** (`b2c slas token`) still send their secret in a
  Basic header, which the proxy cannot resolve.
- **Binary restrictions apply to network access, not to placeholders.** The
  policy's `binaries` list limits which programs can open connections. In
  OpenShell 0.1.2, the profile's `binaries` list does not yet limit which
  program can use a placeholder. Every Node.js script in the sandbox is
  treated as `/usr/local/bin/node`.
- **Telemetry and npm registry requests are blocked** unless you allow their
  hosts. Commands still work. Set `SFCC_DISABLE_TELEMETRY=1` to keep
  telemetry denials out of the log.

See also [Safety Mode](./safety), [Security](./security), and
[MCP Security and Access](../mcp/security).
