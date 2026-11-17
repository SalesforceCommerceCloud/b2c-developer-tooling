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

// A personalisation upload that names the stored file after several form fields.
server.post('SaveBlob', function (req, res, next) {
    var form = req.form;
    var name = form.pid + '_' + form.position + '_' + form.color + '_' + form.text + '.jpg';
    var file = new File(File.TEMP + File.SEPARATOR + name); // expect
    res.json({saved: file.name});
    next();
});

server.post('SaveJson', function (req, res, next) {
    var body = JSON.parse(req.body);
    var file = new File(new File(File.TEMP), body.fileName); // expect
    res.json({saved: file.name});
    next();
});

module.exports = server.exports();
module.exports.helpers = {documented: documented, byField: byField, useNamed: useNamed, joinedPath: joinedPath, renameAfterUpload: renameAfterUpload};
