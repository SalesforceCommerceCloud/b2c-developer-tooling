---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Set up two-factor (mTLS) code upload for Hyperforce staging in one step: `b2c ecdn mtls setup` generates and uploads your CA, issues your client certificate, and configures `dw.json`, and you can issue more certificates for teammates and CI pipelines. See the new Hyperforce guide for the full workflow.
