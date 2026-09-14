# Instance files and cartridge uploads

No prerequisite skill read. Reuse the task's project/instance; inspect masked
configuration only if the target or access is unclear.

| Need | Preferred tool | Alternative |
| --- | --- | --- |
| Directory entries, file sizes | `webdav_list` with path/offset/limit | CLI `b2c webdav ls` |
| Exact log/text, including unparsed job logs | `webdav_get` with path/offset/maxBytes | Recent/filter/watch needs: existing `logs_*` tools |
| Whole file, including binary archives | `webdav_get` with a new `outputPath` | CLI `b2c webdav get` |
| Upload text or an existing local file | `webdav_put` with `content` or `sourcePath` | CLI `b2c webdav put` |
| Selected local cartridge files | `cartridge_deploy` with `files` and `codeVersion` | Whole cartridge: omit `files` |

Paths are WebDAV Sites-relative: `Logs/jobs/run.log`, `Impex/src/data.zip`,
`Cartridges/version/app/cartridge/scripts/file.js`. Returned `/Sites/LOGS/...`
job paths are accepted. List one directory; listing does not recurse.

Text reads fetch at most `maxBytes` (default 4000, maximum 8000). `size` is total
file bytes; reuse `nextOffset` to preserve UTF-8 boundaries. Null means end.
Files can grow/rotate; compare returned size/ETag/lastModified when consistency
matters. For recent errors or continuous activity, prefer the log tools.
Binary reads require `outputPath`; transfers are limited to 64 MiB.
Local paths refer to the MCP host and resolve from `projectDirectory`.
Downloads never replace existing local files. Upload parents must exist;
replacement requires `overwrite: true` and user intent. No automatic deletion.

Cartridge `files` resolve from `projectDirectory`, within cartridges discovered
under `cartridgeDirectory`. Include/exclude filters still apply. Maximum 100
files / 64 MiB total; matching remote files are overwritten, other files remain.
No reload unless requested. Reload can activate another version briefly, then
the target. Preserve uploaded-file results and warnings; do not redeploy merely
because reload or temporary-archive cleanup failed.

SDK authentication, installed middleware, and Safety Mode apply to remote requests.
Keep path/HTTP errors distinct from an empty directory or healthy job.
For mkdir, recursive transfers, delete, ZIP/UNZIP, use the CLI WebDAV skill only
when needed: `skill://b2c-cli/b2c-webdav/SKILL.md`.
