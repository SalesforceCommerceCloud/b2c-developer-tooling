# File uploads and downloads (not in code mode)

Code mode sends JSON bodies and reads JSON or text. Operations with a multipart body or binary response are
marked `auth.executable: false` with `auth.unsupported` (also `unsupported` on `spec.search` matches), and
`scapi.request` refuses them with `SCAPI_TRANSFER_UNSUPPORTED` before sending anything.

Example: `site/seo/v1` `uploadCustomSitemapAndTriggerSitemapGeneration` (the API's only operation) takes a
multipart file, so custom sitemap upload cannot run here.

Split the work: run any JSON steps of the flow (submit, status, delete) in code mode and give the user the IDs
and status. Move the file with an HTTP client outside MCP using a token from CLI
`b2c auth token` with the operation's scopes and the tenant scope (the error lists the `--auth-scope` flags), or use
Business Manager. Never try another code-mode route.
