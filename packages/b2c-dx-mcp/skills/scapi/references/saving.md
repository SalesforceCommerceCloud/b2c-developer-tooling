# Save a reusable workflow

Save only on user request with `scapi_snippet_save` and a completed `executionId`
(last 50, current server). Verify the outcome first. Use `async (input)` and the
tool's `input` for variable values; source must contain no credentials. Saving
retains source/metadata only. No overwrite; choose a new name. Never replay writes
to recover an expired execution. Saved code may reference other named snippets;
those must still exist. Existing snippets remain runnable after restart.

Declare an accurate read/write/destructive effect and JSON input schema.
After saving, describe the named snippet to confirm its source. Discovery and
execution remain available when scapi_snippet_save is excluded from the catalog.
