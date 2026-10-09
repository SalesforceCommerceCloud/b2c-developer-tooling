'use strict';

var Transaction = require('dw/system/Transaction');
var collections = require('~/cartridge/scripts/util/collections');

// Deliberately undocumented AND never called anywhere in this workspace —
// the exact "no call site at all" scenario usage-based matching exists for
// (a helper only ever reached indirectly, or genuinely dead code). Only
// member/method usage below (.custom, .productLineItems,
// .setShippingMethod) can recover its type.
function markShipmentForShipping(shipment) {
  Transaction.wrap(function () {
    collections.forEach(shipment.productLineItems, function (lineItem) {
      lineItem.custom.fromStoreId = null;
      lineItem.setProductInventoryList(null);
    });
    shipment.custom.fromStoreId = null;
    shipment.setShippingMethod(null);
  });
}

// Mirrors a real dogfooding find: a dangling `shipment.` immediately
// followed (after a blank line) by more code. `.` never gets automatic
// semicolon insertion, so this parses as ONE expression together with
// whatever identifier comes next — the exact state while a developer is
// mid-typing this line, before finishing it. The integration test locates
// the completion position right after the first `shipment.`.
function danglingDotProbe(shipment) {
  var localTransaction = require('dw/system/Transaction');

  shipment.

  localTransaction.wrap(function () {
    shipment.custom.fromStoreId = null;
    shipment.setShippingMethod(null);
  });
}

// A collection iterated with a manual for-loop (index access) instead of
// collections.forEach — `items` is undocumented and never called either, so
// `items[i]` stays `any` no matter what; the loop variable's type can only
// come from ITS OWN usage further down.
function hasBulkProductLineItem(items) {
  var result = false;
  for (var i = 0; i < items.length; i++) {
    var lineItem = items[i];
    if (lineItem && lineItem.productID && lineItem.quantity && lineItem.catalogProduct) {
      result = true;
    }
  }
  return result;
}

module.exports = {
  markShipmentForShipping: markShipmentForShipping,
  danglingDotProbe: danglingDotProbe,
  hasBulkProductLineItem: hasBulkProductLineItem
};
