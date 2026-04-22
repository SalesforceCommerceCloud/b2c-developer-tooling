'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var logger = Logger.getLogger('AvaTax', 'avataxHelper');

/**
 * Gets AvaTax configuration from Site Custom Preferences
 * @returns {Object} Configuration object
 */
function getConfig() {
  var currentSite = Site.getCurrent();

  return {
    baseUrl: currentSite.getCustomPreferenceValue('ATServiceURL') || 'https://sandbox-rest.avatax.com',
    accountId: currentSite.getCustomPreferenceValue('ATAccountID') || '1100046103', // TODO: Remove
    licenseKey: currentSite.getCustomPreferenceValue('ATLicenseKey') || '8CC13BF3AE2B8122', // TODO: Remove
    companyCode: currentSite.getCustomPreferenceValue('ATCompanyCode') || 'dwre', // TODO: Remove
    enabled: currentSite.getCustomPreferenceValue('ATEnable') || true, // TODO: Make false
  };
}

/**
 * Builds the AvaTax CreateTransaction request payload
 * @param {dw.order.LineItemCtnr} basket - The basket or order
 * @returns {Object} Transaction model for AvaTax API
 */
function buildTransactionModel(basket) {
  var lines = [];
  var lineNumber = 0;
  var currentSite = Site.getCurrent();

  // Get ship-from address from site preferences
  var shipFrom = {
    locationCode: currentSite.getCustomPreferenceValue('ATShipFromLocationCode') || '',
    line1: currentSite.getCustomPreferenceValue('ATShipFromLine1') || '5 Wall Street',
    line2: currentSite.getCustomPreferenceValue('ATShipFromLine2') || '',
    line3: currentSite.getCustomPreferenceValue('ATShipFromLine3') || '',
    city: currentSite.getCustomPreferenceValue('ATShipFromCity') || 'Burlington',
    region: currentSite.getCustomPreferenceValue('ATShipFromStateCode') || 'MA',
    country: currentSite.getCustomPreferenceValue('ATShipFromCountryCode') || 'US',
    postalCode: currentSite.getCustomPreferenceValue('ATShipFromZipCode') || '01803',
    latitude: currentSite.getCustomPreferenceValue('ATShipFromLatitude') || '',
    longitude: currentSite.getCustomPreferenceValue('ATShipFromLongitude') || '',
  };

  // Get default tax codes from site preferences
  var defaultProductTaxCode = currentSite.getCustomPreferenceValue('ATDefaultProductTaxCode') || 'P0000000';
  var defaultShippingTaxCode = currentSite.getCustomPreferenceValue('ATDefaultShippingMethodTaxCode') || 'FR020100';

  // Process product line items
  var productLineItems = basket.getAllProductLineItems();
  var pliCount = productLineItems.length;
  logger.warn('Processing ' + pliCount + ' product line items for basket: ' + basket.getUUID());

  // Log all shipments in basket
  var shipments = basket.getShipments();
  logger.warn('Basket has ' + shipments.length + ' shipments');
  for (var i = 0; i < shipments.length; i++) {
    var s = shipments[i];
    var hasAddr = s.getShippingAddress() != null;
    logger.warn(
      'Shipment[' +
        i +
        '] ID=' +
        s.getID() +
        ', hasAddress=' +
        hasAddr +
        (hasAddr ? ', city=' + s.getShippingAddress().city : ''),
    );
  }

  var pliIterator = productLineItems.iterator();
  while (pliIterator.hasNext()) {
    var pli = pliIterator.next();
    var shipment = pli.getShipment();

    if (!shipment) {
      logger.warn('Product line item has no shipment: ' + pli.productID);
      continue;
    }

    logger.warn('PLI ' + pli.productID + ' -> Shipment ' + shipment.getID());

    if (!shipment.getShippingAddress()) {
      logger.warn('Shipment has no shipping address: ' + pli.productID + ', shipmentID: ' + shipment.getID());
      continue;
    }

    var shippingAddress = shipment.getShippingAddress();
    var shipTo = {
      line1: shippingAddress.address1 || '',
      line2: shippingAddress.address2 || '',
      city: shippingAddress.city || '',
      region: shippingAddress.stateCode || '',
      country: shippingAddress.countryCode ? shippingAddress.countryCode.value : 'US',
      postalCode: shippingAddress.postalCode || '',
    };

    lines.push({
      number: ++lineNumber,
      quantity: pli.quantityValue,
      amount: pli.adjustedGrossPrice.value,
      taxCode: pli.getProduct() && pli.getProduct().taxClassID ? pli.getProduct().taxClassID : defaultProductTaxCode,
      itemCode: pli.productID,
      description: pli.productName.substring(0, 255),
      addresses: {
        shipFrom: shipFrom,
        shipTo: shipTo,
      },
    });
  }

  // Process shipping line items
  var shipments = basket.getShipments().iterator();
  while (shipments.hasNext()) {
    var shipment = shipments.next();
    var shippingAddress = shipment.getShippingAddress();

    if (!shippingAddress) {
      logger.warn('Shipment ' + shipment.getID() + ' has no shipping address, skipping shipping line items');
      continue;
    }

    var shippingLineItems = shipment.getShippingLineItems().iterator();
    while (shippingLineItems.hasNext()) {
      var sli = shippingLineItems.next();

      // Only add shipping line item if it has a cost
      var shippingAmount = sli.adjustedPrice ? sli.adjustedPrice.value : 0;
      if (shippingAmount <= 0) {
        logger.debug('Shipping line item ' + sli.ID + ' has zero cost, skipping');
        continue;
      }

      var shipTo = {
        line1: shippingAddress.address1 || '',
        line2: shippingAddress.address2 || '',
        city: shippingAddress.city || '',
        region: shippingAddress.stateCode || '',
        country: shippingAddress.countryCode ? shippingAddress.countryCode.value : 'US',
        postalCode: shippingAddress.postalCode || '',
      };

      lines.push({
        number: ++lineNumber,
        quantity: 1,
        amount: shippingAmount,
        taxCode: sli.taxClassID || defaultShippingTaxCode,
        itemCode: sli.ID,
        description: sli.lineItemText || 'Shipping',
        addresses: {
          shipFrom: shipFrom,
          shipTo: shipTo,
        },
      });

      logger.debug('Added shipping line ' + lineNumber + ': $' + shippingAmount);
    }
  }

  // Build transaction model
  var config = getConfig();

  if (lines.length === 0) {
    logger.warn(
      'No taxable line items found for basket ' +
        basket.getUUID() +
        '. This often happens on first address set before line items are properly associated with shipments.',
    );
  } else {
    logger.debug('Built transaction model with ' + lines.length + ' line items');
  }

  var transactionModel = {
    type: 'SalesOrder',
    companyCode: config.companyCode,
    date: new Date().toISOString().split('T')[0],
    customerCode: basket.getCustomerEmail() || 'guest-' + basket.getUUID(),
    currencyCode: basket.getCurrencyCode(),
    lines: lines,
    commit: false,
  };

  return transactionModel;
}

