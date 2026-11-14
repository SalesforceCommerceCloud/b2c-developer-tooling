'use strict';

var File = require('dw/io/File');
var server = require('server');

// The pattern from the HttpParameterMap.processMultipart() documentation.
function documented(pdict) {
    var params = pdict.CurrentHttpParameterMap;
    return params.processMultipart(function (field, ct, oname) {
        return new File(File.IMPEX + '/' + params.firstField); // expect
    });
}

server.post('Upload', function (req, res, next) {
    request.httpParameterMap.processMultipart(function (field, contentType, fileName) {
        return new File(File.IMPEX + '/src/upload/' + fileName); // expect
    });
    next();
});

function byField() {
    return request.httpParameterMap.processMultipart((field) => new File(File.TEMP + '/' + field + '.csv')); // expect
}

function namedCallback(fieldName, contentType, originalName) {
    var dir = new File(File.IMPEX + '/src');
    var safeish = originalName.replace(/[^\w.]/g, '_');
    return new File(dir, safeish); // expect
}

function useNamed() {
    return request.httpParameterMap.processMultipart(namedCallback);
}

function joinedPath() {
    return request.httpParameterMap.processMultipart(function (field, ct, oname) {
        return new File([File.TEMP, 'uploads', oname].join(File.SEPARATOR)); // expect
    });
}

server.get('Download', function (req, res, next) {
    var file = new File(File.IMPEX + '/src/exports/' + req.querystring.name); // expect
    res.json({exists: file.exists()});
    next();
});

function renameAfterUpload(uploaded) {
    uploaded.renameTo(new File(File.IMPEX + '/src/' + request.httpParameterMap.target.stringValue)); // expect
}

module.exports = server.exports();
module.exports.helpers = {documented: documented, byField: byField, useNamed: useNamed, joinedPath: joinedPath, renameAfterUpload: renameAfterUpload};
