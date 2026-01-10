<!-- prettier-ignore-start -->
# Class SFTPClient

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.SFTPClient](dw.net.SFTPClient.md)

The SFTPClient class supports the SFTP commands GET, PUT, DEL, MKDIR, RENAME, and LIST. The transfer of files can be
text or binary.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information.


An example usage is as follows:




```

 var sftp : SFTPClient = new dw.net.SFTPClient();
 sftp.connect("my.sftp-server.com", "username", "password");
 var data : String = sftp.get("simple.txt");
 sftp.disconnect();
```



The default connection timeout depends on the script context timeout and will be set to a maximum of 30 seconds
(default script context timeout is 10 seconds within storefront requests and 15 minutes within jobs).


**IMPORTANT NOTE:** Before you can make an outbound SFTP connection to a port other than 22, the SFTP server IP address must be enabled
for outbound traffic at the Commerce Cloud Digital firewall for your POD. Please file a support request to request a new firewall
rule.


SSH Version 2 is supported with the following algorithms:
| Type | Algorithms |
| --- |--- |
| Host Key | ssh-ed25519, ecdsa-sha2-nistp256, ecdsa-sha2-nistp384, ecdsa-sha2-nistp521,                  rsa-sha2-512, rsa-sha2-256, ssh-rsa, ssh-dss |
| Key Exchange (KEX) | curve25519-sha256, curve25519-sha256@libssh.org, ecdh-sha2-nistp256,              ecdh-sha2-nistp384, ecdh-sha2-nistp521, diffie-hellman-group-exchange-sha256,              diffie-hellman-group16-sha512, diffie-hellman-group18-sha512, diffie-hellman-group14-sha256,              diffie-hellman-group14-sha1, diffie-hellman-group-exchange-sha1, diffie-hellman-group1-sha1 |
| Cipher | aes128-ctr, aes192-ctr, aes256-ctr, aes128-gcm@openssh.com,              aes256-gcm@openssh.com, aes128-cbc, 3des-ctr, 3des-cbc, blowfish-cbc, aes192-cbc,              aes256-cbc |
| Message Authentication Code (MAC) | hmac-sha2-256-etm@openssh.com, hmac-sha2-512-etm@openssh.com,              hmac-sha1-etm@openssh.com, hmac-sha2-256, hmac-sha2-512, hmac-sha1, hmac-md5, hmac-sha1-96,              hmac-md5-96 |
| Public Key Authentication | rsa-sha2-512, rsa-sha2-256, ssh-rsa |



## Constant Summary

