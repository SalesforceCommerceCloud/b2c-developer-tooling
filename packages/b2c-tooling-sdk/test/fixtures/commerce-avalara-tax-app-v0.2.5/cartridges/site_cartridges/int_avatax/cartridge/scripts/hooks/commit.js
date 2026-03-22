/* eslint-disable */
'use strict';

importPackage(dw.system);
importPackage(dw.order);

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var demoAppLogger = Logger.getLogger('demoApp', 'commit');

/**
 * Commit tax transaction with external provider (e.g., Avalara).
 * This is called after an order is successfully placed.
 * Records the transaction ID from the tax provider for audit purposes.
 */
exports.commit = function (order) {
  try {
    demoAppLogger.warn('Starting commit.js for order: ' + order.getOrderNo());

    // Simulate API call to external tax provider to commit transaction
    // In real implementation, this would call Avalara's commit API:
    // var avalaraService = require('~/cartridge/scripts/tax/AvalaraService');
    // var result = avalaraService.commitTransaction(order);

    // Generate mock transaction ID
    var transactionId = 'AVALARA-TX-12345';

    // Store transaction ID on order for future reference (voids, adjustments, etc.)
    order.getCustom().put('taxProviderTransactionId', transactionId);

    demoAppLogger.info('Tax transaction committed: ' + transactionId);
    return new Status(Status.OK, 'Tax transaction committed: ' + transactionId);
  } catch (e) {
    demoAppLogger.error('Failed to commit tax: ' + e.message);
    return new Status(Status.ERROR, 'TAX_COMMIT_FAILED', 'Failed to commit tax: ' + e.message);
  }
};
