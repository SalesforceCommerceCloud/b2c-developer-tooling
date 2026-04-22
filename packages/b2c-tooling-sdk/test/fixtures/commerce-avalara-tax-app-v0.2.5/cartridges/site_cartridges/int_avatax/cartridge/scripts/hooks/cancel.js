/* eslint-disable */
'use strict';

importPackage(dw.system);
importPackage(dw.order);

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var demoAppLogger = Logger.getLogger('demoApp', 'cancel');

/**
 * Void tax transaction with external provider (e.g., Avalara).
 * This is called when an order is cancelled or failed.
 * Voids the previously committed tax transaction.
 */
exports.cancel = function (order) {
  try {
    demoAppLogger.warn('Starting cancel.js for order: ' + order.getOrderNo());

    // Get the transaction ID that was stored during commit
    var transactionId = order.getCustom().get('taxProviderTransactionId');

    // Simulate API call to external tax provider to void transaction
    // In real implementation, this would call Avalara's void API:
    // var avalaraService = require('~/cartridge/scripts/tax/AvalaraService');
    // var result = avalaraService.voidTransaction(transactionId);

    // Mark order as voided
    order.getCustom().put('taxProviderVoided', 'true');

    demoAppLogger.info('Tax transaction voided: ' + transactionId);
    return new Status(Status.OK, 'Tax transaction voided: ' + transactionId);
  } catch (e) {
    demoAppLogger.error('Failed to void tax: ' + e.message);
    return new Status(Status.ERROR, 'TAX_VOID_FAILED', 'Failed to void tax: ' + e.message);
  }
};
