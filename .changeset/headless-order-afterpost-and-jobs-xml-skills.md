---
'@salesforce/b2c-agent-plugins': patch
---

Document headless order-failure essentials in the `b2c` agent skills. The `b2c-hooks` skill now explains the `dw.ocapi.shop.order.afterPOST` hook in depth — it runs inside a platform transaction (so wrapping `OrderMgr.placeOrder`/`failOrder` in your own `Transaction.wrap` rolls the change back and surfaces an opaque `HTTP 400: An error occurred in ExtensionPoint…`), it owns the `CREATED → NEW`/`FAILED` transition for SCAPI orders, and it must log its own decline reason — plus a canonical example that authorizes payment instruments via `app.payment.processor.*` Authorize hooks, fails the order on decline, and places it when fully paid. `b2c-custom-job-steps` gains a `jobs.xml` reference covering how to author and import (`b2c job import`) a job definition (job/flow/step structure, the `type` vs `@type-id` distinction, and the required `<triggers>` element).
