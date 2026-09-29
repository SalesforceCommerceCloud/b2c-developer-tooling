---
description: Run the B2C CLI and MCP server inside an NVIDIA OpenShell sandbox so AI agents never see your secrets and can only reach the B2C Commerce hosts and operations you allow.
---

# Sandboxing with OpenShell

::: warning Beta
The OpenShell integration is in beta, and OpenShell itself is alpha software. Generated files and behavior may change between releases.
:::

[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runs AI agents and
their tools in an isolated container. One command, `b2c setup openshell`,
turns your B2C configuration into a sandbox that is **safe but fully
functional**: code, WebDAV, SCAPI, Account Manager, on-demand sandboxes,
Managed Runtime, analytics, and documentation commands all work, and
everything else is locked down.

- **Your secrets never enter the sandbox.** Agents can use the CLI and MCP
  server without seeing your API client secret, WebDAV access key, or MRT API
  key.
- **Only B2C Commerce is reachable.** Every other host is blocked.
- **Your [Safety Mode](./safety) level applies**, enforced outside the
  sandbox so an agent can't turn it off.
- **An audit log** of every request, including blocked ones.

## Requirements

- [OpenShell](https://github.com/NVIDIA/OpenShell#quickstart) with a running
  gateway (`openshell status` should succeed)
- Docker
- An API client ID and secret. WebDAV credentials and an MRT API key are
  optional.

::: tip Docker Desktop on macOS
If sandbox creation fails with `failed to connect to OpenShell server`, enable
host networking in Docker Desktop, or add this to the gateway configuration
(with Homebrew: `$(brew --prefix)/var/openshell/gateway.toml`) and run
`brew services restart openshell`:

```toml
[openshell.drivers.docker]
grpc_endpoint = "https://host.docker.internal:17670"
```

:::

## Create a sandbox

With your instance configured, run:

```bash
b2c setup openshell
```

Then use it:

```bash
# Open a shell in the sandbox
openshell sandbox connect b2c-abcd-001

# Or run a single command
openshell sandbox exec -n b2c-abcd-001 -- b2c code list
```

The sandbox is named `b2c-<instance>`. Use `--instance` to create one for
another configured instance, and `--name` to choose the name.

::: details What runs behind the scenes
The command builds a sandbox image, stores your secrets on the OpenShell
gateway, writes a network policy, and creates the sandbox. For an instance
with an API client and WebDAV credentials, that is the equivalent of:

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
  --env SFCC_SAFETY_LEVEL=NONE \
  --env SFCC_DISABLE_TELEMETRY=true \
  --env B2C_SKIP_NEW_VERSION_CHECK=true \
  --detach
```

To review these files first, or run the commands yourself, use `--dry-run`.
It writes everything to `.openshell/<sandbox name>/`, including a `setup.sh`,
without changing anything. The files contain no secrets.
:::

## Choose what the sandbox can do

The sandbox uses your [Safety Mode](./safety) level and rules. Without
Safety Mode configured, it can do anything on the allowed hosts. To choose a
level for the sandbox, add `--safety-level`:

| `--safety-level` | The sandbox can                | Use it to                                               |
| ---------------- | ------------------------------ | ------------------------------------------------------- |
| `READ_ONLY`      | Read                           | Explore, review, and troubleshoot                       |
| `NO_DELETE`      | Read and write, but not delete | Deploy code, run jobs, query analytics, and change data |
| `NONE`           | Do anything                    | Trusted automation that must also delete                |

```bash
b2c setup openshell --safety-level READ_ONLY
```

Safety Mode rules that allow a request or job, such as a site archive export
job, work in the sandbox too.

## Allow more

To reach another host, add `--allow-host`:

```bash
# Let the sandbox install packages from npm
b2c setup openshell --allow-host registry.npmjs.org
```

You can also edit `.openshell/<sandbox name>/policy.yaml`, for example to
restrict a host further, and run `b2c setup openshell` again. Your edits are
kept, but settings such as the safety level then no longer apply to it; use
`--force` to start over from a newly generated policy.

## Update a sandbox

Run `b2c setup openshell` again after changing the policy. After changing
your secrets, configuration, or Safety Mode settings, add `--recreate` to
rebuild the sandbox.

## Agents and the MCP server

Add `--mcp` to include the [B2C DX MCP server](../mcp/) in the sandbox:

```bash
b2c setup openshell --mcp
```

To run a coding agent in the sandbox, install it in your own image (pass it
with `--image`) and allow its model provider in `policy.yaml`. See the
OpenShell documentation for agent-specific setup.

## Audit log {#audit-log}

OpenShell records every request that leaves the sandbox, whether it was
allowed or blocked, and agents in the sandbox can't change it:

```bash
openshell logs b2c-abcd-001 --since 10m --source sandbox
```

```text
HTTP:POST [INFO] ALLOWED POST .../dwsso/oauth2/access_token [policy:b2c_account_manager engine:l7]
HTTP:DELETE [MED] DENIED DELETE .../webdav/Sites/Temp/old.zip [policy:b2c_instance engine:l7]
NET:OPEN [MED] DENIED /usr/bin/curl(0) -> example.com:443
```

The log shows requests, not their contents.

::: warning Keep the log if you need it later
The gateway keeps only recent entries and loses them on restart. For
compliance or long-term review, turn on OpenShell's
[OCSF JSON export](https://github.com/NVIDIA/OpenShell/blob/main/docs/observability/ocsf-json-export.mdx)
and send the records to your log platform or SIEM:

```bash
openshell settings set b2c-abcd-001 --key ocsf_json_enabled --value true
```

:::

## Limitations

- **Client credentials only.** Browser login (`b2c auth login`), JWT
  authentication, mTLS certificates, and SLAS private client tokens
  (`b2c slas token`) don't work in the sandbox.
- **Downloads are blocked**, such as npm plugins and `b2c setup skills`.
  Install what you need in the image, or use `--allow-host`.
- **Only the CLI and MCP server can reach B2C Commerce.** Tools such as
  `curl` are blocked.
- **Access tokens are visible in the sandbox.** They are short-lived and can
  only be used with the allowed hosts.

See also [Safety Mode](./safety), [Security](./security),
[`b2c setup openshell`](../cli/setup#b2c-setup-openshell), and
[MCP Security and Access](../mcp/security).
