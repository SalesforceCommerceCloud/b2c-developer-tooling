<!-- prettier-ignore-start -->
# Class FTPClient

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.FTPClient](dw.net.FTPClient.md)

The FTPClient class supports the FTP commands CD, GET, PUT, DEL, MKDIR, RENAME, and LIST. The FTP connection is
established using passive transfer mode (PASV). The transfer of files can be text or binary.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.


An example usage is as follows:




```

 var ftp : FTPClient = new dw.net.FTPClient();
 ftp.connect("my.ftp-server.com", "username", "password");
 var data : String = ftp.get("simple.txt");
 ftp.disconnect();
```



The default connection timeout depends on the script context timeout and will be set to a maximum of 30 seconds
(default script context timeout is 10 seconds within storefront requests and 15 minutes within jobs).


**IMPORTANT NOTE:** Before you can make an outbound FTP connection, the FTP server IP address must be enabled for
outbound traffic at the Commerce Cloud Digital firewall for your POD. Please file a support request to request a new firewall
rule.


**Deprecated:**
:::warning
The FTPClient is deprecated. Use [SFTPClient](dw.net.SFTPClient.md) for a secure alternative.
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[DEFAULT_GET_FILE_SIZE](#default_get_file_size): [Number](TopLevel.Number.md) = 5242880~~ | The default size for `get()` returning a File is 5MB |
| ~~[DEFAULT_GET_STRING_SIZE](#default_get_string_size): [Number](TopLevel.Number.md) = 2097152~~ | The default size for `get()` returning a String is 2MB |
| [MAX_GET_FILE_SIZE](#max_get_file_size): [Number](TopLevel.Number.md) = 209715200 | The maximum size for `get()` returning a File is forty times the default size for getting a file. |
| [MAX_GET_STRING_SIZE](#max_get_string_size): [Number](TopLevel.Number.md) = 10485760 | The maximum size for `get()` returning a String is five times the default size for getting a String. |

## Property Summary

| Property | Description |
| --- | --- |
| [connected](#connected): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the FTP client is currently connected to the FTP server. |
| [replyCode](#replycode): [Number](TopLevel.Number.md) `(read-only)` | Returns the reply code from the last FTP action. |
| [replyMessage](#replymessage): [String](TopLevel.String.md) `(read-only)` | Returns the string message from the last FTP action. |
| [timeout](#timeout): [Number](TopLevel.Number.md) | Returns the timeout for this client, in milliseconds. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FTPClient](#ftpclient)() | Constructs the FTPClient instance. |

## Method Summary

| Method | Description |
| --- | --- |
| [cd](dw.net.FTPClient.md#cdstring)([String](TopLevel.String.md)) | Changes the current directory on the remote server to the given path. |
| [connect](dw.net.FTPClient.md#connectstring)([String](TopLevel.String.md)) | Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure. |
| [connect](dw.net.FTPClient.md#connectstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure. |
| [connect](dw.net.FTPClient.md#connectstring-number-string-string)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Connects and logs on to an FTP server and returns a boolean indicating success or failure. |
| [connect](dw.net.FTPClient.md#connectstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Connects and logs on to an FTP server and returns a boolean indicating success or failure. |
| [del](dw.net.FTPClient.md#delstring)([String](TopLevel.String.md)) | Deletes the remote file on the server identified by the path parameter. |
| [disconnect](dw.net.FTPClient.md#disconnect)() | The method first logs the current user out from the server and then disconnects from the server. |
| [get](dw.net.FTPClient.md#getstring)([String](TopLevel.String.md)) | Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. |
| ~~[get](dw.net.FTPClient.md#getstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md))~~ | Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. |
| [get](dw.net.FTPClient.md#getstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Reads the content of a remote file and returns it as string using the passed encoding. |
| [get](dw.net.FTPClient.md#getstring-string-file)([String](TopLevel.String.md), [String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to  read the file content and using the system standard encoding "UTF-8" to write the file. |
| ~~[get](dw.net.FTPClient.md#getstring-string-file-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [File](dw.io.File.md), [Number](TopLevel.Number.md))~~ | Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to  read the file content and using the system standard encoding "UTF-8" to write the file. |
| ~~[get](dw.net.FTPClient.md#getstring-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md))~~ | Reads the content of a remote file and returns it as a string using the specified encoding. |
| [getBinary](dw.net.FTPClient.md#getbinarystring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote file and creates a local copy in the given file. |
| ~~[getBinary](dw.net.FTPClient.md#getbinarystring-file-number)([String](TopLevel.String.md), [File](dw.io.File.md), [Number](TopLevel.Number.md))~~ | Reads the content of a remote file and creates a local copy in the given file. |
| [getConnected](dw.net.FTPClient.md#getconnected)() | Identifies if the FTP client is currently connected to the FTP server. |
| [getReplyCode](dw.net.FTPClient.md#getreplycode)() | Returns the reply code from the last FTP action. |
| [getReplyMessage](dw.net.FTPClient.md#getreplymessage)() | Returns the string message from the last FTP action. |
| [getTimeout](dw.net.FTPClient.md#gettimeout)() | Returns the timeout for this client, in milliseconds. |
| [list](dw.net.FTPClient.md#list)() | Returns a list of FTPFileInfo objects containing information about the files in the current directory. |
| [list](dw.net.FTPClient.md#liststring)([String](TopLevel.String.md)) | Returns a list of FTPFileInfo objects containing information about the files in the remote directory defined by  the given path. |
| [mkdir](dw.net.FTPClient.md#mkdirstring)([String](TopLevel.String.md)) | Creates a directory |
| [put](dw.net.FTPClient.md#putstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Puts the specified content to the specified full path using "ISO-8859-1" encoding. |
| [put](dw.net.FTPClient.md#putstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Put the given content to a file on the given full path on the FTP server. |
| [putBinary](dw.net.FTPClient.md#putbinarystring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Put the content of the given file into a file on the remote FTP server with the given full path. |
| [removeDirectory](dw.net.FTPClient.md#removedirectorystring)([String](TopLevel.String.md)) | Deletes the remote directory on the server identified by the path parameter. |
| [rename](dw.net.FTPClient.md#renamestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Renames an existing file. |
| [setTimeout](dw.net.FTPClient.md#settimeoutnumber)([Number](TopLevel.Number.md)) | Sets the timeout for connections made with the FTP client to the given number of milliseconds. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DEFAULT_GET_FILE_SIZE

- ~~DEFAULT_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 5242880~~
  - : The default size for `get()` returning a File is 5MB

    **Deprecated:**
:::warning
The default size is not supported anymore. The `get()` methods returning a file will
            always try to return [MAX_GET_FILE_SIZE](dw.net.FTPClient.md#max_get_file_size) bytes instead.

:::

---

### DEFAULT_GET_STRING_SIZE

- ~~DEFAULT_GET_STRING_SIZE: [Number](TopLevel.Number.md) = 2097152~~
  - : The default size for `get()` returning a String is 2MB

    **Deprecated:**
:::warning
The default size is not supported anymore. The `get()` methods returning a String will
            always try to return [MAX_GET_STRING_SIZE](dw.net.FTPClient.md#max_get_string_size) bytes instead.

:::

---

### MAX_GET_FILE_SIZE

- MAX_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 209715200
  - : The maximum size for `get()` returning a File is forty times the default size for getting a file. The
      largest file allowed is 200MB.



---

### MAX_GET_STRING_SIZE

- MAX_GET_STRING_SIZE: [Number](TopLevel.Number.md) = 10485760
  - : The maximum size for `get()` returning a String is five times the default size for getting a String.
      The largest String allowed is 10MB.



---

## Property Details

### connected
- connected: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the FTP client is currently connected to the FTP server.


---

### replyCode
- replyCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the reply code from the last FTP action.


---

### replyMessage
- replyMessage: [String](TopLevel.String.md) `(read-only)`
  - : Returns the string message from the last FTP action.


---

### timeout
- timeout: [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.


---

## Constructor Details

### FTPClient()
- FTPClient()
  - : Constructs the FTPClient instance.


---

## Method Details

### cd(String)
- cd(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Changes the current directory on the remote server to the given path.

    **Parameters:**
    - path - the new current directory

    **Returns:**
    - true if the directory change was okay


---

### connect(String)
- connect(host: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the FTP sever

    **Returns:**
    - true when connection is successful, false otherwise.


---

### connect(String, Number)
- connect(host: [String](TopLevel.String.md), port: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to an FTP Server as "anonymous" and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the FTP sever
    - port - Port for FTP server

    **Returns:**
    - true when connection is successful, false otherwise.


---

### connect(String, Number, String, String)
- connect(host: [String](TopLevel.String.md), port: [Number](TopLevel.Number.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to an FTP server and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the FTP sever
    - port - Port for FTP server
    - user - Username for the login
    - password - Password for the login

    **Returns:**
    - true when connection is successful, false otherwise.


---

### connect(String, String, String)
- connect(host: [String](TopLevel.String.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to an FTP server and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the FTP sever
    - user - Username for the login
    - password - Password for the login

    **Returns:**
    - true when connection is successful, false otherwise.


---

### del(String)
- del(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Deletes the remote file on the server identified by the path parameter.

    **Parameters:**
    - path - the path to the file.

    **Returns:**
    - true if the file was successfully deleted, false otherwise.


---

### disconnect()
- disconnect(): void
  - : The method first logs the current user out from the server and then disconnects from the server.


---

### get(String)
- get(path: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Read at
      most MAX\_GET\_STRING\_SIZE bytes.


    **Parameters:**
    - path - remote path of the file to be read.

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.


---

### get(String, Number)
- ~~get(path: [String](TopLevel.String.md), maxGetSize: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)~~
  - : Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Read at
      most maxGetSize characters.


    **Parameters:**
    - path - remote path of the file to be read.
    - maxGetSize - the maximum bytes fetched from the remote file.

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.

    **Deprecated:**
:::warning
The maxGetSize attribute is not supported anymore. Use the method [get(String)](dw.net.FTPClient.md#getstring) instead.
:::

---

### get(String, String)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file and returns it as string using the passed encoding. Read at most
      MAX\_GET\_STRING\_SIZE characters.


    **Parameters:**
    - path - remote path of the file to be read.
    - encoding - an ISO 8859 character encoding labeled as a string, e.g. "ISO-8859-1"

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.


---

### get(String, String, File)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
      read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most
      MAX\_GET\_FILE\_SIZE bytes.


    **Parameters:**
    - path - remote path of the file to be read.
    - encoding - the encoding to use.
    - file - the local file name

    **Returns:**
    - true if remote file is fetched and copied into local file.


---

### get(String, String, File, Number)
- ~~get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), file: [File](dw.io.File.md), maxGetSize: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
      read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most maxGetSize
      bytes.


    **Parameters:**
    - path - remote path of the file to be read.
    - encoding - the encoding to use.
    - file - the local file name
    - maxGetSize - the maximum number of bytes to fetch

    **Returns:**
    - true if remote file is fetched and copied into local file.

    **Deprecated:**
:::warning
The maxGetSize attribute is not supported anymore. Use the method [get(String, String, File)](dw.net.FTPClient.md#getstring-string-file)
            instead.

:::

---

### get(String, String, Number)
- ~~get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), maxGetSize: [Number](TopLevel.Number.md)): [String](TopLevel.String.md)~~
  - : Reads the content of a remote file and returns it as a string using the specified encoding. Returns at most
      maxGetSize characters.


    **Parameters:**
    - path - remote path of the file to be read.
    - encoding - the encoding to use.
    - maxGetSize - the maximum bytes fetched from the remote file.

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.

    **Deprecated:**
:::warning
The maxGetSize attribute is not supported anymore. Use the method [get(String, String)](dw.net.FTPClient.md#getstring-string)
            instead.

:::

---

### getBinary(String, File)
- getBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file and creates a local copy in the given file. Copies at most MAX\_GET\_FILE\_SIZE
      bytes. The FTP transfer is done in Binary mode.


    **Parameters:**
    - path - remote path of the file to be read.
    - file - the local file name

    **Returns:**
    - true if remote file is fetched and copied into local file.


---

### getBinary(String, File, Number)
- ~~getBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md), maxGetSize: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Reads the content of a remote file and creates a local copy in the given file. Copies at most maxGetSize bytes.
      The FTP transfer is done in Binary mode.


    **Parameters:**
    - path - remote path of the file to be read.
    - file - the local file name
    - maxGetSize - the maximum number of bytes to fetch

    **Returns:**
    - true if remote file is fetched and copied into local file.

    **Deprecated:**
:::warning
The maxGetSize attribute is not supported anymore. Use the method [getBinary(String, File)](dw.net.FTPClient.md#getbinarystring-file)
            instead.

:::

---

### getConnected()
- getConnected(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the FTP client is currently connected to the FTP server.

    **Returns:**
    - true if the client is currently connected.


---

### getReplyCode()
- getReplyCode(): [Number](TopLevel.Number.md)
  - : Returns the reply code from the last FTP action.

    **Returns:**
    - the reply code from the last FTP action.


---

### getReplyMessage()
- getReplyMessage(): [String](TopLevel.String.md)
  - : Returns the string message from the last FTP action.

    **Returns:**
    - the string message from the last FTP action.


---

### getTimeout()
- getTimeout(): [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.

    **Returns:**
    - the timeout in milliseconds


---

### list()
- list(): [FTPFileInfo\[\]](dw.net.FTPFileInfo.md)
  - : Returns a list of FTPFileInfo objects containing information about the files in the current directory.

    **Returns:**
    - list of objects with remote file information.


---

### list(String)
- list(path: [String](TopLevel.String.md)): [FTPFileInfo\[\]](dw.net.FTPFileInfo.md)
  - : Returns a list of FTPFileInfo objects containing information about the files in the remote directory defined by
      the given path.


    **Parameters:**
    - path - the remote path from which the file info is listed.

    **Returns:**
    - list of objects with remote file information.


---

### mkdir(String)
- mkdir(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Creates a directory

    **Parameters:**
    - path - the path to the directory to create.

    **Returns:**
    - true if the directory was successfully created, false otherwise.


---

### put(String, String)
- put(path: [String](TopLevel.String.md), content: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Puts the specified content to the specified full path using "ISO-8859-1" encoding. The full path must include the
      path and the file name. If the content of a local file is to be uploaded, please use method
      [putBinary(String, File)](dw.net.FTPClient.md#putbinarystring-file) instead.


    **Parameters:**
    - path - full path on the remote FTP server where the file will be stored.
    - content - the content to put.

    **Returns:**
    - true or false indicating success or failure.


---

### put(String, String, String)
- put(path: [String](TopLevel.String.md), content: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Put the given content to a file on the given full path on the FTP server. The full path must include the path and
      the file name. The transformation from String into binary data is done via the encoding provided with the method
      call. If the content of a local file is to be uploaded, please use method [putBinary(String, File)](dw.net.FTPClient.md#putbinarystring-file)
      instead.


    **Parameters:**
    - path - the full path on the remote FTP server where the file will be stored.
    - content - the content to put.
    - encoding - the encoding to use.

    **Returns:**
    - true or false indicating success or failure.


---

### putBinary(String, File)
- putBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Put the content of the given file into a file on the remote FTP server with the given full path. The full path
      must include the path and the file name.


    **Parameters:**
    - path - the full path on the remote FTP server where the file will be stored.
    - file - the file on the local system, which content is send to the remote FTP server.

    **Returns:**
    - true or false indicating success or failure.


---

### removeDirectory(String)
- removeDirectory(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Deletes the remote directory on the server identified by the path parameter. In order to delete the directory
      successfully the directory needs to be empty, otherwise the removeDirectory() method will return false.


    **Parameters:**
    - path - the path to the directory.

    **Returns:**
    - true if the directory was successfully deleted, false otherwise.


---

### rename(String, String)
- rename(from: [String](TopLevel.String.md), to: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Renames an existing file.

    **Parameters:**
    - from - the file that will be renamed.
    - to - the name of the new file.

    **Returns:**
    - true if the file was successfully renamed, false otherwise.


---

### setTimeout(Number)
- setTimeout(timeoutMillis: [Number](TopLevel.Number.md)): void
  - : Sets the timeout for connections made with the FTP client to the given number of milliseconds. If the given
      timeout is less than or equal to zero, the timeout is set to the same value as the script context timeout but
      will only be set to a maximum of 30 seconds.
      
      
      The maximum and default timeout depend on the script context timeout. The maximum timeout is set to a maximum of
      2 minutes. The default timeout for a new client is set to a maximum of 30 seconds.
      
      
      This method can be called at any time, and will affect the next connection made with this client. It is not
      possible to set the timeout for an open connection.


    **Parameters:**
    - timeoutMillis - timeout, in milliseconds, up to a maximum of 2 minutes.


---

<!-- prettier-ignore-end -->
