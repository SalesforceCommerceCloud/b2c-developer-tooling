---
'b2c-vs-extension': minor
---

Added the Endpoints view: controller endpoints (SFRA and SiteGenesis) with the middleware and route event listeners that run for each across the cartridge path, Custom APIs with their schema operations and implementations, and hooks in cartridge path order, with warnings for missing CSRF checks, `server.replace()` overrides that drop security middleware, and system hooks that can skip later registrations. The Cartridges view now shows each cartridge's controllers and route statements, hooks with their place in the run order, and Custom APIs, and combines Job Steps and Custom Step Types into Custom Job Steps. Hooks and job steps open the function that runs, and Open Registration jumps to their `hooks.json` or `steptypes.json` entry. Controller files show each endpoint's summary above its route statement, with a link to it in the Endpoints view. Custom APIs can be opened in the API Browser.
