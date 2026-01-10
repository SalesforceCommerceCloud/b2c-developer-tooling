# Task-Oriented Job Steps Reference

Complete patterns for task-oriented job steps.

## When to Use

- FTP file transfers
- Import/export operations
- Report generation
- External API calls
- Cleanup operations
- Any non-iterable task

## Basic Structure

```javascript
'use strict';

var Status = require('dw/system/Status');

exports.execute = function (parameters, stepExecution) {
    // Your logic here
    return new Status(Status.OK);
};
```

## Status Codes

Custom status codes work **only** with `Status.OK`. Custom codes with `Status.ERROR` are replaced with ERROR.

```javascript
// Custom OK codes work - these are useful for flow transitions
return new Status(Status.OK, 'NO_DATA', 'No files found');
return new Status(Status.OK, 'PARTIAL', 'Some items processed');

// ERROR always becomes ERROR - custom code is ignored
return new Status(Status.ERROR, null, 'Something failed');  // Code will be ERROR
```

## Step Execution Context

```javascript
exports.execute = function (parameters, stepExecution) {
    // Access job information
    var jobId = stepExecution.jobExecution.jobID;
    var stepId = stepExecution.stepID;
    var startTime = stepExecution.startTime;

    // Access custom exit status if set
    var exitStatus = stepExecution.exitStatus;
};
```

## FTP Download Example

```javascript
'use strict';

var Status = require('dw/system/Status');
var FTPClient = require('dw/net/FTPClient');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'FTPDownload');

exports.execute = function (parameters, stepExecution) {
    var host = parameters.Host;
    var username = parameters.Username;
    var password = parameters.Password;
    var remoteFile = parameters.RemoteFile;
    var localPath = parameters.LocalPath;

    var ftp = new FTPClient();

    try {
        // Connect
        log.info('Connecting to ' + host);
        ftp.connect(host, username, password);

        if (!ftp.connected) {
            return new Status(Status.ERROR, 'CONNECT_FAILED', 'Failed to connect to FTP server');
        }

        // Download file
        log.info('Downloading ' + remoteFile);
        var localFile = new File(File.IMPEX + localPath);
        var success = ftp.getBinary(remoteFile, localFile);

        if (!success) {
            return new Status(Status.ERROR, 'DOWNLOAD_FAILED', 'Failed to download file');
        }

        log.info('Download complete: ' + localFile.fullPath);
        return new Status(Status.OK);

    } catch (e) {
        log.error('FTP error: ' + e.message);
        return new Status(Status.ERROR, 'FTP_ERROR', e.message);

    } finally {
        if (ftp.connected) {
            ftp.disconnect();
        }
    }
};
```

## SFTP Example

```javascript
'use strict';

var Status = require('dw/system/Status');
var SFTPClient = require('dw/net/SFTPClient');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'SFTPUpload');

exports.execute = function (parameters, stepExecution) {
    var host = parameters.Host;
    var port = parameters.Port || 22;
    var username = parameters.Username;
    var password = parameters.Password;
    var localPath = parameters.LocalFile;
    var remotePath = parameters.RemotePath;

    var sftp = new SFTPClient();

    try {
        sftp.connect(host, port, username, password);

        if (!sftp.connected) {
            return new Status(Status.ERROR, 'CONNECT_FAILED');
        }

        var localFile = new File(File.IMPEX + localPath);
        if (!localFile.exists()) {
            return new Status(Status.ERROR, 'FILE_NOT_FOUND', 'Local file not found');
        }

        sftp.putBinary(remotePath, localFile);
        log.info('Uploaded: ' + localFile.name + ' to ' + remotePath);

        return new Status(Status.OK);

    } finally {
        if (sftp.connected) {
            sftp.disconnect();
        }
    }
};
```

## HTTP/REST API Example

