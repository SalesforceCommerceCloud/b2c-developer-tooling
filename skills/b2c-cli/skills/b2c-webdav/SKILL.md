---
name: b2c-webdav
description: List, upload, download, and manage files on B2C Commerce instances via WebDAV with the b2c cli. Use when uploading to IMPEX directories, downloading files, managing files in cartridges/catalogs/static/temp folders, creating directories, or zipping/unzipping remote files. For log exploration and tailing, use b2c-logs instead.
---

# B2C WebDAV Skill

Use the `b2c` CLI plugin to perform WebDAV file operations on Salesforce B2C Commerce instances. This includes listing files, uploading, downloading, and managing files across different WebDAV roots.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli webdav ls`).

## WebDAV Roots

The `--root` flag specifies the WebDAV directory:
- `impex` (default) - Import/Export directory
- `temp` - Temporary files
- `cartridges` - Code cartridges
- `realmdata` - Realm data
- `catalogs` - Product catalogs
- `libraries` - Content libraries
- `static` - Static resources
- `logs` - Application logs
- `securitylogs` - Security logs

## Examples

### List Files

```bash
# list files in the default IMPEX root
b2c webdav ls

# list files in a specific path
b2c webdav ls src/instance

# list files in the cartridges root
b2c webdav ls --root=cartridges

# list files with JSON output
b2c webdav ls --root=impex --json
```

### Download Files

```bash
# download a file from IMPEX (default root)
b2c webdav get src/instance/export.zip

# download to a specific local path
b2c webdav get src/instance/export.zip -o ./downloads/export.zip

# download from a specific root
b2c webdav get customerror.log --root=logs

# output file content to stdout
b2c webdav get src/instance/data.xml -o -
```

### Upload Files

```bash
# upload a file to IMPEX
b2c webdav put ./local-file.zip src/instance/

# upload to a specific root
b2c webdav put ./my-cartridge.zip --root=cartridges
```

### Create Directories

```bash
# create a directory in IMPEX
b2c webdav mkdir src/instance/my-folder

# create a directory in a specific root
b2c webdav mkdir my-folder --root=temp
```

### Delete Files

```bash
# delete a file
b2c webdav rm src/instance/old-export.zip

# delete from a specific root
b2c webdav rm old-file.txt --root=temp
```

### Delete Cartridges

To delete cartridges from a code version, use the `cartridges` root with the path format `{code-version}/{cartridge-name}`:

```bash
# delete a cartridge from a code version
b2c webdav rm v25_1_0/app_mysite --root=cartridges

# delete multiple cartridges
b2c webdav rm v25_1_0/app_mysite --root=cartridges
b2c webdav rm v25_1_0/int_myintegration --root=cartridges

# list cartridges in a code version first
b2c webdav ls v25_1_0 --root=cartridges
```

**Important:** The path is `{code-version}/{cartridge-name}`, not `/cartridges/{code-version}/...`. The `--root=cartridges` (or `-r cartridges`) flag sets the WebDAV root.

### Zip/Unzip Remote Files

```bash
# create a zip archive of a remote directory
b2c webdav zip src/instance/my-folder

# extract a remote zip archive
b2c webdav unzip src/instance/archive.zip
```

### More Commands

See `b2c webdav --help` for a full list of available commands and options in the `webdav` topic.

## Related Skills

- `b2c-cli:b2c-logs` - Filtered log retrieval, search, and real-time tailing (preferred for log exploration)
- `b2c-cli:b2c-code` - Higher-level code deployment (preferred for cartridge upload)
- `b2c-cli:b2c-job` - Import/export site archives
