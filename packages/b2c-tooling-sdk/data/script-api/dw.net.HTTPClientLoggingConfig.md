<!-- prettier-ignore-start -->
# Class HTTPClientLoggingConfig

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md)

Script API for configuring HTTP client logging and sensitive data redaction.


This class provides a customer-facing interface for configuring HTTP client logging behavior, including
enabling/disabling logging, setting log levels, and defining sensitive fields that should be redacted from HTTP
request and response bodies.


**Security Note:** This class handles sensitive security-related data and logging
configuration. Pay special attention to PCI DSS requirements when configuring sensitive field redaction to ensure
proper data protection.
Sensitive Fields of appropriate types MUST be set else logging will be skipped.


**Usage Example:**

```
var config = new dw.net.HTTPClientLoggingConfig();
// Enable logging and set level
config.setEnabled(true);
config.setLevel("INFO");
// Configure sensitive JSON fields
config.setSensitiveJsonFields(["password", "creditCard", "ssn"]);
// Configure sensitive XML fields
config.setSensitiveXmlFields(["password", "creditCard", "ssn"]);
// Configure sensitive headers
config.setSensitiveHeaders(["authorization", "x-api-key", "cookie"]);
// Configure sensitive body fields (for form data)
config.setSensitiveBodyFields(["password", "creditCard", "ssn"]);
// Configure text patterns for plain text/HTML content
config.setSensitiveTextPatterns([["password\\s*=\\s*[^\\s&]+"]]);
```



**Content Type Support:**

- **JSON:**Use setSensitiveJsonFields() to specify field names to redact
- **XML:**Use setSensitiveXmlFields() to specify element/attribute names to redact
- **Form Data:**Use setSensitiveBodyFields() to specify parameter names to redact
- **Plain Text/HTML:**Use setSensitiveTextPatterns() to specify regex patterns
- **Binary/Multipart:**Entire body is automatically treated as sensitive



## Property Summary

