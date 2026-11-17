---
type: regex
# Names the overlay that serves the route, that it replaced (overrode) the base route, and the lost CSRF check.
pattern: '^(?=[\s\S]*app_custom)(?=[\s\S]*(?:replace|overrid))(?=[\s\S]*(?:csrf|cross-site request forgery))'
flags: i
---
