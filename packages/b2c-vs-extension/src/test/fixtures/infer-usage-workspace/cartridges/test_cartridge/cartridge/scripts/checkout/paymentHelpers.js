'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');

// The extension point is built at runtime from the processor ID, like SFRA's
// checkout helpers; its literal prefix reaches every registered processor.
function handlePayment(paymentMethodID) {
  var currentBasket = BasketMgr.getCurrentBasket();
  var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
  var hookName = 'app.payment.processor.' + processor.ID.toLowerCase();
  var paymentInstrument = HookMgr.callHook(hookName, 'Handle', currentBasket, paymentMethodID);
  return paymentInstrument;
}

module.exports = {
  handlePayment: handlePayment,
};
