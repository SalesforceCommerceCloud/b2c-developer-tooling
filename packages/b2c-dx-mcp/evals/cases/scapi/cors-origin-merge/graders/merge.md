---
type: llm
---

PASS if the response says the CORS preferences write (PUT, `updateCorsPreferences`) replaces all existing client origins for the site, and plans to read the current preferences first and send them back merged with the new origin (or names the `builtin/cors-preferences-update` snippet, which does that).
FAIL if the response proposes a PUT containing only the new origin, does not mention reading the current configuration first, or claims a change was made.
