---
type: llm
---

Ground truth (ImportCatalog job step reference):

- `NoFilesFoundHandling` (default `NO_FILES_FOUND`) should be set to `ERROR` so a missing file fails the step.
- `ImportFailedHandling` (default `WARN`) should be set to `ERROR` so a failed import fails the step.
- `WorkingFolder` is relative to `IMPEX/src/`, so it should be `catalog` (not the full `IMPEX/src/catalog/` path). `FileNamePattern` optionally selects files by regex.
- `AfterImportFileHandling` (default `Archive`) is not performed when `ImportFailedHandling` is `ERROR` and the file failed to validate, so a malformed file is not archived in that configuration; it stays in the working folder.

PASS if the response sets both handling parameters to ERROR, configures the working folder relative to IMPEX/src/, and says a malformed file is not archived (left in place) when ImportFailedHandling is ERROR.
FAIL if it invents parameter names or values, gives the full IMPEX path as the working folder value, or says the malformed file will still be archived.
