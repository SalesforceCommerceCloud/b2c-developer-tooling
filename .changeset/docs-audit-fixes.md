---
'@salesforce/b2c-dx-docs': patch
---

Documentation audit pass: corrected mismatched flags and missing commands across the CLI reference. Highlights:

- Documented `b2c sandbox ips`, `b2c mrt env var push`, and `b2c debug` (previously omitted).
- Fixed `mrt project get/update/delete` examples to use the required positional slug; corrected `mrt project member add/update --role` to integer values; replaced `mrt env invalidate --path` with the actual `--pattern` flag; corrected `mrt env redirect create/delete/clone` flag names; rewrote `mrt user api-key` and `mrt user email-prefs` against the real flags.
- Rewrote `ecdn zones create`, `ecdn cache purge`, `ecdn security update`, `ecdn speed update`, and `ecdn logpush jobs create` flag tables to match source.
- Removed phantom flags (`--display-name`, etc.) from `am users update`.
- Standardized Node.js requirement on `>=22.16.0` across all installation guides.
- `account-manager` guide no longer recommends the unsupported `client_secret_post`; the `authentication` warning was reframed as guidance toward `client_secret_basic`.
- Added a Copilot section to the agent-skills guide so the homepage Copilot link points at meaningful content.
- Filled gaps in the CLI command-topic index (`bm-roles`, `setup`, `ecdn`, `replications`, `scapi-schemas`, `cap`, `logs`).
