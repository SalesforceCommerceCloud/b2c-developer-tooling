---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Script API reference content is now read online (from developer.salesforce.com) instead of shipping in the package, reducing the installed SDK/CLI size by ~6 MB. Documentation search is unchanged and still works offline from the bundled index; only `docs read` for a `dw.*` class now fetches its content.

To keep reads fast, fetched documentation content (Script API, Developer Center guides, and Salesforce Help) is cached locally — in memory for the session and on disk (under the CLI cache dir) for 7 days — so repeated reads avoid the network. A new `b2c docs cache` command shows the cache location and size, and `b2c docs cache --clear` empties it. When a fetch fails, `docs read` falls back to the indexed summary and prints both the article URL and the raw markdown URL so you can retrieve the page yourself.
