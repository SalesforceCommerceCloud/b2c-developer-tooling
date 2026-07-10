---
'b2c-vs-extension': patch
---

Gate the developer onboarding walkthrough behind a new `b2c-dx.features.onboarding` setting (Preview, off by default). The guided walkthrough, role-based deep-dive panel, and their palette commands no longer appear — and the walkthrough no longer auto-opens on first activation — unless the setting is enabled. Set `b2c-dx.features.onboarding` to `true` to opt in while the feature is still in development.
