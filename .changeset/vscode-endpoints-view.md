---
'b2c-vs-extension': minor
---

Added the Endpoints view: controller endpoints (SFRA and SiteGenesis) with the middleware that runs for each across the cartridge path, Custom APIs with their schema operations and implementations, and hooks in cartridge path order, with warnings for missing CSRF checks, `server.replace()` overrides that drop security middleware, and system hooks that can skip later registrations. The Cartridges view now lists each cartridge's controllers and route statements.
