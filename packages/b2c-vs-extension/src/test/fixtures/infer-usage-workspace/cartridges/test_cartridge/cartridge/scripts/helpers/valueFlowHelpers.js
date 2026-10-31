'use strict';

// Values followed to where they end up: a model constructor reached only
// through the factory that returns it, and a generic collection helper whose
// result depends on the collection one call passes. Integration tests locate
// positions via indexOf — keep shapes stable.

var BasketMgr = require('dw/order/BasketMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var collections = require('~/cartridge/scripts/util/collections');

function ProductTileModel(source) {
  this.id = source.ID;
}

function getTileModel() {
  return ProductTileModel;
}

function buildTile() {
  var TileModel = getTileModel();
  return new TileModel(ProductMgr.getProduct('some-id'));
}

function getShipmentByUUID(basket, uuid) {
  return collections.find(basket.shipments, function (candidate) {
    return candidate.UUID === uuid;
  });
}

function getLineItemByUUID(basket, uuid) {
  return collections.find(basket.productLineItems, function (candidate) {
    return candidate.UUID === uuid;
  });
}

function getShippingAddress(uuid) {
  var currentBasket = BasketMgr.getCurrentBasket();
  var shipment = getShipmentByUUID(currentBasket, uuid);
  var lineItem = getLineItemByUUID(currentBasket, uuid);
  return shipment && lineItem ? shipment.shippingAddress : null;
}

module.exports = {
  buildTile: buildTile,
  getShippingAddress: getShippingAddress,
};
