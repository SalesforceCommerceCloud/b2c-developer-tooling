---
'@salesforce/b2c-agent-plugins': minor
---

Added a new `b2c-bm-users-roles` skill covering all `b2c bm` instance commands — `bm roles`, `bm users`, `bm whoami`, and `bm access-key`. The existing `b2c-am` skill now defers to it for Business Manager content and stays focused on Account Manager (cross-instance) administration.
