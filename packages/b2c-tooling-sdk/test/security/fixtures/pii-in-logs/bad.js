'use strict';

var Logger = require('dw/system/Logger');
var log = Logger.getLogger('checkout', 'payment');

function logs(customer, order, card) {
  Logger.info('Customer login {0}', customer.profile.email); // expect
  log.debug('Order placed: {0}', JSON.stringify(order)); // expect
  Logger.getLogger('payment').error('Card {0} declined', card.creditCardNumber); // expect
  log.warn('Address: ' + order.billingAddress.address1); // expect
}

module.exports = {logs: logs};
