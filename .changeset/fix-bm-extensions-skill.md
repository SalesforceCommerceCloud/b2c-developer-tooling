---
'@salesforce/b2c-agent-plugins': patch
---

Fix the Business Manager extensions skill (`b2c-business-manager-extensions`) to match the authoritative `bmext.xsd` schema. The previous guidance used the wrong namespace and element shapes (resource-key `name`/`icon` attributes, `xp-ref`, a `bm_extensions.properties` bundle) that would not load on a real instance. The skill now documents the `bmmodules/2007-12-11` schema with inline localized `name`/`description` elements, correct `dialogaction`/`formextension` structures, the `NoPermissionCheck` idiom for permission-free endpoints, ascending `position` ordering, and the core BM menu-id table for attaching to existing menus. All XML examples validate against the schema.
