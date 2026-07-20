'use strict';

// Modeled on real SFRA helper modules (app_storefront_base scripts/helpers):
// undocumented functions with no JSDoc, chain hops parked in intermediate
// variables, deep property chains with a nullable middle step, and the
// canonical `module.exports = {name: name}` alias map. The integration tests
// locate positions in this file via indexOf on distinctive substrings — keep
// the shapes below stable.

function getSalePrice(product) {
  var priceModel = product.getPriceModel();
  var price = priceModel.getPrice();
  return price;
}

function getListPriceValue(product) {
  return product.getPriceModel().getPrice().getValue();
}

function isOrderable(product, quantity) {
  var availabilityModel = product.availabilityModel;
  var inventoryRecord = availabilityModel.inventoryRecord;
  if (!inventoryRecord) {
    return false;
  }
  return inventoryRecord.ATS.value >= quantity;
}

module.exports = {
  getSalePrice: getSalePrice,
  getListPriceValue: getListPriceValue,
  isOrderable: isOrderable
};
