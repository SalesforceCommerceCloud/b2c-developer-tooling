---
'@salesforce/b2c-agent-plugins': minor
---

Add the `sfnext-site-audit` skill to the `storefront-next` plugin. It runs a pre-launch audit of a deployed Storefront Next storefront with the `sfnext audit` commands (in `@salesforce/storefront-next-dev` 1.4.1 and later): it measures the home, category and product pages, checks performance, SEO, security and best-practice rules against the evidence and the project source, and shows a launch-readiness report in a local dashboard. The `sfnext-overview` router and the `sfnext-deployment` pre-launch checklist point to it.
