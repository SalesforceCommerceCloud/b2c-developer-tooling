'use strict';

// SFRA plugin-cartridge overlay: extends the base cartridge's productHelpers
// at the same path via module.superModule (resolved to the next cartridge
// down the path — see the cartridges order in dw.json) and re-exports it
// with one extra helper, exactly the way real plugin cartridges do.
var base = module.superModule;

function getMemberPrice(product) {
  var basePrice = base.getSalePrice(product);
  return basePrice.multiply(0.9);
}

module.exports = base;
module.exports.getMemberPrice = getMemberPrice;