```javascript
'use strict';

var Status = require('dw/system/Status');
var HTTPClient = require('dw/net/HTTPClient');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'APISync');

exports.execute = function (parameters, stepExecution) {
    var apiUrl = parameters.APIUrl;
    var apiKey = parameters.APIKey;

    var http = new HTTPClient();
    http.setTimeout(30000);
    http.setRequestHeader('Authorization', 'Bearer ' + apiKey);
    http.setRequestHeader('Content-Type', 'application/json');

    try {
        http.open('POST', apiUrl);
        http.send(JSON.stringify({ action: 'sync', timestamp: new Date().toISOString() }));

        var statusCode = http.statusCode;
        var responseText = http.text;

        if (statusCode >= 200 && statusCode < 300) {
            log.info('API sync successful');
            return new Status(Status.OK);
        } else {
            log.error('API error: ' + statusCode + ' - ' + responseText);
            return new Status(Status.ERROR, 'API_ERROR', 'HTTP ' + statusCode);
        }

    } catch (e) {
        log.error('HTTP error: ' + e.message);
        return new Status(Status.ERROR, 'HTTP_ERROR', e.message);
    }
};
```

## File Processing Example

```javascript
'use strict';

var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'FileProcessor');

exports.execute = function (parameters, stepExecution) {
    var inputPath = parameters.InputFile;
    var outputPath = parameters.OutputFile;

    var inputFile = new File(File.IMPEX + inputPath);
    if (!inputFile.exists()) {
        return new Status(Status.ERROR, 'FILE_NOT_FOUND', 'Input file not found');
    }

    var outputFile = new File(File.IMPEX + outputPath);
    var reader;
    var writer;

    try {
        reader = new FileReader(inputFile);
        writer = new FileWriter(outputFile);

        var line;
        var lineCount = 0;

        while ((line = reader.readLine()) !== null) {
            // Process line
            var processed = line.toUpperCase();  // Example transformation
            writer.writeLine(processed);
            lineCount++;
        }

        log.info('Processed ' + lineCount + ' lines');
        return new Status(Status.OK);

    } finally {
        if (reader) reader.close();
        if (writer) writer.close();
    }
};
```

## Cleanup Example

```javascript
'use strict';

var Status = require('dw/system/Status');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'FileCleanup');

exports.execute = function (parameters, stepExecution) {
    var directory = parameters.Directory;
    var maxAgeHours = parameters.MaxAgeHours || 24;

    var folder = new File(File.IMPEX + directory);
    if (!folder.exists() || !folder.directory) {
        return new Status(Status.ERROR, 'INVALID_PATH', 'Directory not found');
    }

    var files = folder.listFiles();
    var cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    var deletedCount = 0;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.directory && file.lastModified() < cutoffTime) {
            file.remove();
            deletedCount++;
            log.info('Deleted: ' + file.name);
        }
    }

    log.info('Cleanup complete. Deleted ' + deletedCount + ' files.');
    return new Status(Status.OK, 'OK', 'Deleted ' + deletedCount + ' files');
};
```

## steptypes.json for Task Steps

```json
{
    "step-types": {
        "script-module-step": [
            {
                "@type-id": "custom.FTPDownload",
                "@supports-parallel-execution": "false",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Download file from FTP server",
                "module": "my_cartridge/cartridge/scripts/steps/ftpDownload.js",
                "function": "execute",
                "timeout-in-seconds": 600,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "Host",
                            "@type": "string",
                            "@required": "true",
                            "description": "FTP server hostname"
                        },
                        {
                            "@name": "Username",
                            "@type": "string",
                            "@required": "true"
                        },
                        {
                            "@name": "Password",
                            "@type": "string",
                            "@required": "true"
                        },
                        {
                            "@name": "RemoteFile",
                            "@type": "string",
                            "@required": "true",
                            "description": "Remote file path"
                        },
                        {
                            "@name": "LocalPath",
                            "@type": "string",
                            "@required": "true",
                            "description": "Local path (relative to IMPEX)"
                        }
                    ]
                },
                "status-codes": {
                    "status": [
                        { "@code": "OK", "description": "Download successful" },
                        { "@code": "ERROR", "description": "Download failed" },
                        { "@code": "CONNECT_FAILED", "description": "Connection failed" },
                        { "@code": "DOWNLOAD_FAILED", "description": "File download failed" }
                    ]
                }
            }
        ]
    }
}
```
