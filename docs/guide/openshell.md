---
description: Run the B2C CLI and MCP server inside an NVIDIA OpenShell sandbox so AI agents never see your secrets and can only reach the B2C Commerce hosts and operations you allow.
---

# Sandboxing with OpenShell

::: warning Beta
The OpenShell integration is in beta, and OpenShell itself is alpha software. Generated files and behavior may change between releases.
:::

[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runs AI agents and
their tools inside an isolated container. One command,
`b2c setup openshell`, turns your current B2C configuration into a sandbox
that is **safe but still fully functional** for everyday development and
administration: code, WebDAV, SCAPI, Account Manager, on-demand sandboxes,
Managed Runtime, analytics, and documentation all work inside it, with
everything else locked down.

What you get:

- **Secrets stay out of the sandbox.** Your API client secret, WebDAV access
  key, and MRT API key are stored on the OpenShell gateway. The sandbox only
  sees placeholders such as `openshell:resolve:env:v1_SFCC_CLIENT_SECRET`.
  OpenShell inserts the real value only when a request goes to the host that
  secret belongs to.
- **Only B2C Commerce hosts are reachable.** Every other host is blocked,
  including from `curl` or scripts an agent writes.
- **Write protection that can't be switched off.** By default the sandbox can
  only read. OpenShell enforces this outside the sandbox, so an agent can't
  bypass it the way it could bypass settings inside the CLI.
- **An audit log** of every request the sandbox makes, including the ones that
  were blocked. See [Audit log](#audit-log).

## OpenShell and Safety Mode

[Safety Mode](./safety) runs inside the CLI and MCP server. It understands B2C
operations and can prompt for approval, but anything else in the same
environment can bypass it. OpenShell enforces its rules outside the sandbox.
`b2c setup openshell` configures both to the same level, so blocked operations
fail early with a clear Safety Mode message, and OpenShell backs that up at
the network.

## Requirements

- [OpenShell](https://github.com/NVIDIA/OpenShell#quickstart) with a running
  gateway (`openshell status` should succeed).
- Docker, to build the sandbox image.
- An API client with a client ID and secret. WebDAV credentials and an MRT
  API key are optional.

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

## Quick start

With your instance configured (in `dw.json`, environment variables, or flags),
run:

```bash
b2c setup openshell
```

The command:

1. Builds a sandbox image with the same B2C CLI version you are running.
2. Registers provider profiles and stores your secrets on the gateway.
3. Writes a network policy for your instance, SCAPI short code, Account
   Manager, and the other hosts the CLI uses.
4. Creates the sandbox.

Each step is printed as it runs.

::: details What runs behind the scenes
For an instance with an API client and WebDAV credentials, the command runs
the equivalent of:

```bash
docker build -t b2c-openshell:1.2.3 .openshell/b2c-abcd-001
openshell profile import --file .openshell/b2c-abcd-001/profiles/b2c-client-secret.yaml
openshell profile import --file .openshell/b2c-abcd-001/profiles/b2c-webdav-access-key.yaml
openshell provider create --name b2c-abcd-001-client-secret --type b2c-client-secret --credential SFCC_CLIENT_SECRET
openshell provider create --name b2c-abcd-001-webdav --type b2c-webdav-access-key --credential SFCC_PASSWORD
openshell sandbox create \
  --name b2c-abcd-001 \
  --from b2c-openshell:1.2.3 \
  --policy .openshell/b2c-abcd-001/policy.yaml \
  --provider b2c-abcd-001-client-secret \
  --provider b2c-abcd-001-webdav \
  --no-auto-providers \
  --env SFCC_CLIENT_ID=my-client-id \
  --env SFCC_SERVER=abcd-001.dx.commercecloud.salesforce.com \
  --env SFCC_USERNAME=me@example.com \
  --env SFCC_SHORTCODE=kv7kzm78 \
  --env SFCC_TENANT_ID=abcd_001 \
  --env SFCC_SAFETY_LEVEL=READ_ONLY \
  --env SFCC_DISABLE_TELEMETRY=true \
  --env B2C_SKIP_NEW_VERSION_CHECK=true \
  --detach
```

- The image build is skipped when the image already exists, or when you pass
  `--image`.
- `--credential` names an environment variable. The command passes each
  secret to `openshell` in its environment only, never as an argument, so
  secrets don't appear in process listings or shell history.
- Each secret gets its own profile and provider, so OpenShell releases it only
  to the hosts it belongs to.
- Only non-secret settings are passed with `--env`.
:::

Then use it:

```bash
# Open a shell in the sandbox
openshell sandbox connect b2c-abcd-001

# Or run a single command
openshell sandbox exec -n b2c-abcd-001 -- b2c code list
```

The sandbox name defaults to `b2c-<instance>`. Use `--name` to choose one, and
`--instance` to create a sandbox for another configured instance.

### Do it yourself

To review everything first, or to run the steps yourself, use `--dry-run`:

```bash
b2c setup openshell --dry-run
```

This writes the generated files to `.openshell/<sandbox name>/` without
changing anything:

| File              | Contents                                     |
| ----------------- | -------------------------------------------- |
| `policy.yaml`     | The sandbox network and filesystem policy    |
| `profiles/*.yaml` | Provider profiles, one per secret            |
| `Dockerfile`      | The sandbox image                            |
| `setup.sh`        | The `docker` and `openshell` commands to run |

The files contain no secrets. To run `setup.sh`, first export the secrets it
lists (for example `SFCC_CLIENT_SECRET`) in your shell.

::: details Example policy.yaml
Each B2C host gets an entry limited to the methods of the access level. The
Account Manager entry releases the client secret, and only the token endpoint
accepts a `POST`:

```yaml
network_policies:
  b2c_account_manager:
    name: b2c-account-manager
    endpoints:
      - host: account.demandware.com
        port: 443
        protocol: rest
        enforcement: enforce
        credential_binding:
          provider: b2c-abcd-001-client-secret
        rules:
          - {allow: {method: POST, path: /dwsso/oauth2/access_token}}
          - {allow: {method: GET, path: /dw/rest/**}}
          - {allow: {method: HEAD, path: /dw/rest/**}}
          - {allow: {method: OPTIONS, path: /dw/rest/**}}
    binaries:
      - path: /usr/local/bin/node
  b2c_instance:
    name: b2c-instance
    endpoints:
      - host: abcd-001.dx.commercecloud.salesforce.com
        port: 443
        protocol: rest
        enforcement: enforce
        credential_binding:
          provider: b2c-abcd-001-webdav
        rules:
          - {allow: {method: GET, path: /**}}
          - {allow: {method: HEAD, path: /**}}
          - {allow: {method: OPTIONS, path: /**}}
          - {allow: {method: PROPFIND, path: /on/demandware.servlet/webdav/**}}
    binaries:
      - path: /usr/local/bin/node
  # ... SCAPI, sandbox API, CIP, MRT, and documentation hosts
```

OpenShell reports a validation warning for `PROPFIND` because it is not a
standard HTTP method. The rule still applies.
:::

## Access levels

`--safety-level` sets what the sandbox may do on B2C Commerce hosts. It also
sets [Safety Mode](./safety) in the sandbox to the same level.

| Level                 | Allowed                                                       |
| --------------------- | ------------------------------------------------------------- |
| `READ_ONLY` (default) | Reads: `GET`, `HEAD`, `OPTIONS`, and WebDAV `PROPFIND`        |
| `NO_DELETE`           | Reads and writes (`POST`, `PUT`, `PATCH`, WebDAV `MKCOL`, `MOVE`, `COPY`), but no deletes |
| `NONE`                | Everything, including `DELETE`                                |

```bash
b2c setup openshell --safety-level NO_DELETE
```

Some B2C searches, such as job execution search, are `POST` requests, so
`READ_ONLY` blocks them. To allow specific writes without raising the level,
see [Customize the policy](#customize-the-policy).

## What works in the sandbox

The generated policy allows the hosts your configuration uses. Hosts you have
overridden, such as `SFCC_ACCOUNT_MANAGER_HOST`, `SFCC_SANDBOX_API_HOST`,
`SFCC_CIP_HOST`, or `MRT_CLOUD_ORIGIN`, are used instead of the defaults and
passed to the sandbox.

| Area                                          | Host                                                 |
| --------------------------------------------- | ---------------------------------------------------- |
| Authentication and `b2c am`                   | Account Manager                                      |
| Code, jobs, WebDAV, logs, and other OCAPI commands | Your instance                                   |
| SCAPI commands (`scapi`, `ecdn`, `slas client`, and others) | `<shortcode>.api.commercecloud.salesforce.com` |
| On-demand sandboxes (`b2c sandbox`)           | The sandbox API host                                 |
| Analytics (`b2c cip`)                         | The CIP host                                         |
| Managed Runtime (`b2c mrt`), including log tailing | The MRT host and its log host                   |
| Documentation (`b2c docs read`)               | `developer.salesforce.com`, `salesforcecommercecloud.github.io` (read only) |

`b2c docs search` and `b2c docs schema` work offline. Telemetry and update
checks are turned off in the sandbox.

Analytics queries are always `POST` requests. The network policy allows them
at every level, but Safety Mode blocks them at `READ_ONLY`. Use
`--safety-level NO_DELETE` if you need `b2c cip` in the sandbox.

To reach another host, add it with `--allow-host`. It gets the same access
level as B2C hosts:

```bash
# Let `b2c setup skills` download skills from GitHub
b2c setup openshell \
  --allow-host api.github.com --allow-host github.com \
  --allow-host codeload.github.com
```

## Customize the policy

Edit `.openshell/<sandbox name>/policy.yaml` and run `b2c setup openshell`
again. The command keeps your edited policy and applies it to the running
sandbox. Use `--force` to replace it with a newly generated one.

For example, to allow code deployment at `READ_ONLY`, add these rules to the
instance endpoint. `b2c code deploy` uploads a zip over WebDAV (`PUT`),
extracts it (`POST`), and deletes it (`DELETE`). Add the `PATCH` rule if you
also use `--activate`:

```yaml
rules:
  - {allow: {method: PUT, path: /on/demandware.servlet/webdav/Sites/Cartridges/**}}
  - {allow: {method: POST, path: /on/demandware.servlet/webdav/Sites/Cartridges/**}}
  - {allow: {method: DELETE, path: /on/demandware.servlet/webdav/Sites/Cartridges/**}}
  - {allow: {method: PATCH, path: /s/-/dw/data/*/code_versions/*}}
```

Blocked requests appear in the [audit log](#audit-log), which shows the exact
path to allow.

Changes to your secrets, configuration, or image need a new sandbox. Run the
command again with `--recreate` to delete and recreate it.

::: details What a re-run does
Running the command again converges on your current configuration:

```bash
# Profiles and providers are updated in place
openshell profile update --file .openshell/b2c-abcd-001/profiles/b2c-client-secret.yaml b2c-client-secret
openshell provider update b2c-abcd-001-client-secret --credential SFCC_CLIENT_SECRET

# The policy is applied to the running sandbox
openshell policy set b2c-abcd-001 --policy .openshell/b2c-abcd-001/policy.yaml --wait
```

With `--recreate`, the sandbox is deleted (`openshell sandbox delete`) and
created again instead of updated, which picks up new environment settings and
providers.
:::

## Agents and the MCP server

Add `--mcp` to also install the [B2C DX MCP server](../mcp/) in the image:

```bash
b2c setup openshell --mcp
```

To run a coding agent in the sandbox, install it in the image (pass your own
image with `--image`) and allow its model provider in `policy.yaml`. See the
OpenShell documentation for agent-specific setup.

## Audit log {#audit-log}

OpenShell records every connection and HTTP request that leaves the sandbox,
whether it was allowed or denied, and which process made it. The log is
written outside the sandbox, so processes in the sandbox can't change it. This
gives you a record of what an agent did against B2C Commerce, including the
attempts your policy blocked.

```bash
openshell logs b2c-abcd-001 --since 10m --source sandbox
```

Each entry shows the process, host, HTTP method and path, the result, and the
policy that matched:

```text
HTTP:POST [INFO] ALLOWED POST .../dwsso/oauth2/access_token [policy:b2c_account_manager engine:l7]
HTTP:DELETE [MED] DENIED DELETE .../webdav/Sites/Temp/old.zip [policy:b2c_instance engine:l7]
NET:OPEN [MED] DENIED /usr/bin/curl(0) -> example.com:443
```

The log records requests, not request or response bodies.

::: warning Keep the log if you need it later
By default, the gateway keeps only a limited buffer of recent entries per
sandbox, and loses it on restart. For compliance or long-term review, enable
OpenShell's
[OCSF JSON export](https://github.com/NVIDIA/OpenShell/blob/main/docs/observability/ocsf-json-export.mdx)
and send the records to your log platform or SIEM:

```bash
openshell settings set b2c-abcd-001 --key ocsf_json_enabled --value true
```

:::

## How credentials are handled

- The API client secret is released only to the Account Manager token
  endpoint, the WebDAV access key only to your instance, and the MRT API key
  only to the MRT host.
- The access token that Account Manager returns is a real, short-lived token
  that the sandbox can read. The network policy limits where it can be used.
- If your client secret contains `+` or `%`, the sandbox sends client
  credentials in the token request body instead of a Basic header, so the
  secret reaches Account Manager intact. See
  [`clientAuthMethod`](./configuration#client-authentication-method).

## Limitations

- **Client credentials only.** Browser-based login (`b2c auth login`),
  JWT/certificate authentication, and mTLS client certificates don't work in
  the sandbox.
- **SLAS private client tokens** (`b2c slas token`) don't work in the sandbox.
- **Other package and skill downloads are blocked**, such as installing
  plugins from npm or `b2c setup skills`. Install what you need in the image,
  or allow the hosts with `--allow-host`.
- **Only Node.js may reach B2C hosts.** Tools such as `curl` are blocked, even
  to allowed hosts.

See also [Safety Mode](./safety), [Security](./security),
[`b2c setup openshell`](../cli/setup#b2c-setup-openshell), and
[MCP Security and Access](../mcp/security).
