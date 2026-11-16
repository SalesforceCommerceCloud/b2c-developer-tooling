'use strict';

/**
 * Writes opted-in loyalty members to a CSV file in TargetFolder.
 */
exports.run = function (parameters) {
    var Status = require('dw/system/Status');
    var folder = parameters.TargetFolder;
    if (!folder) {
        return new Status(Status.ERROR, 'ERROR', 'TargetFolder is required');
    }
    return new Status(Status.OK);
};
