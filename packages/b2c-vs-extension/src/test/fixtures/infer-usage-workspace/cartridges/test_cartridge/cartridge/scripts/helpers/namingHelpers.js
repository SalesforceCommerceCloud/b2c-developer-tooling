'use strict';

// Patterns covered by recent inference work: PascalCase suffixes, weak
// Object JSDoc, instanceof class checks, and collections.first ternary
// returns. Integration tests locate positions via indexOf — keep shapes stable.

var collections = require('~/cartridge/scripts/util/collections');

/**
 * @param {string} email
 * @param {Object} resettingCustomer
 * @param {Object} currentLocale
 */
function sendPasswordResetEmail(email, resettingCustomer, currentLocale) {
  var token = resettingCustomer.profile.credentials.createResetPasswordToken();
  return {
    email: email,
    firstName: resettingCustomer.profile.firstName,
    lastName: resettingCustomer.profile.lastName,
    locale: currentLocale.ID,
    token: token
  };
}

/**
 * @param {Object} lineItem
 */
function getLineItemAdjustmentCount(lineItem) {
  return lineItem.priceAdjustments.getLength();
}

function isProductLineItem(lineItem) {
  return lineItem instanceof dw.order.ProductLineItem;
}

function firstVariantId(product) {
  var variant = collections.first(product.getVariants());
  return variant ? variant.getID() : null;
}

module.exports = {
  sendPasswordResetEmail: sendPasswordResetEmail,
  getLineItemAdjustmentCount: getLineItemAdjustmentCount,
  isProductLineItem: isProductLineItem,
  firstVariantId: firstVariantId
};
