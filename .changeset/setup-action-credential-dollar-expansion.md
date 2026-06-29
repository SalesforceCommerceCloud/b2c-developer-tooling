---
'@salesforce/b2c-dx-docs': patch
---

Fix the `setup` GitHub Action silently corrupting any credential that contains a `$` (for example an auto-generated WebDAV access key like `abc$FOO123`). The action wrote credentials to the job environment with an inline-interpolated `echo`, so bash re-expanded `$WORD` sequences and stripped them — the altered credential then failed downstream WebDAV auth with an unexplained 401. Credentials are now passed through the step's `env` block and written with GitHub's heredoc env syntax, so values containing `$`, quotes, backticks, `$(...)`, `=`, or even newlines reach the CLI byte-for-byte. No workflow changes are required; re-run with the fixed action version.
