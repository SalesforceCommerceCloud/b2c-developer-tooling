---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Expand the curated CIP analytics report catalog with 16 new pre-built reports, with a focus on technical/developer analytics. New reports include SCAPI traffic & latency, SCAPI error rate by status class, SCAPI latency distribution (slow-tail/SLA percentage from the response-time histogram), SCAPI cache hit ratio, OCAPI usage by client, SFRA controller health scorecard, controller error-rate trend, and remote-include performance — plus revenue-by-channel, new-vs-returning buyer revenue, discount-depth breakdown, promotion ROI leaderboard, recommender effectiveness, zero-result searches, checkout funnel drop-off, and inventory stockout by location.

Also adds `b2c cip report list` to discover the catalog grouped by category (no credentials required), and report parameters now support enum (`--status-class 4xx|5xx`) and default values. Run `b2c cip report <name> --describe` to see each report's flags.
