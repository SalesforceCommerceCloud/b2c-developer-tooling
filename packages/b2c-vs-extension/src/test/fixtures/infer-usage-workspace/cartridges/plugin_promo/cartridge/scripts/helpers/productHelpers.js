'use strict';

// Third level of the overlay stack (see dw.json's cartridges order:
// plugin_promo : app_custom_cartridge : test_cartridge). getMemberPrice below
// is a member the MIDDLE cartridge added as an export augmentation on top of
// its own pass-through re-export — the hardest superModule shape: no
// candidate type carries it, so resolving it exercises the member walk down
// the cartridge chain.
var base = module.superModule;

function getPromoPrice(product) {
  var memberPrice = base.getMemberPrice(product);
  return memberPrice.subtract(base.getSalePrice(product));
}

module.exports = base;
module.exports.getPromoPrice = getPromoPrice;