| Property | Description |
| --- | --- |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) | Gets whether HTTP client logging is enabled. |
| [level](#level): [String](TopLevel.String.md) | Gets the current log level for HTTP client logging. |
| [sensitiveBodyFields](#sensitivebodyfields): [String\[\]](TopLevel.String.md) | Gets the sensitive body fields configured for form data redaction. |
| [sensitiveHeaders](#sensitiveheaders): [String\[\]](TopLevel.String.md) | Gets the sensitive headers configured for redaction. |
| [sensitiveJsonFields](#sensitivejsonfields): [String\[\]](TopLevel.String.md) | Gets the sensitive JSON fields configured for redaction. |
| [sensitiveXmlFields](#sensitivexmlfields): [String\[\]](TopLevel.String.md) | Gets the sensitive XML fields configured for redaction. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [HTTPClientLoggingConfig](#httpclientloggingconfig)() | Creates a new HTTPClientLoggingConfig instance. |

## Method Summary

| Method | Description |
| --- | --- |
| [getLevel](dw.net.HTTPClientLoggingConfig.md#getlevel)() | Gets the current log level for HTTP client logging. |
| [getSensitiveBodyFields](dw.net.HTTPClientLoggingConfig.md#getsensitivebodyfields)() | Gets the sensitive body fields configured for form data redaction. |
| [getSensitiveHeaders](dw.net.HTTPClientLoggingConfig.md#getsensitiveheaders)() | Gets the sensitive headers configured for redaction. |
| [getSensitiveJsonFields](dw.net.HTTPClientLoggingConfig.md#getsensitivejsonfields)() | Gets the sensitive JSON fields configured for redaction. |
| [getSensitiveXmlFields](dw.net.HTTPClientLoggingConfig.md#getsensitivexmlfields)() | Gets the sensitive XML fields configured for redaction. |
| [isEnabled](dw.net.HTTPClientLoggingConfig.md#isenabled)() | Gets whether HTTP client logging is enabled. |
| [setEnabled](dw.net.HTTPClientLoggingConfig.md#setenabledboolean)([Boolean](TopLevel.Boolean.md)) | Sets whether HTTP client logging is enabled. |
| [setLevel](dw.net.HTTPClientLoggingConfig.md#setlevelstring)([String](TopLevel.String.md)) | Sets the log level for HTTP client logging. |
| [setSensitiveBodyFields](dw.net.HTTPClientLoggingConfig.md#setsensitivebodyfieldsstring)([String\[\]](TopLevel.String.md)) | Sets the sensitive body fields that should be redacted from HTTP form data. |
| [setSensitiveHeaders](dw.net.HTTPClientLoggingConfig.md#setsensitiveheadersstring)([String\[\]](TopLevel.String.md)) | Sets the sensitive headers that should be redacted from HTTP requests/responses. |
| [setSensitiveJsonFields](dw.net.HTTPClientLoggingConfig.md#setsensitivejsonfieldsstring)([String\[\]](TopLevel.String.md)) | Sets the sensitive JSON fields that should be redacted from HTTP request/response bodies. |
| [setSensitiveTextPatterns](dw.net.HTTPClientLoggingConfig.md#setsensitivetextpatternsstring)([String\[\]](TopLevel.String.md)) | Sets the sensitive text patterns that should be redacted from HTTP request/response bodies. |
| [setSensitiveXmlFields](dw.net.HTTPClientLoggingConfig.md#setsensitivexmlfieldsstring)([String\[\]](TopLevel.String.md)) | Sets the sensitive XML fields that should be redacted from HTTP request/response bodies. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### enabled
- enabled: [Boolean](TopLevel.Boolean.md)
  - : Gets whether HTTP client logging is enabled.


---

### level
- level: [String](TopLevel.String.md)
  - : Gets the current log level for HTTP client logging.


---

### sensitiveBodyFields
- sensitiveBodyFields: [String\[\]](TopLevel.String.md)
  - : Gets the sensitive body fields configured for form data redaction.


---

### sensitiveHeaders
- sensitiveHeaders: [String\[\]](TopLevel.String.md)
  - : Gets the sensitive headers configured for redaction.


---

### sensitiveJsonFields
- sensitiveJsonFields: [String\[\]](TopLevel.String.md)
  - : Gets the sensitive JSON fields configured for redaction.


---

### sensitiveXmlFields
- sensitiveXmlFields: [String\[\]](TopLevel.String.md)
  - : Gets the sensitive XML fields configured for redaction.


---

## Constructor Details

### HTTPClientLoggingConfig()
- HTTPClientLoggingConfig()
  - : Creates a new HTTPClientLoggingConfig instance.
      
      
      The public constructor should only be called from JavaScript, but cfgAPI uses this constructor for creating the
      Service instance -> so fill the factory here



---

## Method Details

### getLevel()
- getLevel(): [String](TopLevel.String.md)
  - : Gets the current log level for HTTP client logging.

    **Returns:**
    - the log level as a string (DEBUG, INFO, WARN, ERROR)


---

### getSensitiveBodyFields()
- getSensitiveBodyFields(): [String\[\]](TopLevel.String.md)
  - : Gets the sensitive body fields configured for form data redaction.

    **Returns:**
    - an array of field names that will be redacted from form data


---

### getSensitiveHeaders()
- getSensitiveHeaders(): [String\[\]](TopLevel.String.md)
  - : Gets the sensitive headers configured for redaction.

    **Returns:**
    - an array of header names that will be redacted


---

### getSensitiveJsonFields()
- getSensitiveJsonFields(): [String\[\]](TopLevel.String.md)
  - : Gets the sensitive JSON fields configured for redaction.

    **Returns:**
    - an array of field names that will be redacted from JSON content


---

### getSensitiveXmlFields()
- getSensitiveXmlFields(): [String\[\]](TopLevel.String.md)
  - : Gets the sensitive XML fields configured for redaction.

    **Returns:**
    - an array of field names that will be redacted from XML content


---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Gets whether HTTP client logging is enabled.

    **Returns:**
    - true if logging is enabled, false otherwise


---

### setEnabled(Boolean)
- setEnabled(enabled: [Boolean](TopLevel.Boolean.md)): void
  - : Sets whether HTTP client logging is enabled.
      
      
      When enabled, HTTP requests and responses will be logged according to the configured log level and sensitive
      field redaction settings. When disabled, no HTTP logging will occur.


    **Parameters:**
    - enabled - true to enable logging, false to disable


---

### setLevel(String)
- setLevel(level: [String](TopLevel.String.md)): void
  - : Sets the log level for HTTP client logging.
      
      
      The log level determines the verbosity of HTTP logging output. Available levels:
      
      - **DEBUG:**Most verbose, includes detailed request/response information
      - **INFO:**Standard level, includes basic request/response details
      - **WARN:**Only logs warnings and errors
      - **ERROR:**Only logs errors


    **Parameters:**
    - level - the log level (DEBUG, INFO, WARN, ERROR). Case-insensitive.


---

### setSensitiveBodyFields(String[])
- setSensitiveBodyFields(fields: [String\[\]](TopLevel.String.md)): void
  - : Sets the sensitive body fields that should be redacted from HTTP form data.
      
      
      When HTTP requests or responses contain form data (application/x-www-form-urlencoded), any parameters matching
      the specified field names will be redacted with "\*\*\*\*FILTERED\*\*\*\*" in the logs.
      Sensitive Field MUST be set else logging will be skipped for form body type
      Setting with empty array will use default values \["name", "email", "email\_address", "ssn", "first\_name", "last\_name"\]
      
      
      **Example:**
      
      ```
      config.setSensitiveBodyFields(["fname", "creditCard", "ssn_last_4"]);
      ```


    **Parameters:**
    - fields - an array of field names to redact from form data


---

### setSensitiveHeaders(String[])
- setSensitiveHeaders(headers: [String\[\]](TopLevel.String.md)): void
  - : Sets the sensitive headers that should be redacted from HTTP requests/responses.
      
      
      Any HTTP headers matching the specified names will be redacted with "\*\*\*\*FILTERED\*\*\*\*" in the logs. This is useful for
      protecting sensitive authentication tokens, API keys, and session information.
      Sensitive Headers MUST be set else logging will be skipped for headers
      Setting the sensitive headers with empty array will use default values \["authorization", "cookie"\]
      
      
      **Example:**
      
      ```
      config.setSensitiveHeaders([ "x-api-key", "x-auth-token"]);
      config.setSensiviteHeaders([]);
      ```


    **Parameters:**
    - headers - an array of header names to redact


---

### setSensitiveJsonFields(String[])
- setSensitiveJsonFields(fields: [String\[\]](TopLevel.String.md)): void
  - : Sets the sensitive JSON fields that should be redacted from HTTP request/response bodies.
      
      
      When HTTP requests or responses contain JSON content, any fields matching the specified names will be redacted
      with "\*\*\*\*FILTERED\*\*\*\*" in the logs.
      Sensitive Field MUST be set else logging will be skipped for JSON body type
      Setting with empty array will use default values \["name", "email", "email\_address", "ssn", "first\_name", "last\_name", "password"\]
      
      
      **Example:**
      
      ```
      config.setSensitiveJsonFields(["password", "creditCard", "ssn"]);
      ```


    **Parameters:**
    - fields - an array of field names to redact from JSON content


---

### setSensitiveTextPatterns(String[])
- setSensitiveTextPatterns(patterns: [String\[\]](TopLevel.String.md)): void
  - : Sets the sensitive text patterns that should be redacted from HTTP request/response bodies.
      
      
      When HTTP requests or responses contain text content, any text matching the specified regex patterns will be
      redacted with "\*\*\*\*FILTERED\*\*\*\*" in the logs.
      
      
      **Example:**
      
      ```
      config.setSensitiveTextPatterns(["password", "credit.*card", "\\d{3}-\\d{2}-\\d{4}"]);
      ```


    **Parameters:**
    - patterns - an array of regex patterns to match and redact from text content


---

### setSensitiveXmlFields(String[])
- setSensitiveXmlFields(fields: [String\[\]](TopLevel.String.md)): void
  - : Sets the sensitive XML fields that should be redacted from HTTP request/response bodies.
      
      
      When HTTP requests or responses contain XML content, any elements or attributes matching the specified names will
      be redacted with "\*\*\*\*FILTERED\*\*\*\*" in the logs.
      Sensitive Field MUST be set else logging will be skipped for XML body type
      Setting with empty array will use default values \["name", "email", "email\_address", "ssn", "first\_name", "last\_name", "password"\]
      
      
      **Example:**
      
      ```
      config.setSensitiveXmlFields(["password", "creditCard", "ssn"]);
      ```


    **Parameters:**
    - fields - an array of element/attribute names to redact from XML content


---

<!-- prettier-ignore-end -->
