---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Create or update Page Designer pages on an instance with `b2c content push`, without a site archive import, validated against the page and component types deployed to the site, and inspect those types with `b2c content types list` and `get`. `b2c content validate --page` checks page bodies against local cartridge types. These commands use the SCAPI Experiences API (`sfcc.experiences.rw` scope); existing content commands work without it.
