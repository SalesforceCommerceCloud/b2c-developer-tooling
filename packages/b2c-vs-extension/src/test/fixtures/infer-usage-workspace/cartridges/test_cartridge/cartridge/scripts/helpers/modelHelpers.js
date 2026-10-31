'use strict';

// Evidence IntelliJ also reads for undocumented parameters: `.call(this, ...)`
// call sites (SFRA model inheritance), the typed Script API a value is passed
// on to, and call sites that disagree (shown as a union). Integration tests
// locate positions via indexOf — keep shapes stable.

var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ShippingMgr = require('dw/order/ShippingMgr');

function BaseModel(source) {
  this.id = source.ID;
}

function FullModel(source) {
  BaseModel.call(this, source);
  this.online = source.online;
}

function recalculate(container) {
  ShippingMgr.applyShippingCost(container);
}

function describeItem(item) {
  return item.ID;
}

function buildModels() {
  var product = ProductMgr.getProduct('some-id');
  describeItem(product);
  describeItem(CatalogMgr.getCategory('some-category'));
  return new FullModel(product);
}

module.exports = {
  BaseModel: BaseModel,
  FullModel: FullModel,
  recalculate: recalculate,
  describeItem: describeItem,
  buildModels: buildModels,
};
