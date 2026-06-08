---
id: services
title: Service Framework
category: integration
tags: [service, http, webservice, ftp, integration, callout]
---

The Service Framework wraps outbound calls (HTTP, SOAP, FTP, generic) so
storefront and job code can rely on shared timeouts, circuit breakers, and
profile-based monitoring.

## Where to manage

- Service definitions: `Administration > Operations > Services`
- Profiles, credentials, and circuit-breaker config: same screen, separate tabs.

## Three building blocks

1. **Profile** — timeout, circuit breaker, rate limit settings.
2. **Credential** — endpoint URL plus optional username/password/cert.
3. **Service** — bound to a profile and a credential, identified by a stable
   service ID.

## Calling from script

```javascript
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var service = LocalServiceRegistry.createService('my.external.api', {
  createRequest: function (svc, body) {
    svc.setRequestMethod('POST');
    svc.addHeader('Content-Type', 'application/json');
    return JSON.stringify(body);
  },
  parseResponse: function (svc, client) {
    return JSON.parse(client.text);
  },
  filterLogMessage: function (message) {
    return message.replace(/"password":"[^"]+"/g, '"password":"***"');
  }
});

var result = service.call({foo: 'bar'});
if (result.ok) {
  // result.object is whatever parseResponse returned
}
```

## Tips

- Always implement `filterLogMessage` to redact secrets from communication logs.
- Watch the **circuit breaker** counters — flapping services indicate the
  remote endpoint is unhealthy and the breaker is protecting you.
- Use `LocalServiceRegistry` (per-request) over `ServiceRegistry` (legacy
  global) for new code.
