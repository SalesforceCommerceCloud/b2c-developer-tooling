'use strict';

// A payment processor hook. Nothing calls Handle by name: the platform
// dispatches HookMgr.callHook('app.payment.processor.<id>', 'Handle', ...)
// here through the hooks.json this cartridge's package.json names, so
// `container` takes the arguments of the callHook call in
// scripts/checkout/paymentHelpers.js. Its own usage alone fits any
// dw.order.LineItemCtnr.
function Handle(container, paymentMethodID) {
  return container.createPaymentInstrument(paymentMethodID, container.totalGrossPrice);
}

exports.Handle = Handle;
