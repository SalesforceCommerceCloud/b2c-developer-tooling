# FTP/SFTP Services Reference

Patterns for implementing file transfer integrations. SFTP is recommended over FTP for security.

## FTPService Methods

| Method | Description |
|--------|-------------|
| `setOperation(name, args...)` | Set single operation to perform |
| `setAutoDisconnect(bool)` | Control auto-disconnect after call |
| `getClient()` | Get underlying FTPClient or SFTPClient |

## Configuration Styles

There are two approaches to FTP service configuration:

### Style 1: setOperation (Simple)

Use `setOperation` in `createRequest` for single operations:

```javascript
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var ftpService = LocalServiceRegistry.createService('my.ftp.service', {
    createRequest: function (svc, params) {
        // Set the operation to perform
        svc.setOperation('list', params.directory);
    },

    parseResponse: function (svc, response) {
        // response is the return value of the operation
        return response;
    },

    filterLogMessage: function (msg) {
        return msg.replace(/password=[^&\s]+/gi, 'password=***');
    }
});
```

### Style 2: execute (Advanced)

Use `execute` for multiple operations or complex logic:

```javascript
var ftpService = LocalServiceRegistry.createService('my.ftp.service', {
    execute: function (svc, params) {
        var client = svc.client; // SFTPClient or FTPClient

        // Perform multiple operations
        var files = client.list(params.directory);
        var results = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.name.indexOf('.xml') > -1) {
                var content = client.get(params.directory + '/' + file.name);
                results.push({
                    name: file.name,
                    content: content
                });
            }
        }

        return results;
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## SFTP Operations

Common SFTPClient operations:

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `list` | List directory contents | `(path)` |
| `get` | Download file to string | `(remotePath)` |
| `getBinary` | Download file to File | `(remotePath, localFile)` |
| `put` | Upload string content | `(remotePath, content)` |
| `putBinary` | Upload File | `(remotePath, localFile)` |
| `del` | Delete file | `(remotePath)` |
| `mkdir` | Create directory | `(remotePath)` |
| `rmdir` | Remove directory | `(remotePath)` |
| `rename` | Rename/move file | `(oldPath, newPath)` |
| `getFileInfo` | Get file metadata | `(remotePath)` |
| `cd` | Change directory | `(path)` |

## List Directory

```javascript
var listService = LocalServiceRegistry.createService('my.sftp.list', {
    createRequest: function (svc, directory) {
        svc.setOperation('list', directory || '/');
    },

    parseResponse: function (svc, fileList) {
        // fileList is an array of SFTPFileInfo objects
        var files = [];
        for (var i = 0; i < fileList.length; i++) {
            var f = fileList[i];
            files.push({
                name: f.name,
                directory: f.directory,
                size: f.size,
                modificationTime: f.modificationTime
            });
        }
        return files;
    },

    mockCall: function (svc, request) {
        return [
            { name: 'file1.xml', directory: false, size: 1024, modificationTime: new Date() },
            { name: 'file2.xml', directory: false, size: 2048, modificationTime: new Date() }
        ];
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = listService.call('/incoming');
if (result.ok) {
    var files = result.object;
}
```

## Download File

### Download to String

```javascript
var downloadService = LocalServiceRegistry.createService('my.sftp.download', {
    createRequest: function (svc, remotePath) {
        svc.setOperation('get', remotePath);
    },

    parseResponse: function (svc, content) {
        // content is the file contents as a string
        return content;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = downloadService.call('/incoming/data.xml');
if (result.ok) {
    var content = result.object;
}
```

### Download to Local File

```javascript
var File = require('dw/io/File');

var downloadBinaryService = LocalServiceRegistry.createService('my.sftp.download.binary', {
    createRequest: function (svc, params) {
        var localFile = new File(File.IMPEX + '/src/' + params.localFilename);
        svc.setOperation('getBinary', params.remotePath, localFile);
    },

    parseResponse: function (svc, success) {
        return success; // boolean
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = downloadBinaryService.call({
    remotePath: '/incoming/large-file.zip',
    localFilename: 'downloaded.zip'
});
```

## Upload File

### Upload String Content

```javascript
var uploadService = LocalServiceRegistry.createService('my.sftp.upload', {
    createRequest: function (svc, params) {
        svc.setOperation('put', params.remotePath, params.content);
    },

    parseResponse: function (svc, success) {
        return success; // boolean
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var xmlContent = '<?xml version="1.0"?><data><item>value</item></data>';
var result = uploadService.call({
    remotePath: '/outgoing/export.xml',
    content: xmlContent
});
```

### Upload Local File

```javascript
var File = require('dw/io/File');

var uploadBinaryService = LocalServiceRegistry.createService('my.sftp.upload.binary', {
    createRequest: function (svc, params) {
        var localFile = new File(File.IMPEX + '/src/' + params.localFilename);
        svc.setOperation('putBinary', params.remotePath, localFile);
    },

    parseResponse: function (svc, success) {
        return success;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = uploadBinaryService.call({
    localFilename: 'export.csv',
    remotePath: '/outgoing/export.csv'
});
```

## Delete File

```javascript
var deleteService = LocalServiceRegistry.createService('my.sftp.delete', {
    createRequest: function (svc, remotePath) {
        svc.setOperation('del', remotePath);
    },

    parseResponse: function (svc, success) {
        return success;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = deleteService.call('/incoming/processed-file.xml');
```

## Create Directory

```javascript
var mkdirService = LocalServiceRegistry.createService('my.sftp.mkdir', {
    createRequest: function (svc, remotePath) {
        svc.setOperation('mkdir', remotePath);
    },

    parseResponse: function (svc, success) {
        return success;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Move/Rename File

```javascript
var renameService = LocalServiceRegistry.createService('my.sftp.rename', {
    createRequest: function (svc, params) {
        svc.setOperation('rename', params.oldPath, params.newPath);
    },

    parseResponse: function (svc, success) {
        return success;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage - move file to processed folder
var result = renameService.call({
    oldPath: '/incoming/data.xml',
    newPath: '/processed/data.xml'
});
```

## Complex Multi-Operation Example

Process files from an SFTP server:

```javascript
var File = require('dw/io/File');

var processingService = LocalServiceRegistry.createService('my.sftp.processor', {
    execute: function (svc, params) {
        var client = svc.client;
        var results = {
            processed: [],
            errors: []
        };

        // List files in incoming directory
        var files = client.list(params.incomingDir);

        for (var i = 0; i < files.length; i++) {
            var fileInfo = files[i];

            // Skip directories and non-XML files
            if (fileInfo.directory || fileInfo.name.indexOf('.xml') === -1) {
                continue;
            }

            try {
                var remotePath = params.incomingDir + '/' + fileInfo.name;

                // Download file content
                var content = client.get(remotePath);

                // Move to processed folder
                var processedPath = params.processedDir + '/' + fileInfo.name;
                client.rename(remotePath, processedPath);

                results.processed.push({
                    name: fileInfo.name,
                    content: content,
                    size: fileInfo.size
                });

            } catch (e) {
                results.errors.push({
                    name: fileInfo.name,
                    error: e.message
                });
            }
        }

        return results;
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = processingService.call({
    incomingDir: '/incoming',
    processedDir: '/processed'
});

if (result.ok) {
    var processed = result.object.processed;
    var errors = result.object.errors;
}
```

## Keep Connection Open

For multiple operations in sequence:

```javascript
var ftpService = LocalServiceRegistry.createService('my.sftp.multiop', {
    createRequest: function (svc, params) {
        // Don't disconnect after this call
        svc.setAutoDisconnect(false);
        svc.setOperation('list', params.directory);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// First call - get file list
var listResult = ftpService.call({ directory: '/incoming' });

// Process each file with the same connection
if (listResult.ok) {
    var files = listResult.object;
    // Connection remains open for subsequent calls
}
```

## SFTP Key Authentication

For SFTP with key-based authentication, configure the service credential in Business Manager with the private key.

```javascript
var sftpKeyService = LocalServiceRegistry.createService('my.sftp.key.auth', {
    // Key authentication is configured in BM credential
    createRequest: function (svc, directory) {
        svc.setOperation('list', directory);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## File Info

Get metadata about a specific file:

```javascript
var fileInfoService = LocalServiceRegistry.createService('my.sftp.fileinfo', {
    createRequest: function (svc, remotePath) {
        svc.setOperation('getFileInfo', remotePath);
    },

    parseResponse: function (svc, fileInfo) {
        if (fileInfo) {
            return {
                name: fileInfo.name,
                size: fileInfo.size,
                directory: fileInfo.directory,
                modificationTime: fileInfo.modificationTime
            };
        }
        return null;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = fileInfoService.call('/incoming/data.xml');
if (result.ok && result.object) {
    var info = result.object;
    var lastModified = info.modificationTime;
}
```

## Mock FTP Operations

```javascript
var mockFtpService = LocalServiceRegistry.createService('my.sftp.mock', {
    createRequest: function (svc, directory) {
        svc.setOperation('list', directory);
    },

    parseResponse: function (svc, response) {
        var files = [];
        for (var i = 0; i < response.length; i++) {
            files.push({
                name: response[i].name,
                size: response[i].size
            });
        }
        return files;
    },

    mockCall: function (svc, request) {
        // Return mock file list
        return [
            { name: 'test1.xml', size: 1024, directory: false },
            { name: 'test2.xml', size: 2048, directory: false },
            { name: 'archive', size: 0, directory: true }
        ];
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## FTP (Legacy)

FTP is deprecated. Use SFTP instead. The API is similar:

```javascript
// FTPClient operations (deprecated)
var ftpLegacyService = LocalServiceRegistry.createService('my.ftp.legacy', {
    createRequest: function (svc, params) {
        svc.setOperation('list', params.directory);
    },

    parseResponse: function (svc, response) {
        // FTPFileInfo objects
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```
