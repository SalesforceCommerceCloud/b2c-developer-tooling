# Code Commands

Commands for managing cartridge code on B2C Commerce instances.

## b2c code list

List all code versions on a B2C Commerce instance.

### Usage

```bash
b2c code list
```

### Flags

Uses [global instance and authentication flags](./index#global-flags).

### Examples

```bash
# List code versions on an instance
b2c code list --server my-sandbox.demandware.net --client-id xxx --client-secret yyy

# Output as JSON
b2c code list --json

# Using environment variables
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
b2c code list
```

### Output

The command displays a table of code versions with:

- Code version ID
- Active status
- Rollback status
- Last modification time
- Number of cartridges

Example output:

```
ID                        Active    Rollback  Last Modified             Cartridges
────────────────────────────────────────────────────────────────────────────────────
version1                  Yes       No        11/29/2024, 2:30:00 PM    15
version2                  No        Yes       11/28/2024, 10:15:00 AM   15
staging                   No        No        11/25/2024, 9:00:00 AM    12
```

### Authentication

This command requires OAuth authentication. Provide `--client-id` and `--client-secret` or set the corresponding `SFCC_CLIENT_ID` and `SFCC_CLIENT_SECRET` environment variables.

---

## b2c code deploy

Deploy cartridges to a B2C Commerce instance.

This command finds cartridges in the specified directory (by looking for `.project` files), creates a zip archive, uploads it via WebDAV, and optionally reloads the code version.

### Usage

```bash
b2c code deploy [CARTRIDGEPATH]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `CARTRIDGEPATH` | Path to search for cartridges | `.` (current directory) |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--reload`, `-r` | Reload (re-activate) code version after deploy | `false` |
| `--delete` | Delete existing cartridges before upload | `false` |
| `--cartridge`, `-c` | Include specific cartridge(s) (can be repeated) | |
| `--exclude-cartridge`, `-x` | Exclude specific cartridge(s) (can be repeated) | |

### Examples

```bash
# Deploy all cartridges from current directory
b2c code deploy --server my-sandbox.demandware.net --code-version v1

# Deploy from a specific directory
b2c code deploy ./my-project --server my-sandbox.demandware.net --code-version v1

# Deploy and reload the code version
b2c code deploy --reload

# Deploy specific cartridges only
b2c code deploy -c app_storefront_base -c plugin_applepay

# Deploy all except certain cartridges
b2c code deploy -x test_cartridge -x int_debug

# Delete existing cartridges before upload
b2c code deploy --delete

# Delete and reload
b2c code deploy --delete --reload

# Using environment variables
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_CODE_VERSION=v1
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-access-key
b2c code deploy
```

### Cartridge Discovery

Cartridges are discovered by searching for `.project` files (Eclipse project markers commonly used in SFCC development). The directory containing the `.project` file is considered a cartridge.

### Authentication

This command requires both WebDAV and OAuth authentication:

- **WebDAV** (for file upload): Basic Auth (`--username`/`--password`) or OAuth
- **OAuth** (for code version reload): `--client-id` and `--client-secret`

Basic authentication is recommended for WebDAV operations due to better performance.

---

## b2c code activate

Activate a code version on a B2C Commerce instance, or reload the current active version.

### Usage

```bash
b2c code activate [CODEVERSION]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CODEVERSION` | Code version ID to activate | No (required unless `--reload`) |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--reload`, `-r` | Reload the code version (toggle activation to force reload) | `false` |

### Examples

```bash
# Activate a specific code version
b2c code activate v2 --server my-sandbox.demandware.net

# Reload the current active code version (forces code refresh)
b2c code activate --reload

# Reload a specific code version
b2c code activate v1 --reload

# Using --code-version flag instead of argument
b2c code activate --code-version v2
```

### Reload vs Activate

- **Activate**: Sets the specified code version as the active version
- **Reload**: Forces the instance to reload the code by temporarily activating a different version, then re-activating the target version

Use `--reload` when you've made changes via WebDAV and need the instance to pick up the changes without deploying again.

### Authentication

This command requires OAuth authentication. Provide `--client-id` and `--client-secret` or set the corresponding environment variables.

---

## b2c code delete

Delete a code version from a B2C Commerce instance.

### Usage

```bash
b2c code delete CODEVERSION
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CODEVERSION` | Code version ID to delete | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--force`, `-f` | Skip confirmation prompt | `false` |

### Examples

```bash
# Delete a code version (with confirmation prompt)
b2c code delete old-version --server my-sandbox.demandware.net

# Delete without confirmation
b2c code delete old-version --force
```

### Notes

- You cannot delete the currently active code version
- The command will prompt for confirmation unless `--force` is used

### Authentication

This command requires OAuth authentication. Provide `--client-id` and `--client-secret` or set the corresponding environment variables.

---

## b2c code watch

Watch cartridge directories and automatically upload changes to a B2C Commerce instance.

This command monitors cartridge files for changes and uploads them in real-time, making it ideal for development workflows.

### Usage

```bash
b2c code watch [CARTRIDGEPATH]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `CARTRIDGEPATH` | Path to search for cartridges | `.` (current directory) |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description |
|------|-------------|
| `--cartridge`, `-c` | Include specific cartridge(s) (can be repeated) |
| `--exclude-cartridge`, `-x` | Exclude specific cartridge(s) (can be repeated) |

### Examples

```bash
# Watch all cartridges in current directory
b2c code watch --server my-sandbox.demandware.net --code-version v1

# Watch cartridges in a specific directory
b2c code watch ./my-project

# Watch only specific cartridges
b2c code watch -c app_storefront_base -c plugin_applepay

# Exclude certain cartridges from watching
b2c code watch -x test_cartridge

# Using environment variables
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_CODE_VERSION=v1
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-access-key
b2c code watch
```

### Behavior

- **File changes** (`add`, `change`): Batched and uploaded as a zip archive
- **File deletions** (`unlink`): Deleted from the remote server
- **Debouncing**: Rapid changes are batched together (default 100ms delay)
- **Error handling**: Continues watching after upload errors with rate limiting

Press `Ctrl+C` to stop watching.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SFCC_UPLOAD_DEBOUNCE_TIME` | Debounce time in milliseconds (default: 100) |

### Authentication

This command requires both WebDAV and OAuth authentication:

- **WebDAV** (for file upload): Basic Auth (`--username`/`--password`) or OAuth
- **OAuth** (for determining active code version): `--client-id` and `--client-secret`

Basic authentication is recommended for WebDAV operations due to better performance.