/**
 * Calls AvaTax CreateTransaction API
 * @param {Object} transactionModel - The transaction request payload
 * @returns {Object} Response object with {success: boolean, data: Object, error: String}
 */
function callAvaTaxAPI(transactionModel) {
  var HTTPClient = require('dw/net/HTTPClient');
  var httpClient = new HTTPClient();
  var config = getConfig();

  // Check if AvaTax is enabled
  if (!config.enabled) {
    logger.warn('AvaTax is not enabled in site preferences');
    return {
      success: false,
      error: 'AvaTax not enabled',
    };
  }

  // Check if credentials are configured
  if (!config.accountId || !config.licenseKey) {
    logger.error('AvaTax credentials not configured in site preferences');
    return {
      success: false,
      error: 'AvaTax credentials not configured. Please set ATAccountID and ATLicenseKey in Site Preferences.',
    };
  }

  try {
    var url = config.baseUrl + '/api/v2/transactions/create';

    // Set up Basic Auth
    var credentials = config.accountId + ':' + config.licenseKey;
    var encodedCredentials = require('dw/util/StringUtils').encodeBase64(credentials);

    httpClient.open('POST', url);
    httpClient.setRequestHeader('Authorization', 'Basic ' + encodedCredentials);
    httpClient.setRequestHeader('Content-Type', 'application/json');

    var requestBody = JSON.stringify(transactionModel);
    logger.debug('AvaTax Request: ' + requestBody);

    httpClient.send(requestBody);

    var statusCode = httpClient.getStatusCode();
    var responseText = httpClient.getText();

    logger.debug('AvaTax Response Status: ' + statusCode);
    logger.debug('AvaTax Response: ' + responseText);

    if (statusCode === 200 || statusCode === 201) {
      return {
        success: true,
        data: JSON.parse(responseText),
      };
    } else {
      var errorResponse = responseText ? JSON.parse(responseText) : {};
      return {
        success: false,
        error: 'AvaTax API error: ' + statusCode,
        details: errorResponse,
      };
    }
  } catch (e) {
    logger.error('AvaTax API call failed: ' + e.message);
    return {
      success: false,
      error: e.message,
    };
  }
}

