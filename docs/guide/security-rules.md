---
description: Reference for the rules that b2c security scan runs on B2C Commerce cartridge code, with examples and fixes for each.
---

# Security Rules

The rules that [`b2c security scan`](../cli/security.md#b2c-security-scan) runs. List them with `b2c security rules`. To suppress a finding, add `// b2c-dx-disable-next-line <rule-id>` on the line before it.

Route rules understand SFRA (`server.get`/`post`/`use`, and `server.extend` with `append`, `prepend`, and `replace` across the cartridge path) and SiteGenesis (`guard.ensure` filters). The scanner builds a project index of every cartridge under the scan root, so a rule can tell, for example, that an overlay cartridge prepends a CSRF check to a base route.

| Rule                                                              | Severity | Finds                                                    |
| ----------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| [`dynamic-code`](#dynamic-code)                                   | high     | `eval`, `new Function`, `require` with a computed path   |
| [`file-path-from-request`](#file-path-from-request)               | high     | File paths and upload names chosen by the client         |
| [`get-mutates-state`](#get-mutates-state)                         | medium   | GET routes that store request input in a transaction     |
| [`hardcoded-credentials`](#hardcoded-credentials)                 | high     | Passwords, API keys, and auth headers written into code  |
| [`insecure-cookie`](#insecure-cookie)                             | low      | Cookies without the Secure and HttpOnly flags            |
| [`mass-assignment`](#mass-assignment)                             | high     | Request fields copied into persistent objects by key     |
| [`object-query-injection`](#object-query-injection)               | high     | Object query strings built by concatenation              |
| [`open-redirect`](#open-redirect)                                 | medium   | Redirects to a host chosen through the request           |
| [`pii-in-logs`](#pii-in-logs)                                     | medium   | Personal or payment data written to logs                 |
| [`sfra-post-without-csrf`](#sfra-post-without-csrf)               | high     | SFRA POST routes without a CSRF token check              |
| [`sfra-replace-drops-middleware`](#sfra-replace-drops-middleware) | high     | `server.replace()` dropping security middleware          |
| [`sg-post-without-csrf`](#sg-post-without-csrf)                   | high     | SiteGenesis POST actions without the `csrf` filter       |
| [`weak-crypto`](#weak-crypto)                                     | medium   | `dw.crypto` Weak\* classes, MD5/SHA-1, DES/RC4, ECB mode |

## dynamic-code

**Severity:** high · **Confidence:** high · **CWE:** CWE-95

Finds code that is built or loaded from strings at runtime: `eval()`, `Function()` or `new Function()`, and `require()` or `importScript()` with a computed path. A computed path with a fixed directory prefix, such as `require('*/cartridge/experience/' + type)`, is allowed unless the variable part comes from the request.

```js
// Finding
var helper = require(request.httpParameterMap.helper.stringValue);

// Fix: map known values to static requires
var HELPERS = {cart: require('*/cartridge/scripts/helpers/cartHelpers')};
var helper = HELPERS[name];
```

## file-path-from-request

**Severity:** high · **Confidence:** medium · **CWE:** CWE-73, CWE-22, CWE-434

Finds `dw.io.File` paths built from request input. That includes the three values the platform passes to the `HttpParameterMap.processMultipart()` callback (field name, content type, and original file name), which all come from the client, as well as `req.querystring`, `req.form`, and `request.httpParameterMap` values used anywhere in a path.

When the callback returns a `File` that already exists, the platform deletes it and stores the upload in its place. A client-chosen name lets an attacker overwrite other files in the target directory (for example, files that import jobs read from `IMPEX`), pick extensions and special characters, and probe for traversal. Outside uploads, a request-controlled path lets the client choose which file is read, renamed, or deleted. Cleaning the name with `replace()` still leaves the choice of name to the client, so it is still reported.

```js
// Finding
request.httpParameterMap.processMultipart(function (field, contentType, fileName) {
  return new File(File.IMPEX + '/src/upload/' + fileName);
});

// Fix: return a directory so the platform generates a unique name...
var dir = new File(File.TEMP + '/uploads');
request.httpParameterMap.processMultipart(function () {
  return dir;
});

// ...or generate the name and take the extension from an allowlist
var EXTENSIONS = {'image/png': 'png', 'image/jpeg': 'jpg'};
request.httpParameterMap.processMultipart(function (field, contentType) {
  var ext = EXTENSIONS[contentType];
  if (field !== 'attachment' || !ext) return null;
  return new File(File.TEMP + '/uploads/' + UUIDUtils.createUUID() + '.' + ext);
});
```

Returning `null` from the callback skips a part, so check the field name and content type and skip anything you don't expect.

## get-mutates-state

**Severity:** medium · **Confidence:** medium · **CWE:** CWE-352, CWE-650

Finds GET routes (SFRA `server.get`, SiteGenesis actions with the `get` filter) that write request input inside `Transaction.wrap()` or after `Transaction.begin()`: an assignment of a request value, or a `set*`, `create*`, `remove*`, `delete*`, `add*`, or `update*` call with one. GET requests carry no CSRF token, so another site can make the change by linking to the URL or loading it in an image. Routes that check a CSRF token (a token passed as a query parameter) are not reported, and recalculating a basket without request input is fine.

```js
// Finding
server.get('AddCoupon', function (req, res, next) {
  Transaction.wrap(function () {
    basket.createCouponLineItem(req.querystring.couponCode, true);
  });
  next();
});

// Fix: accept POST and check the token
server.post('AddCoupon', csrfProtection.validateAjaxRequest, function (req, res, next) {
  Transaction.wrap(function () {
    basket.createCouponLineItem(req.form.couponCode, true);
  });
  next();
});
```

## hardcoded-credentials

**Severity:** high · **Confidence:** medium · **CWE:** CWE-798

Finds credentials written into code: literal values assigned to names ending in `password`, `secret`, `apiKey`, `accessToken`, `privateKey`, and similar; the user and password arguments of `HTTPClient.open()`; and literal `Authorization` or API key headers. Placeholders, empty strings, and dotted preference IDs are ignored.

```js
// Finding
client.setRequestHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9abc');

// Fix: keep credentials in a service credential and read it in the service callback
var service = LocalServiceRegistry.createService('payment.http', {
  createRequest: function (svc, args) {
    var credential = svc.configuration.credential;
    svc.addHeader('Authorization', 'Bearer ' + credential.password);
    return args;
  },
});
```

Rotate any credential that was committed, even after you remove it.

## insecure-cookie

**Severity:** low · **Confidence:** medium · **CWE:** CWE-614, CWE-1004

Finds `dw.web.Cookie` objects that are created without both `setSecure(true)` and `setHttpOnly(true)` (or the `secure` and `httpOnly` properties) in the same file. Cookies being deleted with `setMaxAge(0)` are ignored.

```js
// Fix
var cookie = new Cookie('remember', value);
cookie.setSecure(true);
cookie.setHttpOnly(true); // leave off only for cookies that client-side script must read
response.addHttpCookie(cookie);
```

## mass-assignment

**Severity:** high · **Confidence:** medium · **CWE:** CWE-915

Finds request input copied into persistent objects with property names the client chooses: loops over `req.form`, `request.httpParameterMap`, or `Object.keys()`/`Object.entries()` of them that assign `obj.custom[key]`; computed keys taken directly from the request; and `Object.assign()` of request input into a custom attributes object, profile, customer, order, basket, address, or line item. The client can then set any attribute, including ones that control discounts, roles, or loyalty status.

```js
// Finding
Object.keys(req.form).forEach(function (key) {
  profile.custom[key] = req.form[key];
});

// Fix: copy only the fields you expect
profile.custom.newsletter = req.form.newsletter === 'true';
```

## object-query-injection

**Severity:** high · **Confidence:** medium · **CWE:** CWE-943

Finds query strings for `CustomObjectMgr`, `SystemObjectMgr`, `OrderMgr`, and `CustomerMgr` query and search methods that are built by concatenation, template literals, or `.concat()`, including through a local variable. Concatenated values can change the meaning of the query.

```js
// Finding
CustomObjectMgr.queryCustomObject('Subscription', "custom.email = '" + email + "'");

// Fix: use placeholders and pass values as arguments
CustomObjectMgr.queryCustomObject('Subscription', 'custom.email = {0}', email);
```

## open-redirect

**Severity:** medium · **Confidence:** medium · **CWE:** CWE-601

Finds `res.redirect()` and `response.redirect()` calls whose destination host can be chosen through request parameters, headers, or form fields. Appending request values after a fixed origin, path, or `?` is fine, as is a value that the code checks in a condition (for example `allowed.test(url)`) before redirecting.

```js
// Finding
res.redirect(req.querystring.returnUrl);

// Fix: redirect only to known destinations
var target = req.querystring.returnUrl;
res.redirect(isAllowedRedirect(target) ? target : URLUtils.url('Home-Show').toString());
```

## pii-in-logs

**Severity:** medium · **Confidence:** low · **CWE:** CWE-532

Finds `dw.system.Logger` calls (including loggers from `Logger.getLogger()`) whose arguments include personal or payment data: properties such as `email`, `phone`, `firstName`, `lastName`, `address1`, `postalCode`, `birthday`, `password`, or `creditCardNumber`, or whole customer, profile, address, payment instrument, order, or basket objects passed to `JSON.stringify()`. Log files are readable by anyone with Business Manager log access. Confidence is low: check whether the value is really personal data.

```js
// Finding
Logger.info('Customer login {0}', customer.profile.email);

// Fix: log an identifier
Logger.info('Customer login {0}', customer.profile.customerNo);
```

## sfra-post-without-csrf

**Severity:** high · **Confidence:** medium · **CWE:** CWE-352

Finds SFRA routes that accept POST without checking a CSRF token: `server.post()` routes, and `server.use()` or `server.replace()` routes (which accept any method) that read `req.form`, when neither the route's middleware (`csrfProtection.validateRequest` or `validateAjaxRequest`) nor its handler (`CSRFProtection.validateRequest()`) checks the token. With the project index, a check that an overlay cartridge prepends counts, and routes that a later cartridge replaces are judged by the replacement.

```js
// Finding
server.post('Subscribe', server.middleware.https, function (req, res, next) { ... });

// Fix
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
server.post('Subscribe', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) { ... });
```

To fix a route that SFRA's `app_storefront_base` defines, prepend the check from your own cartridge:

```js
server.extend(module.superModule);
server.prepend('AddProduct', csrfProtection.validateAjaxRequest);
```

Routes that only hand out a token (such as `CSRF-Generate`) or that are protected by a single-use token sent by email (such as a password reset confirmation) don't need the check; suppress them with a reason.

## sfra-replace-drops-middleware

**Severity:** high · **Confidence:** high · **CWE:** CWE-862, CWE-352

Finds `server.replace()` calls in overlay cartridges that drop security middleware the replaced route had: CSRF checks, login checks (`userLoggedIn.validateLoggedIn`, `validateLoggedInAjax`), `server.middleware.https`, or the GET/POST method restriction. `server.replace()` registers the new chain with `server.use()`, so a replaced `server.post()` route accepts GET too unless you add `server.middleware.post` back. This rule needs the project index, so it runs in `b2c security scan` but not when the rules run in ESLint or oxlint without one.

```js
// Finding: the base route had server.middleware.post, https, login, and CSRF checks
server.replace('SaveProfile', function (req, res, next) { ... });

// Fix: repeat the security middleware
server.replace(
    'SaveProfile',
    server.middleware.post,
    server.middleware.https,
    userLoggedIn.validateLoggedInAjax,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) { ... }
);
```

Where you only need to change the response, `server.append()` keeps the base chain.

## sg-post-without-csrf

**Severity:** high · **Confidence:** medium · **CWE:** CWE-352

Finds SiteGenesis controller actions exposed with `guard.ensure(['post', ...])` or `guard.httpsPost()` without the `csrf` filter, and actions with no method filter whose action function handles a form submission (`handleAction()`), unless the action calls `CSRFProtection.validateRequest()` itself. Actions limited to remote includes (`include` filter) are skipped.

```js
// Finding
exports.Submit = guard.ensure(['post', 'https'], submit);

// Fix
exports.Submit = guard.ensure(['post', 'https', 'csrf'], submit);
```

Include the CSRF token field (`dw.web.CSRFProtection.getTokenName()` and `generateToken()`) in the form that submits to the action.

## weak-crypto

**Severity:** medium · **Confidence:** high · **CWE:** CWE-327, CWE-328

Finds the deprecated `dw.crypto` Weak\* classes (`WeakCipher`, `WeakMac`, `WeakMessageDigest`, `WeakSignature`), MD5 and SHA-1 for `MessageDigest` and `Mac`, and DES, 3DES, RC2, RC4, Blowfish, or ECB-mode cipher transformations.

```js
// Finding
new Cipher().encrypt(value, key, 'AES/ECB/PKCS5Padding', null, 0);

// Fix
new Cipher().encrypt(value, key, 'AES/GCM/NoPadding', iv, 0);
```

Use the Weak\* classes only to interoperate with legacy systems that require them.
