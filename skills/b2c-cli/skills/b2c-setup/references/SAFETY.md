# Setup Safety

## Identify the Instance

Check the configured hostname (`b2c setup inspect`), not the configuration name.

| Hostname                                           | Instance    |
| -------------------------------------------------- | ----------- |
| `<realm>-<number>.dx.commercecloud.salesforce.com` | Sandbox     |
| Starts with `staging-` (on `demandware.net`)       | Staging     |
| Starts with `production-` (on `demandware.net`)    | Production  |
| Starts with `development-` (on `demandware.net`)   | Development |

Use `b2c sandbox list` to confirm a sandbox belongs to the expected realm. Hosts on a custom domain or another pattern count as shared instances until the user confirms otherwise.

## Confirm Changes

On staging, production, and development, describe and get approval before:

- importing any site archive or dataset (imports change global settings such as locales, time zone, and preferences);
- running replication, search index rebuilds, or other jobs that change data;
- deploying or activating a code version;
- creating, importing, or deleting a storefront or MRT project.

Include the hostname, the exact command, and what changes. Ask again if the plan changes. A job that reports OK can still leave data incomplete; verify before the next step.

## Safety Mode

Safety Mode adds a second check that also applies to your assistant. Add a policy to each shared instance in `dw.json`:

```json
{
  "configs": [
    {
      "name": "sandbox",
      "hostname": "abcd-001.dx.commercecloud.salesforce.com",
      "safety": {"level": "NONE"}
    },
    {
      "name": "staging",
      "hostname": "staging-abcd-example.demandware.net",
      "safety": {"level": "NO_DELETE", "confirm": true}
    },
    {
      "name": "production",
      "hostname": "production-abcd-example.demandware.net",
      "safety": {"level": "READ_ONLY", "confirm": true}
    }
  ]
}
```

With `confirm: true`, blocked actions ask for approval in an interactive terminal and are blocked in CI. To require approval for specific commands everywhere, add command rules such as `{"command": "job:import", "action": "confirm"}`. An assistant running commands has no terminal to answer the prompt, so those commands are blocked. Give the user the command to run in their own terminal; do not change or remove the safety policy to get past a block. See the [Safety Mode guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/safety.md) (`b2c docs read guide-safety`).
