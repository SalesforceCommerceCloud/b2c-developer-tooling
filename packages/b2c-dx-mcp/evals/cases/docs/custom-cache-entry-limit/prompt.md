---
description: Developer Center guide lookup (Custom Caches) for platform limits and edge-case behavior.
tags: [tier0, docs, devcenter, ablation]
max_turns: 10
---

I'm caching an external API response in a B2C Commerce custom cache with `Cache.get(key, loader)`. Some responses are large. What is the size limit for a single cache entry, and what exactly happens when the loader returns a value over that limit? Does it throw?
