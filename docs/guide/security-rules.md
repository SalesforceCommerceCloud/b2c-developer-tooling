---
description: Reference for the rules that b2c security scan runs on B2C Commerce cartridge code, with examples and fixes for each.
---

# Security Rules

The rules that [`b2c security scan`](../cli/security.md#b2c-security-scan) runs. List them with `b2c security rules`. To suppress a finding, add `// b2c-dx-disable-next-line <rule-id>` on the line before it.

| Rule                                                | Severity | Finds                                                    |
| --------------------------------------------------- | -------- | -------------------------------------------------------- |
| [`dynamic-code`](#dynamic-code)                     | high     | `eval`, `new Function`, `require` with a computed path   |
| [`file-path-from-request`](#file-path-from-request) | high     | File paths and upload names chosen by the client         |
| [`hardcoded-credentials`](#hardcoded-credentials)   | high     | Passwords, API keys, and auth headers written into code  |
| [`insecure-cookie`](#insecure-cookie)               | low      | Cookies without the Secure and HttpOnly flags            |
| [`object-query-injection`](#object-query-injection) | high     | Object query strings built by concatenation              |
| [`open-redirect`](#open-redirect)                   | medium   | Redirects to a host chosen through the request           |
| [`weak-crypto`](#weak-crypto)                       | medium   | `dw.crypto` Weak\* classes, MD5/SHA-1, DES/RC4, ECB mode |

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
