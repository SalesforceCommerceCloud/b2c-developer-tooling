'use strict';

var Status = require('dw/system/Status');

/**
 * Tags new baskets with the loyalty program so the storefront can show points.
 */
exports.afterPOST = function (basket) {
    basket.custom.loyaltyProgram = 'gold';
    return new Status(Status.OK);
};
