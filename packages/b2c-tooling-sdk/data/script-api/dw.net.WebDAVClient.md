<!-- prettier-ignore-start -->
# Class WebDAVClient

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.WebDAVClient](dw.net.WebDAVClient.md)

The WebDAVClient class supports the WebDAV methods GET, PUT, MKCOL, MOVE,
COPY, PROPFIND,OPTIONS and DELETE.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 The client can be used as shown in the following example:



```
var webdavClient : WebDAVClient = new WebDAVClient("http://mywebdav.server.com","myusername", "mypassword");
var getString : String = webdavClient.get("myData.xml","UTF-8");
var message : String;

if (webdavClient.succeeded())
{
     message = webDavClient.statusText;
}
else
{
    // error handling
    message="An error occurred with status code "+webdavClient.statusCode;
}

var data : XML = new XML(getString);
```



The WebDAV client supports the following authentication schemes:

- Basic authentication
- Digest authentication


The methods of this class do not generally throw exceptions if the underlying
WebDAV operation do not succeed.The result of a WebDAV operation can be
checked using the methods succeeded(), getStatusCode(), and getStatusText().


Important note: This WebDAV client cannot be used to access the Commerce Cloud Digital
server via WebDAV protocol.



## Constant Summary

| Constant | Description |
| --- | --- |
| [DEFAULT_ENCODING](#default_encoding): [String](TopLevel.String.md) = "UTF-8" | The default encoding character set. |
| [DEFAULT_GET_FILE_SIZE](#default_get_file_size): [Number](TopLevel.Number.md) = 5242880 | The default size for `get()` returning a File is 5MB. |
| [DEFAULT_GET_STRING_SIZE](#default_get_string_size): [Number](TopLevel.Number.md) = 2097152 | The default size for `get()` returning a String is 2MB. |
| [DEPTH_0](#depth_0): [Number](TopLevel.Number.md) = 0 | The depth of searching a WebDAV destination using the PROPFIND method -  if that depth is given to the PROPFIND method as an input parameter the  destination will be searched only on the level of the given path and a  list of all containing files on that level will be returned \[is not  supported by every server\]. |
| [DEPTH_1](#depth_1): [Number](TopLevel.Number.md) = 1 | The depth of searching a WebDAV destination using the PROPFIND method -  if that depth is given to the PROPFIND method as an input parameter the  destination will be searched until one level under the given path and a  list of all containing files in that two levels \[/path and one level  underneath\] will be returned \[is not supported by every server\]. |
| [DEPTH_INIFINITY](#depth_inifinity): [Number](TopLevel.Number.md) = 2147483647 | The depth of searching a WebDAV destination using the PROPFIND method -  if that depth is given to the PROPFIND method as an input parameter the  destination will be fully searched and a list of all containing files  will be returned \[is not supported by every server\]. |
| [MAX_GET_FILE_SIZE](#max_get_file_size): [Number](TopLevel.Number.md) = 209715200 | The maximum size for `get()` returning a File is forty times  the default size for getting a file. |
| [MAX_GET_STRING_SIZE](#max_get_string_size): [Number](TopLevel.Number.md) = 10485760 | The maximum size for `get()` returning a String is five  times the default size for getting a String. |

## Property Summary

| Property | Description |
| --- | --- |
| [allResponseHeaders](#allresponseheaders): [HashMap](dw.util.HashMap.md) `(read-only)` | Returns a [HashMap](dw.util.HashMap.md) of all response headers. |
| [statusCode](#statuscode): [Number](TopLevel.Number.md) `(read-only)` | Returns the status code after the execution of a method. |
| [statusText](#statustext): [String](TopLevel.String.md) `(read-only)` | Returns the status text after the execution of a method. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WebDAVClient](#webdavclientstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Creates a new client for the use at a server which requires  authentication. |
| [WebDAVClient](#webdavclientstring)([String](TopLevel.String.md)) | Creates a new client for the use at a server which does not require  authentication. |

## Method Summary

| Method | Description |
| --- | --- |
| [addRequestHeader](dw.net.WebDAVClient.md#addrequestheaderstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a request header to the next WebDAV call. |
| [close](dw.net.WebDAVClient.md#close)() | Closes the current connection to the server. |
| [copy](dw.net.WebDAVClient.md#copystring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Copies a file on the server from one place `rootUrl`/`origin`  to the other `rootUrl`/`destination`. |
| [copy](dw.net.WebDAVClient.md#copystring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Copies a file on the server from one place `rootUrl`/`origin`  to the other `rootUrl`/`destination`. |
| [copy](dw.net.WebDAVClient.md#copystring-string-boolean-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md), [Boolean](TopLevel.Boolean.md)) | Copies a file on the server from one place `rootUrl`/`origin`  to the other `rootUrl`/`destination`. |
| [del](dw.net.WebDAVClient.md#delstring)([String](TopLevel.String.md)) | Deletes a file or directory from the remote server that can be found  under `rootUrl`/`path`. |
| [get](dw.net.WebDAVClient.md#getstring)([String](TopLevel.String.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` and returns a string  representation of the data found in the DEFAULT\_ENCODING encoding. |
| [get](dw.net.WebDAVClient.md#getstring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` in DEFAULT\_ENCODING  encoding and writes a [File](dw.io.File.md) in the system's standard  encoding, which is "UTF-8". |
| [get](dw.net.WebDAVClient.md#getstring-file-number)([String](TopLevel.String.md), [File](dw.io.File.md), [Number](TopLevel.Number.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` in DEFAULT\_ENCODING  encoding and writes a [File](dw.io.File.md) in the system's standard  encoding, which is "UTF-8". |
| [get](dw.net.WebDAVClient.md#getstring-file-string-number)([String](TopLevel.String.md), [File](dw.io.File.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` in the passed encoding and  writes a [File](dw.io.File.md) in the system standard encoding, which is  "UTF-8". |
| [get](dw.net.WebDAVClient.md#getstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` and returns a string  representation of the data found in the given `encoding`. |
| [get](dw.net.WebDAVClient.md#getstring-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Reads the content of a remote file or directory that can be found under  `rootUrl`/`path` and returns a string  representation of the data found in the given `encoding`. |
| [getAllResponseHeaders](dw.net.WebDAVClient.md#getallresponseheaders)() | Returns a [HashMap](dw.util.HashMap.md) of all response headers. |
| [getBinary](dw.net.WebDAVClient.md#getbinarystring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote binary file that can be found under  `rootUrl`/`path` and creates a local copy  in [File](dw.io.File.md). |
| [getBinary](dw.net.WebDAVClient.md#getbinarystring-file-number)([String](TopLevel.String.md), [File](dw.io.File.md), [Number](TopLevel.Number.md)) | Reads the content of a remote binary file that can be found under  `rootUrl`/`path` and creates a local copy  in [File](dw.io.File.md). |
| [getResponseHeader](dw.net.WebDAVClient.md#getresponseheaderstring)([String](TopLevel.String.md)) | Returns a specified response header - multiple headers are separated by  CRLF. |
| [getStatusCode](dw.net.WebDAVClient.md#getstatuscode)() | Returns the status code after the execution of a method. |
| [getStatusText](dw.net.WebDAVClient.md#getstatustext)() | Returns the status text after the execution of a method. |
| [mkcol](dw.net.WebDAVClient.md#mkcolstring)([String](TopLevel.String.md)) | Creates a directory on the remote server on the location  `rootUrl`/`path`. |
| [move](dw.net.WebDAVClient.md#movestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Moves a file on the server from one place `rootUrl` + "/" +`origin`  to the other `rootUrl`/`destination`. |
| [move](dw.net.WebDAVClient.md#movestring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Moves a file on the server from one place `rootUrl`/`origin`  to the other `rootUrl`/`destination` Can  also be used to rename a remote file. |
| [options](dw.net.WebDAVClient.md#optionsstring)([String](TopLevel.String.md)) | Returns a list of methods which can be executed on the server location  `rootUrl`/`path`. |
| [propfind](dw.net.WebDAVClient.md#propfindstring)([String](TopLevel.String.md)) | Get file listing of a remote location. |
| [propfind](dw.net.WebDAVClient.md#propfindstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Get file listing of a remote location. |
| [put](dw.net.WebDAVClient.md#putstring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Puts content out of a passed local file into a remote located file  at `rootUrl`/`path`. |
| [put](dw.net.WebDAVClient.md#putstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Puts content encoded with DEFAULT\_ENCODING into a remote located file at  `rootUrl`/`path`. |
| [put](dw.net.WebDAVClient.md#putstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Puts content encoded with the passed encoding into a remote located file  at `rootUrl`/`path`. |
| [succeeded](dw.net.WebDAVClient.md#succeeded)() | Returns true if the last executed WebDAV method was executed successfully - otherwise false. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DEFAULT_ENCODING

- DEFAULT_ENCODING: [String](TopLevel.String.md) = "UTF-8"
  - : The default encoding character set.


---

### DEFAULT_GET_FILE_SIZE

- DEFAULT_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 5242880
  - : The default size for `get()` returning a File is 5MB.


---

### DEFAULT_GET_STRING_SIZE

- DEFAULT_GET_STRING_SIZE: [Number](TopLevel.Number.md) = 2097152
  - : The default size for `get()` returning a String is 2MB.


---

### DEPTH_0

- DEPTH_0: [Number](TopLevel.Number.md) = 0
  - : The depth of searching a WebDAV destination using the PROPFIND method -
      if that depth is given to the PROPFIND method as an input parameter the
      destination will be searched only on the level of the given path and a
      list of all containing files on that level will be returned \[is not
      supported by every server\].



---

### DEPTH_1

- DEPTH_1: [Number](TopLevel.Number.md) = 1
  - : The depth of searching a WebDAV destination using the PROPFIND method -
      if that depth is given to the PROPFIND method as an input parameter the
      destination will be searched until one level under the given path and a
      list of all containing files in that two levels \[/path and one level
      underneath\] will be returned \[is not supported by every server\].



---

### DEPTH_INIFINITY

- DEPTH_INIFINITY: [Number](TopLevel.Number.md) = 2147483647
  - : The depth of searching a WebDAV destination using the PROPFIND method -
      if that depth is given to the PROPFIND method as an input parameter the
      destination will be fully searched and a list of all containing files
      will be returned \[is not supported by every server\].



---

### MAX_GET_FILE_SIZE

- MAX_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 209715200
  - : The maximum size for `get()` returning a File is forty times
      the default size for getting a file. The largest file allowed is 200MB.



---

### MAX_GET_STRING_SIZE

- MAX_GET_STRING_SIZE: [Number](TopLevel.Number.md) = 10485760
  - : The maximum size for `get()` returning a String is five
      times the default size for getting a String. The largest String allowed
      is 10MB.



---

## Property Details

### allResponseHeaders
- allResponseHeaders: [HashMap](dw.util.HashMap.md) `(read-only)`
  - : Returns a [HashMap](dw.util.HashMap.md) of all response headers.


---

### statusCode
- statusCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the status code after the execution of a method.


---

### statusText
- statusText: [String](TopLevel.String.md) `(read-only)`
  - : Returns the status text after the execution of a method.


---

## Constructor Details

### WebDAVClient(String, String, String)
- WebDAVClient(rootUrl: [String](TopLevel.String.md), username: [String](TopLevel.String.md), password: [String](TopLevel.String.md))
  - : Creates a new client for the use at a server which requires
      authentication.
      The client supports the following authentication schemes:
           - Basic authentication scheme
           - Digest authentication scheme


    **Parameters:**
    - rootUrl - the url of the server one wants to connect to. All commands             will be executed by the client relative to that url.
    - username - username of the user for server authentication.
    - password - password of the user for server authentication.


---

### WebDAVClient(String)
- WebDAVClient(rootUrl: [String](TopLevel.String.md))
  - : Creates a new client for the use at a server which does not require
      authentication.


    **Parameters:**
    - rootUrl - the url of the server one wants to connect to. All commands             will be executed by the client relative to that url.


---

## Method Details

### addRequestHeader(String, String)
- addRequestHeader(headerName: [String](TopLevel.String.md), headerValue: [String](TopLevel.String.md)): void
  - : Adds a request header to the next WebDAV call.

    **Parameters:**
    - headerName - name of the header.
    - headerValue - value of the header.


---

### close()
- close(): void
  - : Closes the current connection to the server.


---

### copy(String, String)
- copy(origin: [String](TopLevel.String.md), destination: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Copies a file on the server from one place `rootUrl`/`origin`
      to the other `rootUrl`/`destination`. If
      `destination` already exists it gets overwritten. Returns
      true if succeeded, otherwise false.


    **Parameters:**
    - origin - The origin where a file is located, relative to the             `rootUrl` stated when instantiating the client.
    - destination - The destination where the file should be copied to, relative             to the `rootUrl` stated when instantiating the             client.

    **Returns:**
    - true if succeeded, otherwise false.


---

### copy(String, String, Boolean)
- copy(origin: [String](TopLevel.String.md), destination: [String](TopLevel.String.md), overwrite: [Boolean](TopLevel.Boolean.md)): [Boolean](TopLevel.Boolean.md)
  - : Copies a file on the server from one place `rootUrl`/`origin`
      to the other `rootUrl`/`destination`. If
      the passed parameter `overwrite` is true and
      `destination` already exists it gets overwritten. Returns
      true if succeeded, otherwise false.


    **Parameters:**
    - origin - The origin where a file is located, relative to the             `rootUrl` stated when instantiating the client.
    - destination - The destination where the file should be copied to, relative             to the `rootUrl` stated when instantiating the             client.
    - overwrite - A flag which determines whether the destination gets             overwritten if it exists before copying.

    **Returns:**
    - true if succeeded, otherwise false.


---

### copy(String, String, Boolean, Boolean)
- copy(origin: [String](TopLevel.String.md), destination: [String](TopLevel.String.md), overwrite: [Boolean](TopLevel.Boolean.md), shallow: [Boolean](TopLevel.Boolean.md)): [Boolean](TopLevel.Boolean.md)
  - : Copies a file on the server from one place `rootUrl`/`origin`
      to the other `rootUrl`/`destination`. If
      the passed parameter `overwrite` is true and
      `destination` already exists it gets overwritten. If the
      passed parameter `shallow` is true a flat copy mechanism is
      used.
      
      Returns true if succeeded, otherwise false.


    **Parameters:**
    - origin - The origin where a file is located, relative to the             `rootUrl` stated when instantiating the client.
    - destination - The destination where the file should be copied to, relative             to the `rootUrl` stated when instantiating the             client.
    - overwrite - A flag which determines whether the destination gets             overwritten if it exits before copying
    - shallow - A flag which determines how to copy the given data.

    **Returns:**
    - true if succeeded, otherwise false.


---

### del(String)
- del(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Deletes a file or directory from the remote server that can be found
      under `rootUrl`/`path`. Returns true if
      succeeded, otherwise false.


    **Parameters:**
    - path - The path of the file or collection to delete, relative to the             `rootUrl` stated when instantiating the client.

    **Returns:**
    - true if succeeded, otherwise false.


---

### get(String)
- get(path: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` and returns a string
      representation of the data found in the DEFAULT\_ENCODING encoding. If the
      remote location is a directory the result depends on the server
      configuration, some return an HTML formatted directory listing. Returns
      at most DEFAULT\_GET\_STRING\_SIZE bytes.


    **Parameters:**
    - path - The path of the collection or file one wants to get, relative             to the `rootUrl` stated when instantiating the             client.

    **Returns:**
    - returns the String representation of the data found on the given
              path.



---

### get(String, File)
- get(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` in DEFAULT\_ENCODING
      encoding and writes a [File](dw.io.File.md) in the system's standard
      encoding, which is "UTF-8". If the remote location is a directory the
      result depends on the server configuration, some return an HTML formatted
      directory listing. Receives at most DEFAULT\_GET\_FILE\_SIZE bytes which
      determines the file size of the local file. Returns true if succeeded
      otherwise false.


    **Parameters:**
    - path - The path of the collection or file one wants to get -             relative to the `rootUrl` stated when instantiating             the client.
    - file - The file to save the received data in.

    **Returns:**
    - returns true if succeeded, otherwise false.


---

### get(String, File, Number)
- get(path: [String](TopLevel.String.md), file: [File](dw.io.File.md), maxFileSize: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` in DEFAULT\_ENCODING
      encoding and writes a [File](dw.io.File.md) in the system's standard
      encoding, which is "UTF-8". If the remote location is a directory the
      result depends on the server configuration, some return an HTML formatted
      directory listing. Receives at most maxFileSize bytes which determines
      the file size of the local file. Returns true if succeeded, otherwise
      false.


    **Parameters:**
    - path - The path of the collection or file one wants to get -             relative to the `rootUrl` stated when instantiating             the client.
    - file - The file to save the received data in.
    - maxFileSize - The maximum size of bytes to stream into the file. Not             to exceed MAX\_GET\_FILE\_SIZE.

    **Returns:**
    - returns true if succeeded, otherwise false.


---

### get(String, File, String, Number)
- get(path: [String](TopLevel.String.md), file: [File](dw.io.File.md), encoding: [String](TopLevel.String.md), maxFileSize: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` in the passed encoding and
      writes a [File](dw.io.File.md) in the system standard encoding, which is
      "UTF-8". If the remote location is a directory the result depends on the
      server configuration, some return an HTML formatted directory listing.
      Receives at most maxFileSize bytes which determines the file size of the
      local file. Returns true if succeeded, otherwise false.


    **Parameters:**
    - path - The path of the collection or file one wants to get -             relative to the `rootUrl` stated when instantiating             the client.
    - file - The file to save the received data in.
    - encoding - The encoding to use when reading the remote file.
    - maxFileSize - The maximum number of bytes to stream into the file.             Not to exceed MAX\_GET\_FILE\_SIZE.

    **Returns:**
    - returns true if succeeded, otherwise false.


---

### get(String, String)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` and returns a string
      representation of the data found in the given `encoding`. If
      the remote location is a directory the result depends on the server
      configuration, some return an HTML formatted directory listing. Returns
      at most DEFAULT\_GET\_STRING\_SIZE bytes.


    **Parameters:**
    - path - The path of the collection or file one wants to get -             relative to the `rootUrl` stated when instantiating             the client.
    - encoding - The encoding of the resulting String.

    **Returns:**
    - returns the String representation of the data found on the given
              path in the given encoding.



---

### get(String, String, Number)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), maxGetSize: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file or directory that can be found under
      `rootUrl`/`path` and returns a string
      representation of the data found in the given `encoding`. If
      the remote location is a directory the result depends on the server
      configuration, some return an HTML formatted directory listing. Returns
      at most maxGetSize bytes.


    **Parameters:**
    - path - The path of the collection or file one wants to get -             relative to the `rootUrl` stated when instantiating             the client.
    - encoding - The encoding of the resulting String.
    - maxGetSize - The maximum size of data in bytes. Not to exceed             MAX\_GET\_STRING\_SIZE.

    **Returns:**
    - returns the String representation of the data found on the given
              path in the given encoding.



---

### getAllResponseHeaders()
- getAllResponseHeaders(): [HashMap](dw.util.HashMap.md)
  - : Returns a [HashMap](dw.util.HashMap.md) of all response headers.

    **Returns:**
    - all headers in a [HashMap](dw.util.HashMap.md).


---

### getBinary(String, File)
- getBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote binary file that can be found under
      `rootUrl`/`path` and creates a local copy
      in [File](dw.io.File.md). If the remote location is a directory the result
      depends on the server configuration, some return an HTML formatted
      directory listing. Copies at most DEFAULT\_GET\_FILE\_SIZE bytes. Returns
      true if succeeded, otherwise false.


    **Parameters:**
    - path - The path relative to `rootUrl` on the remote             server including the file name.
    - file - The local file where the received binary data should be             stored.

    **Returns:**
    - true if succeeded, otherwise false.


---

### getBinary(String, File, Number)
- getBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md), maxFileSize: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote binary file that can be found under
      `rootUrl`/`path` and creates a local copy
      in [File](dw.io.File.md). If the remote location is a directory the result
      depends on the server configuration, some return an HTML formatted
      directory listing. Copies at most maxFileSize bytes. Returns true if
      succeeded, otherwise false.


    **Parameters:**
    - path - The path relative to `rootUrl` on the remote             server including the file name.
    - file - The file local file where the received binary data should be             stored.
    - maxFileSize - The maximum number of bytes to stream into the file.             Not to exceed MAX\_GET\_FILE\_SIZE.

    **Returns:**
    - true if succeeded, otherwise false.


---

### getResponseHeader(String)
- getResponseHeader(header: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns a specified response header - multiple headers are separated by
      CRLF.


    **Parameters:**
    - header - The name of the header.

    **Returns:**
    - The header - in case of multiple headers separated by CRLF.


---

### getStatusCode()
- getStatusCode(): [Number](TopLevel.Number.md)
  - : Returns the status code after the execution of a method.

    **Returns:**
    - the `statusCode`.


---

### getStatusText()
- getStatusText(): [String](TopLevel.String.md)
  - : Returns the status text after the execution of a method.

    **Returns:**
    - the `statusText`.


---

### mkcol(String)
- mkcol(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Creates a directory on the remote server on the location
      `rootUrl`/`path`.


    **Parameters:**
    - path - The path relative to the `rootUrl` stated when             instantiating the client where the new collection should be             created.

    **Returns:**
    - true if succeeded, otherwise false.


---

### move(String, String)
- move(origin: [String](TopLevel.String.md), destination: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Moves a file on the server from one place `rootUrl` + "/" +`origin`
      to the other `rootUrl`/`destination`. If
      `destination` already exists it gets overwritten. Can also
      be used to rename a remote file. Returns true if succeeded, otherwise
      false.


    **Parameters:**
    - origin - The origin where a file is located, relative to the             `rootUrl` stated when instantiating the client.
    - destination - The destination where the file should be moved to, relative             to the `rootUrl` stated when instantiating the             client.

    **Returns:**
    - true if succeeded, otherwise false.


---

### move(String, String, Boolean)
- move(origin: [String](TopLevel.String.md), destination: [String](TopLevel.String.md), overwrite: [Boolean](TopLevel.Boolean.md)): [Boolean](TopLevel.Boolean.md)
  - : Moves a file on the server from one place `rootUrl`/`origin`
      to the other `rootUrl`/`destination` Can
      also be used to rename a remote file. If `overwrite` is true
      and `destination` already exists it gets overwritten.
      Returns true if succeeded, otherwise false.


    **Parameters:**
    - origin - The origin where a file is located, relative to the             `rootUrl` stated when instantiating the client.
    - destination - The destination where the file should be moved to, relative             to the `rootUrl` stated when instantiating the             client.
    - overwrite - A flag which determines whether the destination gets             overwritten if it exists before moving.

    **Returns:**
    - true if succeeded, otherwise false.


---

### options(String)
- options(path: [String](TopLevel.String.md)): [String\[\]](TopLevel.String.md)
  - : Returns a list of methods which can be executed on the server location
      `rootUrl`/`path`.


    **Parameters:**
    - path - The path relative to the `rootUrl` stated when             instantiating the client one wants to get the options for.

    **Returns:**
    - list of WebDav methods which can be executed on the given path.


---

### propfind(String)
- propfind(path: [String](TopLevel.String.md)): [WebDAVFileInfo\[\]](dw.net.WebDAVFileInfo.md)
  - : Get file listing of a remote location.
      
      Returns a list of [WebDAVFileInfo](dw.net.WebDAVFileInfo.md) objects which contain
      information about the files and directories located on
      `rootUrl`/`path` and DEPTH\_1 (1) level
      underneath.


    **Parameters:**
    - path - The path relative to the `rootUrl` stated when             instantiating the client where to get information about the             containing files from.

    **Returns:**
    - an Array of [WebDAVFileInfo](dw.net.WebDAVFileInfo.md) objects which hold
              information about the files located on the server at the
              location.



---

### propfind(String, Number)
- propfind(path: [String](TopLevel.String.md), depth: [Number](TopLevel.Number.md)): [WebDAVFileInfo\[\]](dw.net.WebDAVFileInfo.md)
  - : Get file listing of a remote location.
      
      Returns a list of [WebDAVFileInfo](dw.net.WebDAVFileInfo.md) objects which contain
      information about the files and directories located on
      `rootUrl`/`path` and the passed depth
      underneath.


    **Parameters:**
    - path - The path relative to the `rootUrl` stated when             instantiating the client where to get information about the             containing files from.
    - depth - The level starting from `rootUrl` down to which             the file information gets collected.

    **Returns:**
    - an Array of [WebDAVFileInfo](dw.net.WebDAVFileInfo.md) objects which hold
              information about the files located on the server at the
              location.



---

### put(String, File)
- put(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Puts content out of a passed local file into a remote located file
      at `rootUrl`/`path`. This method performs
      a binary file transfer. Returns true if succeeded, otherwise false.


    **Parameters:**
    - path - The path to put given content up to, relative to the             `rootUrl` stated when instantiating the client.
    - file - The file to push up to the server.

    **Returns:**
    - true if succeeded, otherwise false.


---

### put(String, String)
- put(path: [String](TopLevel.String.md), content: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Puts content encoded with DEFAULT\_ENCODING into a remote located file at
      `rootUrl`/`path`. Returns true if
      succeeded, otherwise false.
      
      
      If the content of a local file is to be uploaded, please use method
      [put(String, File)](dw.net.WebDAVClient.md#putstring-file) instead.


    **Parameters:**
    - path - The path to put given content up to, relative to the             `rootUrl` stated when instantiating the client.
    - content - The content that has to be pushed on to the server.

    **Returns:**
    - true if succeeded, otherwise false.


---

### put(String, String, String)
- put(path: [String](TopLevel.String.md), content: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Puts content encoded with the passed encoding into a remote located file
      at `rootUrl`/`path`. Returns true if
      succeeded, otherwise false.
      
      
      If the content of a local file is to be uploaded, please use method
      [put(String, File)](dw.net.WebDAVClient.md#putstring-file) instead.


    **Parameters:**
    - path - The path to put a given content up to, relative to the             `rootUrl` stated when instantiating the client.
    - content - The content that has to be pushed on to a remote location.
    - encoding - The encoding in which the data should be stored on the             server.

    **Returns:**
    - true if succeeded, otherwise false.


---

### succeeded()
- succeeded(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the last executed WebDAV method was executed successfully - otherwise false.
      See the code snippet above for an example how to use the succeed() method.


    **Returns:**
    - true if the last executed WebDAV method was successful - otherwise false.

    **See Also:**
    - [WebDAVClient](dw.net.WebDAVClient.md)


---

<!-- prettier-ignore-end -->
