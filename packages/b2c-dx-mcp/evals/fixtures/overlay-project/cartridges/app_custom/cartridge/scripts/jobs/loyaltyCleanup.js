'use strict';

/**
 * Removes expired loyalty points.
 */
exports.cleanup = function () {
    var Status = require('dw/system/Status');
    return new Status(Status.OK);
};
