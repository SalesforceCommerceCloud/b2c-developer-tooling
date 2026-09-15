'use strict';

// Deliberately undocumented (no JSDoc) — this is the exact gap
// b2c-dx.features.scriptTypesInferUsage fixes. Without it, `product` and this
// function's return value are both implicit `any`, so hovering `product` or
// completing after `product.` inside this function gets nothing useful.
function getDisplayName(product) {
  return product.getName();
}

// Mirrors how a real user triggers completion: cursor right after `product.`,
// before the member name.
function completionProbe(product) {
  return product.getID();
}

function useHelper() {
  var ProductMgr = require('dw/catalog/ProductMgr');
  var product = ProductMgr.getProduct('some-id');
  completionProbe(product);
  return getDisplayName(product);
}

module.exports = {
  getDisplayName: getDisplayName,
  completionProbe: completionProbe,
};
