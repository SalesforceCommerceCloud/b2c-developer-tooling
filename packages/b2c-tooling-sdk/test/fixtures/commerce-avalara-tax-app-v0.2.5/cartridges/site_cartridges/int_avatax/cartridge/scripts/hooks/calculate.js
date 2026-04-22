/* eslint-disable */
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var avataxHelper = require('~/cartridge/scripts/helpers/avataxHelper');

var logger = Logger.getLogger('AvaTax', 'calculate');

/**
 * Calculate taxes using AvaTax API.
 * Calls AvaTax sandbox to get real-time tax calculation and stores custom tax details.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The basket or order to calculate taxes for
 * @returns {dw.system.Status} Status indicating success or failure
 */
exports.calculate = function (lineItemCtnr) {
  logger.warn('Starting AvaTax tax calculation for basket: ' + lineItemCtnr.getUUID());

  try {
    // Set custom fields for tax app metadata
    Transaction.wrap(function () {
      lineItemCtnr.custom.commerceTaxApp_TaxDetails = 'AvaTax: Real-time tax calculation';
      lineItemCtnr.custom.commerceTaxApp_federal_tax_amount = '0.00'; // Will be updated after API call
      lineItemCtnr.custom.commerceTaxApp_state_tax_amount = '0.00'; // Will be updated after API call

      // Force basket to recalculate and sync line item-shipment associations
      // This ensures shipping addresses are properly associated with line items
      // before we build the AvaTax transaction model
      lineItemCtnr.updateTotals();
    });

    // Build AvaTax transaction model
    var transactionModel = avataxHelper.buildTransactionModel(lineItemCtnr);

    if (!transactionModel.lines || transactionModel.lines.length === 0) {
      logger.warn('No taxable line items found in basket');
      return new Status(Status.OK, 'No taxable items');
    }

    logger.warn('Calling AvaTax API with ' + transactionModel.lines.length + ' line items');

    // Call AvaTax API
    var response = avataxHelper.callAvaTaxAPI(transactionModel);

    if (!response.success) {
      logger.error('AvaTax API call failed: ' + response.error);

      // Fall back to zero tax on error
      Transaction.wrap(function () {
        setZeroTax(lineItemCtnr);
        lineItemCtnr.custom.commerceTaxApp_TaxDetails = 'AvaTax Error: ' + response.error;
      });

      return new Status(Status.OK, 'Tax calculation failed, applied zero tax');
    }

    // Apply taxes from AvaTax response
    Transaction.wrap(function () {
      // Apply individual line item taxes and recalculate basket totals
      avataxHelper.applyTaxesToBasket(lineItemCtnr, response.data);

      // Update custom fields with tax breakdown
      var totalTax = response.data.totalTax || 0;
      var stateTax = calculateStateTax(response.data);
      var federalTax = totalTax - stateTax;

      lineItemCtnr.custom.commerceTaxApp_federal_tax_amount = federalTax.toFixed(2);
      lineItemCtnr.custom.commerceTaxApp_state_tax_amount = stateTax.toFixed(2);
      lineItemCtnr.custom.commerceTaxApp_TaxDetails =
        'AvaTax: Total Tax $' +
        totalTax.toFixed(2) +
        ' (Federal: $' +
        federalTax.toFixed(2) +
        ', State: $' +
        stateTax.toFixed(2) +
        ')';
    });

    logger.warn('AvaTax tax calculation completed successfully. Total tax: $' + response.data.totalTax);
    return new Status(Status.OK, 'Taxes calculated via AvaTax');
  } catch (e) {
    logger.error('Error during tax calculation: ' + e.message + '\n' + e.stack);

    // Fall back to zero tax on exception
    Transaction.wrap(function () {
      setZeroTax(lineItemCtnr);
      lineItemCtnr.custom.commerceTaxApp_TaxDetails = 'AvaTax Exception: ' + e.message;
    });

    return new Status(Status.ERROR, 'Tax calculation exception');
  }
};

/**
 * Sets all line items to zero tax (fallback for errors)
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The basket or order
 */
function setZeroTax(lineItemCtnr) {
  var Money = require('dw/value/Money');
  var zeroTax = new Money(0, lineItemCtnr.getCurrencyCode());

  var lineItems = lineItemCtnr.getAllLineItems().iterator();
  while (lineItems.hasNext()) {
    var lineItem = lineItems.next();
    try {
      lineItem.setTax(zeroTax);
      lineItem.updateTax(0);
    } catch (e) {
      // Some line items may not support tax (e.g., price adjustments)
    }
  }
}

/**
 * Calculates state tax from AvaTax response
 * @param {Object} avaTaxResponse - The AvaTax API response
 * @returns {Number} Total state tax amount
 */
function calculateStateTax(avaTaxResponse) {
  var stateTax = 0;

  if (!avaTaxResponse.summary || !avaTaxResponse.summary.length) {
    return stateTax;
  }

  avaTaxResponse.summary.forEach(function (jurisdiction) {
    // State-level jurisdictions
    if (jurisdiction.jurisType === 'State' || jurisdiction.jurisType === 'STA') {
      stateTax += jurisdiction.tax || 0;
    }
  });

  return stateTax;
}
