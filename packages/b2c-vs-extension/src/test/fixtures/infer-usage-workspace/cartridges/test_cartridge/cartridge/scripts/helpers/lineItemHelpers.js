'use strict';

// Covers the *LineItem naming-alias disambiguation and the "real dw.* JSDoc is
// left alone" negative. Integration tests locate positions via indexOf — keep
// shapes stable. All shapes are synthetic; no real storefront code.

/**
 * A promotion helper whose bonus line item is undocumented (weak {Object}
 * placeholder). The parameter is named after a *specific* dw.order line-item
 * subclass — it must resolve to BonusDiscountLineItem, NOT the ProductLineItem
 * the bare `LineItem` naming suffix would otherwise force.
 * @param {Object} bonusDiscountLineItem
 */
function countBonusChoices(bonusDiscountLineItem) {
  var max = bonusDiscountLineItem.maxBonusItems;
  return bonusDiscountLineItem.getBonusProducts().length + max;
}

/**
 * The parameter carries a real, deliberate dw.* JSDoc type. Usage inference
 * must leave it completely alone — no "Inferred from usage" note — deferring
 * to the author's annotation and TypeScript's own resolution.
 * @param {dw.catalog.Product} catalogProduct
 */
function describeCatalogProduct(catalogProduct) {
  return catalogProduct.getID();
}

module.exports = {
  countBonusChoices: countBonusChoices,
  describeCatalogProduct: describeCatalogProduct
};
