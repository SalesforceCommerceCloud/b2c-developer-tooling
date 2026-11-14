'use strict';

var File = require('dw/io/File');
var UUIDUtils = require('dw/util/UUIDUtils');

var EXTENSIONS = {'image/png': 'png', 'image/jpeg': 'jpg', 'text/csv': 'csv'};

// Returning a directory lets the platform generate a unique file name.
function toDirectory() {
    var dir = new File(File.TEMP + '/uploads');
    dir.mkdirs();
    return request.httpParameterMap.processMultipart(function () {
        return dir;
    });
}

// The name is generated on the server; the extension comes from an allowlist lookup.
function generatedName() {
    return request.httpParameterMap.processMultipart(function (field, contentType) {
        var ext = EXTENSIONS[contentType];
        if (field !== 'attachment' || !ext) return null;
        return new File(File.TEMP + '/uploads/' + UUIDUtils.createUUID() + '.' + ext);
    });
}

function fixedFile() {
    return new File(File.IMPEX + '/src/feeds/catalog.xml');
}

module.exports = {toDirectory: toDirectory, generatedName: generatedName, fixedFile: fixedFile};
