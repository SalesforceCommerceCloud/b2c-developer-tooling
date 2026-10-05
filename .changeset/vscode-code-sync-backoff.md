---
'b2c-vs-extension': patch
---

Code Sync no longer retries failed uploads every 5 seconds forever. Authentication failures (401/403) pause sync with a single warning until the next save or **Retry**, other failures back off up to 5 minutes, and failed deletes are no longer dropped. After a configuration change (such as fixing credentials in `.env`), changes that failed are retried with the new configuration.
