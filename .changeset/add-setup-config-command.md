---
'@salesforce/b2c-cli': minor
---

Add `setup config` command to display resolved configuration with source tracking.

Shows all configuration values organized by category (Instance, Authentication, SCAPI, MRT) and indicates which source file or environment variable provided each value. Sensitive values are masked by default; use `--unmask` to reveal them.
