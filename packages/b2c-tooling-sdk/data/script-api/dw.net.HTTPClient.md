<!-- prettier-ignore-start -->
# Class HTTPClient

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.HTTPClient](dw.net.HTTPClient.md)

The HTTPClient class supports the HTTP methods GET, POST, HEAD, PUT, PATCH, OPTIONS, and DELETE.
If a secure connection via HTTPS is
established the used server certificate or the signing CAs certificate needs to be imported into the customer key
store via Business Manager. **Note:** when this class is used with sensitive data, be careful in persisting
sensitive information.

Key selection for mutual TLS:

1. Check if there is an explicit identity requested [setIdentity(KeyRef)](dw.net.HTTPClient.md#setidentitykeyref)
2. Else, Check if there is a mapping for hostname in the keystore
3. Deprecated: Select an arbitrary private key from the keystore




```

var httpClient = new HTTPClient();
var message;
httpClient.open('GET', 'http://www.myinstance.com/feed.xml');
httpClient.setTimeout(3000);
httpClient.send();
if (httpClient.statusCode == 200)
{
     message = httpClient.text;
}
else
{
    // error handling
    message = "An error occurred with status code "+httpClient.statusCode;
}
```



## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[DEFAULT_GET_FILE_SIZE](#default_get_file_size): [Number](TopLevel.Number.md) = 5242880~~ | The default size for `sendAndReceiveToFile()` returning a File is 5MB deprecated in favor of  MAX\_GET\_FILE\_SIZE |
| [MAX_GET_FILE_SIZE](#max_get_file_size): [Number](TopLevel.Number.md) = 209715200 | The maximum permitted size (in bytes) of an HTTP response when calling operations which write the response to  file. |
| [MAX_GET_MEM_SIZE](#max_get_mem_size): [Number](TopLevel.Number.md) = 10485760 | The maximum permitted size (in bytes) of an HTTP response when calling operations which store the response in  memory. |

## Property Summary

| Property | Description |
| --- | --- |
| ~~[allResponseHeaders](#allresponseheaders): [HashMap](dw.util.HashMap.md)~~ `(read-only)` | Returns all response headers as a map containing the name and value of the response header. |
| [allowRedirect](#allowredirect): [Boolean](TopLevel.Boolean.md) | Determines whether redirect handling is enabled. |
| [bytes](#bytes): [Bytes](dw.util.Bytes.md) `(read-only)` | Returns the bytes in the message body for HTTP status codes between 200 and 299. |
| [errorBytes](#errorbytes): [Bytes](dw.util.Bytes.md) `(read-only)` | Returns the returned message body as bytes for HTTP status code greater or equal to 400. |
| [errorText](#errortext): [String](TopLevel.String.md) `(read-only)` | Returns the returned message body as text for HTTP status code greater or equal to 400. |
| [hostNameVerification](#hostnameverification): [Boolean](TopLevel.Boolean.md) | Determines whether host name verification is enabled. |
| [identity](#identity): [KeyRef](dw.crypto.KeyRef.md) | Gets the identity used for mutual TLS (mTLS). |
| [loggingConfig](#loggingconfig): [HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md) | Gets the logging configuration for this HTTP client. |
| [responseHeaders](#responseheaders): [Map](dw.util.Map.md) `(read-only)` | Returns all response headers as a map in which each entry represents an individual header. |
| [statusCode](#statuscode): [Number](TopLevel.Number.md) `(read-only)` | Returns the status code of the last HTTP operation. |
| [statusMessage](#statusmessage): [String](TopLevel.String.md) `(read-only)` | Returns the message text of the last HTTP operation. |
| [text](#text): [String](TopLevel.String.md) `(read-only)` | Returns the returned message body as text for HTTP status codes between 200 and 299. |
| [timeout](#timeout): [Number](TopLevel.Number.md) | Returns the timeout for this client, in milliseconds. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [HTTPClient](#httpclient)() | Constructs the HTTPClient instance with the default configuration. |
| [HTTPClient](#httpclientobject)([Object](TopLevel.Object.md)) | Constructs the HTTPClient instance with the given configuration. |

## Method Summary

| Method | Description |
| --- | --- |
| [enableCaching](dw.net.HTTPClient.md#enablecachingnumber)([Number](TopLevel.Number.md)) | Calling this method enables caching for GET requests. |
| ~~[getAllResponseHeaders](dw.net.HTTPClient.md#getallresponseheaders)()~~ | Returns all response headers as a map containing the name and value of the response header. |
| [getAllowRedirect](dw.net.HTTPClient.md#getallowredirect)() | Determines whether redirect handling is enabled. |
| [getBytes](dw.net.HTTPClient.md#getbytes)() | Returns the bytes in the message body for HTTP status codes between 200 and 299. |
| [getErrorBytes](dw.net.HTTPClient.md#geterrorbytes)() | Returns the returned message body as bytes for HTTP status code greater or equal to 400. |
| [getErrorText](dw.net.HTTPClient.md#geterrortext)() | Returns the returned message body as text for HTTP status code greater or equal to 400. |
| [getHostNameVerification](dw.net.HTTPClient.md#gethostnameverification)() | Determines whether host name verification is enabled. |
| [getIdentity](dw.net.HTTPClient.md#getidentity)() | Gets the identity used for mutual TLS (mTLS). |
| [getLoggingConfig](dw.net.HTTPClient.md#getloggingconfig)() | Gets the logging configuration for this HTTP client. |
| [getResponseHeader](dw.net.HTTPClient.md#getresponseheaderstring)([String](TopLevel.String.md)) | Returns a specific response header from the last HTTP operation. |
| [getResponseHeaders](dw.net.HTTPClient.md#getresponseheaders)() | Returns all response headers as a map in which each entry represents an individual header. |
| [getResponseHeaders](dw.net.HTTPClient.md#getresponseheadersstring)([String](TopLevel.String.md)) | Returns all the values of a response header from the last HTTP operation as a list of strings. |
| [getStatusCode](dw.net.HTTPClient.md#getstatuscode)() | Returns the status code of the last HTTP operation. |
| [getStatusMessage](dw.net.HTTPClient.md#getstatusmessage)() | Returns the message text of the last HTTP operation. |
| [getText](dw.net.HTTPClient.md#gettext)() | Returns the returned message body as text for HTTP status codes between 200 and 299. |
| [getText](dw.net.HTTPClient.md#gettextstring)([String](TopLevel.String.md)) | Returns the returned message body as text for HTTP status codes between 200 and 299. |
| [getTimeout](dw.net.HTTPClient.md#gettimeout)() | Returns the timeout for this client, in milliseconds. |
| [open](dw.net.HTTPClient.md#openstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Opens the specified URL using the specified method. |
| ~~[open](dw.net.HTTPClient.md#openstring-string-boolean-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Deprecated method. |
| [open](dw.net.HTTPClient.md#openstring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Opens the specified URL with the in parameter method specified Http method with given credentials \[user,  password\] using HTTP basic authentication. |
| [send](dw.net.HTTPClient.md#send)() | Sends an HTTP request. |
| [send](dw.net.HTTPClient.md#sendfile)([File](dw.io.File.md)) | This method performs the actual HTTP communication. |
| [send](dw.net.HTTPClient.md#sendstring)([String](TopLevel.String.md)) | This method performs the actual HTTP communication. |
| [send](dw.net.HTTPClient.md#sendstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | This method performs the actual HTTP communication. |
| [sendAndReceiveToFile](dw.net.HTTPClient.md#sendandreceivetofilefile)([File](dw.io.File.md)) | This method performs the actual HTTP communication. |
| [sendAndReceiveToFile](dw.net.HTTPClient.md#sendandreceivetofilestring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | This method performs the actual HTTP communication. |
| [sendAndReceiveToFile](dw.net.HTTPClient.md#sendandreceivetofilestring-string-file)([String](TopLevel.String.md), [String](TopLevel.String.md), [File](dw.io.File.md)) | This method performs the actual HTTP communication. |
| [sendBytes](dw.net.HTTPClient.md#sendbytesbytes)([Bytes](dw.util.Bytes.md)) | This method performs the actual HTTP communication. |
| [sendBytesAndReceiveToFile](dw.net.HTTPClient.md#sendbytesandreceivetofilebytes-file)([Bytes](dw.util.Bytes.md), [File](dw.io.File.md)) | This method performs the actual HTTP communication. |
| [sendMultiPart](dw.net.HTTPClient.md#sendmultiparthttprequestpart)([HTTPRequestPart\[\]](dw.net.HTTPRequestPart.md)) | Sends a multipart HTTP request. |
| [setAllowRedirect](dw.net.HTTPClient.md#setallowredirectboolean)([Boolean](TopLevel.Boolean.md)) | Sets whether automatic HTTP redirect handling is enabled. |
| [setHostNameVerification](dw.net.HTTPClient.md#sethostnameverificationboolean)([Boolean](TopLevel.Boolean.md)) | Sets whether certificate host name verification is enabled. |
| [setIdentity](dw.net.HTTPClient.md#setidentitykeyref)([KeyRef](dw.crypto.KeyRef.md)) | Sets the identity (private key) to use when mutual TLS (mTLS) is configured. |
| [setLoggingConfig](dw.net.HTTPClient.md#setloggingconfighttpclientloggingconfig)([HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md)) | Sets the logging configuration for this HTTP client. |
| [setRequestHeader](dw.net.HTTPClient.md#setrequestheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets a request header for the next HTTP operation. |
| [setTimeout](dw.net.HTTPClient.md#settimeoutnumber)([Number](TopLevel.Number.md)) | Sets the timeout for connections made with this client to the given number of milliseconds. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DEFAULT_GET_FILE_SIZE

- ~~DEFAULT_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 5242880~~
  - : The default size for `sendAndReceiveToFile()` returning a File is 5MB deprecated in favor of
      MAX\_GET\_FILE\_SIZE


    **Deprecated:**
:::warning
Use [MAX_GET_FILE_SIZE](dw.net.HTTPClient.md#max_get_file_size) instead.
:::

---

### MAX_GET_FILE_SIZE

- MAX_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 209715200
  - : The maximum permitted size (in bytes) of an HTTP response when calling operations which write the response to
      file. (200MB)



---

### MAX_GET_MEM_SIZE

- MAX_GET_MEM_SIZE: [Number](TopLevel.Number.md) = 10485760
  - : The maximum permitted size (in bytes) of an HTTP response when calling operations which store the response in
      memory. (10MB)



---

## Property Details

### allResponseHeaders
- ~~allResponseHeaders: [HashMap](dw.util.HashMap.md)~~ `(read-only)`
  - : Returns all response headers as a map containing the name and value of the response header.

    **Deprecated:**
:::warning
Use [getResponseHeaders()](dw.net.HTTPClient.md#getresponseheaders) instead.
:::

---

### allowRedirect
- allowRedirect: [Boolean](TopLevel.Boolean.md)
  - : Determines whether redirect handling is enabled.


---

### bytes
- bytes: [Bytes](dw.util.Bytes.md) `(read-only)`
  - : Returns the bytes in the message body for HTTP status codes between 200 and 299.


---

### errorBytes
- errorBytes: [Bytes](dw.util.Bytes.md) `(read-only)`
  - : Returns the returned message body as bytes for HTTP status code greater or equal to 400. Error messages are not
      written to the response file.



---

### errorText
- errorText: [String](TopLevel.String.md) `(read-only)`
  - : Returns the returned message body as text for HTTP status code greater or equal to 400. Error messages are not
      written to the response file.



---

### hostNameVerification
- hostNameVerification: [Boolean](TopLevel.Boolean.md)
  - : Determines whether host name verification is enabled.


---

### identity
- identity: [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity used for mutual TLS (mTLS).


---

### loggingConfig
- loggingConfig: [HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md)
  - : Gets the logging configuration for this HTTP client.


---

### responseHeaders
- responseHeaders: [Map](dw.util.Map.md) `(read-only)`
  - : Returns all response headers as a map in which each entry represents an individual header. The key of the entry
      holds the header name and the entry value holds a list of all header values.



---

### statusCode
- statusCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the status code of the last HTTP operation.


---

### statusMessage
- statusMessage: [String](TopLevel.String.md) `(read-only)`
  - : Returns the message text of the last HTTP operation.


---

### text
- text: [String](TopLevel.String.md) `(read-only)`
  - : Returns the returned message body as text for HTTP status codes between 200 and 299.


---

### timeout
- timeout: [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.


---

## Constructor Details

### HTTPClient()
- HTTPClient()
  - : Constructs the HTTPClient instance with the default configuration.


---

### HTTPClient(Object)
- HTTPClient(configMap: [Object](TopLevel.Object.md))
  - : Constructs the HTTPClient instance with the given configuration.
      
      
      There is one supported configuration option. Unknown options are ignored.
      | Name | Type | Description |
      | --- |--- |--- |
      | `allowHTTP2` | `boolean` | Allow connections over HTTP/2. This will still allow HTTP/1.1 if that is what the remote server          supports. It will also cause all request and response headers to be case-insensitive.          The default value is `false`. |
      
      
      
      
      Sample usage:
      
      ```
      var httpClient = new HTTPClient( { allowHTTP2: true } )
      ```


    **Parameters:**
    - configMap - A Map containing configuration options.


---

## Method Details

### enableCaching(Number)
- enableCaching(ttl: [Number](TopLevel.Number.md)): void
  - : Calling this method enables caching for GET requests.
      
      
      It basically means that a response is cached, and before making a request the HTTP client looks into the cache to
      determine whether the response is already available. Only responses with a status code of 2xx, with a content
      length, with a size less than 50k, and which are not intended to be immediately written to a file are cached.
      
      
      The provided parameter defines the TTL (time to live) for the cached content. A value of 0 disables caching. The
      URL and the username are used as cache keys. The total size of the cacheable content and the number of cached
      items is limited and automatically managed by the system. Cache control information send by the remote server is
      ignored. Caching HTTP responses should be done very carefully. It is important to ensure that the response really
      depends only on the URL and doesn't contain any remote state information or time information which is independent
      of the URL. It is also important to verify that the application sends exactly the same URL multiple times.


    **Parameters:**
    - ttl - the TTL for the cached content in secs


---

### getAllResponseHeaders()
- ~~getAllResponseHeaders(): [HashMap](dw.util.HashMap.md)~~
  - : Returns all response headers as a map containing the name and value of the response header.

    **Returns:**
    - a map containing the names and corresponding values of the response headers.

    **Deprecated:**
:::warning
Use [getResponseHeaders()](dw.net.HTTPClient.md#getresponseheaders) instead.
:::

---

### getAllowRedirect()
- getAllowRedirect(): [Boolean](TopLevel.Boolean.md)
  - : Determines whether redirect handling is enabled.

    **Returns:**
    - true if redirect handling is enabled, false otherwise.


---

### getBytes()
- getBytes(): [Bytes](dw.util.Bytes.md)
  - : Returns the bytes in the message body for HTTP status codes between 200 and 299.

    **Returns:**
    - the returned message body as bytes.


---

### getErrorBytes()
- getErrorBytes(): [Bytes](dw.util.Bytes.md)
  - : Returns the returned message body as bytes for HTTP status code greater or equal to 400. Error messages are not
      written to the response file.


    **Returns:**
    - the returned message body as bytes.


---

### getErrorText()
- getErrorText(): [String](TopLevel.String.md)
  - : Returns the returned message body as text for HTTP status code greater or equal to 400. Error messages are not
      written to the response file.


    **Returns:**
    - the returned message body as text.


---

### getHostNameVerification()
- getHostNameVerification(): [Boolean](TopLevel.Boolean.md)
  - : Determines whether host name verification is enabled.

    **Returns:**
    - true if verification is enabled, false otherwise


---

### getIdentity()
- getIdentity(): [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity used for mutual TLS (mTLS).

    **Returns:**
    - Reference to the private key, or null if not configured


---

### getLoggingConfig()
- getLoggingConfig(): [HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md)
  - : Gets the logging configuration for this HTTP client.

    **Returns:**
    - the current logging configuration


---

### getResponseHeader(String)
- getResponseHeader(header: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a specific response header from the last HTTP operation. The method returns null if the specific header
      was not returned.


    **Parameters:**
    - header - the name of the response header to locate.

    **Returns:**
    - the value of the specified header or null if the header cannot be found.


---

### getResponseHeaders()
- getResponseHeaders(): [Map](dw.util.Map.md)
  - : Returns all response headers as a map in which each entry represents an individual header. The key of the entry
      holds the header name and the entry value holds a list of all header values.


    **Returns:**
    - A map containing the names and corresponding values of the response headers.


---

### getResponseHeaders(String)
- getResponseHeaders(name: [String](TopLevel.String.md)): [List](dw.util.List.md)
  - : Returns all the values of a response header from the last HTTP operation as a list of strings. This reflects the
      fact that a specific header, e.g. `"Set-Cookie"`, may be set multiple times. In case there is no such
      header, the method returns an empty list.


    **Parameters:**
    - name - The name of the response header to locate.

    **Returns:**
    - The values of the specified header as a list of strings or an empty list if the header cannot be found.


---

### getStatusCode()
- getStatusCode(): [Number](TopLevel.Number.md)
  - : Returns the status code of the last HTTP operation.

    **Returns:**
    - the status code of the last HTTP operation.


---

### getStatusMessage()
- getStatusMessage(): [String](TopLevel.String.md)
  - : Returns the message text of the last HTTP operation.

    **Returns:**
    - the message text of the last HTTP operation.


---

### getText()
- getText(): [String](TopLevel.String.md)
  - : Returns the returned message body as text for HTTP status codes between 200 and 299.

    **Returns:**
    - the returned message body as text.


---

### getText(String)
- getText(encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the returned message body as text for HTTP status codes between 200 and 299.

    **Parameters:**
    - encoding - the character encoding to use.

    **Returns:**
    - String the encoded String.


---

### getTimeout()
- getTimeout(): [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.

    **Returns:**
    - the timeout in milliseconds


---

### open(String, String)
- open(method: [String](TopLevel.String.md), url: [String](TopLevel.String.md)): void
  - : Opens the specified URL using the specified method. The following methods are supported: GET, POST, HEAD, PUT,
      PATCH, OPTIONS, and DELETE


    **Parameters:**
    - method - the method to use for opening the URL.
    - url - the url to open.


---

### open(String, String, Boolean, String, String)
- ~~open(method: [String](TopLevel.String.md), url: [String](TopLevel.String.md), async: [Boolean](TopLevel.Boolean.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): void~~
  - : Deprecated method.

    **Parameters:**
    - method - the method to use for opening the URL.
    - url - the url to open.
    - async - true if asynchronous.
    - user - name of the user.
    - password - password.

    **Deprecated:**
:::warning
Use [open(String, String, String, String)](dw.net.HTTPClient.md#openstring-string-string-string) instead.
:::

---

### open(String, String, String, String)
- open(method: [String](TopLevel.String.md), url: [String](TopLevel.String.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): void
  - : Opens the specified URL with the in parameter method specified Http method with given credentials \[user,
      password\] using HTTP basic authentication. The following methods are supported: GET, POST, HEAD, PUT,
      PATCH, OPTIONS, and DELETE


    **Parameters:**
    - method - HTTP method
    - url - the url
    - user - name of the user
    - password - password


---

### send()
- send(): void
  - : Sends an HTTP request.


---

### send(File)
- send(file: [File](dw.io.File.md)): void
  - : This method performs the actual HTTP communication. Sends the file to the HTTP server. The file content is sent
      as a request body and is sent "as-is" (text or binary).


    **Parameters:**
    - file - File to be sent.


---

### send(String)
- send(text: [String](TopLevel.String.md)): void
  - : This method performs the actual HTTP communication. The text is sent as a request body. If the text is null no
      data will be sent to the HTTP server.


    **Parameters:**
    - text - text String to be sent as request body.


---

### send(String, String)
- send(text: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): void
  - : This method performs the actual HTTP communication. The text is sent as a request body. If the text is null no
      data will be sent to the HTTP server.


    **Parameters:**
    - text - text String to be sent as request body.
    - encoding - character encoding name.


---

### sendAndReceiveToFile(File)
- sendAndReceiveToFile(file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : This method performs the actual HTTP communication. If the file is null no data will be sent to the HTTP server.
      If this method is used with a GET then the file parameter will contain the contents retrieved. When using this
      method with a PUT/POST then the contents of the file parameter will be sent to the server.


    **Parameters:**
    - file - local file used to read from or write to, depending on the method used.

    **Returns:**
    - true if the returned code was a positive status code


---

### sendAndReceiveToFile(String, File)
- sendAndReceiveToFile(text: [String](TopLevel.String.md), outFile: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : This method performs the actual HTTP communication. If the text is null no data will be sent to the HTTP server.

    **Parameters:**
    - text - text String to be sent.
    - outFile - local file to write to.

    **Returns:**
    - true if the returned code was a positive status code


---

### sendAndReceiveToFile(String, String, File)
- sendAndReceiveToFile(text: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), outFile: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : This method performs the actual HTTP communication. If the text is null no data will be sent to the HTTP server.

    **Parameters:**
    - text - text String to be sent.
    - encoding - character encoding name.
    - outFile - local file to write to.

    **Returns:**
    - true if the returned code was a positive status code


---

### sendBytes(Bytes)
- sendBytes(body: [Bytes](dw.util.Bytes.md)): void
  - : This method performs the actual HTTP communication. The bytes are sent as a request body. If the bytes are null no
      data will be sent to the HTTP server.


    **Parameters:**
    - body - Bytes to be sent as request body.


---

### sendBytesAndReceiveToFile(Bytes, File)
- sendBytesAndReceiveToFile(body: [Bytes](dw.util.Bytes.md), outFile: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : This method performs the actual HTTP communication. If the body is null no data will be sent to the HTTP server.

    **Parameters:**
    - body - Bytes to be sent.
    - outFile - local file to write to.

    **Returns:**
    - true if the returned code was a positive status code

    **Throws:**
    - IOException - 


---

### sendMultiPart(HTTPRequestPart[])
- sendMultiPart(parts: [HTTPRequestPart\[\]](dw.net.HTTPRequestPart.md)): [Boolean](TopLevel.Boolean.md)
  - : Sends a multipart HTTP request. This method should only be called if the connection to the remote URL was opened
      with a POST or PATCH method. All other methods will result in an exception being thrown. The request is constructed
      from the passed array of parts.


    **Parameters:**
    - parts - List of part objects representing either string or file parts.

    **Returns:**
    - true if the returned code was a positive status code.


---

### setAllowRedirect(Boolean)
- setAllowRedirect(allowRedirect: [Boolean](TopLevel.Boolean.md)): void
  - : Sets whether automatic HTTP redirect handling is enabled.
      The default value is true. Set it to false to disable all redirects.


    **Parameters:**
    - allowRedirect - true or false for enabling or disabling automatic HTTP redirect


---

### setHostNameVerification(Boolean)
- setHostNameVerification(enable: [Boolean](TopLevel.Boolean.md)): void
  - : Sets whether certificate host name verification is enabled.
      The default value is true. Set it to false to disable host name verification.


    **Parameters:**
    - enable - true to enable host name verification or false to disable it.


---

### setIdentity(KeyRef)
- setIdentity(keyRef: [KeyRef](dw.crypto.KeyRef.md)): void
  - : Sets the identity (private key) to use when mutual TLS (mTLS) is configured.
      
      
      If this is not set and mTLS is used then the private key will be chosen from the key store based on the host
      name.
      If this is set to a reference named "\_\_NONE\_\_" then no private key will be used even if one is requested by the remote server.


    **Parameters:**
    - keyRef - Reference to the private key


---

### setLoggingConfig(HTTPClientLoggingConfig)
- setLoggingConfig(config: [HTTPClientLoggingConfig](dw.net.HTTPClientLoggingConfig.md)): void
  - : Sets the logging configuration for this HTTP client.

    **Parameters:**
    - config - the logging configuration to use


---

### setRequestHeader(String, String)
- setRequestHeader(key: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): void
  - : Sets a request header for the next HTTP operation.

    **Parameters:**
    - key - the request header.
    - value - the request headers' value.


---

### setTimeout(Number)
- setTimeout(timeoutMillis: [Number](TopLevel.Number.md)): void
  - : Sets the timeout for connections made with this client to the given number of milliseconds. If the given timeout
      is less than or equal to zero, the timeout is set to a maximum value of 2 or 15 minutes, depending on the
      context.
      
      
      This timeout value controls both the "connection timeout" (how long it takes to connect to the remote host) and
      the "socket timeout" (how long, after connecting, it will wait without any data being read). Therefore, in the
      worst case scenario, the total time of inactivity could be twice as long as the specified value.
      
      
      The maximum timeout is 15 minutes when the client is used in a job, and 2 minutes otherwise. The default timeout
      for a new client is the maximum timeout value.
      
      
      This method can be called at any time, and will affect the next connection made with this client. It is not
      possible to set the timeout for an open connection.
      
      
      You should always set a reasonable timeout (e.g., a few seconds). Allowing connections to run long can result
      in thread exhaustion.


    **Parameters:**
    - timeoutMillis - timeout, in milliseconds, up to a maximum of 2 or 15 minutes, depending on the context.


---

<!-- prettier-ignore-end -->