| Constant | Description |
| --- | --- |
| [MAX_GET_FILE_SIZE](#max_get_file_size): [Number](TopLevel.Number.md) = 209715200 | The maximum size for get() methods returning a File is 200 MB. |
| [MAX_GET_STRING_SIZE](#max_get_string_size): [Number](TopLevel.Number.md) = 10485760 | The maximum size for get() methods returning a String is 10 MB. |

## Property Summary

| Property | Description |
| --- | --- |
| [connected](#connected): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the SFTP client is currently connected to the SFTP server. |
| [errorMessage](#errormessage): [String](TopLevel.String.md) `(read-only)` | Returns the error message from the last SFTP action. |
| [identity](#identity): [KeyRef](dw.crypto.KeyRef.md) | Gets the identity (private key) used for the connection. |
| [timeout](#timeout): [Number](TopLevel.Number.md) | Returns the timeout for this client, in milliseconds. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SFTPClient](#sftpclient)() | Constructor. |

## Method Summary

| Method | Description |
| --- | --- |
| [addKnownHostKey](dw.net.SFTPClient.md#addknownhostkeystring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a known public host key for the next connection attempt. |
| [cd](dw.net.SFTPClient.md#cdstring)([String](TopLevel.String.md)) | Changes the current directory on the remote server to the given path. |
| [connect](dw.net.SFTPClient.md#connectstring-number-string-string)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Connects and logs on to a SFTP server and returns a boolean indicating success or failure. |
| [connect](dw.net.SFTPClient.md#connectstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Connects and logs on to a SFTP server and returns a boolean indicating success or failure. |
| [del](dw.net.SFTPClient.md#delstring)([String](TopLevel.String.md)) | Deletes the remote file on the server identified by the path parameter. |
| [disconnect](dw.net.SFTPClient.md#disconnect)() | The method first logs the current user out from the server and then disconnects from the server. |
| [get](dw.net.SFTPClient.md#getstring)([String](TopLevel.String.md)) | Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. |
| [get](dw.net.SFTPClient.md#getstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Reads the content of a remote file and returns it as a string using the specified encoding. |
| [get](dw.net.SFTPClient.md#getstring-string-file)([String](TopLevel.String.md), [String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to  read the file content and using the system standard encoding "UTF-8" to write the file. |
| [getBinary](dw.net.SFTPClient.md#getbinarystring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Reads the content of a remote file and creates a local copy in the given file. |
| [getConnected](dw.net.SFTPClient.md#getconnected)() | Identifies if the SFTP client is currently connected to the SFTP server. |
| [getErrorMessage](dw.net.SFTPClient.md#geterrormessage)() | Returns the error message from the last SFTP action. |
| [getFileInfo](dw.net.SFTPClient.md#getfileinfostring)([String](TopLevel.String.md)) | Returns a SFTPFileInfo objects containing information about the given file/directory path. |
| [getIdentity](dw.net.SFTPClient.md#getidentity)() | Gets the identity (private key) used for the connection. |
| [getTimeout](dw.net.SFTPClient.md#gettimeout)() | Returns the timeout for this client, in milliseconds. |
| [list](dw.net.SFTPClient.md#list)() | Returns a list of SFTPFileInfo objects containing information about the files in the current directory. |
| [list](dw.net.SFTPClient.md#liststring)([String](TopLevel.String.md)) | Returns a list of SFTPFileInfo objects containing information about the files in the remote directory defined by  the given path. |
| [mkdir](dw.net.SFTPClient.md#mkdirstring)([String](TopLevel.String.md)) | Creates a directory |
| [put](dw.net.SFTPClient.md#putstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Puts the specified content to the specified path using "ISO-8859-1" encoding. |
| [put](dw.net.SFTPClient.md#putstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Put the given content to a file on the given path on the SFTP server. |
| [putBinary](dw.net.SFTPClient.md#putbinarystring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Put the content of the given file into a file on the remote SFTP server with the given absolute path. |
| [removeDirectory](dw.net.SFTPClient.md#removedirectorystring)([String](TopLevel.String.md)) | Deletes the remote directory on the server identified by the path parameter. |
| [rename](dw.net.SFTPClient.md#renamestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Renames an existing file. |
| [setIdentity](dw.net.SFTPClient.md#setidentitykeyref)([KeyRef](dw.crypto.KeyRef.md)) | Sets the identity (private key) to use for the next connection attempt. |
| [setTimeout](dw.net.SFTPClient.md#settimeoutnumber)([Number](TopLevel.Number.md)) | Sets the timeout for connections made with the SFTP client to the given number of milliseconds. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### MAX_GET_FILE_SIZE

- MAX_GET_FILE_SIZE: [Number](TopLevel.Number.md) = 209715200
  - : The maximum size for get() methods returning a File is 200 MB.


---

### MAX_GET_STRING_SIZE

- MAX_GET_STRING_SIZE: [Number](TopLevel.Number.md) = 10485760
  - : The maximum size for get() methods returning a String is 10 MB.


---

## Property Details

### connected
- connected: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the SFTP client is currently connected to the SFTP server.


---

### errorMessage
- errorMessage: [String](TopLevel.String.md) `(read-only)`
  - : Returns the error message from the last SFTP action.


---

### identity
- identity: [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity (private key) used for the connection.
      
      
      The key is only associated to this instance of the SFTP client.



---

### timeout
- timeout: [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.


---

## Constructor Details

### SFTPClient()
- SFTPClient()
  - : Constructor.


---

## Method Details

### addKnownHostKey(String, String)
- addKnownHostKey(type: [String](TopLevel.String.md), key: [String](TopLevel.String.md)): void
  - : Adds a known public host key for the next connection attempt.
      
      
      This method associates the key to the host used in the subsequent connect method, and must be called prior to connect.
      The key is not persisted, and is only associated to this instance of the SFTP client.
      
      
      Multiple keys may be added, and the validation will succeed if the remote host matches any of them.
      
      
      The default behavior is to persist and trust an unknown host key if there are no known host keys available.
      If addKnownHostKey is later used to trust specific a specific key or keys, then any previously persisted keys
      will be ignored.


    **Parameters:**
    - type - Type of the host key, such as ssh-rsa
    - key - Public host key, in the same format as OpenSSH.


---

### cd(String)
- cd(path: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Changes the current directory on the remote server to the given path.

    **Parameters:**
    - path - the new current directory

    **Returns:**
    - true if the directory change was okay


---

### connect(String, Number, String, String)
- connect(host: [String](TopLevel.String.md), port: [Number](TopLevel.Number.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to a SFTP server and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the SFTP sever
    - port - Port for SFTP server
    - user - Username for the login
    - password - Password for the login

    **Returns:**
    - true when connection is successful, false otherwise.


---

### connect(String, String, String)
- connect(host: [String](TopLevel.String.md), user: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Connects and logs on to a SFTP server and returns a boolean indicating success or failure.

    **Parameters:**
    - host - Name of the SFTP sever
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
  - : Reads the content of a remote file and returns it as a string using "ISO-8859-1" encoding to read it. Files with
      at most MAX\_GET\_STRING\_SIZE bytes are read.


    **Parameters:**
    - path - remote path of the file to be read.

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.


---

### get(String, String)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Reads the content of a remote file and returns it as a string using the specified encoding. Files with at most
      MAX\_GET\_STRING\_SIZE bytes are read.


    **Parameters:**
    - path - the remote path of the file to be read.
    - encoding - the encoding to use.

    **Returns:**
    - the contents of the file or null if an error occurred while reading the file.


---

### get(String, String, File)
- get(path: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file and creates a local copy in the given file using the passed string encoding to
      read the file content and using the system standard encoding "UTF-8" to write the file. Copies at most
      MAX\_GET\_FILE\_SIZE bytes.


    **Parameters:**
    - path - the remote path of the file to be read.
    - encoding - the encoding to use.
    - file - the local file name

    **Returns:**
    - true if complete remote file is fetched and copied into local file. false, otherwise.


---

### getBinary(String, File)
- getBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Reads the content of a remote file and creates a local copy in the given file. Copies at most MAX\_GET\_FILE\_SIZE
      bytes. The SFTP transfer is done in binary mode.


    **Parameters:**
    - path - the remote path of the file to be read.
    - file - the local file name

    **Returns:**
    - true if complete remote file is fetched and copied into local file. false otherwise


---

### getConnected()
- getConnected(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the SFTP client is currently connected to the SFTP server.

    **Returns:**
    - true if the client is currently connected.


---

### getErrorMessage()
- getErrorMessage(): [String](TopLevel.String.md)
  - : Returns the error message from the last SFTP action.

    **Returns:**
    - the error message from the last SFTP action


---

### getFileInfo(String)
- getFileInfo(path: [String](TopLevel.String.md)): [SFTPFileInfo](dw.net.SFTPFileInfo.md)
  - : Returns a SFTPFileInfo objects containing information about the given file/directory path.

    **Parameters:**
    - path - the remote path from which the file info should be listed.

    **Returns:**
    - the remote file information or `null` if not present.


---

### getIdentity()
- getIdentity(): [KeyRef](dw.crypto.KeyRef.md)
  - : Gets the identity (private key) used for the connection.
      
      
      The key is only associated to this instance of the SFTP client.


    **Returns:**
    - Reference to the private key, or null if not configured


---

### getTimeout()
- getTimeout(): [Number](TopLevel.Number.md)
  - : Returns the timeout for this client, in milliseconds.

    **Returns:**
    - the timeout in milliseconds


---

### list()
- list(): [SFTPFileInfo\[\]](dw.net.SFTPFileInfo.md)
  - : Returns a list of SFTPFileInfo objects containing information about the files in the current directory.

    **Returns:**
    - list of objects with remote file information or `null` if not present.


---

### list(String)
- list(path: [String](TopLevel.String.md)): [SFTPFileInfo\[\]](dw.net.SFTPFileInfo.md)
  - : Returns a list of SFTPFileInfo objects containing information about the files in the remote directory defined by
      the given path.


    **Parameters:**
    - path - the remote path from which the file info should be listed.

    **Returns:**
    - list of objects with remote file information or `null` if not present.


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
  - : Puts the specified content to the specified path using "ISO-8859-1" encoding. If the content of a local file is
      to be uploaded, please use method putBinary(String,File) instead.
      
      
      NOTE: If the remote file already exists, it is overwritten.


    **Parameters:**
    - path - the path on the remote SFTP server, where the file will be stored.
    - content - the content to put.

    **Returns:**
    - true or false indicating success or failure.


---

### put(String, String, String)
- put(path: [String](TopLevel.String.md), content: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Put the given content to a file on the given path on the SFTP server. The transformation from String into binary
      data is done via the encoding provided with the method call. If the content of a local file is to be uploaded,
      please use method putBinary(String,File) instead.
      
      
      NOTE: If the remote file already exists, it is overwritten.


    **Parameters:**
    - path - the path on the remote SFTP server, where the file will be stored.
    - content - the content to put.
    - encoding - the encoding to use.

    **Returns:**
    - true or false indicating success or failure.


---

### putBinary(String, File)
- putBinary(path: [String](TopLevel.String.md), file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Put the content of the given file into a file on the remote SFTP server with the given absolute path. NOTE: If
      the remote file already exists, it is overwritten.


    **Parameters:**
    - path - the path on the remote SFTP server where the file will be stored.
    - file - the file on the local system, which content is send to the remote SFTP server.

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

### setIdentity(KeyRef)
- setIdentity(keyRef: [KeyRef](dw.crypto.KeyRef.md)): void
  - : Sets the identity (private key) to use for the next connection attempt.
      
      
      The key is only associated to this instance of the SFTP client.


    **Parameters:**
    - keyRef - Reference to the private key


---

### setTimeout(Number)
- setTimeout(timeoutMillis: [Number](TopLevel.Number.md)): void
  - : Sets the timeout for connections made with the SFTP client to the given number of milliseconds. If the given
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
