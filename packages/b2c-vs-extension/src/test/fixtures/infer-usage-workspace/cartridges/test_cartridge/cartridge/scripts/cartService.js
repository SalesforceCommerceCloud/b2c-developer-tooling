'use strict';

// The only call sites for the productHelpers functions live here, reached
// through the plugin's own `~/cartridge/...` require resolution — this is
// what makes the cross-file inference tests exercise module resolution,
// project-wide reference search, and inference together, the way a real
// SFRA cartridge is wired.

var ProductMgr = require('dw/catalog/ProductMgr');
var productHelpers = require('~/cartridge/scripts/helpers/productHelpers');

function buildLineItemInfo(productId, quantity) {
  var product = ProductMgr.getProduct(productId);
  return {
    price: productHelpers.getSalePrice(product),
    priceValue: productHelpers.getListPriceValue(product),
    orderable: productHelpers.isOrderable(product, quantity)
  };
}

module.exports = {
  buildLineItemInfo: buildLineItemInfo
};
