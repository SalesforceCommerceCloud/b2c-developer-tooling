---
name: b2c-webdav
description: Salesforce B2C Commerce WebDAV file operations (listing, upload, download, logs) Skill
---

# B2C WebDAV Skill

Use the `b2c` CLI plugin to perform WebDAV file operations on Salesforce B2C Commerce instances. This includes listing files, uploading, downloading, and managing files across different WebDAV roots.

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

### Reading Log Files

Use the `logs` root to access instance log files:

```bash
# list all log files
b2c webdav ls --root=logs

# list log files with JSON output for parsing
b2c webdav ls --root=logs --json

# download a specific log file (e.g., customerror log)
b2c webdav get customerror.log --root=logs

# download a log file to a specific local path
b2c webdav get error-20240115.log --root=logs -o ./downloads/error.log

# output log file content to stdout (for piping to grep, etc.)
b2c webdav get customerror.log --root=logs -o -

# pipe log content to grep to search for errors
b2c webdav get customerror.log --root=logs -o - | grep "ERROR"

# download security logs
b2c webdav ls --root=securitylogs
b2c webdav get security-20240115.log --root=securitylogs
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

### Zip/Unzip Remote Files

```bash
# create a zip archive of a remote directory
b2c webdav zip src/instance/my-folder

# extract a remote zip archive
b2c webdav unzip src/instance/archive.zip
```

### More Commands

See `b2c webdav --help` for a full list of available commands and options in the `webdav` topic.
