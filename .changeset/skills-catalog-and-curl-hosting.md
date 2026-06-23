---
'@salesforce/b2c-dx-docs': minor
---

Redesign the agent-skills docs: an interactive **skills catalog** (filter by persona, category, or tag; copy a ready-to-run `curl` command per skill or for all matches) on the Agent Skills page, and a new dedicated **Installing Skills** page for per-IDE setup detail. Every skill is now also hosted as raw, curl-able markdown with a machine-readable `skills-index.json` and an agent-friendly `skills.txt`, so cold agents and CI can fetch guidance without installing anything.
