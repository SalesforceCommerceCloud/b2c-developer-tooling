---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API IntelliSense now types `this` in SFRA middleware as the route, so the `req`/`res` of listeners registered with `this.on('route:BeforeComplete', function (req, res) {...})` get completions instead of `any`.
