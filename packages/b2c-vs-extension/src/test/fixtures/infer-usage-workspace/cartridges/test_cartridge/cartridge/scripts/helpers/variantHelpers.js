'use strict';

// Callback and manual-iterator patterns as used all over SFRA. The
// integration tests locate positions in this file via indexOf on distinctive
// substrings — keep the shapes below stable.
var collections = require('~/cartridge/scripts/util/collections');

function collectVariantIds(product) {
  var ids = [];
  collections.forEach(product.getVariants(), function (variant) {
    ids.push(variant.getID());
  });
  return ids;
}

function firstVariantName(product) {
  var iter = product.getVariants().iterator();
  while (iter.hasNext()) {
    var candidate = iter.next();
    return candidate.getName();
  }
  return null;
}

module.exports = {
  collectVariantIds: collectVariantIds,
  firstVariantName: firstVariantName
};
