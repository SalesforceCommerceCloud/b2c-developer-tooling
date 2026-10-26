---
description: Run AI agents with the B2C CLI and MCP server in a sandbox, so they never see your secrets and can only reach the B2C Commerce hosts and operations you allow.
---

# Agent Sandboxing

::: warning Beta
Agent sandboxing is in beta. Generated files and behavior may change between releases.
:::

Running an AI agent in a sandbox limits what it can do, even if it makes a
mistake or follows a malicious instruction. The B2C tooling can set up a
sandbox that is **safe but fully functional**: code, WebDAV, SCAPI, Account
Manager, on-demand sandboxes, Managed Runtime, analytics, and documentation
commands all work, and everything else is locked down.

- **Your secrets never enter the sandbox.** Agents can use the CLI and MCP
  server without seeing your API client secret, WebDAV access key, or MRT API
  key.
- **Only B2C Commerce is reachable.** Every other host is blocked.
- **Your [Safety Mode](./safety) level applies**, enforced outside the
  sandbox so an agent can't turn it off.
- **An audit log** of every request, including blocked ones.

[NVIDIA OpenShell](#openshell) is the first supported sandbox. Support for
more sandboxing tools is planned.

## OpenShell {#openshell}

[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runs AI agents and
their tools in an isolated container. One command, `b2c setup openshell`,
turns your B2C configuration into an OpenShell sandbox. OpenShell itself is
alpha software.

### Requirements

- [OpenShell](https://docs.nvidia.com/openshell/) 0.1.2 or later with a
  running gateway (`openshell status` should succeed). To upgrade, run the
  OpenShell install script again; if you installed with it, `brew upgrade`
  may not pick up new releases.
- Docker
- An API client ID and secret. WebDAV credentials and an MRT API key are
  optional.

::: tip Docker Desktop on macOS
If sandbox creation fails with `failed to connect to OpenShell server`, enable
host networking in Docker Desktop, or add this to the gateway configuration
(`~/.config/openshell/gateway.toml`, or with Homebrew
`$(brew --prefix)/var/openshell/gateway.toml`) and run
`brew services restart openshell`:

```toml
[openshell.drivers.docker]
grpc_endpoint = "https://host.docker.internal:17670"
```

:::

### Create a sandbox

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

### Choose what the sandbox can do

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

### Allow more

To let the CLI and MCP server reach another host, add `--allow-host`:

```bash
b2c setup openshell --allow-host api.example.com
```

Hosts added this way follow the safety level (with `READ_ONLY`, only reads)
and are reachable only by the CLI and MCP server. To allow other programs,
such as an agent's model provider, see [Run a coding agent](#coding-agent).

You can also edit `.openshell/<sandbox name>/policy.yaml`, for example to
restrict a host further, and run `b2c setup openshell` again. Your edits are
kept, but settings such as the safety level then no longer apply to it; use
`--force` to start over from a newly generated policy. A policy you haven't
edited is regenerated on each run.

### Update a sandbox

Run `b2c setup openshell` again after changing the policy, the safety level,
or your Safety Mode rules. The network policy and rules apply to the running
sandbox.

Some settings, such as the CLI's safety level (`SFCC_SAFETY_LEVEL`) and your
instance configuration, apply only when the sandbox is created; the command
warns when they changed. Add `--recreate` to rebuild the sandbox. Recreating
removes everything you added to the sandbox, such as uploaded files and
attached agent providers.

### Work on a project {#project}

The sandbox has its own file system. Copy your project in, and copy results
back out:

```bash
openshell sandbox upload b2c-abcd-001 ./my-project /sandbox/my-project
openshell sandbox download b2c-abcd-001 /sandbox/my-project/cartridges ./from-sandbox
```

Inside a Git repository, `upload` skips files that `.gitignore` excludes and
the `.git` directory. The default image doesn't include Git; add it to your
own image (see [Run a coding agent](#coding-agent)) if you need it.

### Remove a sandbox {#remove}

Deleting a sandbox keeps the providers that hold your secrets. Delete them
too when you no longer need them:

```bash
openshell sandbox delete b2c-abcd-001
openshell provider delete b2c-abcd-001-client-secret b2c-abcd-001-webdav
```

`openshell provider list` shows the remaining providers.

### Agents and the MCP server

Add `--mcp` to include the [B2C DX MCP server](../mcp/) in the sandbox:

```bash
b2c setup openshell --mcp
```

In the sandbox, configure your agent to start the server with
`b2c-dx-mcp --project-directory <project path>`.

### Run a coding agent {#coding-agent}

To run a coding agent such as Claude Code in the sandbox:

1. Build an image from the B2C image with the agent installed. Create the
   sandbox once with `--mcp` so that the `b2c-openshell:<version>-mcp` image
   exists, then build on it:

   ```dockerfile
   FROM b2c-openshell:1.2.3-mcp
   USER root
   RUN apt-get update && apt-get install -y --no-install-recommends git \
       && rm -rf /var/lib/apt/lists/*
   RUN npm install -g @anthropic-ai/claude-code && npm cache clean --force
   USER sandbox
   WORKDIR /sandbox
   ```

   ```bash
   docker build -t my-agent-sandbox .
   b2c setup openshell --mcp --image my-agent-sandbox --recreate
   ```

2. Give the agent its model credentials with an OpenShell provider. Like the
   B2C secrets, the key stays on the gateway and is sent only to the model
   API. Start from OpenShell's
   [example agent profiles](https://github.com/NVIDIA/OpenShell/tree/main/providers),
   and set `binaries` to the agent's path in your image. The npm package
   installs Claude Code's binary at
   `/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe`.

   ```yaml
   # claude-code.yaml
   id: claude-code
   display_name: Claude Code
   category: agent
   inference_capable: true
   credentials:
     - name: api_key
       env_vars: [ANTHROPIC_API_KEY]
       required: true
       auth_style: header
       header_name: x-api-key
   endpoints:
     - host: api.anthropic.com
       port: 443
       protocol: rest
       access: read-write
       enforcement: enforce
   binaries: [/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe]
   ```

   ```bash
   openshell profile import --file claude-code.yaml
   openshell provider create --name claude --type claude-code --credential ANTHROPIC_API_KEY
   openshell sandbox provider attach b2c-abcd-001 claude --wait
   ```

3. Upload your project (see [Work on a project](#project)) and run the agent:

   ```bash
   openshell sandbox connect b2c-abcd-001
   cd /sandbox/my-project && claude
   ```

Because the agent's binary is not the CLI's, the agent itself can reach only
its model API, and B2C Commerce only through the CLI and MCP server. Set
`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` in the agent's settings to skip
its telemetry hosts, which the policy blocks.

::: tip Private networks and model gateways
Endpoints that resolve to private addresses are blocked unless the endpoint
lists them in `allowed_ips`. OpenShell inspects HTTPS traffic, so a host with
a certificate from a private certificate authority fails verification; with
Docker, set `tls: skip` on that endpoint (the agent then keeps its own token,
because OpenShell can't inject one). Don't override the certificate variables
OpenShell sets in the sandbox, such as `NODE_EXTRA_CA_CERTS`, or the CLI and
MCP server can't connect.
:::

### Audit log {#audit-log}

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
[OCSF JSON export](https://docs.nvidia.com/openshell/observability/ocsf-json-export)
and send the records to your log platform or SIEM:

```bash
openshell settings set b2c-abcd-001 --key ocsf_json_enabled --value true
```

:::

### Limitations

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