/**
 * Applies AvaTax response to basket line items
 * @param {dw.order.LineItemCtnr} basket - The basket
 * @param {Object} avaTaxResponse - Response from AvaTax API
 */
function applyTaxesToBasket(basket, avaTaxResponse) {
  if (!avaTaxResponse || !avaTaxResponse.lines) {
    logger.warn('No tax lines in AvaTax response');
    return;
  }

  var Money = require('dw/value/Money');
  var lineMap = {};

  logger.warn('===== APPLYING TAXES TO BASKET =====');
  logger.warn('AvaTax returned ' + avaTaxResponse.lines.length + ' tax lines');

  // Create a map of line numbers to tax amounts
  avaTaxResponse.lines.forEach(function (line) {
    // Calculate effective tax rate from AvaTax response
    var effectiveRate = 0;
    if (line.taxableAmount && line.taxableAmount > 0) {
      effectiveRate = line.tax / line.taxableAmount;
    }

    lineMap[line.lineNumber] = {
      tax: line.tax,
      rate: effectiveRate,
      taxableAmount: line.taxableAmount || 0,
    };
    logger.warn(
      'AvaTax line ' +
        line.lineNumber +
        ': tax=$' +
        line.tax +
        ', taxableAmount=$' +
        line.taxableAmount +
        ', calculated rate=' +
        effectiveRate.toFixed(4),
    );
  });

  var lineNumber = 0;

  // Apply to product line items
  var productLineItems = basket.getAllProductLineItems().iterator();
  logger.warn('Applying taxes to product line items...');

  while (productLineItems.hasNext()) {
    var pli = productLineItems.next();
    lineNumber++;

    logger.warn('Processing PLI ' + pli.productID + ' as line number ' + lineNumber);

    if (lineMap[lineNumber]) {
      var taxInfo = lineMap[lineNumber];
      var taxMoney = new Money(taxInfo.tax, basket.getCurrencyCode());
      logger.warn('Setting tax on PLI: $' + taxInfo.tax + ' at rate ' + taxInfo.rate);
      pli.setTax(taxMoney);
      pli.updateTax(taxInfo.rate);
      logger.warn('After setTax - PLI tax: $' + pli.getTax().value + ', taxRate: ' + pli.getTaxRate());
    } else {
      logger.warn('No tax mapping found for line number ' + lineNumber);
    }
  }

  // Apply to shipping line items
  logger.warn('Applying taxes to shipping line items...');
  var shipments = basket.getShipments().iterator();
  while (shipments.hasNext()) {
    var shipment = shipments.next();
    var shippingLineItems = shipment.getShippingLineItems().iterator();

    while (shippingLineItems.hasNext()) {
      var sli = shippingLineItems.next();

      // Only process if shipping has a cost
      var shippingAmount = sli.adjustedPrice ? sli.adjustedPrice.value : 0;
      if (shippingAmount <= 0) {
        continue;
      }

      lineNumber++;
      logger.warn('Processing shipping line item ' + sli.ID + ' as line number ' + lineNumber);

      if (lineMap[lineNumber]) {
        var taxInfo = lineMap[lineNumber];
        var taxMoney = new Money(taxInfo.tax, basket.getCurrencyCode());
        logger.warn('Setting tax on shipping: $' + taxInfo.tax + ' at rate ' + taxInfo.rate);
        sli.setTax(taxMoney);
        sli.updateTax(taxInfo.rate);
        logger.warn('After setTax - Shipping tax: $' + sli.getTax().value + ', taxRate: ' + sli.getTaxRate());
      } else {
        logger.warn('No tax mapping found for shipping line number ' + lineNumber);
      }
    }
  }

  // Recalculate basket totals after setting line item taxes
  logger.warn('Calling basket.updateTotals()...');
  basket.updateTotals();

  logger.warn('After updateTotals():');
  logger.warn('  - basket.taxTotal: $' + (basket.getTotalTax() ? basket.getTotalTax().value : 'null'));
  logger.warn(
    '  - basket.merchandizeTotalTax: $' +
      (basket.getMerchandizeTotalTax() ? basket.getMerchandizeTotalTax().value : 'null'),
  );
  logger.warn(
    '  - basket.shippingTotalTax: $' + (basket.getShippingTotalTax() ? basket.getShippingTotalTax().value : 'null'),
  );
  logger.warn('===== FINISHED APPLYING TAXES =====');
}

module.exports = {
  buildTransactionModel: buildTransactionModel,
  callAvaTaxAPI: callAvaTaxAPI,
  applyTaxesToBasket: applyTaxesToBasket,
};
